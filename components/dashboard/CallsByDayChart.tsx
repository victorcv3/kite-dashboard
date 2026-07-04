'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  date: string
  count: number
  successful: number
  failed: number
}

export function CallsByDayChart({ data }: { data: DataPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'rgba(10,10,10,0.35)' }}>
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,10,10,0.06)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'rgba(10,10,10,0.35)', fontFamily: 'Satoshi, system-ui' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'rgba(10,10,10,0.35)', fontFamily: 'Satoshi, system-ui' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid rgba(10,10,10,0.1)',
            borderRadius: '10px',
            fontSize: '12px',
            fontFamily: 'Satoshi, system-ui',
            boxShadow: '0 4px 16px -4px rgba(10,10,10,0.12)',
          }}
          formatter={(value) => [value, 'Calls']}
        />
        <Line
          type="monotone"
          dataKey="count"
          name="Calls"
          stroke="#6366f1"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0, fill: '#6366f1' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
