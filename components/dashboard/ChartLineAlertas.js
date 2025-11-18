'use client'
import { useState, useMemo } from 'react'
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
import TooltipInfo from './TooltipInfo'
import tooltipData from './tooltipData'

export default function ChartLineAlertas({ data = [], title = 'Tendencia', metrica = 'potencia' }) {
  // 🛠️ Normalizar data: garantizar array SIEMPRE
  const safeData = useMemo(() => {
    if (!Array.isArray(data)) {
      console.warn('ChartLineAlertas recibió data inválida:', data)
      return []
    }

    // Estándar de estructura
    return data.map((d) => ({
      dia: d.dia ?? d.fecha ?? d.x ?? '',
      promedio: Number(d.promedio ?? d.avg ?? 0),
      actual: Number(d.actual ?? d.valor ?? d.y ?? 0),
    }))
  }, [data])

  const { primary, secondary } = metricColors[metrica] || metricColors.potencia
  const promedioColor = '#60a5fa'

  const gradientIdPromedio = `gradient-promedio-${metrica}`
  const gradientIdActual = `gradient-${metrica}-actual`

  const tooltipMap = {
    voltaje: 8,
    corriente: 9,
    frecuencia: 10,
    potencia: 11,
    energia: 12,
    costo: 13,
  }

  const tooltipId = tooltipMap[metrica] || 11
  const tooltipInfo = tooltipData[tooltipId]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="w-full h-[350px] sm:h-[380px] md:h-[400px] flex flex-col"
    >
      {/* Título + Tooltip */}
      <div className="flex justify-center items-center gap-2 mb-4">
        <h3 className="text-xl font-semibold text-blue-300 tracking-wide">{tooltipInfo.text}</h3>
        <TooltipInfo numero={tooltipId} />
      </div>

      <div className="flex-1 w-full">
        {/* 🛡️ Si no hay datos → evitar crash */}
        {safeData.length === 0 ? (
          <div className="flex justify-center items-center h-full text-slate-400">
            No hay datos disponibles
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={safeData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <defs>
                <linearGradient id={gradientIdPromedio} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={promedioColor} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={promedioColor} stopOpacity={0} />
                </linearGradient>

                <linearGradient id={gradientIdActual} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={secondary} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={secondary} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="dia" stroke="#d1d5db" fontSize={14} tickMargin={10} />
              <YAxis
                stroke="#d1d5db"
                fontSize={14}
                domain={['auto', 'auto']}
                tickFormatter={(v) => v.toFixed(2)}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  color: '#e2e8f0',
                  fontSize: '0.9rem',
                  boxShadow: `0 0 10px ${primary}66`,
                }}
                formatter={(value, name) => {
                  if (name === 'promedio') return [Number(value).toFixed(2), 'Promedio']
                  if (name === 'actual') return [Number(value).toFixed(2), 'Valor actual']
                  return [value, name]
                }}
                labelStyle={{ color: '#93c5fd', fontWeight: 'bold' }}
              />

              <Area
                type="monotone"
                dataKey="promedio"
                stroke={promedioColor}
                fill={`url(#${gradientIdPromedio})`}
                strokeWidth={3}
              />

              <Area
                type="monotone"
                dataKey="actual"
                stroke={secondary}
                fill={`url(#${gradientIdActual})`}
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  )
}
