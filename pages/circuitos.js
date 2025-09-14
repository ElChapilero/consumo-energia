'use client'

import { useState } from 'react'
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

// --- Datos simulados por circuito ---
const circuitos = [
  { id: 'c1', nombre: 'Circuito 1' },
  { id: 'c2', nombre: 'Circuito 2' },
  { id: 'c3', nombre: 'Circuito 3' },
]

const dataPorCircuito = {
  c1: {
    potencia: [
      { time: '10:00', potencia: 120 },
      { time: '10:05', potencia: 180 },
      { time: '10:10', potencia: 90 },
      { time: '10:15', potencia: 220 },
    ],
    energia: [
      { name: 'Lunes', energia: 4 },
      { name: 'Martes', energia: 3.2 },
      { name: 'Miércoles', energia: 4.8 },
      { name: 'Jueves', energia: 2.9 },
    ],
    comparacion: [
      { hora: '08:00', hoy: 1.2, ayer: 1.0 },
      { hora: '10:00', hoy: 2.0, ayer: 1.6 },
      { hora: '12:00', hoy: 3.5, ayer: 2.8 },
      { hora: '14:00', hoy: 4.2, ayer: 3.9 },
    ],
    consumoHora: [
      { hora: '08:00', kwh: 0.3 },
      { hora: '09:00', kwh: 0.25 },
      { hora: '10:00', kwh: 0.4 },
      { hora: '11:00', kwh: 0.2 },
      { hora: '12:00', kwh: 0.35 },
    ],
    resumen: { max: 220, promedio: 152, estado: 'Medio' },
    resumenDiario: { max: 12, promedio: 8.5, estado: 'Normal' },
    resumenComparacion: { hoy: 10.9, ayer: 9.3, diferencia: '+17%' },
    resumenCosto: { max: 260, promedio: 180, estado: 'Moderado' },
  },
  c2: {
    potencia: [
      { time: '10:00', potencia: 80 },
      { time: '10:05', potencia: 100 },
      { time: '10:10', potencia: 120 },
      { time: '10:15', potencia: 90 },
    ],
    energia: [
      { name: 'Lunes', energia: 2 },
      { name: 'Martes', energia: 1.8 },
      { name: 'Miércoles', energia: 2.2 },
      { name: 'Jueves', energia: 1.5 },
    ],
    comparacion: [
      { hora: '08:00', hoy: 0.8, ayer: 0.9 },
      { hora: '10:00', hoy: 1.0, ayer: 1.2 },
      { hora: '12:00', hoy: 1.5, ayer: 1.3 },
      { hora: '14:00', hoy: 1.8, ayer: 1.6 },
    ],
    consumoHora: [
      { hora: '08:00', kwh: 0.2 },
      { hora: '09:00', kwh: 0.15 },
      { hora: '10:00', kwh: 0.3 },
      { hora: '11:00', kwh: 0.1 },
      { hora: '12:00', kwh: 0.25 },
    ],
    resumen: { max: 150, promedio: 110, estado: 'Bajo' },
    resumenDiario: { max: 8, promedio: 5.5, estado: 'Normal' },
    resumenComparacion: { hoy: 6.5, ayer: 7.0, diferencia: '-7%' },
    resumenCosto: { max: 180, promedio: 120, estado: 'Bajo' },
  },c3: {
    potencia: [
      { time: '10:00', potencia: 80 },
      { time: '10:05', potencia: 100 },
      { time: '10:10', potencia: 120 },
      { time: '10:15', potencia: 90 },
    ],
    energia: [
      { name: 'Lunes', energia: 2 },
      { name: 'Martes', energia: 1.8 },
      { name: 'Miércoles', energia: 2.2 },
      { name: 'Jueves', energia: 1.5 },
    ],
    comparacion: [
      { hora: '08:00', hoy: 0.8, ayer: 0.9 },
      { hora: '10:00', hoy: 1.0, ayer: 1.2 },
      { hora: '12:00', hoy: 1.5, ayer: 1.3 },
      { hora: '14:00', hoy: 1.8, ayer: 1.6 },
    ],
    consumoHora: [
      { hora: '08:00', kwh: 0.2 },
      { hora: '09:00', kwh: 0.15 },
      { hora: '10:00', kwh: 0.3 },
      { hora: '11:00', kwh: 0.1 },
      { hora: '12:00', kwh: 0.25 },
    ],
    resumen: { max: 150, promedio: 110, estado: 'Bajo' },
    resumenDiario: { max: 8, promedio: 5.5, estado: 'Normal' },
    resumenComparacion: { hoy: 6.5, ayer: 7.0, diferencia: '-7%' },
    resumenCosto: { max: 180, promedio: 120, estado: 'Bajo' },
  },
  // Agrega más circuitos según necesites
}

const costoPorKWh = 650

export default function Circuitos() {
  const [selectedCircuit, setSelectedCircuit] = useState('c1')
  const [circuitState, setCircuitState] = useState({
    c1: true,
    c2: false,
    c3: false,
  })
  const data = dataPorCircuito[selectedCircuit]

  // Calcular costo y acumulado
  const consumoHoraConCosto = data.consumoHora.map((d, i, arr) => {
    const costo = d.kwh * costoPorKWh
    const acumulado = costo + (i > 0 ? arr[i - 1].acumulado : 0)
    return { ...d, costo, acumulado }
  })

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
        Panel de Circuitos - {circuitos.find((c) => c.id === selectedCircuit).nombre}
      </motion.h1>

      {/* Selector de circuitos */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="flex gap-6 justify-center flex-wrap">
        {circuitos.map((c) => (
          <div
            key={c.id}
            onClick={() => setSelectedCircuit(c.id)}
            className={`cursor-pointer p-6 w-44 h-36 rounded-xl flex flex-col justify-between shadow-lg transition-all
        ${
          selectedCircuit === c.id
            ? 'border-4 border-blue-500 bg-gray-800'
            : 'border border-gray-700 bg-gray-900 hover:bg-gray-800'
        }`}
          >
            <h3 className="text-xl font-bold text-center">{c.nombre}</h3>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setCircuitState((prev) => ({ ...prev, [c.id]: !prev[c.id] }))
              }}
              className={`mt-2 px-4 py-2 rounded-lg font-semibold w-full ${
                circuitState[c.id] ? 'bg-green-600' : 'bg-red-600'
              }`}
            >
              {circuitState[c.id] ? 'Encendido' : 'Apagado'}
            </button>
          </div>
        ))}
      </motion.div>

      {/* === Fila 1: Indicadores simples === */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl text-center p-6">
          <h3 className="text-lg text-gray-300">Voltaje</h3>
          <p className="text-3xl font-bold text-blue-400">118 V</p>
        </Card>
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl text-center p-6">
          <h3 className="text-lg text-gray-300">Corriente</h3>
          <p className="text-3xl font-bold text-green-400">5.2 A</p>
        </Card>
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl text-center p-6">
          <h3 className="text-lg text-gray-300">Frecuencia</h3>
          <p className="text-3xl font-bold text-yellow-400">60 Hz</p>
        </Card>
      </motion.div>

      {/* === Fila 2: Resumen + Gráfica === */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-10 gap-6">
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
        className="grid md:grid-cols-10 gap-6">
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
        className="grid md:grid-cols-10 gap-6 mt-10">
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
        className="grid md:grid-cols-10 gap-6 mt-10">
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
