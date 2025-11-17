'use client'

export default function ResumenCostoHora({ max, promedio, estado }) {
  return (
    <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border-none shadow-xl w-full flex flex-col items-center p-6 rounded-2xl">
      <h3 className="text-xl font-semibold text-blue-300 mb-4 tracking-wide text-center">Resumen Costo</h3>
      <div className="flex flex-col gap-6 w-full">
        <div className="bg-zinc-900/60 rounded-lg p-4 flex flex-col items-center shadow-inner">
          <span className="text-xl text-blue-300">Máximo</span>
          <span className="text-lg font-bold text-gray-300">${max.toFixed(2)}</span>
        </div>
        <div className="bg-zinc-900/60 rounded-lg p-4 flex flex-col items-center shadow-inner">
          <span className="text-xl text-blue-300">Promedio</span>
          <span className="text-lg font-bold text-gray-300">${promedio.toFixed(2)}</span>
        </div>
        <div className="bg-zinc-900/60 rounded-lg p-4 flex flex-col items-center shadow-inner">
          <span className="text-xl text-blue-300">Estado</span>
          <span className="text-lg font-bold text-gray-300">{estado}</span>
        </div>
      </div>
    </div>
  )
}
