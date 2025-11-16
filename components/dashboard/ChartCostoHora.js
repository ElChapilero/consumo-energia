'use client'
import TooltipInfo from './TooltipInfo'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { metricColors } from '@/constants/colors' // 👈 Importamos los colores

export default function ChartCostoHora({ data }) {
  // 🎨 Colores desde la paleta central
  const { primary, secondary } = metricColors.gasto
  const gradientId = 'costoGradient'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="w-full h-[350px] sm:h-[380px] md:h-[400px]"
    >
      <Card className="bg-gradient-to-br from-zinc-800 to-zinc-900 border-none shadow-xl h-full">
        <CardContent className="p-6 h-full flex flex-col">
          <h2 className="text-xl font-semibold text-blue-300 mb-4 tracking-wide flex items-center justify-center gap-2">
            Gasto por Hora ($COP)
            <TooltipInfo numero={5} /> {/* número 5 → Costo por Hora según tus textos */}
          </h2>

          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 20, left: -10, bottom: 10 }}
                barCategoryGap="20%"
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primary} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={secondary} stopOpacity={0.1} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />

                <XAxis
                  dataKey="hora"
                  stroke="#d1d5db"
                  fontSize={14}
                  tickMargin={10}
                  tickFormatter={(v) => `${parseInt(v)}`}
                />
                <YAxis
                  stroke="#d1d5db"
                  fontSize={14}
                  tickFormatter={(v) => `$${v.toLocaleString('es-CO')}`}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '10px',
                    border: '1px solid #334155',
                    color: '#e2e8f0',
                    fontSize: '0.9rem',
                    boxShadow: `0 0 10px ${primary}66`,
                  }}
                  formatter={(v) => [`$${Number(v).toLocaleString('es-CO')}`, 'Costo']}
                  labelStyle={{ color: primary, fontWeight: 'bold' }}
                />

                <Bar
                  dataKey="costo"
                  fill={`url(#${gradientId})`}
                  radius={[8, 8, 0, 0]}
                  maxBarSize={45}
                  isAnimationActive={true}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
