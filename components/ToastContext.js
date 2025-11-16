'use client'
import { createContext, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const ToastContext = createContext()

export const useToast = () => useContext(ToastContext)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = (type, message, duration = 4000) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => removeToast(id), duration)
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 items-center">
        <AnimatePresence>
          {toasts.map(({ id, type, message }) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`p-4 rounded-xl shadow-lg text-white flex items-center gap-2 font-semibold ${
                type === 'error'
                  ? 'bg-red-600 border border-red-400'
                  : 'bg-blue-600 border border-blue-400'
              }`}
            >
              {type === 'error' && <span></span>}
              {type === 'success' && <span></span>}
              <span>{message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
