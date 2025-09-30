'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import ResumenCard from '@/components/dashboard/ResumenCard'
import ChartLine from '@/components/dashboard/ChartLine'
import ChartBarEnergia from '@/components/dashboard/ChartBarEnergia'
import ResumenEnergia from '@/components/dashboard/ResumenEnergia'
import ChartComparacionConsumo from '@/components/dashboard//ChartComparacionConsumo'
import ResumenComparacionConsumo from '@/components/dashboard//ResumenComparacionConsumo'
import ChartCostoHora from '@/components/dashboard/ChartCostoHora'
import ResumenCostoHora from '@/components/dashboard/ResumenCostoHora'
import IndicadoresBasicos from '@/components/dashboard/IndicadoresBasicos'

export default function General() {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [data, setData] = useState({
    resumen: { max: 0, promedio: 0, estado: 'Apagado' },
    potencia: [],
    resumenDiario: { max: 0, promedio: 0, estado: 'Apagado' },
    energia: [],
    resumenComparacion: { hoy: 0, ayer: 0, diferencia: '0%' },
    comparacion: [],
    resumenCosto: { max: 0, promedio: 0, estado: 'Estable' },
    voltaje: 0,
    corriente: 0,
    frecuencia: 0,
    ultimo: null,
  })
  const [consumoHoraConCosto, setConsumoHoraConCosto] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        await loadDatos(user)
      }
      setLoading(false)
    }
    init()
  }, [])

  const getLocalDateKey = (date) => {
    return date
      .toLocaleDateString('es-CO', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .split('/')
      .reverse()
      .join('-') // yyyy-mm-dd
  }

  const loadDatos = async (user) => {
    const { data: circuitos } = await supabase
      .from('circuitos')
      .select('id')
      .eq('id_usuario', user.id)

    if (!circuitos || circuitos.length === 0) return
    const circuitosIds = circuitos.map((c) => c.id)

    const { data: medicionesDataRaw } = await supabase
      .from('mediciones')
      .select(
        'circuito_id, potencia, energia, voltaje, corriente, frecuencia, factor_potencia, created_at'
      )
      .in('circuito_id', circuitosIds)
      .order('created_at', { ascending: true })

    if (!medicionesDataRaw || medicionesDataRaw.length === 0) return

    const medicionesData = medicionesDataRaw.map((m) => ({
      ...m,
      created_at: new Date(m.created_at),
    }))
    medicionesData.sort((a, b) => a.created_at - b.created_at)

    // === Potencia últimos 10 minutos ===
    const now = new Date()
    const windowMinutes = 10
    const startTime = new Date(now.getTime() - (windowMinutes - 1) * 60_000)

    const potenciaData = []
    for (let i = 0; i < windowMinutes; i++) {
      const t = new Date(startTime.getTime() + i * 60_000)
      const medicion = medicionesData.find(
        (m) =>
          m.created_at.getFullYear() === t.getFullYear() &&
          m.created_at.getMonth() === t.getMonth() &&
          m.created_at.getDate() === t.getDate() &&
          m.created_at.getHours() === t.getHours() &&
          m.created_at.getMinutes() === t.getMinutes()
      )
      potenciaData.push({
        time: t.toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
        potencia: medicion ? medicion.potencia : 0,
      })
    }

    // === Energía últimos 7 días ===
    const energiaPorDiaMap = {}
    medicionesData.forEach((m) => {
      const key = getLocalDateKey(m.created_at)
      energiaPorDiaMap[key] = (energiaPorDiaMap[key] || 0) + (m.energia ?? 0)
    })

    const energiaArr = []
    for (let d = 6; d >= 0; d--) {
      const day = new Date()
      day.setDate(day.getDate() - d)
      const key = getLocalDateKey(day)
      const label = d === 0 ? 'Hoy' : day.toLocaleDateString('es-ES', { weekday: 'short' })
      energiaArr.push({ name: label, energia: energiaPorDiaMap[key] || 0 })
    }

    const energiaUltimos7 = energiaArr.map((d) => d.energia)
    const resumenDiarioMax = energiaUltimos7.length ? Math.max(...energiaUltimos7) : 0
    const resumenDiarioAvg = energiaUltimos7.length
      ? energiaUltimos7.reduce((a, b) => a + b, 0) / energiaUltimos7.length
      : 0

    // === Costos horarios ===
    const today = getLocalDateKey(new Date())
    const { data: consumosHoy } = await supabase
      .from('consumos_horarios')
      .select('hora, costo')
      .in('circuito_id', circuitosIds)
      .eq('fecha', today)
      .order('hora', { ascending: true })

    const costosPorHora = Array.from({ length: 24 }, (_, h) => ({
      hora: h,
      costo: 0,
    }))

    if (consumosHoy) {
      consumosHoy.forEach((c) => {
        costosPorHora[c.hora].costo += Number(c.costo)
      })
    }

    const horaActual = new Date().getHours()
    const costosHastaAhora = costosPorHora.filter((c) => c.hora <= horaActual)
    const resumenCostoMax = costosHastaAhora.length
      ? Math.max(...costosHastaAhora.map((c) => c.costo))
      : 0
    const resumenCostoAvg = costosHastaAhora.length
      ? costosHastaAhora.reduce((a, b) => a + b.costo, 0) / costosHastaAhora.length
      : 0

    // === Resumen potencia (solo hoy) ===
    const inicioHoy = new Date()
    inicioHoy.setHours(0, 0, 0, 0)
    const medicionesHoy = medicionesData.filter((m) => m.created_at >= inicioHoy)

    const maxPot = medicionesHoy.length
      ? Math.max(...medicionesHoy.map((m) => Number(m.potencia)))
      : 0
    const avgPot = medicionesHoy.length
      ? medicionesHoy.reduce((a, b) => a + Number(b.potencia), 0) / medicionesHoy.length
      : 0

    const ultimo = medicionesData[medicionesData.length - 1]

    // === Comparación hoy vs ayer ===
    const hoyKey = getLocalDateKey(new Date())
    const ayerKey = getLocalDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000))

    const energiaHoy = energiaPorDiaMap[hoyKey] || 0
    const energiaAyer = energiaPorDiaMap[ayerKey] || 0
    const diferencia =
      energiaAyer === 0
        ? '100%'
        : (((energiaHoy - energiaAyer) / energiaAyer) * 100).toFixed(1) + '%'

    setData({
      resumen: {
        max: maxPot,
        promedio: avgPot,
        estado: medicionesHoy.length > 0 ? 'Encendido' : 'Apagado',
      },
      potencia: potenciaData,
      resumenDiario: {
        max: resumenDiarioMax,
        promedio: resumenDiarioAvg,
        estado: energiaUltimos7.some((e) => e > 0) ? 'Encendido' : 'Apagado',
      },
      energia: energiaArr,
      resumenComparacion: { hoy: energiaHoy, ayer: energiaAyer, diferencia },
      comparacion: [
        { name: 'Ayer', energia: energiaAyer },
        { name: 'Hoy', energia: energiaHoy },
      ],
      resumenCosto: {
        max: resumenCostoMax,
        promedio: resumenCostoAvg,
        estado: costosHastaAhora.some((c) => c.costo > 0) ? 'Estable' : 'Sin datos',
      },
      voltaje: ultimo?.voltaje ?? 0,
      corriente: ultimo?.corriente ?? 0,
      frecuencia: ultimo?.frecuencia ?? 0,
      ultimo,
    })

    setConsumoHoraConCosto(costosPorHora)
  }

  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => loadDatos(user), 10000) // refresco cada 10s
    return () => clearInterval(interval)
  }, [user])

  if (loading || !data) return <p className="p-4">Cargando...</p>

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white px-4 sm:px-8 md:px-16 lg:px-24 pt-24 pb-20 space-y-10">
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-4xl font-bold text-center text-blue-400"
      >
        Dashboard General - Todos los Circuitos
      </motion.h1>

      {/* === Fila 1: Indicadores simples === */}
      <IndicadoresBasicos
        voltaje={data.voltaje}
        corriente={data.corriente}
        frecuencia={data.frecuencia}
      />

      {/* === Fila 2: Resumen + Gráfica === */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-10 gap-6"
      >
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl md:col-span-3 order-2 md:order-1">
          <CardContent className="p-6 w-full flex flex-col items-center">
            <h3 className="text-xl font-semibold text-blue-300 mb-6">Resumen Potencia</h3>
            <div className="flex flex-col gap-6 w-full">
              <ResumenCard
                label="Máxima"
                value={data.resumen.max ? data.resumen.max.toFixed(3) : 0}
                unit="W"
                color="text-green-400"
              />
              <ResumenCard
                label="Promedio"
                value={data.resumen.promedio ? data.resumen.promedio.toFixed(3) : 0}
                unit="W"
                color="text-blue-400"
              />
              <ResumenCard label="Estado" value={data.resumen.estado} color="text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl md:col-span-7 order-1 md:order-2">
          <CardContent className="p-6">
            <ChartLine
              data={data.potencia}
              dataKey="potencia"
              title="Potencia Activa (W)"
              color="#4ade80"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* === Fila 3: Resumen Diario + Energía === */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-10 gap-6 mt-10"
      >
        <div className="md:col-span-3">
          <ResumenEnergia
            max={data.resumenDiario.max.toFixed(2)}
            promedio={data.resumenDiario.promedio.toFixed(2)}
            estado={data.resumenDiario.estado}
          />
        </div>
        <div className="md:col-span-7">
          <ChartBarEnergia data={data.energia} />
        </div>
      </motion.div>

      {/* === Fila 4: Comparación día actual vs anterior === */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-10 gap-6 mt-10"
      >
        <div className="md:col-span-3">
          <ResumenComparacionConsumo
            hoy={data.resumenComparacion.hoy}
            ayer={data.resumenComparacion.ayer}
            diferencia={data.resumenComparacion.diferencia}
          />
        </div>
        <div className="md:col-span-7">
          <ChartComparacionConsumo data={data.comparacion} />
        </div>
      </motion.div>

      {/* === Fila 5: Costo por hora === */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-10 gap-6 mt-10"
      >
        <div className="md:col-span-3">
          <ResumenCostoHora
            max={data.resumenCosto.max}
            promedio={data.resumenCosto.promedio}
            estado={data.resumenCosto.estado}
          />
        </div>
        <div className="md:col-span-7">
          <ChartCostoHora data={consumoHoraConCosto} />
        </div>
      </motion.div>
    </div>
  )
}
