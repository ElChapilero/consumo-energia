'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info } from 'lucide-react'
import tooltipData from './tooltipData'

export default function TooltipInfo({ numero }) {
  const [hovered, setHovered] = useState(false)
  const data = tooltipData[numero]

  if (!data) return null // evita errores si el número no existe

  return (
    <div
      className="relative inline-block ml-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Info className="w-5 h-5 text-blue-400 cursor-pointer hover:text-blue-300 transition" />

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-gray-900 text-gray-100 text-sm rounded-xl shadow-lg border border-gray-700 p-4 z-50"
          >
            <p className="text-blue-300 font-semibold mb-1">{data.text}</p>
            <p className="text-gray-300 mb-2">{data.description}</p>
            <p className="text-gray-400 text-xs italic">{data.impact}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
