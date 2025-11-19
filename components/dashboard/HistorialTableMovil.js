'use client'
import { motion } from 'framer-motion'

export default function HistorialTableMovil({ data = [], metrica = 'potencia' }) {
  if (!data.length) {
    return <div className="text-gray-400 text-center py-6">No hay datos disponibles.</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="w-full"
    >
      {/* 🎯 CONTENEDOR CON SCROLL VERTICAL */}
      <div className="max-h-[420px] overflow-y-auto rounded-xl border border-gray-700 shadow-lg">
        <table className="min-w-full text-left text-gray-300">
          <thead className="bg-gray-700 text-gray-200 uppercase text-xs sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Potencia (W)</th>
              <th className="px-4 py-3">Energía (kWh)</th>
              <th className="px-4 py-3">Voltaje (V)</th>
              <th className="px-4 py-3">Corriente (A)</th>
              <th className="px-4 py-3">Frecuencia (Hz)</th>
              <th className="px-4 py-3">Factor Potencia</th>
              <th className="px-4 py-3">Gasto ($COP)</th>
              <th className="px-4 py-3">Alertas</th>
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
                <td className="px-4 py-2">{Number(d.energia ?? 0).toFixed(2)}</td>
                <td className="px-4 py-2">{Number(d.voltaje ?? 0).toFixed(2)}</td>
                <td className="px-4 py-2">{Number(d.corriente ?? 0).toFixed(2)}</td>
                <td className="px-4 py-2">{Number(d.frecuencia ?? 0).toFixed(2)}</td>
                <td className="px-4 py-2">{Number(d.factor_potencia ?? 0).toFixed(2)}</td>

                <td className="px-4 py-2 text-green-400 font-semibold">
                  ${Number(d.gasto ?? 0).toFixed(2)}
                </td>

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
    </motion.div>
  )
}
