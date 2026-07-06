'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell
} from 'recharts'
import type { AnalyticsData, VapiCall } from '@/types/app'
import type { Period } from '@/lib/vapi/client'
import { PeriodFilter } from '@/components/dashboard/PeriodFilter'
import { endedReasonLabel } from '@/lib/utils'
import { format } from 'date-fns'

const PERIOD_LABELS: Record<Period, string> = {
  today: 'today',
  week: 'last 7 days',
  max: 'last 14 days',
}

interface Props {
  analytics: AnalyticsData
  calls: VapiCall[]
  period: Period
}

export function AnalyticsClient({ analytics, calls, period }: Props) {
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

  // Busiest day — an actual calendar date, not a day-of-week bucket. With
  // only a 14-day retention window there's barely 2 samples per weekday, so
  // "Wednesdays are busy" isn't a real pattern — a specific date is.
  const dateCounts = new Map<string, { label: string; calls: number }>()
  calls.forEach(c => {
    const ts = c.startedAt ?? c.createdAt
    if (!ts) return
    const date = new Date(ts)
    const key = format(date, 'yyyy-MM-dd')
    const label = `${format(date, 'MMM d')} · ${format(date, 'EEE')}`
    const existing = dateCounts.get(key)
    if (existing) existing.calls++
    else dateCounts.set(key, { label, calls: 1 })
  })
  const busiestDay = Array.from(dateCounts.values()).reduce(
    (a, b) => b.calls > a.calls ? b : a,
    { label: '—', calls: 0 }
  )

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

  // Repeat caller rate — of everyone who called, what % called more than once
  const callerCounts = new Map<string, number>()
  calls.forEach(c => {
    const number = c.customer?.number
    if (!number) return
    callerCounts.set(number, (callerCounts.get(number) ?? 0) + 1)
  })
  const uniqueCallerCount = callerCounts.size
  const repeatCallerCount = Array.from(callerCounts.values()).filter(n => n > 1).length
  const repeatCallerRate = uniqueCallerCount > 0 ? Math.round((repeatCallerCount / uniqueCallerCount) * 100) : 0

  // End reason breakdown — how calls actually ended, not just success/fail
  const endReasonCounts: Record<string, number> = {}
  calls.forEach(c => {
    const reason = endedReasonLabel(c.endedReason)
    endReasonCounts[reason] = (endReasonCounts[reason] ?? 0) + 1
  })
  const endReasonData = Object.entries(endReasonCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-[#0A0A0A]">Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(10,10,10,0.40)' }}>
            Deep dive into your call performance — {PERIOD_LABELS[period]}
          </p>
        </div>
        <PeriodFilter current={period} />
      </div>

      {/* KPI row — deeper metrics only; totals/success rate already live on the Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Peak Hour', value: peakHour.calls > 0 ? peakHour.hour : '—' },
          { label: 'Repeat Caller Rate', value: `${repeatCallerRate}%`, color: '#8b5cf6' },
          { label: 'Busiest Day', value: busiestDay.calls > 0 ? busiestDay.label : '—' },
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

      {/* End reason breakdown */}
      {endReasonData.length > 0 && (
        <div className="bg-white rounded-2xl border border-[rgba(10,10,10,0.07)] shadow-[0_1px_4px_rgba(10,10,10,0.06)]">
          <div className="px-6 py-4 border-b border-[rgba(10,10,10,0.06)]">
            <p className="text-[15px] font-semibold text-[#0A0A0A]">End Reason Breakdown</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(10,10,10,0.40)' }}>How your calls actually ended</p>
          </div>
          <div>
            {endReasonData.map((r, i) => (
              <div
                key={r.reason}
                className="flex items-center gap-4 px-6 py-4"
                style={{ borderTop: i > 0 ? '1px solid rgba(10,10,10,0.04)' : undefined }}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#0A0A0A]">{r.reason}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(10,10,10,0.06)' }}>
                    <div
                      className="h-full rounded-full bg-[#8b5cf6]"
                      style={{ width: `${Math.round((r.count / calls.length) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-[#0A0A0A] w-10 text-right">{r.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
