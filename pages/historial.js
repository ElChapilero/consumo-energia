'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import * as XLSX from 'xlsx'
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

// ==== Datos de ejemplo ====
const datosGeneral = [
  {
    fecha: '2025-09-01',
    potencia: 120,
    energia: 15,
    consumo: 12,
    gasto: 4800,
    alerta: 'Sobrecarga',
    numAlertas: 2,
  },
  {
    fecha: '2025-09-02',
    potencia: 150,
    energia: 18,
    consumo: 14,
    gasto: 5600,
    alerta: 'Normal',
    numAlertas: 0,
  },
]

const datosCircuito1 = [
  {
    fecha: '2025-09-01',
    potencia: 80,
    energia: 10,
    consumo: 8,
    gasto: 3200,
    alerta: 'Pico',
    numAlertas: 1,
  },
  {
    fecha: '2025-09-02',
    potencia: 90,
    energia: 12,
    consumo: 9,
    gasto: 3600,
    alerta: 'Normal',
    numAlertas: 0,
  },
]

const datosCircuito2 = [
  {
    fecha: '2025-09-01',
    potencia: 40,
    energia: 5,
    consumo: 4,
    gasto: 1600,
    alerta: 'Normal',
    numAlertas: 0,
  },
  {
    fecha: '2025-09-02',
    potencia: 60,
    energia: 6,
    consumo: 5,
    gasto: 2000,
    alerta: 'Sobrecarga',
    numAlertas: 1,
  },
]

export default function Historial() {
  const [tab, setTab] = useState('general')
  const [filtro, setFiltro] = useState('dia')
  const [metrica, setMetrica] = useState('consumo') // 👈 Estado de métrica
  const [fechaInicio, setFechaInicio] = useState('2025-09-01')
  const [fechaFin, setFechaFin] = useState('2025-09-02')

  const getData = () => {
    if (tab === 'general') return datosGeneral
    if (tab === 'circuito1') return datosCircuito1
    if (tab === 'circuito2') return datosCircuito2
    return []
  }

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(getData())
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, tab.toUpperCase())
    XLSX.writeFile(wb, `Historial_${tab}.xlsx`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white px-4 sm:px-8 md:px-16 lg:px-24 pt-24 pb-20 space-y-10">
      <h1 className="text-4xl font-bold text-center text-blue-400">Historial Energético</h1>

      {/* === Tabs === */}
      <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
        {['general', 'circuito1', 'circuito2'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`p-4 rounded-xl font-semibold shadow-lg transition text-lg
        ${
          tab === t
            ? 'bg-blue-600 text-white ring-4 ring-blue-400'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
        }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* === Gráfica === */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-4 flex-col md:flex-row">
          {/* Selector de métrica */}
          <select
            value={metrica}
            onChange={(e) => setMetrica(e.target.value)}
            className="bg-gray-900 text-white p-2 rounded-md border border-gray-700"
          >
            <option value="consumo">Consumo (kWh)</option>
            <option value="gasto">Gasto ($)</option>
            <option value="potencia">Potencia Activa (W)</option>
            <option value="energia">Energía (kWh)</option>
          </select>

          {/* Selector de fechas */}
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
            <BarChart data={getData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="fecha" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Bar dataKey="gasto" fill="#60a5fa" />
            </BarChart>
          ) : (
            <LineChart data={getData()}>
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
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="bg-gray-800 px-4 py-2 rounded-md"
        >
          <option value="dia">Por Día</option>
          <option value="mes">Por Mes</option>
        </select>

        <button
          onClick={exportToExcel}
          className="bg-green-600 px-4 py-2 rounded-md hover:bg-green-700 transition"
        >
          Descargar Excel
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
                <th className="p-3 border border-gray-700">Potencia Activa (W)</th>
                <th className="p-3 border border-gray-700">Energía (kWh)</th>
                <th className="p-3 border border-gray-700">Consumo</th>
                <th className="p-3 border border-gray-700">Gasto ($COP)</th>
                <th className="p-3 border border-gray-700">Tipo de alerta</th>
                <th className="p-3 border border-gray-700"># Alertas</th>
              </tr>
            </thead>
            <tbody>
              {getData().map((d, i) => (
                <tr key={i} className="hover:bg-gray-800/40 text-center transition">
                  <td className="p-2 border border-gray-700">{d.fecha}</td>
                  <td className="p-2 border border-gray-700">{d.potencia}</td>
                  <td className="p-2 border border-gray-700">{d.energia}</td>
                  <td className="p-2 border border-gray-700">{d.consumo}</td>
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
