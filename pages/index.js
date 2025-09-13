'use client'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <div className="text-white bg-gradient-to-b from-gray-900 via-gray-950 to-black">
      {/* 🎇 Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-4xl md:text-6xl font-bold mb-4 text-blue-400 leading-tight text-center"
        >
          Visualiza tu consumo <br /> energético en todo momento
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          viewport={{ once: true }}
          className="text-lg md:text-xl text-gray-300 mb-8"
        >
          EcoEnergi pone la información a tu alcance.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          viewport={{ once: true }}
          className="space-x-4"
        >
          <a href="#" className="bg-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-blue-500">
            Descargar App
          </a>
          <a
            href="#servicios"
            className="bg-gray-800 px-6 py-3 rounded-md font-semibold hover:bg-gray-700"
          >
            Ver servicios
          </a>
        </motion.div>
      </section>

      {/* 🚀 Sobre el producto */}
      <section
        id="sobre"
        className="py-24 px-6 md:px-20 text-center bg-gradient-to-r from-gray-900 via-gray-800 to-black"
      >
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-3xl font-bold mb-4 text-blue-300"
        >
          ¿Qué es EcoEnergi?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          viewport={{ once: true }}
          className="text-gray-300 max-w-3xl mx-auto"
        >
          EcoEnergi es una plataforma de monitoreo energético en tiempo real que te permite conocer
          el consumo de tu hogar, detectar aparatos de alto consumo y recibir alertas para ahorrar
          energía y dinero.
        </motion.p>
      </section>

      {/* 🌌 Servicios */}
      <section
        id="servicios"
        className="py-24 px-6 md:px-20 text-center bg-gradient-to-r from-blue-950 via-gray-900 to-black"
      >
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-3xl font-bold mb-8 text-blue-400"
        >
          Nuestros servicios
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              title: 'Consumo Total',
              desc: 'Visualiza el gasto energético global de tu hogar en tiempo real.',
            },
            {
              title: 'Consumo por Circuito',
              desc: 'Analiza el consumo por cada área de tu casa y detecta excesos.',
            },
            {
              title: 'Alertas',
              desc: 'Recibe notificaciones cuando un aparato consuma más de lo normal.',
            },
            { title: 'Blog', desc: 'Aprende tips de ahorro energético y sostenibilidad.' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2, duration: 0.8 }}
              viewport={{ once: true }}
              className="p-6 bg-gray-800/40 rounded-lg hover:bg-gray-700/60 transition"
            >
              <h3 className="font-semibold mb-2 text-blue-300">{item.title}</h3>
              <p className="text-gray-300">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 🔭 Call to Action final */}
      <section className="py-24 text-center bg-gradient-to-r from-gray-900 via-blue-900 to-black">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-3xl font-bold mb-4 text-white"
        >
          Empieza a ahorrar energía desde hoy
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          viewport={{ once: true }}
          className="space-x-4"
        >
          <a
            href="/register"
            className="bg-blue-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-400"
          >
            Crear cuenta
          </a>
          <a
            href="#"
            className="border border-white px-6 py-3 rounded-md font-semibold text-white hover:bg-white hover:text-gray-900"
          >
            Descargar App
          </a>
        </motion.div>
      </section>
    </div>
  )
}
