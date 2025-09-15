'use client'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// === Datos simulados ===
const alertasRecientes = [
  { id: 1, circuito: 'C2', tipo: 'Pico de voltaje', detalle: '152 V a las 14:30', nivel: 'alto' },
  { id: 2, circuito: 'C3', tipo: 'Consumo excesivo', detalle: '2200 W', nivel: 'medio' },
  { id: 3, circuito: 'C1', tipo: 'Desconectado', detalle: 'Sin señal', nivel: 'alto' },
]

const historial = [
  {
    fecha: '15/09/2025 - 14:30',
    circuito: 'C2',
    alerta: 'Pico de voltaje (152 V)',
    estado: 'Resuelto',
  },
  {
    fecha: '15/09/2025 - 10:15',
    circuito: 'C3',
    alerta: 'Consumo excesivo (2200 W)',
    estado: 'Pendiente',
  },
  {
    fecha: '14/09/2025 - 21:00',
    circuito: 'C1',
    alerta: 'Circuito desconectado',
    estado: 'Resuelto',
  },
]

const alertasPorDia = [
  { dia: '12/09', cantidad: 2 },
  { dia: '13/09', cantidad: 4 },
  { dia: '14/09', cantidad: 3 },
  { dia: '15/09', cantidad: 5 },
]

const alertasPorTipo = [
  { tipo: 'Consumo excesivo', cantidad: 60 },
  { tipo: 'Voltaje inestable', cantidad: 25 },
  { tipo: 'Circuito apagado', cantidad: 15 },
]

export default function Alertas() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white px-4 sm:px-8 md:px-16 lg:px-24 pt-24 pb-20 space-y-10">
      {/* Título */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-bold text-blue-400 text-center"
      >
        Alertas de Consumo y Estado del Sistema
      </motion.h1>

      {/* === Alertas recientes === */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid md:grid-cols-3 gap-6"
      >
        {alertasRecientes.map((a, i) => (
          <Card
            key={a.id}
            className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl text-center p-6"
          >
            {/* Título */}
            <h3 className="text-lg text-gray-300">{a.tipo}</h3>

            {/* Nivel de alerta (color destacado como el valor en los indicadores) */}
            <p
              className={`text-3xl font-bold mt-2 ${
                a.nivel === 'alto'
                  ? 'text-red-400'
                  : a.nivel === 'medio'
                  ? 'text-yellow-400'
                  : 'text-green-400'
              }`}
            >
              {a.nivel.charAt(0).toUpperCase() + a.nivel.slice(1)}
            </p>

            {/* Detalle */}
            <p className="text-sm text-gray-400 mt-2">{a.detalle}</p>

            {/* Circuito */}
            <p className="text-xs mt-2 text-blue-300">Circuito: {a.circuito}</p>
          </Card>
        ))}
      </motion.div>

      {/* Gráficas */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid md:grid-cols-2 gap-8"
      >
        {/* Alertas por día */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4 text-blue-300">Alertas por día</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={alertasPorDia}>
                <XAxis dataKey="dia" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alertas por tipo (Barras en vez de Pie) */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4 text-blue-300">Alertas por tipo</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={alertasPorTipo}>
                <XAxis dataKey="tipo" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#facc15" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Historial de alertas */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-bold text-blue-300 mb-4">Historial de Alertas</h2>
        <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-700">
          <table className="min-w-full text-left">
            <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Circuito</th>
                <th className="px-4 py-2">Alerta</th>
                <th className="px-4 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((h, i) => (
                <tr key={i} className="border-t border-gray-700 hover:bg-gray-800/40">
                  <td className="px-4 py-2">{h.fecha}</td>
                  <td className="px-4 py-2">{h.circuito}</td>
                  <td className="px-4 py-2">{h.alerta}</td>
                  <td
                    className={`px-4 py-2 font-semibold ${
                      h.estado === 'Pendiente' ? 'text-yellow-400' : 'text-green-400'
                    }`}
                  >
                    {h.estado}
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
