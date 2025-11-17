'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { Menu, X, LogOut, Settings, BookOpen, LifeBuoy } from 'lucide-react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [menuPerfil, setMenuPerfil] = useState(false)
  const [perfil, setPerfil] = useState(null)
  const [ready, setReady] = useState(false)
  const perfilRef = useRef(null)

  const session = useSession()
  const supabase = useSupabaseClient()
  const user = session?.user

  const router = useRouter()
  const currentPath = router.pathname // siempre actualizado por next/router

  // === Detectar cambios de ruta para cerrar menú móvil y dropdown ===
  useEffect(() => {
    const handleRouteChange = () => {
      setOpen(false)
      setMenuPerfil(false)
    }
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => router.events.off('routeChangeComplete', handleRouteChange)
  }, [router.events])

  // === Cargar perfil (solo cuando cambia user) ===
  useEffect(() => {
    let mounted = true
    const fetchPerfil = async () => {
      if (!user) {
        if (mounted) {
          setPerfil(null)
          setReady(true)
        }
        return
      }

      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('nombre')
          .eq('id', user.id)
          .single()

        if (!error && mounted) setPerfil(data)
      } catch (e) {
        console.error('fetchPerfil error', e)
      } finally {
        if (mounted) setReady(true)
      }
    }

    fetchPerfil()
    return () => {
      mounted = false
    }
  }, [user, supabase])

  // === Cerrar menú perfil si se hace clic fuera ===
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (perfilRef.current && !perfilRef.current.contains(e.target)) {
        setMenuPerfil(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // === Cerrar sesión ===
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Sign out error', err)
    } finally {
      setOpen(false)
      setMenuPerfil(false)
      // si quieres redirigir luego del logout:
      // router.push('/login')
    }
  }

  const links = [
    { name: 'Inicio', href: '/' },
    { name: 'Tu hogar', href: '/circuitos' },
    { name: 'Alertas', href: '/alertas' },
    { name: 'Historial', href: '/historial' },
    { name: 'Vincular Casa', href: '/vincularCasa' },
  ]

  // === Evitar parpadeo inicial ===
  if (!ready) {
    return (
      <nav className="fixed w-full bg-gradient-to-r from-gray-900 via-gray-950 to-black text-white h-16 flex items-center justify-center z-50">
        <span className="text-gray-400 text-sm animate-pulse">Cargando...</span>
      </nav>
    )
  }

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-gray-950 to-black text-white fixed w-full z-50 shadow-lg transition-all duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* LOGO */}
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center gap-2">
              <img src="/Logo_1.svg" alt="Logo" className="h-8 w-8" />
              <span className="font-bold text-xl tracking-wide text-blue-400">EcoEnergi</span>
            </Link>
          </div>

          {/* LINKS (PC) */}
          <div className="hidden md:flex flex-1 justify-center space-x-8 items-center">
            {links.map((link) => {
              const isActive = currentPath === link.href
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`pb-1 transition duration-200 hover:text-blue-400 hover:scale-105 ${
                    isActive ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-300'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </div>

          {/* PERFIL (PC) */}
          <div className="hidden md:flex items-center space-x-6" ref={perfilRef}>
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuPerfil((s) => !s)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full 
  border border-blue-500/40 bg-gray-900/40 
  hover:border-blue-400 hover:bg-gray-800/60 transition-all shadow-sm"
                >
                  <span className="text-gray-200 font-medium">
                    {perfil?.nombre || user.email?.split('@')[0]}
                  </span>

                  <Settings className="w-5 h-5 text-blue-400" />
                </button>

                <div
                  className={`absolute right-0 mt-4 w-72 bg-gray-900/95 border border-gray-700/70 
                    rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-200 
                    origin-top-right transform ${
                      menuPerfil
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}
                >
                  <div className="px-5 py-4 border-b border-gray-800/70">
                    <p className="text-lg font-semibold text-blue-400">
                      {perfil?.nombre || user.email?.split('@')[0]}
                    </p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>

                  <div className="flex flex-col py-2">
                    <Link
                      href="/perfil"
                      className="px-5 py-2.5 text-gray-300 hover:text-blue-400 hover:bg-gray-800/80 flex items-center gap-2 transition"
                      onClick={() => setMenuPerfil(false)}
                    >
                      <Settings className="w-4 h-4" /> Perfil
                    </Link>
                    <Link
                      href="/soporte"
                      className="px-5 py-2.5 text-gray-300 hover:text-blue-400 hover:bg-gray-800/80 flex items-center gap-2 transition"
                      onClick={() => setMenuPerfil(false)}
                    >
                      <LifeBuoy className="w-4 h-4" /> Soporte
                    </Link>
                    <Link
                      href="/manuales"
                      className="px-5 py-2.5 text-gray-300 hover:text-blue-400 hover:bg-gray-800/80 flex items-center gap-2 transition"
                      onClick={() => setMenuPerfil(false)}
                    >
                      <BookOpen className="w-4 h-4" /> Manuales
                    </Link>
                  </div>

                  <div className="border-t border-gray-800/70 my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="text-left w-full px-5 py-3 text-red-400 hover:text-red-300 hover:bg-red-600/10 flex items-center gap-2 transition"
                  >
                    <LogOut className="w-4 h-4" /> Cerrar sesión
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-400 transition duration-200 hover:scale-105"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="border border-blue-400 px-4 py-2 rounded-md hover:bg-blue-400 hover:text-black transition duration-200 hover:scale-105"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* MENÚ MÓVIL BOTÓN */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setOpen((s) => !s)}
              className="text-gray-200 focus:outline-none"
              aria-expanded={open}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* MENÚ MÓVIL */}
      <div
        className={`md:hidden bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 transition-all duration-300 ease-in-out
  ${
    open
      ? 'px-6 pt-4 pb-6 max-h-[34rem] opacity-100'
      : 'px-0 pt-0 pb-0 max-h-0 opacity-0 overflow-hidden'
  }`}
      >
        <div className="flex flex-col space-y-3 pb-4 border-b border-gray-800">
          {links.map((link) => {
            const isActive = currentPath === link.href
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`text-base font-medium transition duration-200 pb-1 ${
                  isActive
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-300 hover:text-blue-400'
                }`}
              >
                {link.name}
              </Link>
            )
          })}
        </div>

        {user ? (
          <div className="mt-5 space-y-3">
            <div>
              <p className="text-blue-400 font-semibold text-lg">
                {perfil?.nombre || user.email?.split('@')[0]}
              </p>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>

            <Link
              href="/perfil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-gray-300 hover:text-blue-400 transition"
            >
              <Settings className="w-4 h-4" /> Perfil
            </Link>
            <Link
              href="/soporte"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-gray-300 hover:text-blue-400 transition"
            >
              <LifeBuoy className="w-4 h-4" /> Soporte
            </Link>
            <Link
              href="/manuales"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-gray-300 hover:text-blue-400 transition"
            >
              <BookOpen className="w-4 h-4" /> Manuales
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 border-t border-gray-800 pt-3 mt-3 transition"
            >
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          </div>
        ) : (
          <div className="space-y-3 mt-5 border-t border-gray-800 pt-4">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-400 transition duration-200"
            >
              Log in
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="block border border-blue-400 px-4 py-2 rounded-md hover:bg-blue-400 hover:text-black transition duration-200"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
