'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Circuitos() {
  const [user, setUser] = useState(null)
  const [demoMode, setDemoMode] = useState(false)
  const [circuitos, setCircuitos] = useState([])
  const [selectedCircuito, setSelectedCircuito] = useState(null)
  const [medicion, setMedicion] = useState(null)
  const [estadoCircuito, setEstadoCircuito] = useState('Apagado')

  // Justo antes del return
  const resumen = {
    voltaje: {
      max: medicion?.voltaje ?? 0,
      prom: medicion?.voltaje ?? 0,
      estado: estadoCircuito,
    },
    corriente: {
      max: medicion?.corriente ?? 0,
      prom: medicion?.corriente ?? 0,
      estado: estadoCircuito,
    },
    potencia: {
      max: medicion?.potencia ?? 0,
      prom: medicion?.potencia ?? 0,
      estado: estadoCircuito,
    },
    energia: {
      max: medicion?.energia ?? 0,
      prom: medicion?.energia ?? 0,
      estado: estadoCircuito,
    },
    factor_potencia: {
      max: medicion?.factor_potencia ?? 0,
      prom: medicion?.factor_potencia ?? 0,
      estado: estadoCircuito,
    },
    frecuencia: {
      max: medicion?.frecuencia ?? 0,
      prom: medicion?.frecuencia ?? 0,
      estado: estadoCircuito,
    },
  }

  // === Manejo de sesión y demo ===
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()

      if (data?.user) {
        setUser(data.user)
      } else {
        // 🚀 Demo habilitada
        setDemoMode(true)
        const demoCircuito = { id_circuito: 'demo1', nombre: 'Demo Circuito' }
        setCircuitos([demoCircuito])
        setSelectedCircuito(demoCircuito)
        setMedicion({
          voltaje: 0,
          corriente: 0,
          potencia: 0,
          energia: 0,
          factor_potencia: 0,
          frecuencia: 0,
        })
      }
    }
    getUser()
  }, [])

  // === Cargar resumen histórico ===
  useEffect(() => {
    const fetchResumen = async () => {
      if (!selectedCircuito || demoMode) return

      const { data, error } = await supabase
        .from('mediciones_historial')
        .select('voltaje, corriente, potencia, energia')
        .eq('id_mediciones', selectedCircuito.id_circuito)

      if (!error && data.length > 0) {
        const calcProm = (arr, key) => arr.reduce((a, b) => a + Number(b[key]), 0) / arr.length

        setResumen({
          voltaje: {
            max: Math.max(...data.map((d) => d.voltaje)),
            prom: calcProm(data, 'voltaje').toFixed(2),
            estado: estadoCircuito,
          },
          corriente: {
            max: Math.max(...data.map((d) => d.corriente)),
            prom: calcProm(data, 'corriente').toFixed(2),
            estado: estadoCircuito,
          },
          potencia: {
            max: Math.max(...data.map((d) => d.potencia)),
            prom: calcProm(data, 'potencia').toFixed(2),
            estado: estadoCircuito,
          },
          energia: {
            max: Math.max(...data.map((d) => d.energia)),
            prom: calcProm(data, 'energia').toFixed(2),
            estado: estadoCircuito,
          },
        })
      }
    }

    fetchResumen()
  }, [selectedCircuito, demoMode, estadoCircuito])

  // === Cargar última medición en tiempo real ===
  useEffect(() => {
    const fetchMedicion = async () => {
      if (!selectedCircuito || demoMode) return

      const { data, error } = await supabase
        .from('mediciones')
        .select('*')
        .eq('id_circuito', selectedCircuito.id_circuito)
        .order('creado_en', { ascending: false })
        .limit(1)
        .single()

      if (!error && data) {
        setMedicion(data)
      }
    }

    fetchMedicion()
  }, [selectedCircuito, demoMode])

  // === Encender/Apagar ===
  const toggleCircuito = () => {
    setEstadoCircuito((prev) => (prev === 'Apagado' ? 'Encendido' : 'Apagado'))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white px-4 sm:px-8 md:px-16 lg:px-24 pt-24 pb-20 space-y-10">
      {/* Título */}
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-4xl font-bold text-center text-blue-400"
      >
        {demoMode ? 'Demo - Panel por Circuito' : 'Panel por Circuito'}
      </motion.h1>

      {/* Lista de circuitos con botón dentro del Card */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {circuitos.map((c) => (
          <Card
            key={c.id_circuito}
            className={`cursor-pointer bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 ${
              selectedCircuito?.id_circuito === c.id_circuito ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedCircuito(c)}
          >
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <h3 className="text-lg font-semibold text-blue-300">{c.nombre}</h3>
              <Button
                className={`w-full rounded-xl py-2 font-bold transition-all ${
                  estadoCircuito === 'Encendido'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                onClick={(e) => {
                  e.stopPropagation() // evita que dispare el onClick del Card
                  toggleCircuito()
                }}
              >
                {estadoCircuito === 'Encendido' ? 'Apagar' : 'Encender'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Datos del circuito seleccionado */}
      {selectedCircuito && medicion && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid md:grid-cols-3 lg:grid-cols-6 gap-6"
        >
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl text-center p-6">
            <h3 className="text-lg text-gray-300">Voltaje</h3>
            <p className="text-3xl font-bold text-blue-400">{medicion.voltaje} V</p>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl text-center p-6">
            <h3 className="text-lg text-gray-300">Corriente</h3>
            <p className="text-3xl font-bold text-green-400">{medicion.corriente} A</p>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl text-center p-6">
            <h3 className="text-lg text-gray-300">Potencia</h3>
            <p className="text-3xl font-bold text-yellow-400">{medicion.potencia} W</p>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl text-center p-6">
            <h3 className="text-lg text-gray-300">Energía</h3>
            <p className="text-3xl font-bold text-purple-400">{medicion.energia} kWh</p>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl text-center p-6">
            <h3 className="text-lg text-gray-300">Factor Potencia</h3>
            <p className="text-3xl font-bold text-pink-400">{medicion.factor_potencia}</p>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl text-center p-6">
            <h3 className="text-lg text-gray-300">Frecuencia</h3>
            <p className="text-3xl font-bold text-cyan-400">{medicion.frecuencia} Hz</p>
          </Card>
        </motion.div>
      )}
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
                {key}
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
