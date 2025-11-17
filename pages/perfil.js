'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Pencil, Save, X, Trash2, Lock } from 'lucide-react'

export default function Perfil() {
  const [user, setUser] = useState(null)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [fecha, setFecha] = useState('')
  const [editandoNombre, setEditandoNombre] = useState(false)
  const [editandoEmail, setEditandoEmail] = useState(false)
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const cargarUsuario = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) {
        setLoading(false)
        return
      }

      const user = data.user
      setUser(user)
      setEmail(user.email)
      setFecha(new Date(user.created_at).toLocaleDateString('es-CO'))

      let nombreFinal = user.user_metadata?.nombre ?? user.email?.split('@')[0] ?? ''
      const { data: perfil } = await supabase
        .from('usuarios')
        .select('nombre')
        .eq('id', user.id)
        .maybeSingle()

      if (perfil?.nombre) nombreFinal = perfil.nombre
      setNombre(nombreFinal)
      setLoading(false)
    }

    cargarUsuario()
  }, [])

  // === Cambiar nombre ===
  const handleGuardarNombre = async () => {
    setGuardando(true)
    try {
      const { data: existente } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (existente)
        await supabase.from('usuarios').update({ nombre }).eq('id', user.id)
      else
        await supabase.from('usuarios').insert([{ id: user.id, nombre }])

      alert('✅ Nombre actualizado correctamente.')
      setEditandoNombre(false)
    } catch (error) {
      console.error(error)
      alert('❌ Error al guardar el nombre.')
    } finally {
      setGuardando(false)
    }
  }

  // === Cambiar correo ===
  const handleGuardarEmail = async () => {
    if (!nuevoEmail || nuevoEmail === email) return
    setGuardando(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: nuevoEmail })
      if (error) throw error
      alert('📧 Se envió un correo de verificación al nuevo email.')
      setEditandoEmail(false)
    } catch (error) {
      console.error(error)
      alert('❌ Error al actualizar el correo.')
    } finally {
      setGuardando(false)
    }
  }

  // === Cambiar contraseña ===
  const handleCambiarContrasena = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth/reset',
      })
      if (error) throw error
      alert('🔒 Se envió un enlace de recuperación de contraseña a tu correo.')
    } catch (error) {
      console.error(error)
      alert('❌ Error al enviar enlace de recuperación.')
    }
  }

  // === Eliminar cuenta ===
  const handleEliminarCuenta = async () => {
    const confirmar = confirm('⚠️ Esta acción eliminará tu cuenta y todos tus datos. ¿Continuar?')
    if (!confirmar) return

    try {
      await supabase.from('usuarios').delete().eq('id', user.id)
      await supabase.auth.signOut()
      alert('🗑️ Cuenta eliminada correctamente.')
      window.location.href = '/'
    } catch (error) {
      console.error(error)
      alert('❌ No se pudo eliminar la cuenta. Contacta al administrador.')
    }
  }

  if (loading)
    return <p className="p-6 text-gray-400 text-center animate-pulse">Cargando perfil...</p>

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white px-6 sm:px-10 md:px-16 lg:px-24 pt-24 pb-20">
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-4xl font-bold text-center text-blue-400 mb-12 tracking-tight"
      >
        Mi Perfil
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.8 }}
        className="max-w-2xl mx-auto"
      >
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-xl rounded-2xl">
          <CardContent className="p-8 space-y-10">

            {/* Correo */}
            <div>
              <h3 className="text-sm text-blue-400 uppercase font-semibold mb-2">Correo electrónico</h3>
              {editandoEmail ? (
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <input
                    type="email"
                    value={nuevoEmail}
                    onChange={(e) => setNuevoEmail(e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleGuardarEmail} disabled={guardando} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-1" /> Guardar
                    </Button>
                    <Button onClick={() => setEditandoEmail(false)} className="bg-gray-700 hover:bg-gray-800">
                      <X className="w-4 h-4 mr-1" /> Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-lg text-gray-200">{email}</p>
                  <Button onClick={() => { setEditandoEmail(true); setNuevoEmail(email) }} className="bg-blue-600 hover:bg-blue-700">
                    <Pencil className="w-4 h-4 mr-1" /> Editar
                  </Button>
                </div>
              )}
            </div>

            {/* Nombre */}
            <div>
              <h3 className="text-sm text-blue-400 uppercase font-semibold mb-2">Nombre de usuario</h3>
              {editandoNombre ? (
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleGuardarNombre} disabled={guardando} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-1" /> Guardar
                    </Button>
                    <Button onClick={() => setEditandoNombre(false)} className="bg-gray-700 hover:bg-gray-800">
                      <X className="w-4 h-4 mr-1" /> Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-lg text-gray-200">{nombre || 'No asignado'}</p>
                  <Button onClick={() => setEditandoNombre(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Pencil className="w-4 h-4 mr-1" /> Editar
                  </Button>
                </div>
              )}
            </div>

            {/* Fecha */}
            <div>
              <h3 className="text-sm text-blue-400 uppercase font-semibold mb-2">Miembro desde</h3>
              <p className="text-lg text-gray-300">{fecha}</p>
            </div>

            {/* Seguridad */}
            <div className="pt-6 border-t border-gray-700">
              <h3 className="text-sm text-blue-400 uppercase font-semibold mb-3">Seguridad</h3>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleCambiarContrasena} className="bg-blue-600 hover:bg-blue-700">
                  <Lock className="w-4 h-4 mr-2" /> Cambiar contraseña
                </Button>
                <Button onClick={handleEliminarCuenta} className="bg-blue-600 hover:bg-blue-700">
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar cuenta
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
