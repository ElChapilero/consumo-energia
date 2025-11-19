'use client'

import { Card, CardContent } from '@/components/ui/card'
import TooltipInfo from './TooltipInfo' // 👈 añadido

export default function IndicadoresBasicos({ voltaje, corriente, frecuencia }) {
  return (
    <div className="grid mobile:grid-cols-3 gap-6 mt-10">
      {/* Voltaje */}
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl">
        <CardContent className="p-6 flex flex-col items-center">
          <span className="text-xl font-semibold text-blue-300 mb-4 tracking-wide flex items-center gap-2">
            Voltaje
            <TooltipInfo numero={1} />
          </span>
          <span className="text-lg font-bold text-gray-300">
            {(voltaje ?? 0).toFixed(1)} V
          </span>
        </CardContent>
      </Card>

      {/* Corriente */}
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl">
        <CardContent className="p-6 flex flex-col items-center">
          <span className="text-xl font-semibold text-blue-300 mb-4 tracking-wide flex items-center gap-2">
            Corriente
            <TooltipInfo numero={2} />
          </span>
          <span className="text-lg font-bold text-gray-300">
            {(corriente ?? 0).toFixed(2)} A
          </span>
        </CardContent>
      </Card>

      {/* Frecuencia */}
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl">
        <CardContent className="p-6 flex flex-col items-center">
          <span className="text-xl font-semibold text-blue-300 mb-4 tracking-wide flex items-center gap-2">
            Frecuencia
            <TooltipInfo numero={3} />
          </span>
          <span className="text-lg font-bold text-gray-300">
            {(frecuencia ?? 0).toFixed(1)} Hz
          </span>
        </CardContent>
      </Card>
    </div>
  )
}
