'use client'

import { useState, useEffect, useRef } from 'react'
import { Menu, X, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [menuPerfil, setMenuPerfil] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [user, setUser] = useState(null)
  const perfilRef = useRef(null)

  useEffect(() => {
    setLoaded(true)

    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      let currentUser = session?.user || null

      if (currentUser) {
        // Buscar nombre real en tabla usuarios
        const { data: perfil, error } = await supabase
          .from('usuarios')
          .select('nombre')
          .eq('id', currentUser.id)
          .single()

        if (!error && perfil) {
          currentUser = { ...currentUser, nombre: perfil.nombre }
        }
      }

      setUser(currentUser)
    }

    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      let currentUser = session?.user || null
      if (currentUser) {
        const { data: perfil, error } = await supabase
          .from('usuarios')
          .select('nombre')
          .eq('id', currentUser.id)
          .single()

        if (!error && perfil) {
          currentUser = { ...currentUser, nombre: perfil.nombre }
        }
      }
      setUser(currentUser)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // Cerrar menú perfil si se hace click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (perfilRef.current && !perfilRef.current.contains(e.target)) {
        setMenuPerfil(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setOpen(false)
    setMenuPerfil(false)
  }

  const links = [
    { name: 'Inicio', href: '/' },
    { name: 'General', href: '/general' },
    { name: 'Circuitos', href: '/circuitos' },
    { name: 'Alertas', href: '/alertas' },
    { name: 'Historial', href: '/historial' },
  ]

  return (
    <nav
      className={`bg-gradient-to-r from-gray-900 via-gray-950 to-black text-white fixed w-full z-50 shadow-lg transition-all duration-700 ${
        loaded ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* === Logo === */}
          <div className="flex items-center space-x-2">
            <img src="/Logo_1.svg" alt="Logo" className="h-8 w-8" />
            <span className="font-bold text-xl tracking-wide text-blue-300">EcoEnergi</span>
          </div>

          {/* === Links (PC) === */}
          <div className="hidden md:flex flex-1 justify-center space-x-8 items-center">
            {links.map((link, i) => (
              <a
                key={i}
                href={link.href}
                className="text-gray-300 hover:text-blue-400 transition duration-300 hover:scale-105"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* === Usuario / Sesión (PC) === */}
          <div className="hidden md:flex items-center space-x-6" ref={perfilRef}>
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuPerfil(!menuPerfil)}
                  className="flex items-center space-x-3 bg-gray-800 px-3 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  <div className="bg-blue-600 w-9 h-9 flex items-center justify-center rounded-full text-white font-bold">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-200">
                      {user?.nombre || 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-400">Perfil de usuario</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {/* Menú desplegable perfil */}
                <div
                  className={`absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden transition-all duration-300 ${
                    menuPerfil
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 -translate-y-2 pointer-events-none'
                  }`}
                >
                  <a
                    href="/perfil"
                    className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-blue-400 transition"
                    onClick={() => setMenuPerfil(false)}
                  >
                    Ver perfil
                  </a>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-gray-300 hover:bg-red-600/40 hover:text-red-400 transition"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            ) : (
              <>
                <a
                  href="/login"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-400 transition duration-300 hover:scale-105"
                >
                  Log in
                </a>
                <a
                  href="/register"
                  className="border border-blue-400 px-4 py-2 rounded-md hover:bg-blue-400 hover:text-black transition duration-300 hover:scale-105"
                >
                  Sign up
                </a>
              </>
            )}
          </div>

          {/* === Botón menú móvil === */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setOpen(!open)} className="text-gray-200 focus:outline-none">
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* === Menú móvil === */}
      <div
        className={`md:hidden bg-gray-900/95 px-4 pt-3 pb-5 space-y-4 transition-all duration-500 ease-in-out ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        {links.map((link, i) => (
          <a
            key={i}
            href={link.href}
            className="block text-gray-200 hover:text-blue-400 transition duration-300"
            onClick={() => setOpen(false)}
          >
            {link.name}
          </a>
        ))}

        {user ? (
          <div className="space-y-3 border-t border-gray-700 pt-3">
            {/* Botón que lleva directo al perfil */}
            <button
              onClick={() => {
                window.location.href = '/perfil'
                setOpen(false)
              }}
              className="flex items-center space-x-3 bg-gray-800 p-3 rounded-lg w-full hover:bg-gray-700 transition"
            >
              <div className="bg-blue-600 w-9 h-9 flex items-center justify-center rounded-full text-white font-bold">
                {user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-200">
                  {user?.nombre || 'Usuario'}
                </p>
                <p className="text-xs text-gray-400">Ver perfil</p>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="block w-full bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-400 transition duration-300"
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <div className="space-y-3 border-t border-gray-700 pt-3">
            <a
              href="/login"
              className="block bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-400 transition duration-300"
              onClick={() => setOpen(false)}
            >
              Log in
            </a>
            <a
              href="/register"
              className="block border border-blue-400 px-3 py-2 rounded-md hover:bg-blue-400 hover:text-black transition duration-300"
              onClick={() => setOpen(false)}
            >
              Sign up
            </a>
          </div>
        )}
      </div>
    </nav>
  )
}
