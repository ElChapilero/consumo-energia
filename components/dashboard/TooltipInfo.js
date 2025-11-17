'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info } from 'lucide-react'
import tooltipData from './tooltipData'

export default function TooltipInfo({ numero }) {
  const [open, setOpen] = useState(false)
  const data = tooltipData[numero]

  if (!data) return null

  const isMobile =
    typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <div className="relative inline-block ml-2">
      {/* PC → hover / Móvil → click */}
      <Info
        className="w-5 h-5 text-blue-400 cursor-pointer hover:text-blue-300 transition"
        onMouseEnter={() => !isMobile && setOpen(true)}
        onMouseLeave={() => !isMobile && setOpen(false)}
        onClick={() => isMobile && setOpen(true)}
      />

      {/* MODAL */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-6"
            onClick={() => setOpen(false)}
          >
            {/* Fondo oscuro */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

            {/* Contenido */}
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              exit={{ y: 20 }}
              className="relative bg-gray-900 text-gray-100 w-full max-w-sm rounded-xl shadow-lg border border-gray-700 p-4 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-blue-300 font-semibold mb-2">{data.text}</p>
              <p className="text-gray-300 mb-2">{data.description}</p>
              <p className="text-gray-400 text-xs italic mb-4">{data.impact}</p>

              <button
                onClick={() => setOpen(false)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-md font-semibold"
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
