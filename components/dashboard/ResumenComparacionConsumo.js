'use client'

import { Card, CardContent } from '@/components/ui/card'

export default function ResumenComparacionConsumo({ hoy, ayer, diferencia }) {
  return (
    <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl">
      <CardContent className="p-6 w-full flex flex-col items-center">
        <h3 className="text-xl font-semibold text-blue-300 mb-6">
          Resumen Comparación
        </h3>
        <div className="flex flex-col gap-6 w-full">
          <div className="bg-gray-900/60 rounded-lg p-4 flex flex-col items-center shadow-inner">
            <span className="text-sm text-gray-400">Consumo Hoy</span>
            <span className="text-2xl font-bold text-green-400">
              {hoy.toFixed(3)} kWh
            </span>
          </div>
          <div className="bg-gray-900/60 rounded-lg p-4 flex flex-col items-center shadow-inner">
            <span className="text-sm text-gray-400">Consumo Ayer</span>
            <span className="text-2xl font-bold text-red-400">
              {ayer.toFixed(3)} kWh
            </span>
          </div>
          <div className="bg-gray-900/60 rounded-lg p-4 flex flex-col items-center shadow-inner">
            <span className="text-sm text-gray-400">Diferencia</span>
            <span className="text-2xl font-bold text-yellow-400">
              {diferencia}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
