'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/components/ToastContext'

const friendlyErrors = {
  'Invalid login credentials': 'Correo o contraseña incorrecta',
  'Email not found': 'El correo no está registrado',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { addToast } = useToast() // Hook dentro del componente

  // 🔹 Redirige si ya hay sesión activa
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

    // ✅ Validación manual antes de enviar
    if (!email.includes('@')) {
      addToast('error', 'El correo debe incluir @')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      addToast('error', 'La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      addToast('error', friendlyErrors[error.message] || 'Ha ocurrido un error')
    } else {
      addToast('success', '¡Inicio de sesión exitoso!')
      setEmail('')
      setPassword('')
      setTimeout(() => router.push('/'), 800)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-700"
      >
        <h2 className="text-3xl font-bold text-center text-blue-400 mb-6">
          Iniciar Sesión
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">Correo</label>
            <input
              type="text" // cambiar a text para evitar alertas nativas
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
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-gray-400 text-center mt-4">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-blue-400 hover:underline">
            Regístrate
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
