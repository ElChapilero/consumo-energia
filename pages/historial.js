'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function Historial() {
  const [tab, setTab] = useState('general')
  const [filtro, setFiltro] = useState('dia')
  const [metrica, setMetrica] = useState('potencia')
  const [fechaInicio, setFechaInicio] = useState('2025-09-01')
  const [fechaFin, setFechaFin] = useState('2025-09-02')
  const [data, setData] = useState([])
  const [circuitos, setCircuitos] = useState([])

  // Cargar circuitos del usuario
  useEffect(() => {
    const fetchCircuitos = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('circuitos')
        .select('id, nombre')
        .eq('id_usuario', user.id)

      if (error) {
        console.error('Error cargando circuitos:', error)
      } else {
        setCircuitos(data || [])
      }
    }

    fetchCircuitos()
  }, [])

  // Cargar consumos según el tab (general o circuito) 
  useEffect(() => {
    const fetchData = async () => {
      let query

      if (tab === 'general') {
        query = supabase
          .from('consumos_horarios_general')
          .select('*')
          .gte('fecha', fechaInicio)
          .lte('fecha', fechaFin)
          .order('fecha', { ascending: true })
          .order('hora', { ascending: true })
      } else {
        //  Datos de un solo circuito
        query = supabase
          .from('consumos_horarios')
          .select(
            `
            circuito_id,
            fecha,
            hora,
            energia,
            costo,
            potencia,
            voltaje,
            corriente,
            frecuencia,
            factor_potencia,
            num_alertas
          `
          )
          .gte('fecha', fechaInicio)
          .lte('fecha', fechaFin)
          .eq('circuito_id', tab)
          .order('fecha', { ascending: true })
          .order('hora', { ascending: true })
      }

      const { data, error } = await query
      if (error) {
        console.error('Error cargando consumos:', error)
      } else {
        const transformados = data.map((d) => ({
          ...d,
          fecha: `${d.fecha} ${String(d.hora).padStart(2, '0')}:00`,
          gasto: d.costo || 0,
          potenciaPromedio: d.potencia || 0,
          numAlertas: d.num_alertas || 0,
          alerta: (d.num_alertas || 0) > 0 ? 'Sobrecarga' : 'Normal',
        }))
        setData(transformados)
      }
    }

    fetchData()
  }, [tab, fechaInicio, fechaFin])

  // Exportar CSV 
  const exportToCSV = () => {
    if (!data.length) return

    const headers = Object.keys(data[0]).join(',')
    const rows = data.map((obj) =>
      Object.values(obj)
        .map((val) => `"${val}"`)
        .join(',')
    )
    const csvContent = [headers, ...rows].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Historial_${tab}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white px-4 sm:px-8 md:px-16 lg:px-24 pt-24 pb-20 space-y-10">
      <h1 className="text-4xl font-bold text-center text-blue-400">Historial Energético</h1>

      {/* === Tabs dinámicos === */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
        <button
          onClick={() => setTab('general')}
          className={`p-4 rounded-xl font-semibold shadow-lg transition text-lg
          ${
            tab === 'general'
              ? 'bg-blue-600 text-white ring-4 ring-blue-400'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          General
        </button>

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

      {/* === Gráfica === */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-4 flex-col md:flex-row">
          <select
            value={metrica}
            onChange={(e) => setMetrica(e.target.value)}
            className="bg-gray-900 text-white p-2 rounded-md border border-gray-700"
          >
            <option value="potencia">Potencia Activa (W)</option>
            <option value="energia">Energía (kWh)</option>
            <option value="voltaje">Voltaje (V)</option>
            <option value="corriente">Corriente (A)</option>
            <option value="frecuencia">Frecuencia (Hz)</option>
            <option value="factor_potencia">Factor de Potencia</option>
            <option value="gasto">Gasto ($)</option>
          </select>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="bg-gray-900 text-white p-2 rounded-md border border-gray-700"
            />
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="bg-gray-900 text-white p-2 rounded-md border border-gray-700"
            />
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          {metrica === 'gasto' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="fecha" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Bar dataKey="gasto" fill="#60a5fa" />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="fecha" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Line type="monotone" dataKey={metrica} stroke="#60a5fa" strokeWidth={2} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* === Filtros === */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={exportToCSV}
          className="bg-green-600 px-4 py-2 rounded-md hover:bg-green-700 transition"
        >
          Descargar CSV
        </button>
      </div>

      {/* === Tabla dinámica === */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-700">
          <table className="min-w-full text-left">
            <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300">
              <tr>
                <th className="p-3 border border-gray-700">Fecha</th>
                <th className="p-3 border border-gray-700">Potencia (W)</th>
                <th className="p-3 border border-gray-700">Energía (kWh)</th>
                <th className="p-3 border border-gray-700">Voltaje (V)</th>
                <th className="p-3 border border-gray-700">Corriente (A)</th>
                <th className="p-3 border border-gray-700">Frecuencia (Hz)</th>
                <th className="p-3 border border-gray-700">Factor de Potencia</th>
                <th className="p-3 border border-gray-700">Gasto ($COP)</th>
                <th className="p-3 border border-gray-700">Tipo de alerta</th>
                <th className="p-3 border border-gray-700"># Alertas</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i} className="hover:bg-gray-800/40 text-center transition">
                  <td className="p-2 border border-gray-700">{d.fecha}</td>
                  <td className="p-2 border border-gray-700">{d.potencia}</td>
                  <td className="p-2 border border-gray-700">{d.energia}</td>
                  <td className="p-2 border border-gray-700">{d.voltaje}</td>
                  <td className="p-2 border border-gray-700">{d.corriente}</td>
                  <td className="p-2 border border-gray-700">{d.frecuencia}</td>
                  <td className="p-2 border border-gray-700">{d.factor_potencia}</td>
                  <td className="p-2 border border-gray-700">${d.gasto}</td>
                  <td className="p-2 border border-gray-700">{d.alerta}</td>
                  <td className="p-2 border border-gray-700">{d.numAlertas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
