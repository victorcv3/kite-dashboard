'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { VapiCall } from '@/types/app'

export function CallsByHourChart({ calls }: { calls: VapiCall[] }) {
  const hourBuckets = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i - 12}pm`,
    calls: 0,
  }))

  for (const call of calls) {
    const ts = call.startedAt ?? call.createdAt
    if (ts) {
      const h = new Date(ts).getHours()
      hourBuckets[h].calls++
    }
  }

  const hasData = hourBuckets.some(b => b.calls > 0)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-40 text-sm" style={{ color: 'rgba(10,10,10,0.35)' }}>
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={hourBuckets} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,10,10,0.06)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: 'rgba(10,10,10,0.40)', fontFamily: 'Satoshi, system-ui' }}
          axisLine={false}
          tickLine={false}
          interval={2}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'rgba(10,10,10,0.40)', fontFamily: 'Satoshi, system-ui' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid rgba(10,10,10,0.1)',
            borderRadius: '12px',
            fontSize: '12px',
            fontFamily: 'Satoshi, system-ui',
            color: '#0A0A0A',
            boxShadow: '0 4px 16px -4px rgba(10,10,10,0.15)',
          }}
          formatter={(value) => [value, 'Calls']}
        />
        <Bar dataKey="calls" fill="#8b5cf6" radius={[3, 3, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  )
}
