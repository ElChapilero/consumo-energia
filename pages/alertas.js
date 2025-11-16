'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import ChartLineAlertas from '@/components/dashboard/ChartLineAlertas'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function Alertas() {
  const [user, setUser] = useState(null)
  const [casas, setCasas] = useState([])
  const [circuitos, setCircuitos] = useState([])
  const [casaSel, setCasaSel] = useState('')
  const [circuitoSel, setCircuitoSel] = useState('')
  const [metrica, setMetrica] = useState('potencia')
  const [data, setData] = useState([])
  const [alertas, setAlertas] = useState([])

  /* ---------- Sesión y carga inicial ---------- */
  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const usuario = session?.user
      setUser(usuario || null)
      if (usuario) await loadCasasYCircuitos(usuario.id)
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      const usuario = session?.user
      setUser(usuario || null)
      if (usuario) loadCasasYCircuitos(usuario.id)
      else {
        setCasas([])
        setCircuitos([])
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  /* ---------- Cargar casas y circuitos ---------- */
  const loadCasasYCircuitos = async (userId) => {
    if (!userId) return
    const { data: dispositivos, error: err1 } = await supabase
      .from('dispositivos')
      .select('id, nombre')
      .eq('id_usuario', userId)
      .order('creado_en', { ascending: true })

    if (err1) {
      console.warn('Error cargando dispositivos:', err1)
      return
    }

    setCasas(dispositivos || [])
    if (!dispositivos?.length) return

    const casaInicial = dispositivos[0].id
    setCasaSel(casaInicial)

    const { data: c, error: err2 } = await supabase
      .from('circuitos')
      .select('id, nombre, id_dispositivo')
      .in(
        'id_dispositivo',
        dispositivos.map((d) => d.id)
      )
      .order('indice', { ascending: true })

    if (err2) console.warn('Error cargando circuitos:', err2)
    setCircuitos(c || [])

    const primerCircuito = c?.find((cir) => cir.id_dispositivo === casaInicial)
    if (primerCircuito) setCircuitoSel(primerCircuito.id)
  }

  /* ---------- Cargar datos semanales ---------- */
  useEffect(() => {
    if (!circuitoSel) return

    const fetchConsumos = async () => {
      const hoy = new Date()
      const fechaHoy = hoy.toISOString().split('T')[0]
      const lunes = new Date(hoy)
      const day = (hoy.getDay() + 6) % 7
      lunes.setDate(hoy.getDate() - day)
      const fechaLunes = lunes.toISOString().split('T')[0]

      const { data: consumos, error } = await supabase
        .from('consumos_horarios')
        .select(`fecha, ${metrica}`)
        .eq('circuito_id', circuitoSel)
        .gte('fecha', fechaLunes)
        .lte('fecha', fechaHoy)
        .order('fecha', { ascending: true })

      if (error) {
        console.warn('Error cargando consumos:', error)
        setData([])
        return
      }

      if (!consumos?.length) {
        setData([])
        return
      }

      const grouped = {}
      consumos.forEach((d) => {
        const fecha = d.fecha
        if (!grouped[fecha]) grouped[fecha] = []
        grouped[fecha].push(Number(d[metrica] || 0))
      })

      const transformados = Object.entries(grouped).map(([fecha, valores]) => {
        const promedio = valores.reduce((a, b) => a + b, 0) / valores.length
        const actual = valores[valores.length - 1]
        const nombreDia = new Date(fecha).toLocaleDateString('es-CO', { weekday: 'long' })
        return {
          dia: nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1),
          promedio: Number(promedio.toFixed(2)),
          actual: Number(actual.toFixed(2)),
        }
      })

      setData(transformados)
    }

    fetchConsumos()
  }, [circuitoSel, metrica])

  /* ---------- Cargar alertas ---------- */
  useEffect(() => {
    if (!circuitoSel) return
    setAlertas([])

    const fetchAlertas = async () => {
      const hoy = new Date()
      const fechaHoy = hoy.toISOString().split('T')[0]
      const lunes = new Date(hoy)
      const day = (hoy.getDay() + 6) % 7
      lunes.setDate(hoy.getDate() - day)
      const fechaLunes = lunes.toISOString().split('T')[0]

      const { data: a, error } = await supabase
        .from('alertas')
        .select('fecha,hora,metrica,valor_actual,valor_referencia,tipo,mensaje')
        .eq('circuito_id', circuitoSel)
        .gte('fecha', fechaLunes)
        .lte('fecha', fechaHoy)
        .ilike('metrica', metrica)
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true })

      if (error) console.warn('Error cargando alertas:', error)
      setAlertas(a || [])
    }

    fetchAlertas()
  }, [circuitoSel, metrica])

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white px-6 pt-24 pb-20 space-y-10">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-4xl font-bold text-center bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg"
      >
        Alertas Energéticas
      </motion.h1>

      {/* ---------- Filtros ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="flex flex-col md:flex-row justify-center items-stretch gap-6 w-full mt-6"
      >
        {/* Casa / Dispositivo */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl text-center rounded-2xl p-6 w-full md:w-1/3">
          <label className="text-xl font-semibold text-blue-300 mb-4 tracking-wide block">
            Casa / Dispositivo
          </label>
          <select
            value={casaSel}
            onChange={(e) => {
              const nuevaCasa = e.target.value
              setCasaSel(nuevaCasa)
              setCircuitoSel('')
              setData([])
              setAlertas([])
              const c = circuitos.find((cir) => cir.id_dispositivo === nuevaCasa)
              if (c) setCircuitoSel(c.id)
            }}
            className="bg-gray-800 text-gray-300  rounded-2xl px-4 py-3 w-full font-semibold cursor-pointer"
          >
            {casas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Circuito */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl text-center rounded-2xl p-6 w-full md:w-1/3">
          <label className="text-xl font-semibold text-blue-300 mb-4 tracking-wide block">
            Circuito
          </label>
          <select
            value={circuitoSel}
            onChange={(e) => {
              setCircuitoSel(e.target.value)
              setData([])
              setAlertas([])
            }}
            className="bg-gray-800 text-gray-300 rounded-2xl px-4 py-3 w-full font-semibold cursor-pointer"
          >
            {circuitos
              .filter((c) => c.id_dispositivo === casaSel)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
          </select>
        </div>

        {/* Métrica */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl text-center rounded-2xl p-6 w-full md:w-1/3">
          <label className="text-xl font-semibold text-blue-300 mb-4 tracking-wide block">
            Métrica
          </label>
          <select
            value={metrica}
            onChange={(e) => setMetrica(e.target.value)}
            className="bg-gray-800 text-gray-300 rounded-2xl px-4 py-3 w-full font-semibold cursor-pointer"
          >
            <option value="potencia">Potencia</option>
            <option value="energia">Energía</option>
            <option value="corriente">Corriente</option>
            <option value="voltaje">Voltaje</option>
            <option value="frecuencia">Frecuencia</option>
            <option value="factor_potencia">Factor de Potencia</option>
          </select>
        </div>
      </motion.div>

      {/* ---------- Gráfico semanal ---------- */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl rounded-2xl p-8">
        <ChartLineAlertas
          data={data}
          title={`Tendencia semanal de ${metrica}`}
          metrica={metrica} // 👈 usa la métrica actual para el color
        />
      </div>

      {/* ---------- Alertas ---------- */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-blue-300 mb-4 tracking-wide">
          Alertas recientes
        </h2>
        {alertas.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-lg text-left text-gray-300">
              <thead className="bg-gray-700 text-gray-200 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Hora</th>
                  <th className="px-4 py-3">Métrica</th>
                  <th className="px-4 py-3">Valor Actual</th>
                  <th className="px-4 py-3">Referencia</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {alertas.map((a, i) => (
                  <tr
                    key={i}
                    className={`border-b border-gray-300 ${
                      a.tipo === 'Alto'
                        ? 'bg-red-900/40'
                        : a.tipo === 'Bajo'
                        ? 'bg-yellow-900/40'
                        : 'bg-gray-800/40'
                    }`}
                  >
                    <td className="px-4 py-2">{a.fecha}</td>
                    <td className="px-4 py-2">{a.hora}</td>
                    <td className="px-4 py-2">{a.metrica}</td>
                    <td className="px-4 py-2">{a.valor_actual}</td>
                    <td className="px-4 py-2">{a.valor_referencia}</td>
                    <td className="px-4 py-2 font-semibold">{a.tipo}</td>
                    <td className="px-4 py-2">{a.mensaje}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-300 text-center">No hay alertas recientes.</p>
        )}
      </div>
    </div>
  )
}
