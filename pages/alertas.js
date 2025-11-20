'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import ChartLineAlertas from '@/components/dashboard/ChartLineAlertas'
import ChartLineAlertasMovil from '@/components/dashboard/ChartLineAlertasMovil'
import ResponsiveChart from '@/components/dashboard/ResponsiveChart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

/* ---------------------------------------------
   🔥 Zona horaria correcta: Colombia (UTC-5)
----------------------------------------------*/
const getFechaColombia = () => {
  const formato = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formato.format(new Date()) // YYYY-MM-DD
}

const toDateColombia = (fechaStr) => new Date(fechaStr + 'T00:00:00-05:00')

/* ---------------------------------------------
   📅 Días de la semana (fijos)
----------------------------------------------*/
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

/* ---------------------------------------------
   📌 Obtener el lunes de la semana de una fecha
----------------------------------------------*/
const obtenerLunes = (fecha) => {
  const day = fecha.getDay()
  const diffToMonday = day === 0 ? 6 : day - 1
  const lunes = new Date(fecha)
  lunes.setDate(fecha.getDate() - diffToMonday)
  return lunes
}

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

  /* ---------- Cargar datos semanales (2 semanas + días vacíos) ---------- */
  useEffect(() => {
    if (!circuitoSel) return

    const fetchConsumos = async () => {
      const hoyStr = getFechaColombia()
      const hoy = toDateColombia(hoyStr)

      // Semana actual
      const lunesActual = obtenerLunes(hoy)
      const fechaHoy = hoyStr
      const fechaLunesActual = lunesActual.toISOString().split('T')[0]

      // Semana anterior
      const lunesAnterior = new Date(lunesActual)
      lunesAnterior.setDate(lunesActual.getDate() - 7)

      const domingoAnterior = new Date(lunesAnterior)
      domingoAnterior.setDate(lunesAnterior.getDate() + 6)

      const fechaLunesAnterior = lunesAnterior.toISOString().split('T')[0]
      const fechaDomingoAnterior = domingoAnterior.toISOString().split('T')[0]

      // Consulta ambas semanas
      const { data: consumos, error } = await supabase
        .from('consumos_horarios')
        .select(`fecha, ${metrica}`)
        .eq('circuito_id', circuitoSel)
        .gte('fecha', fechaLunesAnterior)
        .lte('fecha', fechaHoy)
        .order('fecha', { ascending: true })

      if (error) {
        console.warn('Error cargando consumos:', error)
        setData([])
        return
      }

      // Agrupar por fecha
      const grupos = {}
      consumos.forEach((d) => {
        if (!grupos[d.fecha]) grupos[d.fecha] = []
        grupos[d.fecha].push(Number(d[metrica] || 0))
      })

      // Crear semana con días vacíos
      const crearSemana = (fechaInicio) => {
        const salida = []
        for (let i = 0; i < 7; i++) {
          const f = new Date(fechaInicio)
          f.setDate(fechaInicio.getDate() + i)
          const fechaStr = f.toISOString().split('T')[0]

          const valores = grupos[fechaStr] || []
          const promedio = valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0

          salida.push({
            dia: DIAS_SEMANA[i],
            promedio: Number(promedio.toFixed(2)),
          })
        }
        return salida
      }

      const semanaAnterior = crearSemana(lunesAnterior)
      const semanaActual = crearSemana(lunesActual)

      // 🔥 Unir ambas semanas en un único array compatible con ChartLineAlertas
      const dataFormateada = semanaAnterior.map((d, i) => ({
        dia: d.dia,
        promedio: d.promedio, // semana anterior
        actual: semanaActual[i]?.promedio ?? 0, // semana actual
      }))

      setData(dataFormateada)
    }

    fetchConsumos()
  }, [circuitoSel, metrica])

  /* ---------- Cargar alertas (2 semanas) ---------- */
  useEffect(() => {
    if (!circuitoSel) return
    setAlertas([])

    const fetchAlertas = async () => {
      const hoyStr = getFechaColombia()
      const hoy = toDateColombia(hoyStr)

      const lunesActual = obtenerLunes(hoy)

      const lunesAnterior = new Date(lunesActual)
      lunesAnterior.setDate(lunesActual.getDate() - 7)

      const fechaInicio = lunesAnterior.toISOString().split('T')[0]
      const fechaFin = hoyStr

      const { data: a, error } = await supabase
        .from('alertas')
        .select('fecha,hora,metrica,valor_actual,valor_referencia,tipo,mensaje')
        .eq('circuito_id', circuitoSel)
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .eq('metrica', metrica)
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
        className="text-4xl font-bold text-center text-blue-400"
      >
        Alertas Energéticas
      </motion.h1>

      {/* ---------- Filtros ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="flex flex-col mobile:flex-row justify-center items-stretch gap-6 w-full mt-6"
      >
        {/* Casa / Dispositivo */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl text-center rounded-2xl p-6 w-full mobile:w-1/3">
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
            className="bg-gray-800 text-gray-300  rounded-2xl px-4 py-3 w-full font-semibold cursor-pointer appearance-none"
            style={{
              backgroundImage:
                'linear-gradient(45deg, transparent 50%, #60a5fa 50%), linear-gradient(135deg, #60a5fa 50%, transparent 50%)',
              backgroundPosition:
                'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)',
              backgroundSize: '5px 5px, 5px 5px',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {casas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Circuito */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl text-center rounded-2xl p-6 w-full mobile:w-1/3">
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
            className="bg-gray-800 text-gray-300 rounded-2xl px-4 py-3 w-full font-semibold cursor-pointer  appearance-none"
            style={{
              backgroundImage:
                'linear-gradient(45deg, transparent 50%, #60a5fa 50%), linear-gradient(135deg, #60a5fa 50%, transparent 50%)',
              backgroundPosition:
                'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)',
              backgroundSize: '5px 5px, 5px 5px',
              backgroundRepeat: 'no-repeat',
            }}
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
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl text-center rounded-2xl p-6 w-full mobile:w-1/3">
          <label className="text-xl font-semibold text-blue-300 mb-4 tracking-wide block">
            Métrica
          </label>
          <select
            value={metrica}
            onChange={(e) => setMetrica(e.target.value)}
            className="bg-gray-800 text-gray-300 rounded-2xl px-4 py-3 w-full font-semibold cursor-pointer  appearance-none"
            style={{
              backgroundImage:
                'linear-gradient(45deg, transparent 50%, #60a5fa 50%), linear-gradient(135deg, #60a5fa 50%, transparent 50%)',
              backgroundPosition:
                'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)',
              backgroundSize: '5px 5px, 5px 5px',
              backgroundRepeat: 'no-repeat',
            }}
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
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="w-full mt-10"
      >
        <ResponsiveChart
          mobile={
            <ChartLineAlertasMovil
              data={data}
              title={`Tendencia semanal de ${metrica}`}
              metrica={metrica}
            />
          }
          desktop={
            <ChartLineAlertas
              data={data}
              title={`Tendencia semanal de ${metrica}`}
              metrica={metrica}
            />
          }
        />
      </motion.div>

      {/* ---------- Alertas ---------- */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-blue-300 mb-4 tracking-wide">
          Alertas recientes
        </h2>

        {/* ===== VISTA MOBILE ===== */}
        <div className="block mobile:hidden space-y-4">
          {alertas.map((a, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl shadow-md border 
          ${
            a.tipo === 'Alto'
              ? 'bg-red-900/40 border-red-700'
              : a.tipo === 'Bajo'
              ? 'bg-yellow-900/40 border-yellow-700'
              : 'bg-gray-800/40 border-gray-700'
          }`}
            >
              <div className="flex justify-between mb-2">
                <span className="text-gray-300 font-semibold">{a.fecha}</span>
                <span className="text-gray-400">{a.hora}</span>
              </div>

              <div className="text-gray-200">
                <p>
                  <span className="font-bold">Métrica:</span> {a.metrica}
                </p>
                <p>
                  <span className="font-bold">Valor actual:</span>{' '}
                  {Number(a.valor_actual).toFixed(2)}
                </p>
                <p>
                  <span className="font-bold">Referencia:</span>{' '}
                  {Number(a.valor_referencia).toFixed(2)}
                </p>
                <p>
                  <span className="font-bold">Tipo:</span>{' '}
                  <span className="font-semibold">{a.tipo}</span>
                </p>
                <p className="mt-2 text-gray-300">{a.mensaje}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ===== VISTA DESKTOP ===== */}
        <div className="hidden mobile:block">
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
                      <td className="px-4 py-2">{Number(a.valor_actual).toFixed(2)}</td>
                      <td className="px-4 py-2">{Number(a.valor_referencia).toFixed(2)}</td>
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
    </div>
  )
}
