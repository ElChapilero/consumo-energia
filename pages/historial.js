'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import ChartLineHistorial from '@/components/dashboard/ChartLineHistorial'
import ChartLineHistorialMovil from '@/components/dashboard/ChartLineHistorialMovil'
import ResponsiveChart from '@/components/dashboard/ResponsiveChart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function Historial() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })

  const [tab, setTab] = useState('general')
  const [metrica, setMetrica] = useState('potencia')
  const [fechaInicio, setFechaInicio] = useState(today)
  const [fechaFin, setFechaFin] = useState(today)
  const [data, setData] = useState([])

  const [casas, setCasas] = useState([])
  const [casaSel, setCasaSel] = useState('')
  const [circuitos, setCircuitos] = useState([])

  // 🔹 Cargar dispositivos y circuitos
  useEffect(() => {
    const fetchInitial = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) {
        console.warn('No hay usuario autenticado o error al obtenerlo:', userError)
        return
      }

      const userId = userData.user.id
      const { data: dispositivos, error: errDisp } = await supabase
        .from('dispositivos')
        .select('id, nombre, creado_en')
        .eq('id_usuario', userId)
        .order('creado_en', { ascending: true }) // 🔹 ordena del más antiguo al más reciente

      if (errDisp) {
        console.error('Error obteniendo dispositivos:', errDisp)
        return
      }

      if (!dispositivos?.length) {
        setCasas([])
        setCircuitos([])
        return
      }

      setCasas(dispositivos)
      const primeraCasa = dispositivos[0].id
      setCasaSel(primeraCasa)
      setTab('general')

      const dispositivoIds = dispositivos.map((d) => d.id)
      const { data: circuitosData, error: errCirc } = await supabase
        .from('circuitos')
        .select('id, nombre, id_dispositivo')
        .in('id_dispositivo', dispositivoIds)

      if (errCirc) console.error('Error cargando circuitos:', errCirc)
      else setCircuitos(circuitosData || [])
    }

    fetchInitial()
  }, [])

  useEffect(() => {
    if (!casaSel) return
    setTab('general')
  }, [casaSel])

  // 🔹 Cargar datos históricos
  useEffect(() => {
    const fetchData = async () => {
      if (!casaSel) return

      let query =
        tab === 'general'
          ? supabase.from('consumos_horarios_general').select('*').eq('id_dispositivo', casaSel)
          : supabase.from('consumos_horarios_circuito').select('*').eq('circuito_id', tab)

      query = query
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true })

      const { data: rows, error } = await query
      if (error) {
        console.error('Error cargando consumos:', error)
        return
      }

      const transformados = (rows || []).map((d) => ({
        ...d,
        fecha: `${d.fecha} ${String(d.hora).padStart(2, '0')}:00`,
        gasto: d.costo || 0,
        potencia: d.potencia ?? d.potenciaPromedio ?? 0,
        potenciaPromedio: d.potencia ?? d.potenciaPromedio ?? 0,
        alerta: d.num_alertas && d.num_alertas > 0 ? `${d.num_alertas} alerta(s)` : 'Normal',
      }))

      setData(transformados)
    }

    fetchData()
  }, [tab, fechaInicio, fechaFin, casaSel])

  // 🔹 Exportar CSV
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

  const circuitosFiltrados = circuitos.filter((c) => c.id_dispositivo === casaSel)
  const sinCircuitos = circuitosFiltrados.length === 0

  // ----------------------------------------------------
  // 🔸 Render
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white px-4 sm:px-8 mobile:px-16 lg:px-24 pt-24 pb-20 space-y-10">
      <h1 className="text-4xl font-bold text-center text-blue-400">Historial Energético</h1>

      {/* 🔸 Selects */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="flex flex-col mobile:flex-row justify-center items-stretch gap-6 w-full mt-6"
      >
        {/* Casa */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl text-center w-full mobile:w-1/3 rounded-2xl p-6 flex flex-col justify-center">
          <label className="text-xl font-semibold text-blue-300 mb-4 tracking-wide">
            Casa / Dispositivo
          </label>
          <select
            value={casaSel}
            onChange={(e) => {
              setCasaSel(e.target.value)
              setTab('general')
            }}
            className="bg-gray-800/80 text-gray-300 font-semibold rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 w-full transition-all hover:bg-gray-800 shadow-md cursor-pointer appearance-none"
          >
            {casas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Circuito */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl text-center w-full mobile:w-1/3 rounded-2xl p-6 flex flex-col justify-center">
          <label className="text-xl font-semibold text-blue-300 mb-4 tracking-wide">Circuito</label>
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value)}
            disabled={sinCircuitos}
            className={`${
              sinCircuitos ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-800'
            } bg-gray-800/80 text-gray-300 font-semibold rounded-2xl px-4 py-3 text-base focus:outline-none w-full shadow-md appearance-none`}
          >
            <option value="general"> General (todos los circuitos)</option>
            {!sinCircuitos &&
              circuitosFiltrados.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
          </select>
        </div>

        {/* Métrica */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl text-center w-full mobile:w-1/3 rounded-2xl p-6 flex flex-col justify-center">
          <label className="text-xl font-semibold text-blue-300 mb-4 tracking-wide">Métrica</label>
          <select
            value={metrica}
            onChange={(e) => setMetrica(e.target.value)}
            className="bg-gray-800/80 text-gray-300 font-semibold rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 w-full transition-all hover:bg-gray-800 shadow-md cursor-pointer appearance-none"
          >
            <option value="potencia">Potencia (W)</option>
            <option value="energia">Energía (kWh)</option>
            <option value="voltaje">Voltaje (V)</option>
            <option value="corriente">Corriente (A)</option>
            <option value="frecuencia">Frecuencia (Hz)</option>
            <option value="factor_potencia">Factor de Potencia</option>
            <option value="gasto">Gasto ($)</option>
          </select>
        </div>
      </motion.div>

      {/* 🔸 Rango de fechas mejorado */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="flex flex-col mobile:flex-row justify-center items-center gap-6 mt-4 w-full"
      >
        {[
          { label: 'Desde', value: fechaInicio, onChange: setFechaInicio },
          { label: 'Hasta', value: fechaFin, onChange: setFechaFin },
        ].map(({ label, value, onChange }, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl px-6 py-4 flex flex-col items-center w-full mobile:w-1/4"
          >
            <label className="text-xl font-semibold text-blue-300 mb-4 tracking-wide">
              {label}
            </label>
            <div className="relative w-full">
              <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-gray-900/80 text-gray-300 font-semibold rounded-xl px-4 py-3 text-base border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-center transition-all hover:border-blue-400 cursor-pointer appearance-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400">
                📅
              </span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* 🔸 Gráfica */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="w-full mt-10"
      >
        <ResponsiveChart
          mobile={<ChartLineHistorialMovil data={data} metrica={metrica} />}
          desktop={<ChartLineHistorial data={data} metrica={metrica} />}
        />
      </motion.div>

      {/* 🔸 Botón CSV */}
      <div className="flex justify-end">
        <button
          onClick={exportToCSV}
          className="bg-green-600 px-5 py-3 rounded-xl font-semibold hover:bg-green-700 transition"
        >
          Descargar CSV
        </button>
      </div>

      {/* 🔸 Tabla */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl rounded-2xl p-8"
      >
        <h2 className="text-xl font-semibold text-blue-300 mb-4 tracking-wide text-center">
          Historial de Consumos
        </h2>

        {data.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-lg text-left text-gray-300">
              <thead className="bg-gray-700 text-gray-200 uppercase text-xs">
                <tr>
                  {[
                    'Fecha',
                    'Potencia (W)',
                    'Energía (kWh)',
                    'Voltaje (V)',
                    'Corriente (A)',
                    'Frecuencia (Hz)',
                    'Factor Potencia',
                    'Gasto ($COP)',
                    'Alertas',
                  ].map((h) => (
                    <th key={h} className="px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {data.map((d, i) => (
                  <tr
                    key={i}
                    className={`border-b border-gray-700 ${
                      i % 2 === 0 ? 'bg-gray-800/40' : 'bg-gray-900/30'
                    } hover:bg-gray-800/60 transition`}
                  >
                    <td className="px-4 py-2">{d.fecha}</td>
                    <td className="px-4 py-2">{Number(d.potencia).toFixed(2)}</td>
                    <td className="px-4 py-2">{Number(d.energia).toFixed(2)}</td>
                    <td className="px-4 py-2">{Number(d.voltaje).toFixed(2)}</td>
                    <td className="px-4 py-2">{Number(d.corriente).toFixed(2)}</td>
                    <td className="px-4 py-2">{Number(d.frecuencia).toFixed(2)}</td>
                    <td className="px-4 py-2">{Number(d.factor_potencia).toFixed(2)}</td>

                    {/* 💰 Gasto con color verde */}
                    <td className="px-4 py-2 text-green-400 font-semibold">
                      ${Number(d.gasto).toFixed(2)}
                    </td>

                    {/* 🚨 Alertas con color condicional */}
                    <td
                      className={`px-4 py-2 font-medium ${
                        d.alerta?.toLowerCase().includes('alerta')
                          ? 'text-red-400'
                          : 'text-green-400'
                      }`}
                    >
                      {d.alerta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center">
            No hay datos disponibles para este rango de fechas.
          </p>
        )}
      </motion.div>
    </div>
  )
}
