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
import { motion, AnimatePresence } from 'framer-motion'
import { metricColors } from '@/constants/colors'
import { Card, CardContent } from '@/components/ui/card'
import { useEffect, useState } from 'react'

export default function ChartLinePotenciaMobile({ data, dataKey = 'potencia', title }) {
  const { primary } = metricColors[dataKey] || metricColors.potencia
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

  // Delay para montar el chart del modal
  useEffect(() => {
    if (modalOpen) {
      setReady(false)
      const id = setTimeout(() => setReady(true), 200)
      return () => clearTimeout(id)
    } else {
      setReady(false)
    }
  }, [modalOpen])

  // 🔒 Desactivar scroll al abrir modal
  useEffect(() => {
    if (modalOpen) {
      // Desactivar scroll
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'

      // Desactivar gestos táctiles
      const preventScroll = (e) => e.preventDefault()
      document.addEventListener('touchmove', preventScroll, { passive: false })

      return () => {
        // Restaurar scroll
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''
        document.removeEventListener('touchmove', preventScroll)
      }
    } else {
      // Restaurar cuando modal se cierre
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [modalOpen])

  if (!isMobile) return null

  // ------- REUSABLE DEFS -------
  const renderDefs = (
    <defs>
      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={primary} stopOpacity={0.6} />
        <stop offset="95%" stopColor={primary} stopOpacity={0} />
      </linearGradient>
    </defs>
  )

  // ------- REUSABLE AREA -------
  const renderArea = (
    <Area
      type="monotone"
      dataKey={dataKey}
      stroke={primary}
      fillOpacity={1}
      fill={`url(#${gradientId})`}
      strokeWidth={3}
    />
  )

  return (
    <>
      {/* ---- VISTA PREVIA ---- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        viewport={{ once: true }}
        className="w-full h-[260px] sm:h-[300px] flex flex-col"
      >
        <Card
          className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl h-full"
          onClick={() => setModalOpen(true)}
        >
          <CardContent className="p-6 h-full flex flex-col">
            <h3 className="text-xl font-semibold text-blue-300 mb-4 flex justify-center gap-2">
              {title}

              <span onClick={(e) => e.stopPropagation()}>
                <TooltipInfo numero={1} />
              </span>
            </h3>

            {/* --- CLEAN NON-INTERACTIVE GRAPH --- */}
            <div className="flex-1 min-h-0 relative">
              <div
                className="absolute inset-0 w-full h-full"
                style={{
                  pointerEvents: 'none',
                  touchAction: 'none',
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ left: -20, right: -20, top: 0, bottom: 0 }}>
                    {renderDefs}

                    {/* ❌ SIN Grid */}
                    {/* ❌ SIN XAxis */}
                    {/* ❌ SIN YAxis */}
                    {/* ❌ SIN Tooltip */}

                    {renderArea}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ---- MODAL DETALLADO ---- */}
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
              className="bg-gray-900 rounded-2xl p-4 w-[92%] h-[90vh] max-h-[90vh] border border-gray-700 shadow-xl flex flex-col"
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
                    <AreaChart data={data}>
                      {renderDefs}
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis dataKey="time" stroke="#d1d5db" fontSize={14} />
                      <YAxis stroke="#d1d5db" fontSize={14} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '10px',
                          border: '1px solid #334155',
                          color: '#e2e8f0',
                          fontSize: '0.9rem',
                        }}
                        formatter={(value) => `${Number(value).toFixed(3)} W`}
                      />
                      {renderArea}
                    </AreaChart>
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
