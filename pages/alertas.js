'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function Alertas() {
  const [circuitos, setCircuitos] = useState([])
  const [tab, setTab] = useState(null)
  const [metrica, setMetrica] = useState('potencia')
  const [data, setData] = useState([]) // para la gráfica
  const [alertas, setAlertas] = useState([]) // solo alertas de la semana

  // Días de la semana
  const weekDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

  // 1. Obtener circuitos del usuario
  useEffect(() => {
    const fetchCircuitos = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data: c } = await supabase
        .from('circuitos')
        .select('id, nombre')
        .eq('id_usuario', user.id)

      if (c?.length) {
        setCircuitos(c)
        setTab(c[0].id)
      }
    }
    fetchCircuitos()
  }, [])

  // 2. Consumos semanales para gráfico
  useEffect(() => {
    if (!tab) return

    const fetchConsumos = async () => {
      const hoy = new Date()
      const fechaHoy = hoy.toISOString().split('T')[0]

      // Calcular lunes de esta semana
      const lunes = new Date(hoy)
      const day = (hoy.getDay() + 6) % 7
      lunes.setDate(hoy.getDate() - day)
      const fechaLunes = lunes.toISOString().split('T')[0]

      const { data: consumos } = await supabase
        .from('consumos_horarios')
        .select(`fecha, ${metrica}`)
        .eq('circuito_id', tab)
        .gte('fecha', fechaLunes)
        .lte('fecha', fechaHoy)
        .order('fecha', { ascending: true })

      const grouped = {}
      consumos?.forEach((d) => {
        const fechaStr = d.fecha
        const fecha = new Date(fechaStr)
        const isHoy = fechaStr === fechaHoy
        const dayName = isHoy
          ? `Hoy (${fecha.toLocaleDateString('es-CO', { weekday: 'long' })})`
          : fecha.toLocaleDateString('es-CO', { weekday: 'long' })

        if (!grouped[fechaStr]) grouped[fechaStr] = { dia: dayName, valores: [] }
        grouped[fechaStr].valores.push(Number(d[metrica]))
      })

      const transformados = []
      Object.keys(grouped)
        .sort()
        .forEach((fechaStr) => {
          const valores = grouped[fechaStr].valores
          const promedio = valores.reduce((a, b) => a + b, 0) / valores.length
          const actual = valores[valores.length - 1]

          transformados.push({
            dia: grouped[fechaStr].dia,
            [`${metrica}_promedio`]: promedio.toFixed(2),
            [`${metrica}_actual`]: actual.toFixed(2),
          })
        })

      setData(transformados)
    }

    fetchConsumos()
  }, [tab, metrica])

  useEffect(() => {
    if (!tab) return

    const fetchAlertas = async () => {
      const hoy = new Date()
      // Fecha de hoy en formato YYYY-MM-DD según hora local (Colombia)
      const fechaHoy = hoy.toLocaleDateString('en-CA')

      // Calcular lunes de esta semana
      const lunes = new Date(hoy)
      const day = (hoy.getDay() + 6) % 7 // lunes = 0
      lunes.setDate(hoy.getDate() - day)
      const fechaLunes = lunes.toLocaleDateString('en-CA')

      const { data: a, error } = await supabase
        .from('alertas')
        .select('fecha,hora,metrica,valor_actual,valor_referencia,tipo,mensaje')
        .eq('circuito_id', tab)
        .gte('fecha', fechaLunes)
        .lte('fecha', fechaHoy)
        .eq('metrica', metrica)
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true })

      if (error) {
        console.error('Error cargando alertas:', error)
        setAlertas([])
      } else {
        setAlertas(a || [])
      }
    }

    fetchAlertas()
  }, [tab, metrica])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white px-6 pt-24 pb-20 space-y-10">
      <h1 className="text-4xl font-bold text-center text-blue-400">Alertas Energéticas</h1>

      {/* Tabs de circuitos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
        {circuitos.map((c) => (
          <button
            key={c.id}
            onClick={() => setTab(c.id)}
            className={`p-4 rounded-xl font-semibold shadow-lg transition text-lg
              ${
                tab === c.id
                  ? 'bg-blue-600 text-white ring-4 ring-blue-400'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      {/* Selector de métrica */}
      <div className="flex justify-center mb-6">
        <select
          value={metrica}
          onChange={(e) => setMetrica(e.target.value)}
          className="bg-gray-900 text-white p-2 rounded-md border border-gray-700"
        >
          <option value="potencia">Potencia (W)</option>
          <option value="energia">Energía (kWh)</option>
          <option value="voltaje">Voltaje (V)</option>
          <option value="corriente">Corriente (A)</option>
          <option value="frecuencia">Frecuencia (Hz)</option>
          <option value="factor_potencia">Factor de Potencia</option>
        </select>
      </div>

      {/* Gráfico de consumo */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg shadow-xl">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="dia" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip />
            <Legend />
            <Bar dataKey={`${metrica}_promedio`} fill="#60a5fa" name="Promedio" />
            <Bar dataKey={`${metrica}_actual`} fill="#34d399" name="Actual" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla de alertas reales */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-semibold text-red-400 mb-4">Alertas detectadas esta semana</h2>
        <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-700">
          <table className="min-w-full text-left">
            <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300">
              <tr>
                <th className="p-3 border border-gray-700">Fecha</th>
                <th className="p-3 border border-gray-700">Hora</th>
                <th className="p-3 border border-gray-700">Métrica</th>
                <th className="p-3 border border-gray-700">Actual</th>
                <th className="p-3 border border-gray-700">Referencia</th>
                <th className="p-3 border border-gray-700">Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {alertas.map((a, i) => (
                <tr key={i} className="hover:bg-gray-800/40 text-center transition">
                  <td className="p-2 border border-gray-700">{a.fecha}</td>
                  <td className="p-2 border border-gray-700">{a.hora}</td>
                  <td className="p-2 border border-gray-700 capitalize">{a.metrica}</td>
                  <td className="p-2 border border-gray-700">{a.valor_actual}</td>
                  <td className="p-2 border border-gray-700">{a.valor_referencia ?? '-'}</td>
                  <td
                    className={`p-2 border border-gray-700 ${
                      a.tipo?.includes('sobre') ||
                      a.tipo?.includes('fuera') ||
                      a.tipo?.includes('bajo')
                        ? 'text-red-400'
                        : 'text-green-400'
                    }`}
                  >
                    {a.mensaje}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
