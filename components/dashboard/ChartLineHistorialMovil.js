'use client'
import { useMemo, useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { metricColors } from '@/constants/colors'
import TooltipInfo from '@/components/dashboard/TooltipInfo'
import tooltipData from '@/components/dashboard/tooltipData'
import { Card, CardContent } from '@/components/ui/card'

export default function ChartLineHistorialMovil({ data = [], metrica = 'potencia' }) {
  /* ---------------------- NORMALIZAR DATA ---------------------- */
  const safeData = useMemo(() => {
    if (!Array.isArray(data)) return []

    return data.map((d) => ({
      fecha: d.fecha ?? d.dia ?? '',
      valor: Number(d[metrica] ?? d.valor ?? 0),
    }))
  }, [data, metrica])

  /* ---------------------- COLORES ---------------------- */
  const { primary, secondary } = metricColors[metrica] || metricColors.potencia

  const gradientAct = `grad-hist-${metrica}`

  /* ---------------------- TOOLTIP INFO ---------------------- */
  const tooltipMap = {
    voltaje: 14,
    corriente: 15,
    frecuencia: 16,
    potencia: 17,
    energia: 18,
    costo: 19,
    gasto: 20,
  }

  const tooltipId = tooltipMap[metrica] || 17
  const tooltipInfo = tooltipData[tooltipId]

  /* ---------------------- MODAL ---------------------- */
  const [modalOpen, setModalOpen] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (modalOpen) {
      setReady(false)
      const t = setTimeout(() => setReady(true), 180)
      return () => clearTimeout(t)
    }
  }, [modalOpen])

  /* 🔒 Desactivar scroll */
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden'
      const preventScroll = (e) => e.preventDefault()
      document.addEventListener('touchmove', preventScroll, { passive: false })

      return () => {
        document.body.style.overflow = ''
        document.removeEventListener('touchmove', preventScroll)
      }
    }
  }, [modalOpen])

  /* ---------------------- RENDER ---------------------- */
  return (
    <>
      {/* ===== PREVIEW ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        viewport={{ once: true }}
        className="w-full h-[260px] sm:h-[300px] flex flex-col"
      >
        <Card
          className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-lg h-full"
          onClick={() => setModalOpen(true)}
        >
          <CardContent className="p-4 h-full flex flex-col">
            <div className="flex justify-center items-center gap-2 mb-2">
              <h3 className="text-base font-semibold text-blue-300 tracking-wide">
                {tooltipInfo.text}
              </h3>

              <span onClick={(e) => e.stopPropagation()}>
                <TooltipInfo numero={tooltipId} />
              </span>
            </div>

            {/* --- PREVIEW LIMPIO (SOLO 1 LÍNEA) --- */}
            <div className="flex-1 min-h-0 relative">
              <div
                className="absolute inset-0"
                style={{
                  pointerEvents: 'none',
                  touchAction: 'none',
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={safeData} margin={{ left: -15, right: -15 }}>
                    <defs>
                      <linearGradient id={gradientAct} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={secondary} stopOpacity={0.30} />
                        <stop offset="100%" stopColor={secondary} stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <Area
                      type="monotone"
                      dataKey="valor"
                      stroke={secondary}
                      strokeWidth={2}
                      fill={`url(#${gradientAct})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== MODAL ===== */}
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
              className="bg-gray-900 rounded-2xl p-4 w-[92%] h-[90vh] border border-gray-700 shadow-xl flex flex-col"
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
                    <AreaChart data={safeData}>
                      <defs>
                        <linearGradient id={gradientAct} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={secondary} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={secondary} stopOpacity={0} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />

                      <XAxis dataKey="fecha" stroke="#d1d5db" fontSize={14} />
                      <YAxis stroke="#d1d5db" fontSize={14} />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '10px',
                          border: '1px solid #334155',
                          color: '#e2e8f0',
                          fontSize: '0.9rem',
                        }}
                        formatter={(value) => [value.toFixed(2), tooltipInfo.text]}
                      />

                      <Area
                        type="monotone"
                        dataKey="valor"
                        stroke={secondary}
                        strokeWidth={3}
                        fill={`url(#${gradientAct})`}
                      />
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
