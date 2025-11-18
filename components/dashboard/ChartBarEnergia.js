'use client'
import { useState } from 'react'
import TooltipInfo from './TooltipInfo'
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { metricColors } from '@/constants/colors' // 👈 importamos la paleta

export default function ChartBarEnergia({ data }) {
  const { primary, secondary } = metricColors.energia
  const gradientId = 'energiaGradient'

  return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="w-full h-[350px] sm:h-[380px] md:h-[400px]"
      >
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl h-full">
          <CardContent className="p-6 h-full flex flex-col">
            <h2 className="text-xl font-semibold text-blue-300 mb-4 tracking-wide flex items-center justify-center gap-2">
              Energía (kWh) por Día
              <TooltipInfo numero={4} /> {/* número 4 → corresponde a “Energía Semanal (kWh)” */}
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

                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="dia" stroke="#d1d5db" fontSize={14} tickMargin={10} />
                  <YAxis
                    stroke="#d1d5db"
                    fontSize={14}
                    tickFormatter={(v) => `${v.toFixed(1)} kWh`}
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
                    formatter={(value) => [`${value.toFixed(4)} kWh`, 'Energía']}
                    labelStyle={{ color: primary, fontWeight: 'bold' }}
                  />

                  <Bar
                    dataKey="energia"
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
