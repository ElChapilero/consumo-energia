'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Pencil, Save, X, PlusCircle, Home, Cpu } from 'lucide-react'

export default function VincularCasa() {
  const [user, setUser] = useState(null)
  const [dispositivos, setDispositivos] = useState([])
  const [circuitos, setCircuitos] = useState([])
  const [estratos, setEstratos] = useState([])
  const [loading, setLoading] = useState(true)

  const [editandoDispositivo, setEditandoDispositivo] = useState(null)
  const [editandoCircuito, setEditandoCircuito] = useState(null)

  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoUUID, setNuevoUUID] = useState('')
  const [nuevoEstrato, setNuevoEstrato] = useState('')

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return setLoading(false)

      setUser(user)
      await Promise.all([cargarEstratos(), cargarDispositivos(user.id)])
      setLoading(false)
    }
    init()
  }, [])

  const cargarEstratos = async () => {
    const { data, error } = await supabase.from('estratos').select('id, nombre')
    if (!error) setEstratos(data || [])
  }

  const cargarDispositivos = async (userId) => {
    const { data: dispositivosData, error } = await supabase
      .from('dispositivos')
      .select('id, nombre, uuid_esp32, id_estrato')
      .eq('id_usuario', userId)
      .order('creado_en', { ascending: true })

    if (error) {
      console.error('Error cargando dispositivos:', error)
      setDispositivos([])
      return
    }

    setDispositivos(dispositivosData || [])

    // Cargar circuitos relacionados
    const ids = (dispositivosData || []).map((d) => d.id)
    if (ids.length) {
      const { data: circData } = await supabase
        .from('circuitos')
        .select('id, nombre, id_dispositivo')
        .in('id_dispositivo', ids)
      setCircuitos(circData || [])
    } else setCircuitos([])
  }

  const handleGuardarDispositivo = async (disp) => {
    const { id, nombre, id_estrato } = disp
    const { error } = await supabase
      .from('dispositivos')
      .update({ nombre, id_estrato })
      .eq('id', id)

    if (error) return alert('❌ Error al guardar cambios del dispositivo.')
    setEditandoDispositivo(null)
    alert('✅ Dispositivo actualizado correctamente.')
  }

  const handleGuardarCircuito = async (c) => {
    const { id, nombre } = c
    const { error } = await supabase.from('circuitos').update({ nombre }).eq('id', id)
    if (error) return alert('❌ Error al guardar nombre del circuito.')
    setEditandoCircuito(null)
    alert('✅ Nombre del circuito actualizado.')
  }

  const handleVincularNuevo = async () => {
    if (!nuevoNombre || !nuevoUUID || !nuevoEstrato) {
      alert('⚠️ Completa todos los campos.')
      return
    }

    const { error } = await supabase.from('dispositivos').insert([
      {
        id_usuario: user.id,
        nombre: nuevoNombre,
        uuid_esp32: nuevoUUID,
        id_estrato: parseInt(nuevoEstrato),
      },
    ])

    if (error) {
      console.error(error)
      alert('❌ Error al vincular dispositivo.')
      return
    }

    alert('✅ Dispositivo vinculado correctamente.')
    setNuevoNombre('')
    setNuevoUUID('')
    setNuevoEstrato('')
    await cargarDispositivos(user.id)
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 text-lg">
        Cargando...
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white px-6 sm:px-12 mobile:px-20 pt-24 pb-20 space-y-12">
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-4xl font-bold text-center text-blue-400"
      >
        Vincular y Gestionar Casas / Dispositivos
      </motion.h1>

      {/* ----------- LISTA DE DISPOSITIVOS ----------- */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="space-y-10"
      >
        {dispositivos.length === 0 ? (
          <p className="text-gray-300 text-center">No tienes dispositivos vinculados aún.</p>
        ) : (
          dispositivos.map((disp) => (
            <Card key={disp.id} className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-blue-300 mb-4 tracking-wide flex items-center gap-2">
                    <Home className="w-5 h-5" /> {disp.nombre}
                  </h3>
                  {editandoDispositivo === disp.id ? (
                    <div className="flex gap-3">
                      <Button
                        size="sm"
                        onClick={() => handleGuardarDispositivo(disp)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4 mr-1" /> Guardar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setEditandoDispositivo(null)}
                        className="bg-gray-700 hover:bg-gray-800"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setEditandoDispositivo(disp.id)}
                      className="bg-blue-600 hover:bg-blue-500"
                    >
                      <Pencil className="w-4 h-4 mr-1" /> Editar
                    </Button>
                  )}
                </div>

                {editandoDispositivo === disp.id && (
                  <div className="grid grid-cols-1 mobile:grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={disp.nombre}
                      onChange={(e) =>
                        setDispositivos((prev) =>
                          prev.map((d) => (d.id === disp.id ? { ...d, nombre: e.target.value } : d))
                        )
                      }
                      className="bg-gray-800 text-white p-3 rounded-xl w-full"
                      placeholder="Nombre del dispositivo"
                    />

                    <select
                      value={disp.id_estrato || ''}
                      onChange={(e) =>
                        setDispositivos((prev) =>
                          prev.map((d) =>
                            d.id === disp.id ? { ...d, id_estrato: parseInt(e.target.value) } : d
                          )
                        )
                      }
                      className="bg-gray-800 text-white p-3 rounded-xl w-full"
                    >
                      <option value="">Selecciona estrato</option>
                      {estratos.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nombre}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={disp.uuid_esp32 || ''}
                      readOnly
                      className="bg-gray-700 text-gray-400 p-3 rounded-xl w-full cursor-not-allowed"
                    />
                  </div>
                )}

                {/* Lista de circuitos */}
                <div className="mt-4">
                  <h4 className="text-lg font-semibold text-gray-300 flex items-center gap-2 mb-3">
                    <Cpu className="w-4 h-4" /> Circuitos
                  </h4>
                  <div className="space-y-2">
                    {circuitos
                      .filter((c) => c.id_dispositivo === disp.id)
                      .map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between bg-gray-800/60 p-3 rounded-xl"
                        >
                          {editandoCircuito === c.id ? (
                            <input
                              type="text"
                              value={c.nombre}
                              onChange={(e) =>
                                setCircuitos((prev) =>
                                  prev.map((x) =>
                                    x.id === c.id ? { ...x, nombre: e.target.value } : x
                                  )
                                )
                              }
                              className="bg-gray-900 text-white rounded-lg p-2 w-full mr-3"
                            />
                          ) : (
                            <span className="text-gray-300">{c.nombre}</span>
                          )}

                          {editandoCircuito === c.id ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleGuardarCircuito(c)}
                                className="bg-blue-600 hover:bg-blue-500"
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setEditandoCircuito(null)}
                                className="bg-gray-700 hover:bg-gray-800"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => setEditandoCircuito(c.id)}
                              className="bg-blue-600 hover:bg-blue-500"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </motion.div>

      {/* ----------- NUEVO DISPOSITIVO ----------- */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl mt-10"
      >
        <h3 className="text-xl font-semibold text-blue-300 mb-4 tracking-wide flex items-center gap-2">
          <PlusCircle className="w-5 h-5" /> Vincular Nuevo Dispositivo
        </h3>

        <div className="grid mobile:grid-cols-3 gap-4">
          <input
            type="text"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            placeholder="Nombre del dispositivo"
            className="bg-gray-800 text-white p-3 rounded-xl w-full"
          />
          <input
            type="text"
            value={nuevoUUID}
            onChange={(e) => setNuevoUUID(e.target.value)}
            placeholder="UUID del dispositivo"
            className="bg-gray-800 text-white p-3 rounded-xl w-full"
          />
          <select
            value={nuevoEstrato}
            onChange={(e) => setNuevoEstrato(e.target.value)}
            className="bg-gray-800 text-white p-3 rounded-xl w-full"
          >
            <option value="">Selecciona estrato</option>
            {estratos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-center mt-6">
          <Button
            onClick={handleVincularNuevo}
            className="bg-blue-600 hover:bg-blue-500 px-8 py-3 text-lg font-semibold rounded-2xl"
          >
            Vincular Dispositivo
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
