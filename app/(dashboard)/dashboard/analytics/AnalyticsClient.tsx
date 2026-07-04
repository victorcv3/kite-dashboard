'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell
} from 'recharts'
import type { AnalyticsData, VapiCall } from '@/types/app'

interface Props {
  analytics: AnalyticsData
  calls: VapiCall[]
}

export function AnalyticsClient({ analytics, calls }: Props) {
  const successRate = analytics.totalCalls > 0
    ? Math.round((analytics.successfulCalls / analytics.totalCalls) * 100)
    : 0

  // Calls by hour of day
  const hourBuckets = Array.from({ length: 24 }, (_, i) => ({
    hour: i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i - 12}pm`,
    calls: 0,
  }))
  calls.forEach(c => {
    const ts = c.startedAt ?? c.createdAt
    if (ts) hourBuckets[new Date(ts).getHours()].calls++
  })
  const peakHour = hourBuckets.reduce((a, b) => b.calls > a.calls ? b : a)

  // Duration distribution
  const durationBuckets = [
    { label: '<1 min', count: 0 },
    { label: '1–2 min', count: 0 },
    { label: '2–4 min', count: 0 },
    { label: '4–6 min', count: 0 },
    { label: '>6 min', count: 0 },
  ]
  calls.forEach(c => {
    const d = (c.duration ?? 0) / 60
    if (d < 1) durationBuckets[0].count++
    else if (d < 2) durationBuckets[1].count++
    else if (d < 4) durationBuckets[2].count++
    else if (d < 6) durationBuckets[3].count++
    else durationBuckets[4].count++
  })

  // Per-assistant breakdown
  const byAssistant: Record<string, { name: string; total: number; successful: number }> = {}
  calls.forEach(c => {
    const name = c.assistant?.name ?? 'Unknown'
    if (!byAssistant[name]) byAssistant[name] = { name, total: 0, successful: 0 }
    byAssistant[name].total++
    if (c.analysis?.successEvaluation === 'true') byAssistant[name].successful++
  })
  const assistantData = Object.values(byAssistant).map(a => ({
    name: a.name,
    total: a.total,
    rate: Math.round((a.successful / a.total) * 100),
  }))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-[-0.01em] text-[#0A0A0A]">Analytics</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(10,10,10,0.40)' }}>
          Deep dive into your call performance — last 30 days
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Success Rate', value: `${successRate}%`, color: '#10b981' },
          { label: 'Total Calls', value: analytics.totalCalls },
          { label: 'Avg Duration', value: `${Math.round(analytics.avgDuration)}s` },
          { label: 'Peak Hour', value: peakHour.calls > 0 ? peakHour.hour : '—' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-[rgba(10,10,10,0.07)] p-5 shadow-[0_1px_4px_rgba(10,10,10,0.06)]">
            <p className="text-xs font-medium tracking-[0.1em] uppercase mb-2" style={{ color: 'rgba(10,10,10,0.40)' }}>{label}</p>
            <p className="text-3xl font-bold tracking-[-0.03em]" style={{ color: color ?? '#0A0A0A' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Calls by hour + Duration distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Peak hours */}
        <div className="bg-white rounded-2xl border border-[rgba(10,10,10,0.07)] p-6 shadow-[0_1px_4px_rgba(10,10,10,0.06)]">
          <p className="text-[15px] font-semibold text-[#0A0A0A] mb-0.5">Calls by Hour</p>
          <p className="text-xs mb-4" style={{ color: 'rgba(10,10,10,0.40)' }}>When your customers call most</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourBuckets} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,10,10,0.06)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'rgba(10,10,10,0.35)', fontFamily: 'Satoshi, system-ui' }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(10,10,10,0.35)', fontFamily: 'Satoshi, system-ui' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid rgba(10,10,10,0.1)', borderRadius: '10px', fontSize: '12px', fontFamily: 'Satoshi, system-ui' }} formatter={(v) => [v, 'Calls']} />
              <Bar dataKey="calls" radius={[3, 3, 0, 0]} maxBarSize={18}>
                {hourBuckets.map((entry, i) => (
                  <Cell key={i} fill={entry.calls === peakHour.calls && entry.calls > 0 ? '#8b5cf6' : 'rgba(139,92,246,0.3)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Duration distribution */}
        <div className="bg-white rounded-2xl border border-[rgba(10,10,10,0.07)] p-6 shadow-[0_1px_4px_rgba(10,10,10,0.06)]">
          <p className="text-[15px] font-semibold text-[#0A0A0A] mb-0.5">Call Duration</p>
          <p className="text-xs mb-4" style={{ color: 'rgba(10,10,10,0.40)' }}>Distribution of call lengths</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={durationBuckets} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,10,10,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgba(10,10,10,0.35)', fontFamily: 'Satoshi, system-ui' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(10,10,10,0.35)', fontFamily: 'Satoshi, system-ui' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid rgba(10,10,10,0.1)', borderRadius: '10px', fontSize: '12px', fontFamily: 'Satoshi, system-ui' }} formatter={(v) => [v, 'Calls']} />
              <Bar dataKey="count" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-assistant table */}
      {assistantData.length > 0 && (
        <div className="bg-white rounded-2xl border border-[rgba(10,10,10,0.07)] shadow-[0_1px_4px_rgba(10,10,10,0.06)]">
          <div className="px-6 py-4 border-b border-[rgba(10,10,10,0.06)]">
            <p className="text-[15px] font-semibold text-[#0A0A0A]">Performance by Assistant</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(10,10,10,0.40)' }}>Success rate per AI agent</p>
          </div>
          <div>
            {assistantData.map((a, i) => (
              <div
                key={a.name}
                className="flex items-center gap-4 px-6 py-4"
                style={{ borderTop: i > 0 ? '1px solid rgba(10,10,10,0.04)' : undefined }}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#0A0A0A]">{a.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(10,10,10,0.40)' }}>{a.total} calls</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(10,10,10,0.06)' }}>
                    <div className="h-full rounded-full bg-[#10b981]" style={{ width: `${a.rate}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-[#10b981] w-10 text-right">{a.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
