'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Pencil, Save, X, Cpu } from 'lucide-react'

export default function Perfil() {
  const [user, setUser] = useState(null)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [fecha, setFecha] = useState('')
  const [uuidEsp32, setUuidEsp32] = useState('')
  const [circuitos, setCircuitos] = useState([])

  const [editandoNombre, setEditandoNombre] = useState(false)
  const [editandoUUID, setEditandoUUID] = useState(false)
  const [editandoCircuito, setEditandoCircuito] = useState(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  // 🔹 Cargar datos del usuario y sus dispositivos
  useEffect(() => {
    const obtenerDatos = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      setUser(user)
      setEmail(user.email)
      setFecha(new Date(user.created_at).toLocaleDateString('es-CO'))

      // Buscar nombre real en tabla usuarios (como el Navbar)
      let nombreFinal = user.user_metadata?.nombre ?? user.email?.split('@')[0] ?? ''
      const { data: perfil, error: errorPerfil } = await supabase
        .from('usuarios')
        .select('nombre')
        .eq('id', user.id)
        .maybeSingle()

      if (!errorPerfil && perfil?.nombre) {
        nombreFinal = perfil.nombre
      }

      setNombre(nombreFinal)

      // Obtener dispositivo (si existe)
      const { data: dispositivo } = await supabase
        .from('dispositivos')
        .select('uuid_esp32')
        .eq('id_usuario', user.id)
        .maybeSingle()
      if (dispositivo) setUuidEsp32(dispositivo.uuid_esp32)

      // Obtener circuitos relacionados
      const { data: dispositivosUser, error: errDisp } = await supabase
        .from('dispositivos')
        .select('id')
        .eq('id_usuario', user.id)

      if (errDisp) {
        console.error('Error obteniendo dispositivos:', errDisp)
        setCircuitos([])
        setLoading(false)
        return
      }

      const dispositivoIds = (dispositivosUser || []).map((d) => d.id)

      if (dispositivoIds.length === 0) {
        setCircuitos([])
        setLoading(false)
        return
      }

      const { data: circuitosData, error: errCirc } = await supabase
        .from('circuitos')
        .select('id, nombre, estado, creado_en')
        .in('id_dispositivo', dispositivoIds)
        .order('creado_en', { ascending: true })

      if (errCirc) {
        console.error('Error cargando circuitos:', errCirc)
        setCircuitos([])
      } else {
        setCircuitos(circuitosData || [])
      }

      setLoading(false)
    }

    obtenerDatos()
  }, [])

  // 🔹 Guardar nombre actualizado en tabla `usuarios`
  const handleGuardarNombre = async () => {
    try {
      setGuardando(true)

      // Verificar si ya existe en la tabla
      const { data: existente, error: buscarError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (buscarError) throw buscarError

      if (existente) {
        await supabase.from('usuarios').update({ nombre }).eq('id', user.id)
      } else {
        await supabase.from('usuarios').insert([{ id: user.id, nombre }])
      }

      setEditandoNombre(false)
      alert('✅ Nombre actualizado correctamente.')
    } catch (err) {
      console.error(err)
      alert('❌ Error al guardar el nombre.')
    } finally {
      setGuardando(false)
    }
  }

  // 🔹 Guardar UUID ESP32
  const handleGuardarUUID = async () => {
    if (!uuidEsp32) {
      alert('⚠️ Ingresa un UUID válido antes de guardar.')
      return
    }

    setGuardando(true)

    try {
      const { data: dispositivoExistente } = await supabase
        .from('dispositivos')
        .select('id')
        .eq('id_usuario', user.id)
        .maybeSingle()

      if (dispositivoExistente) {
        await supabase
          .from('dispositivos')
          .update({ uuid_esp32: uuidEsp32 })
          .eq('id', dispositivoExistente.id)
      } else {
        await supabase.from('dispositivos').insert([{ id_usuario: user.id, uuid_esp32 }])
      }

      setEditandoUUID(false)
      alert('✅ UUID del ESP32 actualizado correctamente.')
    } catch (err) {
      console.error(err)
      alert('❌ Error al guardar UUID.')
    } finally {
      setGuardando(false)
    }
  }

  const handleGuardarCircuito = async (id, nuevoNombre) => {
    await supabase.from('circuitos').update({ nombre: nuevoNombre }).eq('id', id)
    setCircuitos((prev) => prev.map((c) => (c.id === id ? { ...c, nombre: nuevoNombre } : c)))
    setEditandoCircuito(null)
  }

  if (loading)
    return <p className="p-6 text-gray-300 text-center animate-pulse">Cargando perfil...</p>

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white px-6 sm:px-10 md:px-16 lg:px-24 pt-24 pb-20">
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-4xl font-bold text-center text-blue-400 mb-10 tracking-tight"
      >
        Perfil de Usuario
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.8 }}
        className="max-w-4xl mx-auto space-y-10"
      >
        {/* === Datos del Usuario === */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-2xl rounded-2xl">
          <CardContent className="p-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm text-blue-400 uppercase font-semibold">
                  Correo Electrónico
                </h3>
                <p className="text-lg mt-1 text-gray-200">{email}</p>
              </div>

              <div>
                <h3 className="text-sm text-blue-400 uppercase font-semibold">Miembro Desde</h3>
                <p className="text-lg mt-1 text-gray-200">{fecha}</p>
              </div>
            </div>

            {/* === Nombre === */}
            <div>
              <h3 className="text-sm text-blue-400 uppercase font-semibold mb-1">
                Nombre del Usuario
              </h3>
              {editandoNombre ? (
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleGuardarNombre} disabled={guardando} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-1" /> Guardar
                    </Button>
                    <Button
                      onClick={() => setEditandoNombre(false)}
                      className="bg-gray-600 hover:bg-gray-700"
                    >
                      <X className="w-4 h-4 mr-1" /> Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-lg text-white">{nombre || 'No asignado'}</p>
                  <Button
                    onClick={() => setEditandoNombre(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Pencil className="w-4 h-4 mr-1" /> Editar
                  </Button>
                </div>
              )}
            </div>

            {/* === UUID === */}
            <div>
              <h3 className="text-sm text-blue-400 uppercase font-semibold mb-1">UUID del ESP32</h3>
              {editandoUUID ? (
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <input
                    type="text"
                    value={uuidEsp32}
                    onChange={(e) => setUuidEsp32(e.target.value)}
                    className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500"
                    placeholder="Ejemplo: a1b2c3d4-e5f6-7890..."
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleGuardarUUID} disabled={guardando} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-1" /> Guardar
                    </Button>
                    <Button
                      onClick={() => setEditandoUUID(false)}
                      className="bg-gray-600 hover:bg-gray-700"
                    >
                      <X className="w-4 h-4 mr-1" /> Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-lg text-white">{uuidEsp32 || 'No registrado'}</p>
                  <Button
                    onClick={() => setEditandoUUID(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Pencil className="w-4 h-4 mr-1" /> Editar
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* === Circuitos === */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-2xl rounded-2xl">
          <CardContent className="p-8 space-y-6">
            <h3 className="text-2xl font-semibold text-blue-400 mb-4 flex items-center gap-2">
              <Cpu className="w-6 h-6" /> Mis Circuitos
            </h3>

            {circuitos.length > 0 ? (
              <div className="space-y-6">
                {circuitos.map((circuito) => (
                  <motion.div
                    key={circuito.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border border-gray-700 p-4 rounded-xl bg-gray-800/70"
                  >
                    <h4 className="text-sm text-blue-400 uppercase font-semibold mb-2 flex items-center justify-between">
                      <span>Circuito</span>
                      <span className={circuito.estado ? 'text-green-400' : 'text-red-400'}>
                        {circuito.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </h4>

                    {editandoCircuito === circuito.id ? (
                      <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <input
                          type="text"
                          value={circuito.nombre}
                          onChange={(e) =>
                            setCircuitos((prev) =>
                              prev.map((c) =>
                                c.id === circuito.id ? { ...c, nombre: e.target.value } : c
                              )
                            )
                          }
                          className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleGuardarCircuito(circuito.id, circuito.nombre)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Save className="w-4 h-4 mr-1" /> Guardar
                          </Button>
                          <Button
                            onClick={() => setEditandoCircuito(null)}
                            className="bg-gray-600 hover:bg-gray-700"
                          >
                            <X className="w-4 h-4 mr-1" /> Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-lg text-white">{circuito.nombre}</p>
                        <Button
                          onClick={() => setEditandoCircuito(circuito.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Pencil className="w-4 h-4 mr-1" /> Editar
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center">No tienes circuitos registrados.</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
