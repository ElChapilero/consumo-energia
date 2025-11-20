import '@/styles/globals.css'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabaseClient'
import { SessionContextProvider, useSession } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'
import { ToastProvider } from '@/components/ToastContext'
import { useRouter } from 'next/router'

const rutasProtegidas = [
  '/dashboard',
  '/alertas',
  '/circuitos',
  '/historial',
  '/perfil',
  '/vincularCasa',
]

function AuthGuard({ children }) {
  const router = useRouter()
  const session = useSession()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function check() {
      const requiereAuth = rutasProtegidas.includes(router.pathname)

      if (requiereAuth && !session) {
        router.replace('/login')
      }

      setChecking(false)
    }

    check()
  }, [router.pathname, session])

  if (checking) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black text-gray-400">
        Cargando...
      </div>
    )
  }

  return children
}

function MyApp({ Component, pageProps }) {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <ToastProvider>
        <AuthGuard>
          <Navbar />
          <Component {...pageProps} />
        </AuthGuard>
      </ToastProvider>
    </SessionContextProvider>
  )
}

export default MyApp
