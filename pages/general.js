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

export default function General() {
  const [user, setUser] = useState(null)
  const [data, setData] = useState({
    resumen: { max: 0, promedio: 0, estado: 'Apagado' },
    potencia: [],
    resumenDiario: { max: 0, promedio: 0, estado: 'Apagado' },
    energia: [],
    resumenComparacion: { hoy: 0, ayer: 0, diferencia: '0%' },
    comparacion: [],
    resumenCosto: { max: 0, promedio: 0, estado: 'Estable' },
    ultimo: null,
  })
  const [consumoHoraConCosto, setConsumoHoraConCosto] = useState([])

  // === Verifica sesión y carga datos ===
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user || null)

      if (session?.user) {
        await loadMedicionesGeneral(session.user.id)
      }
    }
    checkUser()
  }, [])

  // === Cargar mediciones generales del usuario ===
  const loadMedicionesGeneral = async (idUsuario) => {
    const { data: medicionesData, error } = await supabase
      .from('mediciones_general')
      .select(
        'timestamp, voltaje_avg, corriente_total, potencia_total, energia_total, fp_total, frecuencia'
      )
      .eq('id_usuario', idUsuario)
      .order('timestamp', { ascending: true })
      .limit(50)

    if (error) {
      console.error(error)
      return
    }

    if (medicionesData.length > 0) {
      const ultimo = medicionesData[medicionesData.length - 1]

      const potencias = medicionesData.map((m) => ({
        time: new Date(m.timestamp).toLocaleTimeString(),
        potencia: m.potencia_total,
      }))

      const energia = medicionesData.map((m, i) => ({
        name: i + 1,
        energia: m.energia_total,
      }))

      setData({
        resumen: {
          max: Math.max(...medicionesData.map((m) => m.potencia_total)),
          promedio:
            medicionesData.reduce((a, b) => a + b.potencia_total, 0) / medicionesData.length,
          estado: ultimo.potencia_total > 0 ? 'Encendido' : 'Apagado',
        },
        potencia: potencias,
        resumenDiario: {
          max: Math.max(...medicionesData.map((m) => m.energia_total)),
          promedio: medicionesData.reduce((a, b) => a + b.energia_total, 0) / medicionesData.length,
          estado: ultimo.energia_total > 0 ? 'Encendido' : 'Apagado',
        },
        energia,
        resumenComparacion: { hoy: 0, ayer: 0, diferencia: '0%' }, // 🔧 se puede mejorar con query diaria
        comparacion: [],
        resumenCosto: { max: 0, promedio: 0, estado: 'Estable' },
        ultimo,
      })

      const costos = medicionesData.map((m) => ({
        hora: new Date(m.timestamp).getHours(),
        costo: (m.energia_total ?? 0) * 650, // tarifa fija COP
      }))
      setConsumoHoraConCosto(costos)
    }
  }

  // === UI (idéntico a Circuitos.jsx pero sin selector de circuitos) ===
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
        Consumo General - Todos los Circuitos
      </motion.h1>

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
