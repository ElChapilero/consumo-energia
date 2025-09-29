'use client'

import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts'
import { Card, CardContent } from '@/components/ui/card'

export default function ChartComparacionConsumo({ data }) {
  return (
    <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-none shadow-xl md:col-span-7 order-1 md:order-2 h-full">
      <CardContent className="p-6 h-full min-h-[250px]">
        <h2 className="text-xl font-semibold mb-4 text-blue-300">
          Consumo: Ayer vs. Hoy
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="name" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip />
            <Bar dataKey="energia" fill="#34d399" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
