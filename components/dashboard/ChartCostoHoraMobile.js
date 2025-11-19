'use client'
import TooltipInfo from './TooltipInfo'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { metricColors } from '@/constants/colors'
import { useEffect, useState } from 'react'

export default function ChartCostoHoraMobile({ data, dataKey = 'costo', title = 'Gasto por Hora ($COP)' }) {
  const { primary, secondary } = metricColors.gasto
  const gradientId = `gradient-${dataKey}`

  const [isMobile, setIsMobile] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [ready, setReady] = useState(false)

  // Detectar móvil
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 965)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Delay para render modal
  useEffect(() => {
    if (modalOpen) {
      setReady(false)
      const id = setTimeout(() => setReady(true), 200)
      return () => clearTimeout(id)
    }
    setReady(false)
  }, [modalOpen])

  // Bloqueo scroll
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      const prevent = (e) => e.preventDefault()
      document.addEventListener('touchmove', prevent, { passive: false })

      return () => {
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''
        document.removeEventListener('touchmove', prevent)
      }
    }
  }, [modalOpen])

  if (!isMobile) return null

  return (
    <>
      {/* --- PREVIEW --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full h-[450px] flex flex-col"
      >
        <Card
          className="bg-gradient-to-br from-zinc-800 to-zinc-900 border-none shadow-xl h-full"
          onClick={() => setModalOpen(true)}
        >
          <CardContent className="p-6 h-full flex flex-col">
            <h3 className="text-xl font-semibold text-blue-300 mb-4 flex justify-center gap-2">
              {title}
              <span onClick={(e) => e.stopPropagation()}>
                <TooltipInfo numero={5} />
              </span>
            </h3>

            {/* --- PREVIEW CLEAN --- */}
            <div className="flex-1 min-h-0 relative">
              <div
                className="absolute inset-0 w-full h-full"
                style={{
                  pointerEvents: 'none',
                  touchAction: 'none',
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ left: -20, right: -20 }}>
                    <defs>
                      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={primary} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={secondary} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>

                    {/* ❌ Sin grid
                        ❌ Sin eje X
                        ❌ Sin eje Y
                        ❌ Sin tooltip */}

                    <Bar
                      dataKey={dataKey}
                      fill={`url(#${gradientId})`}
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* --- MODAL DETALLADO --- */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              transition={{ duration: 0.2 }}
              className="bg-zinc-900 rounded-2xl p-4 w-[92%] h-[90vh] max-h-[90vh] border border-zinc-700 shadow-xl flex flex-col"
            >
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-blue-300 text-lg">Vista detallada</h4>
                <button onClick={() => setModalOpen(false)} className="text-gray-300 text-2xl">
                  ✕
                </button>
              </div>

              <div className="flex-1 min-h-0">
                {ready ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
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
                        tickFormatter={(v) => `${parseInt(v)}`}
                      />

                      <YAxis
                        stroke="#d1d5db"
                        fontSize={14}
                        tickFormatter={(v) => `${v.toLocaleString('es-CO')}`}
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '10px',
                          border: '1px solid #334155',
                          color: '#e2e8f0',
                          fontSize: '0.9rem',
                        }}
                        formatter={(v) => [`$${Number(v).toLocaleString('es-CO')}`, 'Costo']}
                      />

                      <Bar
                        dataKey={dataKey}
                        fill={`url(#${gradientId})`}
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-gray-400">
                    Cargando...
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
