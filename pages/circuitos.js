'use client'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'
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

// --- Datos "vacíos" cuando no hay sesión ---
const circuitoDemo = {
  id: 'demo',
  nombre: 'Circuito Demo',
  potencia: [{ time: '00:00', potencia: 0 }],
  energia: [{ name: 'Día', energia: 0 }],
  comparacion: [{ hora: '00:00', hoy: 0, ayer: 0 }],
  consumoHora: [{ hora: '00:00', kwh: 0 }],
  resumen: { max: 0, promedio: 0, estado: 'Apagado' },
  resumenDiario: { max: 0, promedio: 0, estado: 'Apagado' },
  resumenComparacion: { hoy: 0, ayer: 0, diferencia: '0%' },
  resumenCosto: { max: 0, promedio: 0, estado: 'Apagado' },
  voltaje: 120,
  corriente: 0,
  frecuencia: 60,
}

export default function Circuitos({ user }) {
  const [circuitos, setCircuitos] = useState([])
  const [dataPorCircuito, setDataPorCircuito] = useState({})
  const [selectedCircuit, setSelectedCircuit] = useState(null)

  // 🔹 Helper para formatear $COP
  function formatCOP(value) {
    return `$${value.toLocaleString('es-CO')} COP`
  }

  useEffect(() => {
    if (!user) {
      // 🔹 Modo demo
      setCircuitos([{ id_circuito: 'demo', nombre: 'Circuito Demo' }])
      setDataPorCircuito({ demo: circuitoDemo })
      setSelectedCircuit('demo')
      return
    }

    async function loadCircuitos() {
      // 🔹 Traer la tarifa vigente según la fecha actual y estrato
      const { data: tarifaData, error: tarifaError } = await supabase
        .from('tarifas')
        .select('*')
        .eq('estrato', 3) // <-- aquí podrías usar el estrato del usuario
        .lte('fecha_inicio', new Date().toISOString())
        .or(`fecha_fin.is.null,fecha_fin.gte.${new Date().toISOString()}`)
        .order('fecha_inicio', { ascending: false })
        .limit(1)

      if (tarifaError) {
        console.error('Error cargando tarifa', tarifaError)
      }

      const tarifa = tarifaData?.[0]

      // 🔹 Calcular tarifa final (simple: COP/kWh)
      let TARIFA = 500 // fallback si no hay tarifa en DB
      if (tarifa) {
        TARIFA = Number(tarifa.valor_kwh) // viene en COP/kWh
      }

      // 1. Traer circuitos del usuario
      const { data: cData, error } = await supabase
        .from('circuitos')
        .select('id_circuito, nombre')
        .eq('id_usuario', user.id)

      if (error) {
        console.error('Error cargando circuitos', error)
        return
      }

      setCircuitos(cData)
      if (!selectedCircuit && cData.length > 0) {
        setSelectedCircuit(cData[0].id_circuito)
      }

      // 2. Por cada circuito, traer su última medición + historial
      const results = {}
      for (let c of cData) {
        const { data: mData } = await supabase
          .from('mediciones')
          .select('*')
          .eq('id_circuito', c.id_circuito)
          .order('creado_en', { ascending: false })
          .limit(1)

        const { data: hData } = await supabase
          .from('mediciones_historial')
          .select('*')
          .eq('id_mediciones', mData?.[0]?.id_mediciones || 0)
          .order('creado_en')

        const historial =
          hData?.map((d) => ({
            time: new Date(d.creado_en).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            potencia: d.potencia,
          })) || []

        const energia =
          hData?.map((d) => ({
            name: new Date(d.creado_en).toLocaleDateString(),
            energia: d.energia,
          })) || []

        // 🔹 Cálculo de costos usando la tarifa final
        const consumoHora =
          hData?.map((d) => ({
            hora: new Date(d.creado_en).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            kwh: d.energia,
            costo: d.energia * TARIFA,
          })) || []

        const costos = consumoHora.map((d) => d.costo)

        results[c.id_circuito] = {
          potencia: historial,
          energia: energia,
          comparacion: [], // puedes llenarlo después
          consumoHora,
          resumen: {
            max: Math.max(...(hData?.map((d) => d.potencia) || [0])),
            promedio: hData?.reduce((acc, d) => acc + d.potencia, 0) / (hData?.length || 1),
            estado: mData?.[0]?.potencia > 0 ? 'Encendido' : 'Apagado',
          },
          resumenCosto: {
            max: Math.max(...costos, 0),
            promedio: costos.length ? costos.reduce((a, b) => a + b, 0) / costos.length : 0,
            estado: costos.some((c) => c > 0) ? 'Con consumo' : 'Apagado',
          },
          voltaje: mData?.[0]?.voltaje || 0,
          corriente: mData?.[0]?.corriente || 0,
          frecuencia: mData?.[0]?.frecuencia || 0,
        }
      }
      setDataPorCircuito(results)
    }

    loadCircuitos()
    // 🔹 Refrescar cada 10s para "tiempo real"
    const interval = setInterval(loadCircuitos, 10000)
    return () => clearInterval(interval)
  }, [user, selectedCircuit])

  // 🔹 Si aún no hay data cargada
  if (!selectedCircuit) return <p className="text-white p-4">Cargando...</p>

  const data = dataPorCircuito[selectedCircuit]

  // 🔹 Preparar data para gráfico de costo por hora
  const consumoHoraConCosto = data?.consumoHora || []

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
        Panel de Circuitos - {circuitos.find((c) => c.id_circuito === selectedCircuit)?.nombre}
      </motion.h1>

      {/* Selector de circuitos */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-3 gap-6"
      >
        {circuitos.map((c) => {
          const resumen = dataPorCircuito[c.id_circuito || c.id]?.resumen

          return (
            <Card
              key={c.id_circuito || c.id}
              onClick={() => setSelectedCircuit(c.id_circuito || c.id)}
              className={`cursor-pointer bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl text-center p-6 transition-all ${
                selectedCircuit === (c.id_circuito || c.id)
                  ? 'ring-4 ring-blue-500'
                  : 'hover:bg-gray-800'
              }`}
            >
              {/* Nombre del circuito */}
              <h3 className="text-lg text-gray-300">{c.nombre}</h3>

              {/* Estado destacado */}
              <p
                className={`text-3xl font-bold mt-3 ${
                  resumen?.estado === 'Encendido' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {resumen?.estado || 'Apagado'}
              </p>
            </Card>
          )
        })}
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
          <p className="text-3xl font-bold text-blue-400">{data?.voltaje ?? 0} V</p>
        </Card>

        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl text-center p-6">
          <h3 className="text-lg text-gray-300">Corriente</h3>
          <p className="text-3xl font-bold text-green-400">{data?.corriente ?? 0} A</p>
        </Card>

        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl text-center p-6">
          <h3 className="text-lg text-gray-300">Frecuencia</h3>
          <p className="text-3xl font-bold text-yellow-400">{data?.frecuencia ?? 0} Hz</p>
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
                data={
                  data?.potencia
                    ? data.potencia.map((d) => ({
                        ...d,
                        potencia: data.resumen.estado === 'Encendido' ? d.potencia : 0,
                      }))
                    : []
                }
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
                  {data?.resumenDiario?.max ?? 0} kWh
                </span>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-4 w-full text-center shadow-inner">
                <span className="text-sm text-gray-400">Promedio</span>
                <span className="block text-2xl font-bold text-blue-400">
                  {data?.resumenDiario?.promedio ?? 0} kWh
                </span>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-4 w-full text-center shadow-inner">
                <span className="text-sm text-gray-400">Estado</span>
                <span className="block text-2xl font-bold text-yellow-400">
                  {data?.resumenDiario?.estado ?? 'Apagado'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-none shadow-xl md:col-span-7 order-1 md:order-2">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Energía (kWh) por día</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data?.energia || []}>
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
        {/* Tarjeta Resumen Comparación */}
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

        {/* Gráfico Hoy vs Ayer */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl md:col-span-7 order-1 md:order-2">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Consumo: Hoy vs. Ayer</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.comparacion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="hora" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip />
                <Bar dataKey="hoy" fill="#34d399" name="Hoy" radius={[6, 6, 0, 0]} />
                <Bar dataKey="ayer" fill="#f87171" name="Ayer" radius={[6, 6, 0, 0]} />
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
        {/* Tarjeta Resumen Costo */}
        <Card className="bg-gradient-to-br from-zinc-800 to-zinc-900 border-none shadow-xl md:col-span-3 order-2 md:order-1">
          <CardContent className="p-6 w-full flex flex-col items-center">
            <h3 className="text-xl font-semibold text-blue-300 mb-6">Resumen Costo</h3>
            <div className="flex flex-col gap-6 w-full">
              <div className="bg-zinc-900/60 rounded-lg p-4 flex flex-col items-center shadow-inner">
                <span className="text-sm text-gray-400">Máximo</span>
                <span className="text-2xl font-bold text-green-400">
                  {formatCOP(data?.resumenCosto?.max ?? 0)}
                </span>
              </div>
              <div className="bg-zinc-900/60 rounded-lg p-4 flex flex-col items-center shadow-inner">
                <span className="text-sm text-gray-400">Promedio</span>
                <span className="text-2xl font-bold text-blue-400">
                  {formatCOP(data?.resumenCosto?.promedio ?? 0)}
                </span>
              </div>
              <div className="bg-zinc-900/60 rounded-lg p-4 flex flex-col items-center shadow-inner">
                <span className="text-sm text-gray-400">Estado</span>
                <span className="text-2xl font-bold text-yellow-400">
                  {data?.resumenCosto?.estado ?? 'Sin datos'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Gasto */}
        <Card className="bg-gradient-to-br from-zinc-800 to-zinc-900 border-none shadow-xl md:col-span-7 order-1 md:order-2">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Gasto por hora ($COP)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={consumoHoraConCosto || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="hora" stroke="#ccc" />
                <YAxis stroke="#ccc" tickFormatter={(value) => formatCOP(value)} />
                <Tooltip formatter={(value) => formatCOP(Number(value) || 0)} />

                <Bar dataKey="costo" fill="#34d399" radius={[6, 6, 0, 0]} name="Costo (COP)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
