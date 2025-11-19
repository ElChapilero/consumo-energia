'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/components/ToastContext'

const friendlyErrors = {
  'User already registered': 'Este correo ya está registrado',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
  'Email not found': 'El correo no es válido',
}

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { addToast } = useToast()

  // Redirige si ya hay sesión activa
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data?.session) router.push('/')
    }
    checkSession()
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validación manual
    if (!name.trim()) {
      addToast('error', 'El nombre es obligatorio')
      setLoading(false)
      return
    }

    if (!email.includes('@')) {
      addToast('error', 'El correo debe ser válido')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      addToast('error', 'La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre: name },
      },
    })

    if (signUpError) {
      addToast('error', friendlyErrors[signUpError.message] || 'Ha ocurrido un error')
    } else {
      const userId = data.user?.id
      if (userId) {
        await supabase.from('usuarios').insert([{ id: userId, nombre: name, email }])
      }

      addToast('success', 'Registro exitoso. Redirigiendo a login...')
      setName('')
      setEmail('')
      setPassword('')
      // 🔹 Redirigir a login en lugar de inicio
      setTimeout(() => router.push('/login'), 1200)
    }

    setLoading(false)
  }

  return (
    <div
      className="
      min-h-screen 
      flex items-center justify-center
      bg-gradient-to-br from-gray-900 via-gray-800 to-black
      px-6 mobile:px-0
      pt-[80px]   /* 🔥 evita que se esconda detrás del navbar */
    "
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="
        bg-gray-900 p-6 mobile:p-8 
        rounded-2xl shadow-xl w-full 
        max-w-sm mobile:max-w-md 
        border border-gray-700
      "
      >
        <h2 className="text-3xl font-bold text-center text-blue-400 mb-6">Crear Cuenta</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Correo</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@email.com"
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-semibold text-white shadow-lg"
          >
            {loading ? 'Registrando...' : 'Registrarme'}
          </button>
        </form>

        <p className="text-gray-400 text-center mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
