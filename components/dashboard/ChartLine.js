'use client'
import TooltipInfo from './TooltipInfo'
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
import { metricColors } from '@/constants/colors' // 👈 importamos la paleta

export default function ChartLinePotencia({ data, dataKey = 'potencia', title }) {
  const { primary } = metricColors[dataKey] || metricColors.potencia
  const gradientId = `gradient-${dataKey}`

  return (
    <div className="chart-touch-lock flex-1">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="w-full h-[350px] sm:h-[380px] md:h-[400px] flex flex-col"
      >
        <h3 className="text-xl font-semibold text-blue-300 mb-4 tracking-wide flex items-center justify-center gap-2">
          {title}
          <TooltipInfo numero={1} /> {/* ← puedes cambiar el número según el tema */}
        </h3>

        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primary} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={primary} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="time" stroke="#d1d5db" fontSize={14} tickMargin={10} />
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
                formatter={(value) => `${Number(value).toFixed(3)} W`}
              />

              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={primary}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                strokeWidth={3}
                isAnimationActive={true}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  )
}
