import '@/styles/globals.css'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabaseClient'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'
import { ToastProvider } from '@/components/ToastContext' // <-- Importar aquí

function MyApp({ Component, pageProps }) {
  const [hydrated, setHydrated] = useState(false)

  // Evita que se muestre la app hasta que React esté listo
  useEffect(() => {
    setHydrated(true)
  }, [])

  if (!hydrated) {
    return (
      <div
        className="w-full h-screen flex items-center justify-center bg-black text-gray-400"
      >
        Cargando...
      </div>
    )
  }

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <ToastProvider> {/* <-- Envolvemos toda la app */}
        <Navbar />
        <Component {...pageProps} />
      </ToastProvider>
    </SessionContextProvider>
  )
}

export default MyApp
