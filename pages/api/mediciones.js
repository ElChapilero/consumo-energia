// pages/api/mediciones.js
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { voltage, current, power, energy } = req.body

    // 1️⃣ Guardar en la base de datos (ej: MongoDB, Supabase, Postgres)
    // aquí iría tu lógica para guardar

    // 2️⃣ Enviar al frontend en tiempo real (con WebSocket / Server-Sent Events)
    // o bien, lo consultas cada cierto tiempo

    console.log("Datos recibidos:", { voltage, current, power, energy })
    return res.status(200).json({ ok: true })
  }
  res.status(405).json({ error: 'Método no permitido' })
}
