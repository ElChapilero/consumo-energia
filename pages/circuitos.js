'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

export default function Circuitos() {
  const [user, setUser] = useState(null)
  const [circuitos, setCircuitos] = useState([])
  const [selectedCircuit, setSelectedCircuit] = useState(null)
  const [circuitState, setCircuitState] = useState({})
  const [data, setData] = useState({
    resumen: { max: 0, promedio: 0, estado: 'Apagado' },
    potencia: [],
    resumenDiario: { max: 0, promedio: 0, estado: 'Apagado' },
    energia: [],
    resumenComparacion: { hoy: 0, ayer: 0, diferencia: '0%' },
    comparacion: [],
    resumenCosto: { max: 0, promedio: 0, estado: 'Estable' },
    ultimo: null, // ✅ agregado
  })
  const [consumoHoraConCosto, setConsumoHoraConCosto] = useState([])

  // === Verifica sesión y carga datos ===
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user || null)

      if (!session?.user) {
        // --- DEMO MODE: todo en ceros ---
        setCircuitos([{ id: 1, nombre: 'Demo 1' }])
        setSelectedCircuit(1)
        setCircuitState({ 1: false })
        setData((prev) => ({
          ...prev,
          resumen: { max: 0, promedio: 0, estado: 'Apagado' },
          potencia: [],
          resumenDiario: { max: 0, promedio: 0, estado: 'Apagado' },
          energia: [],
          resumenComparacion: { hoy: 0, ayer: 0, diferencia: '0%' },
          comparacion: [],
          resumenCosto: { max: 0, promedio: 0, estado: 'Estable' },
          ultimo: null,
        }))
        setConsumoHoraConCosto([])
      } else {
        await loadCircuitos()
      }
    }
    checkUser()
  }, [])

  // === Cargar circuitos de la BD ===
  const loadCircuitos = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: circuitosData, error } = await supabase
      .from('circuitos')
      .select('id, nombre')
      .eq('id_usuario', user.id) // 🔥 filtrar por el usuario autenticado

    if (error) {
      console.error(error)
      return
    }

    setCircuitos(circuitosData)
    if (circuitosData.length > 0) {
      setSelectedCircuit(circuitosData[0].id)
      const initState = {}
      circuitosData.forEach((c) => (initState[c.id] = true))
      setCircuitState(initState)
    }
  }

  // === Cargar mediciones del circuito seleccionado ===
  useEffect(() => {
    if (!selectedCircuit || !user) return

    let interval

    const loadMediciones = async () => {
      const { data: medicionesDataRaw, error } = await supabase
        .from('mediciones')
        .select('potencia, energia, voltaje, corriente, frecuencia, factor_potencia, created_at')
        .eq('circuito_id', selectedCircuit)
        .order('created_at', { ascending: true })

      if (error) {
        console.error(error)
        return
      }

      // === Si no hay mediciones → llenar ceros ===
      if (!medicionesDataRaw || medicionesDataRaw.length === 0) {
        const now = new Date()
        const windowMinutes = 10
        const potenciaDataZero = Array.from({ length: windowMinutes }, (_, i) => {
          const t = new Date(now.getTime() - (windowMinutes - 1 - i) * 60_000)
          return {
            time: t.toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }),
            potencia: 0,
          }
        })

        setData((prev) => ({
          ...prev,
          potencia: potenciaDataZero,
          energia: Array.from({ length: 7 }, (_, i) => ({
            name: i === 6 ? 'Hoy' : '',
            energia: 0,
          })),
          resumen: { ...prev.resumen, max: 0, promedio: 0 },
          ultimo: null,
        }))

        setConsumoHoraConCosto(Array.from({ length: 24 }, (_, h) => ({ hora: h, costo: 0 })))
        return
      }

      // === Convertir y ordenar fechas ===
      const medicionesData = medicionesDataRaw.map((m) => ({
        ...m,
        created_at: new Date(m.created_at),
      }))
      medicionesData.sort((a, b) => a.created_at - b.created_at)

      // === Potencia: últimos 10 minutos hasta ahora ===
      const now = new Date()
      const windowMinutes = 10
      const startTime = new Date(now.getTime() - (windowMinutes - 1) * 60_000)

      const potenciaData = []
      const ultimoRegistro = medicionesData[medicionesData.length - 1].created_at

      for (let i = 0; i < windowMinutes; i++) {
        const t = new Date(startTime.getTime() + i * 60_000)

        // Buscar si hay medición en ese minuto exacto
        const medicion = medicionesData.find(
          (m) =>
            m.created_at.getFullYear() === t.getFullYear() &&
            m.created_at.getMonth() === t.getMonth() &&
            m.created_at.getDate() === t.getDate() &&
            m.created_at.getHours() === t.getHours() &&
            m.created_at.getMinutes() === t.getMinutes()
        )

        potenciaData.push({
          time: t.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
          potencia: medicion ? medicion.potencia : 0, // ⚡️ ahora siempre 0 si no hubo dato
        })
      }

      // === Energía: últimos 7 días ===
      const energiaPorDiaMap = {}
      medicionesData.forEach((m) => {
        const key = m.created_at.toISOString().split('T')[0]
        energiaPorDiaMap[key] = (energiaPorDiaMap[key] || 0) + (m.energia ?? 0)
      })

      const energiaArr = []
      for (let d = 6; d >= 0; d--) {
        const day = new Date()
        day.setDate(day.getDate() - d)
        const key = day.toISOString().split('T')[0]
        const label = d === 0 ? 'Hoy' : day.toLocaleDateString('es-ES', { weekday: 'short' })
        energiaArr.push({ name: label, energia: energiaPorDiaMap[key] || 0 })
      }

      // === Costos por hora desde consumos_horarios ===
      const today = new Date().toISOString().split('T')[0]

      const { data: consumosHoy, error: errorConsumos } = await supabase
        .from('consumos_horarios')
        .select('hora, costo')
        .eq('circuito_id', selectedCircuit)
        .eq('fecha', today)
        .order('hora', { ascending: true })

      if (errorConsumos) {
        console.error('Error cargando consumos_horarios:', errorConsumos)
      }

      // Inicializar 24 horas en 0
      const costosPorHora = Array.from({ length: 24 }, (_, h) => ({
        hora: h,
        costo: 0,
      }))

      if (consumosHoy) {
        consumosHoy.forEach((c) => {
          costosPorHora[c.hora].costo = Number(c.costo)
        })
      }

      // === Resúmenes ===
      const maxPot = Math.max(...medicionesData.map((m) => Number(m.potencia)))
      const avgPot =
        medicionesData.reduce((a, b) => a + Number(b.potencia), 0) / medicionesData.length

      const energiaValues = Object.values(energiaPorDiaMap)
      const resumenDiarioMax = energiaValues.length ? Math.max(...energiaValues) : 0
      const resumenDiarioAvg = energiaValues.length
        ? energiaValues.reduce((a, b) => a + b, 0) / energiaValues.length
        : 0

      const ultimo = medicionesData[medicionesData.length - 1]

      // === Comparación Hoy vs Ayer ===
      const hoyKey = new Date().toISOString().split('T')[0]
      const ayerKey = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const energiaHoy = energiaPorDiaMap[hoyKey] || 0
      const energiaAyer = energiaPorDiaMap[ayerKey] || 0

      const diferencia =
        energiaAyer === 0
          ? '100%'
          : (((energiaHoy - energiaAyer) / energiaAyer) * 100).toFixed(1) + '%'

      setData({
        resumen: {
          max: maxPot || 0,
          promedio: avgPot || 0,
          estado: 'Encendido',
        },
        potencia: potenciaData,
        resumenDiario: {
          max: resumenDiarioMax,
          promedio: resumenDiarioAvg,
          estado: 'Encendido',
        },
        energia: energiaArr,
        resumenComparacion: { hoy: energiaHoy, ayer: energiaAyer, diferencia },
        comparacion: [
          { name: 'Ayer', energia: energiaAyer },
          { name: 'Hoy', energia: energiaHoy },
        ],

        resumenCosto: {
          max: Math.max(...costosPorHora.map((c) => c.costo)),
          promedio: costosPorHora.reduce((a, b) => a + b.costo, 0) / costosPorHora.length,
          estado: 'Estable',
        },
        ultimo,
      })

      setConsumoHoraConCosto(costosPorHora)
    }

    // primera carga
    loadMediciones()
    // refresco automático cada 10s
    interval = setInterval(loadMediciones, 10000)

    return () => clearInterval(interval)
  }, [selectedCircuit, user])

  // === UI (visual, lo que ya tienes) ===
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white px-4 sm:px-8 md:px-16 lg:px-24 pt-24 pb-20 space-y-10">
      {/* Título */}
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-4xl font-bold text-center text-blue-400"
      >
        Panel de Circuitos -{' '}
        {circuitos.find((c) => c.id === selectedCircuit)?.nombre || 'Sin datos'}
      </motion.h1>

      {/* Selector de circuitos */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-3 gap-6"
      >
        {circuitos.map((c) => (
          <Card
            key={c.id}
            onClick={() => setSelectedCircuit(c.id)}
            className={`cursor-pointer bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl text-center p-6 transition-all ${
              selectedCircuit === c.id ? 'ring-4 ring-blue-500' : 'hover:bg-gray-800'
            }`}
          >
            {/* Nombre del circuito */}
            <h3 className="text-lg text-gray-300">{c.nombre}</h3>

            {/* Estado destacado */}
            <p
              className={`text-3xl font-bold mt-3 ${
                circuitState[c.id] ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {circuitState[c.id] ? 'Encendido' : 'Apagado'}
            </p>

            {/* Botón de cambio de estado */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setCircuitState((prev) => ({ ...prev, [c.id]: !prev[c.id] }))
              }}
              className={`mt-4 px-4 py-2 rounded-lg font-semibold w-full transition ${
                circuitState[c.id]
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {circuitState[c.id] ? 'Apagar' : 'Encender'}
            </button>
          </Card>
        ))}
      </motion.div>

      {/* === Fila 1: Indicadores simples === */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-3 gap-6"
      >
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl text-center p-6">
          <h3 className="text-lg text-gray-300">Voltaje</h3>
          <p className="text-3xl font-bold text-blue-400">
            {data.ultimo ? `${data.ultimo.voltaje.toFixed(1)} V` : '--'}
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl text-center p-6">
          <h3 className="text-lg text-gray-300">Corriente</h3>
          <p className="text-3xl font-bold text-green-400">
            {data.ultimo ? `${data.ultimo.corriente.toFixed(2)} A` : '--'}
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl text-center p-6">
          <h3 className="text-lg text-gray-300">Frecuencia</h3>
          <p className="text-3xl font-bold text-yellow-400">
            {data.ultimo ? `${data.ultimo.frecuencia.toFixed(0)} Hz` : '--'}
          </p>
        </Card>
      </motion.div>

      {/* === Fila 2: Resumen + Gráfica === */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-10 gap-6"
      >
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl md:col-span-3 order-2 md:order-1">
          <CardContent className="p-6 w-full flex flex-col items-center">
            <h3 className="text-xl font-semibold text-blue-300 mb-6">Resumen</h3>
            <div className="flex flex-col gap-6 w-full">
              <div className="bg-gray-900/60 rounded-lg p-4 flex flex-col items-center shadow-inner">
                <span className="text-sm text-gray-400">Máxima</span>
                <span className="text-2xl font-bold text-green-400">{data.resumen.max} W</span>
              </div>
              <div className="bg-gray-900/60 rounded-lg p-4 flex flex-col items-center shadow-inner">
                <span className="text-sm text-gray-400">Promedio</span>
                <span className="text-2xl font-bold text-blue-400">{data.resumen.promedio} W</span>
              </div>
              <div className="bg-gray-900/60 rounded-lg p-4 flex flex-col items-center shadow-inner">
                <span className="text-sm text-gray-400">Estado</span>
                <span className="text-2xl font-bold text-yellow-400">{data.resumen.estado}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl md:col-span-7 order-1 md:order-2">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Potencia Activa (W)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={data.potencia.map((d) => ({
                  ...d,
                  potencia: circuitState[selectedCircuit] ? d.potencia : 0,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="time" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="potencia"
                  stroke="#4ade80"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* === Fila 3: Resumen Diario + Energía === */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-10 gap-6"
      >
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-none shadow-xl md:col-span-3 order-2 md:order-1">
          <CardContent className="p-6 w-full">
            <h3 className="text-xl font-semibold text-blue-300 mb-4 text-center">Resumen Diario</h3>
            <div className="flex flex-col items-center gap-4">
              <div className="bg-slate-800/60 rounded-lg p-4 w-full text-center shadow-inner">
                <span className="text-sm text-gray-400">Máxima</span>
                <span className="block text-2xl font-bold text-green-400">
                  {data.resumenDiario.max} kWh
                </span>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-4 w-full text-center shadow-inner">
                <span className="text-sm text-gray-400">Promedio</span>
                <span className="block text-2xl font-bold text-blue-400">
                  {data.resumenDiario.promedio} kWh
                </span>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-4 w-full text-center shadow-inner">
                <span className="text-sm text-gray-400">Estado</span>
                <span className="block text-2xl font-bold text-yellow-400">
                  {data.resumenDiario.estado}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-none shadow-xl md:col-span-7 order-1 md:order-2">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Energía (kWh) por día</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.energia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip />
                <Bar dataKey="energia" fill="#60a5fa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* === Fila 4: Comparación día actual vs anterior === */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-10 gap-6 mt-10"
      >
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl md:col-span-3 order-2 md:order-1">
          <CardContent className="p-6 w-full flex flex-col items-center">
            <h3 className="text-xl font-semibold text-blue-300 mb-6">Resumen Comparación</h3>
            <div className="flex flex-col gap-6 w-full">
              <div className="bg-gray-900/60 rounded-lg p-4 flex flex-col items-center shadow-inner">
                <span className="text-sm text-gray-400">Consumo Hoy</span>
                <span className="text-2xl font-bold text-green-400">
                  {data.resumenComparacion.hoy} kWh
                </span>
              </div>
              <div className="bg-gray-900/60 rounded-lg p-4 flex flex-col items-center shadow-inner">
                <span className="text-sm text-gray-400">Consumo Ayer</span>
                <span className="text-2xl font-bold text-red-400">
                  {data.resumenComparacion.ayer} kWh
                </span>
              </div>
              <div className="bg-gray-900/60 rounded-lg p-4 flex flex-col items-center shadow-inner">
                <span className="text-sm text-gray-400">Diferencia</span>
                <span className="text-2xl font-bold text-yellow-400">
                  {data.resumenComparacion.diferencia}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl md:col-span-7 order-1 md:order-2">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Consumo: Ayer vs. Hoy</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.comparacion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#ccc" /> {/* 👈 ahora muestra Hoy y Ayer */}
                <YAxis stroke="#ccc" />
                <Tooltip />
                <Bar dataKey="energia" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* === Fila 5: Costo por hora === */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-10 gap-6 mt-10"
      >
        <Card className="bg-gradient-to-br from-zinc-800 to-zinc-900 border-none shadow-xl md:col-span-3 order-2 md:order-1">
          <CardContent className="p-6 w-full flex flex-col items-center">
            <h3 className="text-xl font-semibold text-blue-300 mb-6">Resumen Costo</h3>
            <div className="flex flex-col gap-6 w-full">
              <div className="bg-zinc-900/60 rounded-lg p-4 flex flex-col items-center shadow-inner">
                <span className="text-sm text-gray-400">Máximo</span>
                <span className="text-2xl font-bold text-green-400">${data.resumenCosto.max}</span>
              </div>
              <div className="bg-zinc-900/60 rounded-lg p-4 flex flex-col items-center shadow-inner">
                <span className="text-sm text-gray-400">Promedio</span>
                <span className="text-2xl font-bold text-blue-400">
                  ${data.resumenCosto.promedio}
                </span>
              </div>
              <div className="bg-zinc-900/60 rounded-lg p-4 flex flex-col items-center shadow-inner">
                <span className="text-sm text-gray-400">Estado</span>
                <span className="text-2xl font-bold text-yellow-400">
                  {data.resumenCosto.estado}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-zinc-800 to-zinc-900 border-none shadow-xl md:col-span-7 order-1 md:order-2">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Gasto por hora ($COP)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={consumoHoraConCosto}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="hora" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip formatter={(v) => `$${v.toLocaleString('es-CO')} COP`} />
                <Bar dataKey="costo" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
