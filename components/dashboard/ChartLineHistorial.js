'use client'
import { useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { motion } from 'framer-motion'
import { metricColors } from '@/constants/colors'
import tooltipData from '@/components/dashboard/tooltipData'
import TooltipInfo from '@/components/dashboard/TooltipInfo'

export default function ChartLineHistorial({ data = [], metrica = 'potencia' }) {
  const { primary, secondary } = metricColors[metrica] || metricColors.potencia
  const promedioColor = '#60a5fa'

  const gradientIdPromedio = `gradient-historial-promedio`
  const gradientIdActual = `gradient-historial-${metrica}`
  const [tooltipActive, setTooltipActive] = useState(false)

  // 🔢 Mapa para asociar la métrica con su ID de tooltip
  const tooltipMap = {
    voltaje: 14,
    corriente: 15,
    frecuencia: 16,
    potencia: 17,
    energia: 18,
    costo: 19,
    gasto: 20,
  }

  const tooltipId = tooltipMap[metrica] || 11

  return (
    <div
      className="chart-touch-lock flex-1"
      onTouchStart={() => setTooltipActive(true)} // activa tooltip al tocar
      onTouchEnd={() => setTooltipActive(false)} // desactiva al soltar
      onTouchCancel={() => setTooltipActive(false)} // desactiva si el touch se cancela
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="bg-gradient-to-br from-gray-800/90 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-2xl w-full h-[380px] flex flex-col"
      >
        {/* 🔹 Título principal */}
        <div className="flex justify-center items-center gap-2 mb-4 text-center">
          <h3 className="text-xl font-semibold text-blue-300 tracking-wide capitalize">
            {metrica === 'gasto'
              ? 'Tendencia del gasto energético ($COP)'
              : `Tendencia de ${metrica}`}
          </h3>
          <TooltipInfo numero={tooltipId} />
        </div>

        {/* 🔹 Subtexto descriptivo (una sola línea, más claro) */}
        <p className="text-center text-sm text-gray-400 mb-2">
          {`Evolución ${
            metrica === 'gasto' ? 'del gasto' : 'de la ' + metrica
          } a lo largo del tiempo`}
        </p>

        {/* 🔹 Gráfico principal */}
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <defs>
                {/* Gradiente del promedio */}
                <linearGradient id={gradientIdPromedio} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={promedioColor} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={promedioColor} stopOpacity={0} />
                </linearGradient>

                {/* Gradiente de la métrica actual */}
                <linearGradient id={gradientIdActual} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={secondary} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={secondary} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="fecha" stroke="#d1d5db" fontSize={14} tickMargin={10} />
              <YAxis stroke="#d1d5db" fontSize={14} tickFormatter={(v) => v.toFixed(2)} />

              <Tooltip
                active={tooltipActive}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  color: '#e2e8f0',
                  fontSize: '0.9rem',
                  boxShadow: `0 0 10px ${primary}66`,
                }}
                labelStyle={{ color: '#93c5fd', fontWeight: 'bold' }}
                formatter={(value) => Number(value).toFixed(2)}
              />

              {/* Área promedio */}
              <Area
                type="monotone"
                dataKey="promedio"
                stroke={promedioColor}
                fill={`url(#${gradientIdPromedio})`}
                strokeWidth={3}
                isAnimationActive
                animationDuration={800}
              />

              {/* Área actual */}
              <Area
                type="monotone"
                dataKey={metrica}
                stroke={secondary}
                fill={`url(#${gradientIdActual})`}
                strokeWidth={3}
                isAnimationActive
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  )
}
