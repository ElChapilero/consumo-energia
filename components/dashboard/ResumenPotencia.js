'use client'

import { Card, CardContent } from '@/components/ui/card'

export default function ResumenPotencia({ max, promedio, estado }) {
  return (
    <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl h-full flex flex-col">
      <CardContent className="p-6 flex flex-col justify-between flex-1">
        <h3 className="text-xl font-semibold text-blue-300 mb-4 tracking-wide text-center">
          Resumen Potencia
        </h3>
        <div className="flex flex-col gap-6 justify-between flex-1">
          <div className="bg-gray-900/60 rounded-lg p-4 flex flex-col items-center justify-center shadow-inner flex-1">
            <span className="text-xl text-blue-300">Máxima</span>
            <span className="text-lg font-bold text-gray-300">
              {Number(max).toFixed(3)} W
            </span>
          </div>
          <div className="bg-gray-900/60 rounded-lg p-4 flex flex-col items-center justify-center shadow-inner flex-1">
            <span className="text-xl text-blue-300">Promedio</span>
            <span className="text-lg font-bold text-gray-300">
              {Number(promedio).toFixed(3)} W
            </span>
          </div>
          <div className="bg-gray-900/60 rounded-lg p-4 flex flex-col items-center justify-center shadow-inner flex-1">
            <span className="text-xl text-blue-300">Estado</span>
            <span className="text-lg font-bold text-gray-300">
              {estado}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
