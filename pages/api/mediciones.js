export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { voltage, current, power, energy } = req.body

    console.log("Datos recibidos:", { voltage, current, power, energy })
    return res.status(200).json({ ok: true })
  }
  res.status(405).json({ error: 'Método no permitido' })
}
