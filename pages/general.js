'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function General() {
  const [user, setUser] = useState(null)
  const [demoMode, setDemoMode] = useState(false)
  const [valores, setValores] = useState({
    voltaje: 0,
    corriente: 0,
    potencia: 0,
    energia: 0,
    factor_potencia: 0,
    frecuencia: 0,
  })
  const [resumen, setResumen] = useState({
    voltaje: { max: 0, prom: 0, estado: 'Sin datos' },
    corriente: { max: 0, prom: 0, estado: 'Sin datos' },
    potencia: { max: 0, prom: 0, estado: 'Sin datos' },
    energia: { max: 0, prom: 0, estado: 'Sin datos' },
    factor_potencia: { max: 0, prom: 0, estado: 'Sin datos' },
    frecuencia: { max: 0, prom: 0, estado: 'Sin datos' },
  })

  // === Manejo de sesión ===
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        setUser(data.user)
      } else {
        setDemoMode(true) // 🚀 Si no hay sesión, usar modo demo
      }
    }
    getUser()
  }, [])

  // === Última medición general ===
  useEffect(() => {
    const fetchGeneral = async () => {
      if (demoMode) return

      const { data, error } = await supabase
        .from('mediciones_general')
        .select('*')
        .order('creado_en', { ascending: false })
        .limit(1)
        .single()

      if (!error && data) {
        setValores({
          voltaje: data.voltaje_avg,
          corriente: data.corriente_total,
          potencia: data.potencia_total,
          energia: data.energia_total,
          factor_potencia: data.fp_total,
          frecuencia: data.frecuencia,
        })
      }
    }

    fetchGeneral()
  }, [demoMode])

  // === Resumen histórico general ===
  useEffect(() => {
    const fetchResumen = async () => {
      if (demoMode) return

      const { data, error } = await supabase
        .from('mediciones_general')
        .select('voltaje_avg, corriente_total, potencia_total, energia_total, fp_total, frecuencia')

      if (!error && data.length > 0) {
        const calcProm = (arr, key) => arr.reduce((a, b) => a + Number(b[key]), 0) / arr.length

        setResumen({
          voltaje: {
            max: Math.max(...data.map((d) => d.voltaje_avg)),
            prom: calcProm(data, 'voltaje_avg').toFixed(2),
            estado: 'Normal',
          },
          corriente: {
            max: Math.max(...data.map((d) => d.corriente_total)),
            prom: calcProm(data, 'corriente_total').toFixed(2),
            estado: 'Normal',
          },
          potencia: {
            max: Math.max(...data.map((d) => d.potencia_total)),
            prom: calcProm(data, 'potencia_total').toFixed(2),
            estado: 'Normal',
          },
          energia: {
            max: Math.max(...data.map((d) => d.energia_total)),
            prom: calcProm(data, 'energia_total').toFixed(2),
            estado: 'Normal',
          },
          factor_potencia: {
            max: Math.max(...data.map((d) => d.fp_total)),
            prom: calcProm(data, 'fp_total').toFixed(2),
            estado: 'Normal',
          },
          frecuencia: {
            max: Math.max(...data.map((d) => d.frecuencia)),
            prom: calcProm(data, 'frecuencia').toFixed(2),
            estado: 'Normal',
          },
        })
      }
    }

    fetchResumen()
  }, [demoMode])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white 
      px-4 sm:px-8 md:px-16 lg:px-24 pt-24 pb-20 space-y-10">
      {/* Título */}
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-4xl font-bold text-center text-blue-400"
      >
        {demoMode ? 'Demo - Panel General' : 'Panel General de Consumo Energético'}
      </motion.h1>

      {/* === Indicadores instantáneos === */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0 }}
        className="grid md:grid-cols-3 lg:grid-cols-6 gap-6"
      >
        {[
          { label: 'Voltaje', value: `${valores.voltaje} V`, color: 'text-blue-400' },
          { label: 'Corriente', value: `${valores.corriente} A`, color: 'text-green-400' },
          { label: 'Potencia', value: `${valores.potencia} W`, color: 'text-yellow-400' },
          { label: 'Energía', value: `${valores.energia} kWh`, color: 'text-purple-400' },
          { label: 'Factor Potencia', value: valores.factor_potencia, color: 'text-pink-400' },
          { label: 'Frecuencia', value: `${valores.frecuencia} Hz`, color: 'text-cyan-400' },
        ].map((item, i) => (
          <Card key={i} className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl text-center p-6">
            <h3 className="text-lg text-gray-300">{item.label}</h3>
            <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
          </Card>
        ))}
      </motion.div>

      {/* === Resumen por variable === */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {Object.entries(resumen).map(([key, r]) => (
          <Card
            key={key}
            className="bg-gradient-to-br from-slate-900 to-slate-800 border-none shadow-xl"
          >
            <CardContent className="p-6 w-full">
              <h3 className="text-xl font-semibold text-blue-300 mb-4 text-center capitalize">
                {key.replace('_', ' ')}
              </h3>
              <div className="flex flex-col items-center gap-4">
                <div className="bg-slate-800/60 rounded-lg p-4 w-full text-center shadow-inner">
                  <span className="text-sm text-gray-400">Máximo</span>
                  <span className="block text-2xl font-bold text-green-400">{r.max}</span>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-4 w-full text-center shadow-inner">
                  <span className="text-sm text-gray-400">Promedio</span>
                  <span className="block text-2xl font-bold text-blue-400">{r.prom}</span>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-4 w-full text-center shadow-inner">
                  <span className="text-sm text-gray-400">Estado</span>
                  <span className="block text-2xl font-bold text-yellow-400">{r.estado}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  )
}
