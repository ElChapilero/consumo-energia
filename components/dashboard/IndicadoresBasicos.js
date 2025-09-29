'use client'

import { Card, CardContent } from '@/components/ui/card'

export default function IndicadoresBasicos({ voltaje, corriente, frecuencia }) {
  return (
    <div className="grid md:grid-cols-3 gap-6 mt-10">
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl">
        <CardContent className="p-6 flex flex-col items-center">
          <span className="text-sm text-gray-400">Voltaje</span>
          <span className="text-2xl font-bold text-blue-400">
            {(voltaje ?? 0).toFixed(1)} V
          </span>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl">
        <CardContent className="p-6 flex flex-col items-center">
          <span className="text-sm text-gray-400">Corriente</span>
          <span className="text-2xl font-bold text-green-400">
            {(corriente ?? 0).toFixed(2)} A
          </span>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl">
        <CardContent className="p-6 flex flex-col items-center">
          <span className="text-sm text-gray-400">Frecuencia</span>
          <span className="text-2xl font-bold text-yellow-400">
            {(frecuencia ?? 0).toFixed(1)} Hz
          </span>
        </CardContent>
      </Card>
    </div>
  )
}
