import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import ResumenPotencia from '@/components/dashboard/ResumenPotencia'
import ChartLine from '@/components/dashboard/ChartLine'
import ChartBarEnergia from '@/components/dashboard/ChartBarEnergia'
import ResumenEnergia from '@/components/dashboard/ResumenEnergia'
import ChartCostoHora from '@/components/dashboard/ChartCostoHora'
import ResumenCostoHora from '@/components/dashboard/ResumenCostoHora'
import IndicadoresBasicos from '@/components/dashboard/IndicadoresBasicos'

/* ---------- Constantes ---------- */
const WINDOW_MINUTES = 10
const POLLING_MS = 2000
const RECENT_SINCE_MS = 20 * 1000
const INITIAL_SINCE_MS = WINDOW_MINUTES * 60 * 1000

const withTimeout = async (promise, ms = 7000) => {
  try {
    return await Promise.race([
      promise,
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
    ])
  } catch (err) {
    return { data: null, error: err }
  }
}

const formatMinuteLabel = (date) =>
  date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })

const minuteKey = (date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`

/* ---------- Componente Principal ---------- */
export default function Circuitos() {
  const [user, setUser] = useState(null)
  const [circuitos, setCircuitos] = useState([])
  const [selectedCircuit, setSelectedCircuit] = useState(null)
  const [modoGeneral, setModoGeneral] = useState(true)
  const [dispositivos, setDispositivos] = useState([])
  const [selectedDispositivo, setSelectedDispositivo] = useState(null)

  const [viewData, setViewData] = useState({
    potencia: Array.from({ length: WINDOW_MINUTES }, () => ({ time: '', potencia: null })),
    resumen: { max: 0, promedio: 0, estado: 'Apagado' },
    resumenDiario: { max: 0, promedio: 0, estado: 'Apagado' },
    energia: [],
    resumenCosto: { max: 0, promedio: 0, estado: 'Estable' },
    voltaje: 0,
    corriente: 0,
    frecuencia: 0,
    ultimo: null,
    costosPorHora: [],
  })

  // Refs para almacenamiento interno
  const cacheMedicionesRef = useRef([])
  const perCircuitMapRef = useRef({})
  const circuitStateRef = useRef({})
  const inFlightRef = useRef(false)
  const pollingRef = useRef(null)

  const selectedCircuitRef = useRef(selectedCircuit)
  const modoGeneralRef = useRef(modoGeneral)

  useEffect(() => {
    selectedCircuitRef.current = selectedCircuit
  }, [selectedCircuit])
  useEffect(() => {
    modoGeneralRef.current = modoGeneral
  }, [modoGeneral])

  /* ---------- Sesión ---------- */
  useEffect(() => {
    const initSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) await loadCircuitos(session.user.id, null)
    }

    initSession()

    // 🔁 Escucha cambios en la sesión
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        loadCircuitos(session.user.id, null)
      } else {
        setUser(null)
        setCircuitos([])
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  /* ---------- Carga de dispositivos y circuitos ---------- */
  const loadCircuitos = async (userId, dispositivoId = null) => {
    if (!userId) return // 🧠 protección para evitar consultas sin sesión
    try {
      // Obtener dispositivos del usuario
      const { data: dispositivosData } = await supabase
        .from('dispositivos')
        .select('id, nombre')
        .eq('id_usuario', userId)
        .order('creado_en', { ascending: true })

      setDispositivos(dispositivosData || [])
      if (!dispositivosData?.length) return setCircuitos([])

      // Determinar dispositivo activo
      const dispositivoActivo = dispositivoId || dispositivosData[0].id
      setSelectedDispositivo(dispositivoActivo)

      // Obtener circuitos del dispositivo seleccionado
      const { data: circuitosData } = await supabase
        .from('circuitos')
        .select('id, nombre, estado, id_dispositivo, indice')
        .eq('id_dispositivo', dispositivoActivo)
        .order('indice', { ascending: true })

      setCircuitos(circuitosData || [])
      setModoGeneral(true)
      setSelectedCircuit(null) // circuito general
      setViewData({
        potencia: Array.from({ length: WINDOW_MINUTES }, () => ({ time: '', potencia: null })),
        resumen: { max: 0, promedio: 0, estado: 'Apagado' },
        resumenDiario: { max: 0, promedio: 0, estado: 'Apagado' },
        energia: [],
        resumenCosto: { max: 0, promedio: 0, estado: 'Estable' },
        voltaje: 0,
        corriente: 0,
        frecuencia: 0,
        ultimo: null,
        costosPorHora: [],
      })

      // Cargar mediciones del nuevo dispositivo
      await cargarMedicionesIniciales(circuitosData || [])
    } catch (err) {
      console.error('loadCircuitos error:', err)
    }
  }

  /* ---------- Actualizar energía y costo cada 2 segundos ---------- */
  useEffect(() => {
    if (!user || !circuitos.length) return

    const fetchAll = async () => {
      await cargarEnergiaSemanal()
      await cargarCostosPorHora()
    }

    fetchAll()
    const intv = setInterval(fetchAll, 2000)
    return () => clearInterval(intv)
  }, [user, circuitos, selectedCircuit, modoGeneral])

  /* ---------- Carga inicial de mediciones ---------- */
  const cargarMedicionesIniciales = async (circuitosList = circuitos) => {
    try {
      const ids = (circuitosList || []).map((c) => c.id)
      if (!ids.length) return

      const since = new Date(Date.now() - INITIAL_SINCE_MS).toISOString()

      const resp = await withTimeout(
        supabase
          .from('mediciones')
          .select('circuito_id, potencia, energia, voltaje, corriente, frecuencia, created_at')
          .in('circuito_id', ids)
          .gte('created_at', since)
          .order('created_at', { ascending: true }),
        9000
      )

      if (resp.error) {
        if (resp.error.message === 'timeout') {
          console.debug('⏳ Supabase no respondió a tiempo (cargarMedicionesIniciales).')
          return
        }
        console.warn('cargarMedicionesIniciales:', resp.error)
        return
      }

      const parsed = (resp.data || []).map((m) => ({
        ...m,
        created_at: new Date(m.created_at),
      }))

      const ahora = Date.now()
      cacheMedicionesRef.current = parsed.filter(
        (m) => ahora - m.created_at.getTime() < INITIAL_SINCE_MS
      )

      rebuildPerCircuitMap(cacheMedicionesRef.current)
      deriveCircuitStateFromMediciones(cacheMedicionesRef.current)
      procesarYRenderizar()
    } catch (err) {
      console.error('cargarMedicionesIniciales catch:', err)
    }
  }

  const rebuildPerCircuitMap = (arr) => {
    const map = {}
    ;(arr || []).forEach((m) => {
      if (!map[m.circuito_id]) map[m.circuito_id] = []
      map[m.circuito_id].push(m)
    })
    perCircuitMapRef.current = map
  }

  const deriveCircuitStateFromMediciones = (arr) => {
    const estados = {}
    ;(arr || []).forEach((m) => {
      const activo = Number(m.potencia || 0) > 0.5
      estados[m.circuito_id] = estados[m.circuito_id] || activo
    })
    circuitStateRef.current = estados
  }

  /* ---------- Polling ---------- */
  const startPolling = () => {
    stopPolling()
    pollingRef.current = setInterval(fetchRecientesPolling, POLLING_MS)
  }

  const stopPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = null
    inFlightRef.current = false
  }

  const fetchRecientesPolling = async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    try {
      const ids = (circuitos || []).map((c) => c.id)
      if (!ids.length) return

      const since = new Date(Date.now() - RECENT_SINCE_MS).toISOString()
      const resp = await withTimeout(
        supabase
          .from('mediciones')
          .select('circuito_id, potencia, energia, voltaje, corriente, frecuencia, created_at')
          .in('circuito_id', ids)
          .gte('created_at', since)
          .order('created_at', { ascending: true }),
        5000
      )

      if (resp.error) {
        if (resp.error.message === 'timeout') {
          console.debug('⏳ Supabase tardó mucho, se omitió este ciclo.')
          return
        }
        console.warn('fetchRecientesPolling error:', resp.error.message)
        inFlightRef.current = false
        return
      }

      const recientes = (resp.data || []).map((m) => ({
        ...m,
        created_at: new Date(m.created_at),
      }))

      if (recientes.length) {
        const mapa = new Map()
        cacheMedicionesRef.current.forEach((p) =>
          mapa.set(`${p.circuito_id}-${p.created_at.toISOString()}`, p)
        )
        recientes.forEach((r) => mapa.set(`${r.circuito_id}-${r.created_at.toISOString()}`, r))
        cacheMedicionesRef.current = Array.from(mapa.values()).sort(
          (a, b) => a.created_at - b.created_at
        )
      }

      rebuildPerCircuitMap(cacheMedicionesRef.current)
      deriveCircuitStateFromMediciones(cacheMedicionesRef.current)
      procesarYRenderizar()
    } catch (err) {
      console.error('fetchRecientesPolling error:', err)
    } finally {
      inFlightRef.current = false
      const LIMITE_CACHE_MS = 60 * 60 * 1000
      const ahora = Date.now()
      cacheMedicionesRef.current = cacheMedicionesRef.current.filter(
        (m) => ahora - m.created_at.getTime() < LIMITE_CACHE_MS
      )
    }
  }

  /* ---------- Control de visibilidad ---------- */
  useEffect(() => {
    const onVisibility = async () => {
      if (document.visibilityState === 'visible') {
        stopPolling()
        await cargarMedicionesIniciales(circuitos)
        startPolling()
      } else stopPolling()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [circuitos])

  /* ---------- Inicio de polling ---------- */
  useEffect(() => {
    if (!user || !circuitos.length) return
    startPolling()
    cargarMedicionesIniciales(circuitos)
    return () => stopPolling()
  }, [user, circuitos])

  /* ---------- Procesar datos ---------- */
  const procesarYRenderizar = () => {
    const now = new Date()
    const start = new Date(now.getTime() - (WINDOW_MINUTES - 1) * 60_000)
    const labels = Array.from({ length: WINDOW_MINUTES }, (_, i) => {
      const t = new Date(start.getTime() + i * 60_000)
      return { date: t, label: formatMinuteLabel(t), key: minuteKey(t) }
    })

    const perCircuitValues = {}
    const ahora = Date.now()

    Object.keys(perCircuitMapRef.current).forEach((cid) => {
      perCircuitValues[cid] = Array.from({ length: WINDOW_MINUTES }, () => 0)
      const mediciones = perCircuitMapRef.current[cid] || []
      const agrupadas = {}

      mediciones.forEach((m) => {
        const k = minuteKey(m.created_at)
        if (!agrupadas[k]) agrupadas[k] = []
        agrupadas[k].push(Number(m.potencia ?? 0))
      })

      labels.forEach((l, i) => {
        const arr = agrupadas[l.key]
        perCircuitValues[cid][i] = arr?.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
      })
    })

    const potenciaArr = labels.map((l, i) => {
      if (modoGeneralRef.current) {
        let sum = 0
        const circuitosActivos = circuitos.filter((c) => c.id_dispositivo === selectedDispositivo)
        circuitosActivos.forEach((c) => {
          sum += perCircuitValues[c.id]?.[i] || 0
        })
        return { time: l.label, potencia: sum }
      } else {
        const sel = selectedCircuitRef.current
        return { time: l.label, potencia: perCircuitValues[sel]?.[i] ?? 0 }
      }
    })

    const relevant = modoGeneralRef.current
      ? cacheMedicionesRef.current
      : perCircuitMapRef.current[selectedCircuitRef.current] || []

    const inicioHoy = new Date()
    inicioHoy.setHours(0, 0, 0, 0)
    const hoy = relevant.filter((m) => m.created_at >= inicioHoy)

    const maxPot = hoy.length ? Math.max(...hoy.map((m) => m.potencia || 0)) : 0
    const avgPot = hoy.length
      ? hoy.reduce((a, b) => a + Number(b.potencia || 0), 0) / hoy.length
      : 0
    const ultimo = relevant.slice(-1)[0] || null

    setViewData((p) => ({
      ...p,
      potencia: potenciaArr,
      resumen: { max: maxPot, promedio: avgPot, estado: avgPot > 0.5 ? 'Encendido' : 'Apagado' },
      voltaje: ultimo?.voltaje ?? 0,
      corriente: ultimo?.corriente ?? 0,
      frecuencia: ultimo?.frecuencia ?? 0,
      ultimo,
    }))
  }

  /* ---------- Carga de energía (últimos 7 días) ---------- */
const cargarEnergiaSemanal = async () => {
  if (!circuitos.length) return
  const ids = modoGeneral ? circuitos.map((c) => c.id) : [selectedCircuit]

  // Fecha desde hace 6 días (incluye hoy)
  const desde = new Date()
  desde.setDate(desde.getDate() - 6)
  desde.setHours(0, 0, 0, 0)

  // Formato ISO para consulta Supabase
  const desdeISO = desde.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('consumos_horarios')
    .select('fecha, energia, circuito_id')
    .in('circuito_id', ids)
    .gte('fecha', desdeISO)

  if (error) {
    console.warn('Error cargarEnergiaSemanal:', error)
    return
  }

  // Crear arreglo de los últimos 7 días en la zona horaria de Bogotá
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = d
      .toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
      .split('/')
      .reverse()
      .join('-') // Convierte dd/mm/yyyy → yyyy-mm-dd
    return { fecha: key, energia: 0 }
  })

  // Sumar energía por día
  data?.forEach((row) => {
    const f = row.fecha
    const idx = dias.findIndex((d) => d.fecha === f)
    if (idx !== -1) dias[idx].energia += Number(row.energia || 0)
  })

  const max = Math.max(...dias.map((d) => d.energia))
  const promedio = dias.reduce((a, b) => a + b.energia, 0) / 7

  setViewData((prev) => ({
    ...prev,
    energia: dias.map((d) => ({ dia: d.fecha.slice(5), energia: d.energia })),
    resumenDiario: {
      max,
      promedio,
      estado: promedio > 0 ? 'Consumo activo' : 'Sin consumo',
    },
  }))
}


  /* ---------- Carga de costos por hora (día actual) ---------- */
  const cargarCostosPorHora = async () => {
    if (!circuitos.length) return
    const ids = modoGeneral ? circuitos.map((c) => c.id) : [selectedCircuit]

    const hoy = new Date()
      .toLocaleDateString('es-CO', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .split('/')
      .reverse()
      .join('-')

    const { data, error } = await supabase
      .from('consumos_horarios')
      .select('hora, costo, circuito_id')
      .in('circuito_id', ids)
      .eq('fecha', hoy)

    if (error) {
      console.warn('Error cargarCostosPorHora:', error)
      return
    }

    // Crear las 24 horas aunque no haya datos
    const horas = Array.from({ length: 24 }, (_, h) => ({ hora: h, costo: 0 }))
    data?.forEach((r) => {
      const idx = horas.findIndex((h) => h.hora === r.hora)
      if (idx !== -1) horas[idx].costo += Number(r.costo || 0)
    })

    const max = Math.max(...horas.map((h) => h.costo))
    const promedio = horas.reduce((a, b) => a + b.costo, 0) / 24

    setViewData((prev) => ({
      ...prev,
      costosPorHora: horas,
      resumenCosto: {
        max,
        promedio,
        estado: promedio > 0 ? 'En gasto' : 'Sin gasto',
      },
    }))
  }

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white px-4 sm:px-8 md:px-16 lg:px-24 pt-24 pb-20 space-y-10">
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-4xl font-bold text-center text-blue-400"
      >
        {modoGeneral
          ? 'Panel General:  Todas las Secciones de la casa'
          : `Seccion:  ${circuitos.find((c) => c.id === selectedCircuit)?.nombre || 'Sin datos'}`}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="flex flex-col md:flex-row justify-center items-stretch gap-6 w-full mt-6 flex-wrap px-0"
      >
        {/* ---------- Select de Casa / Dispositivo ---------- */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl text-center w-full md:flex-1 rounded-2xl flex flex-col justify-center p-6 hover:shadow-2xl transition-all">
          <label className="text-xl font-semibold text-blue-300 mb-4 tracking-wide">
            Casa / Dispositivo
          </label>
          <select
            value={selectedDispositivo || ''}
            onChange={async (e) => {
              const newDisp = e.target.value
              setSelectedDispositivo(newDisp)
              setModoGeneral(true)
              setSelectedCircuit(null)
              await loadCircuitos(user.id, newDisp)
            }}
            className="bg-gray-800/80 text-gray-300 font-semibold rounded-2xl px-4 py-3 text-base
             focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
             focus:ring-offset-gray-900 w-full transition-all hover:bg-gray-800
             shadow-md cursor-pointer appearance-none"
            style={{
              backgroundImage:
                'linear-gradient(45deg, transparent 50%, #60a5fa 50%), linear-gradient(135deg, #60a5fa 50%, transparent 50%)',
              backgroundPosition:
                'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)',
              backgroundSize: '5px 5px, 5px 5px',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {dispositivos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* ---------- Select de Circuito ---------- */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl text-center w-full md:flex-1 rounded-2xl flex flex-col justify-center p-6 hover:shadow-2xl transition-all">
          <label className="text-xl font-semibold text-blue-300 mb-4 tracking-wide">Circuito</label>
          {/* ---------- Select de Circuito ---------- */}
          <select
            value={!circuitos.length ? '' : modoGeneral ? 'general' : selectedCircuit || ''}
            onChange={(e) => {
              const val = e.target.value
              if (val === 'general') setModoGeneral(true)
              else {
                setModoGeneral(false)
                setSelectedCircuit(val)
              }
            }}
            disabled={!circuitos.length}
            className={`bg-gray-800/80 text-gray-300 font-semibold rounded-2xl px-4 py-3 text-base
   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
   focus:ring-offset-gray-900 w-full transition-all hover:bg-gray-800
   shadow-md appearance-none ${
     !circuitos.length ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
   }`}
            style={{
              backgroundImage:
                'linear-gradient(45deg, transparent 50%, #60a5fa 50%), linear-gradient(135deg, #60a5fa 50%, transparent 50%)',
              backgroundPosition:
                'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)',
              backgroundSize: '5px 5px, 5px 5px',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {!circuitos.length ? (
              <option value="">Sin circuitos disponibles</option>
            ) : (
              <>
                <option value="general">General (todos los circuitos)</option>
                {circuitos
                  .filter((c) => c.id_dispositivo === selectedDispositivo)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
              </>
            )}
          </select>
        </div>

        {/* ---------- Botón Encender / Apagar ---------- */}
        <div
          onClick={() => {
            if (modoGeneral) {
              const algunEncendido = Object.values(circuitStateRef.current).some(Boolean)
              toggleTodosCircuitos(!algunEncendido)
            } else if (selectedCircuit) {
              const estadoActual = circuitStateRef.current[selectedCircuit]
              toggleCircuito(selectedCircuit, estadoActual)
            }
          }}
          className={`cursor-pointer w-full md:flex-1 h-32 rounded-2xl flex flex-col justify-center text-center
    shadow-xl transition-all transform hover:scale-105
    ${
      modoGeneral
        ? Object.values(circuitStateRef.current).some(Boolean)
          ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
          : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'
        : circuitStateRef.current[selectedCircuit]
        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-600'
    }`}
        >
          <p className="text-white font-semibold text-xl tracking-wide">
            {modoGeneral
              ? Object.values(circuitStateRef.current).some(Boolean)
                ? 'Apagar toda la casa'
                : 'Encender toda la casa'
              : circuitStateRef.current[selectedCircuit]
              ? `Apagar ${circuitos.find((c) => c.id === selectedCircuit)?.nombre || ''}`
              : `Encender ${circuitos.find((c) => c.id === selectedCircuit)?.nombre || ''}`}
          </p>
        </div>
      </motion.div>

      <IndicadoresBasicos
        voltaje={viewData.voltaje}
        corriente={viewData.corriente}
        frecuencia={viewData.frecuencia}
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-10 gap-6 h-full"
      >
        <div className="md:col-span-3 h-full">
          <ResumenPotencia
            max={viewData.resumen.max}
            promedio={viewData.resumen.promedio}
            estado={viewData.resumen.estado}
          />
        </div>
        <div className="md:col-span-7 h-full">
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl h-full">
            <CardContent className="p-6 h-full">
              <ChartLine
                data={viewData.potencia}
                dataKey="potencia"
                title="Potencia Activa (W)"
                color="#4ade80"
              />
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Energía / Costos: si quieres que se calculen desde tu vista (consumos_horarios_...) puedes añadir una carga similar a la original */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-10 gap-6 mt-10"
      >
        <div className="md:col-span-3">
          <ResumenEnergia
            max={(viewData.resumenDiario.max || 0).toFixed(2)}
            promedio={(viewData.resumenDiario.promedio || 0).toFixed(2)}
            estado={viewData.resumenDiario.estado}
          />
        </div>
        <div className="md:col-span-7">
          <ChartBarEnergia data={viewData.energia} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-10 gap-6 mt-10"
      >
        <div className="md:col-span-3">
          <ResumenCostoHora
            max={viewData.resumenCosto.max}
            promedio={viewData.resumenCosto.promedio}
            estado={viewData.resumenCosto.estado}
          />
        </div>
        <div className="md:col-span-7">
          <ChartCostoHora data={viewData.costosPorHora || []} />
        </div>
      </motion.div>
    </div>
  )
}
