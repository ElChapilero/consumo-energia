import { supabase } from '@/lib/supabaseClient'

export default async function handler(req, res) {
  // Promedios históricos
  const { data: historico, error: err1 } = await supabase.rpc('promedios_historicos')
  const { data: actual, error: err2 } = await supabase.rpc('valores_actuales')

  if (err1 || err2) return res.status(500).json({ error: err1 || err2 })

  // Combinar ambos resultados
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const merged = diasSemana.map((d, idx) => {
    const h = historico.find((x) => x.dia_semana === idx) || {}
    const a = actual.find((x) => x.dia_semana === idx) || {}
    return {
      dia: d,
      potencia_promedio: h.potencia_promedio || 0,
      potencia_actual: a.potencia_actual || 0,
      voltaje_promedio: h.voltaje_promedio || 0,
      voltaje_actual: a.voltaje_actual || 0,
      corriente_promedio: h.corriente_promedio || 0,
      corriente_actual: a.corriente_actual || 0,
      fp_promedio: h.fp_promedio || 0,
      fp_actual: a.fp_actual || 0,
      frecuencia_promedio: h.frecuencia_promedio || 0,
      frecuencia_actual: a.frecuencia_actual || 0,
    }
  })

  if (err1 || err2) {
    return res.status(500).json([])
  }
  res.status(200).json(merged || [])
}
