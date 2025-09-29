'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import ResumenCard from '@/components/dashboard/ResumenCard'
import ChartLine from '@/components/dashboard/ChartLine'
import ChartBarEnergia from '@/components/dashboard/ChartBarEnergia'
import ResumenEnergia from '@/components/dashboard/ResumenEnergia'
import ChartComparacionConsumo from '@/components/dashboard//ChartComparacionConsumo'
import ResumenComparacionConsumo from '@/components/dashboard//ResumenComparacionConsumo'
import ChartCostoHora from '@/components/dashboard/ChartCostoHora'
import ResumenCostoHora from '@/components/dashboard/ResumenCostoHora'
import IndicadoresBasicos from '@/components/dashboard/IndicadoresBasicos'

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

      // === Resumen Energía: últimos 7 días ===
      const energiaUltimos7 = energiaArr.map((d) => d.energia)

      const resumenDiarioMax = energiaUltimos7.length ? Math.max(...energiaUltimos7) : 0

      const resumenDiarioAvg = energiaUltimos7.length
        ? energiaUltimos7.reduce((a, b) => a + b, 0) / energiaUltimos7.length
        : 0

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

      // === Resumen Costo: hasta la hora actual ===
      const horaActual = new Date().getHours()
      const costosHastaAhora = costosPorHora.filter((c) => c.hora <= horaActual)

      const resumenCostoMax = costosHastaAhora.length
        ? Math.max(...costosHastaAhora.map((c) => c.costo))
        : 0

      const resumenCostoAvg = costosHastaAhora.length
        ? costosHastaAhora.reduce((a, b) => a + b.costo, 0) / costosHastaAhora.length
        : 0

      // === Resumen Potencia: solo HOY ===
      const inicioHoy = new Date()
      inicioHoy.setHours(0, 0, 0, 0)

      const medicionesHoy = medicionesData.filter((m) => m.created_at >= inicioHoy)

      const maxPot = medicionesHoy.length
        ? Math.max(...medicionesHoy.map((m) => Number(m.potencia)))
        : 0

      const avgPot = medicionesHoy.length
        ? medicionesHoy.reduce((a, b) => a + Number(b.potencia), 0) / medicionesHoy.length
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
          max: maxPot,
          promedio: avgPot,
          estado: medicionesHoy.length > 0 ? 'Encendido' : 'Apagado',
        },
        potencia: potenciaData,
        resumenDiario: {
          max: resumenDiarioMax,
          promedio: resumenDiarioAvg,
          estado: energiaUltimos7.some((e) => e > 0) ? 'Encendido' : 'Apagado',
        },
        energia: energiaArr,
        resumenComparacion: { hoy: energiaHoy, ayer: energiaAyer, diferencia },
        comparacion: [
          { name: 'Ayer', energia: energiaAyer },
          { name: 'Hoy', energia: energiaHoy },
        ],
        resumenCosto: {
          max: resumenCostoMax,
          promedio: resumenCostoAvg,
          estado: costosHastaAhora.some((c) => c.costo > 0) ? 'Estable' : 'Sin datos',
        },
        // 👇 añadimos los indicadores básicos desde el último registro
        voltaje: ultimo?.voltaje ?? 0,
        corriente: ultimo?.corriente ?? 0,
        frecuencia: ultimo?.frecuencia ?? 0,
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
      <IndicadoresBasicos
        voltaje={data.voltaje}
        corriente={data.corriente}
        frecuencia={data.frecuencia}
      />

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
            <h3 className="text-xl font-semibold text-blue-300 mb-6">Resumen Potencia</h3>
            <div className="flex flex-col gap-6 w-full">
              <ResumenCard
                label="Máxima"
                value={data.resumen.max ? data.resumen.max.toFixed(3) : 0}
                unit="W"
                color="text-green-400"
              />
              <ResumenCard
                label="Promedio"
                value={data.resumen.promedio ? data.resumen.promedio.toFixed(3) : 0}
                unit="W"
                color="text-blue-400"
              />
              <ResumenCard label="Estado" value={data.resumen.estado} color="text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl md:col-span-7 order-1 md:order-2">
          <CardContent className="p-6">
            <ChartLine
              data={data.potencia.map((d) => ({
                ...d,
                potencia: circuitState[selectedCircuit] ? d.potencia : 0,
              }))}
              dataKey="potencia"
              title="Potencia Activa (W)"
              color="#4ade80"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* === Fila 3: Resumen Diario + Energía === */}
      {/* === Fila Energía === */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-10 gap-6 mt-10"
      >
        <div className="md:col-span-3">
          <ResumenEnergia
            max={data.resumenDiario.max.toFixed(2)}
            promedio={data.resumenDiario.promedio.toFixed(2)}
            estado={data.resumenDiario.estado}
          />
        </div>
        <div className="md:col-span-7">
          <ChartBarEnergia data={data.energia} />
        </div>
      </motion.div>

      {/* === Fila 4: Comparación día actual vs anterior === */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-10 gap-6 mt-10"
      >
        <div className="md:col-span-3">
          <ResumenComparacionConsumo
            hoy={data.resumenComparacion.hoy}
            ayer={data.resumenComparacion.ayer}
            diferencia={data.resumenComparacion.diferencia}
          />
        </div>
        <div className="md:col-span-7">
          <ChartComparacionConsumo data={data.comparacion} />
        </div>
      </motion.div>

      {/* === Fila 5: Costo por hora === */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-10 gap-6 mt-10"
      >
        <div className="md:col-span-3">
          <ResumenCostoHora
            max={data.resumenCosto.max}
            promedio={data.resumenCosto.promedio}
            estado={data.resumenCosto.estado}
          />
        </div>
        <div className="md:col-span-7">
          <ChartCostoHora data={consumoHoraConCosto} />
        </div>
      </motion.div>
    </div>
  )
}
