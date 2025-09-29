'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'

export default function ChartCostoHora({ data }) {
  return (
    <Card className="bg-gradient-to-br from-zinc-800 to-zinc-900 border-none shadow-xl md:col-span-7 order-1 md:order-2 h-full">
      <CardContent className="p-6 h-full min-h-[250px]">
        <h2 className="text-xl font-semibold mb-4 text-blue-300">Gasto por hora ($COP)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="hora" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip formatter={(v) => `$${v.toLocaleString('es-CO')} COP`} />
            <Bar dataKey="costo" fill="#34d399" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
