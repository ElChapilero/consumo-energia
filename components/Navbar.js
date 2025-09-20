import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)
  }, [])

  return (
    <nav
      className={`bg-gradient-to-r from-gray-900 via-gray-950 to-black text-white fixed w-full z-50 shadow-lg transform transition-transform duration-700 ${
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
            {['Inicio', 'General', 'Circuitos', 'Alertas', 'Historial'].map((item, i) => (
              <a
                key={i}
                href={`/${item.toLowerCase() === 'inicio' ? '' : item.toLowerCase()}`}
                className="text-gray-200 hover:text-blue-400 transition duration-300 ease-in-out hover:scale-105"
              >
                {item}
              </a>
            ))}
          </div>

          {/* === Botones sesión (PC) === */}
          <div className="hidden md:flex items-center space-x-4">
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
          </div>

          {/* === Botón menú móvil === */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setOpen(!open)}>
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* === Menú móvil === */}
      {open && (
        <div className="md:hidden bg-gray-900/95 px-4 pt-2 pb-4 space-y-3 animate-fadeIn">
          {['Inicio', 'General', 'Circuitos', 'Alertas', 'Historial'].map((item, i) => (
            <a
              key={i}
              href={`/${item.toLowerCase() === 'inicio' ? '' : item.toLowerCase()}`}
              className="block text-gray-200 hover:text-blue-400 transition duration-300"
            >
              {item}
            </a>
          ))}
          <a
            href="/login"
            className="block bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-400 transition duration-300"
          >
            Log in
          </a>
          <a
            href="/register"
            className="block border border-blue-400 px-3 py-2 rounded-md hover:bg-blue-400 hover:text-black transition duration-300"
          >
            Sign up
          </a>
        </div>
      )}
    </nav>
  )
}
