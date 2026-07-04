'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { AnalyticsData } from '@/types/app'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  thisMonth: AnalyticsData
  lastMonth: AnalyticsData
}

const BREAKDOWN_COLORS = ['#6366f1', '#10b981', '#f97316', '#94a3b8']
const BREAKDOWN_LABELS = ['LLM (AI model)', 'Speech-to-Text', 'Text-to-Speech', 'Platform fee']
const BREAKDOWN_KEYS = ['llm', 'stt', 'tts', 'vapi'] as const

function pct(a: number, b: number) {
  if (!b) return null
  return ((a - b) / b) * 100
}

export function BillingClient({ thisMonth, lastMonth }: Props) {
  const cost = thisMonth.estimatedCost
  const prevCost = lastMonth.estimatedCost
  const trend = pct(cost, prevCost)
  const avgPerCall = thisMonth.totalCalls > 0 ? cost / thisMonth.totalCalls : 0

  // Cost breakdown (approximate from known ratios)
  const breakdown = [
    { name: BREAKDOWN_LABELS[0], value: parseFloat((cost * 0.40).toFixed(4)), color: BREAKDOWN_COLORS[0] },
    { name: BREAKDOWN_LABELS[1], value: parseFloat((cost * 0.30).toFixed(4)), color: BREAKDOWN_COLORS[1] },
    { name: BREAKDOWN_LABELS[2], value: parseFloat((cost * 0.20).toFixed(4)), color: BREAKDOWN_COLORS[2] },
    { name: BREAKDOWN_LABELS[3], value: parseFloat((cost * 0.10).toFixed(4)), color: BREAKDOWN_COLORS[3] },
  ]

  // Daily cost from callsByDay
  const dailyCostData = thisMonth.callsByDay.map(d => ({
    date: d.date,
    cost: parseFloat(((d.count / (thisMonth.totalCalls || 1)) * cost).toFixed(3)),
  }))

  const isUp = trend !== null && trend > 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-[-0.01em] text-[#0A0A0A]">Billing & Usage</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(10,10,10,0.40)' }}>
          Cost breakdown and spending overview
        </p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total spent */}
        <div className="bg-white rounded-2xl border border-[rgba(10,10,10,0.07)] p-5 shadow-[0_1px_4px_rgba(10,10,10,0.06)]">
          <p className="text-xs font-medium tracking-[0.1em] uppercase mb-3" style={{ color: 'rgba(10,10,10,0.40)' }}>
            Total Spent (30 days)
          </p>
          <p className="text-3xl font-bold tracking-[-0.03em] text-[#0A0A0A]">${cost.toFixed(2)}</p>
          {trend !== null && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${isUp ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
              {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isUp ? '+' : ''}{trend.toFixed(1)}% vs last 30 days
            </div>
          )}
        </div>

        {/* Avg cost per call */}
        <div className="bg-white rounded-2xl border border-[rgba(10,10,10,0.07)] p-5 shadow-[0_1px_4px_rgba(10,10,10,0.06)]">
          <p className="text-xs font-medium tracking-[0.1em] uppercase mb-3" style={{ color: 'rgba(10,10,10,0.40)' }}>
            Avg Cost per Call
          </p>
          <p className="text-3xl font-bold tracking-[-0.03em] text-[#0A0A0A]">${avgPerCall.toFixed(3)}</p>
          <p className="text-xs mt-2" style={{ color: 'rgba(10,10,10,0.40)' }}>
            Across {thisMonth.totalCalls} calls
          </p>
        </div>

        {/* Total minutes */}
        <div className="bg-white rounded-2xl border border-[rgba(10,10,10,0.07)] p-5 shadow-[0_1px_4px_rgba(10,10,10,0.06)]">
          <p className="text-xs font-medium tracking-[0.1em] uppercase mb-3" style={{ color: 'rgba(10,10,10,0.40)' }}>
            Total Minutes Used
          </p>
          <p className="text-3xl font-bold tracking-[-0.03em] text-[#0A0A0A]">{Math.round(thisMonth.totalMinutes)}</p>
          <p className="text-xs mt-2" style={{ color: 'rgba(10,10,10,0.40)' }}>
            ${(cost / (thisMonth.totalMinutes || 1)).toFixed(4)} per minute
          </p>
        </div>
      </div>

      {/* Cost over time + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily cost chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[rgba(10,10,10,0.07)] p-6 shadow-[0_1px_4px_rgba(10,10,10,0.06)]">
          <p className="text-[15px] font-semibold text-[#0A0A0A] mb-0.5">Daily Spending</p>
          <p className="text-xs mb-4" style={{ color: 'rgba(10,10,10,0.40)' }}>Cost per day over the last 30 days</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyCostData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,10,10,0.06)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(10,10,10,0.35)', fontFamily: 'Satoshi, system-ui' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(10,10,10,0.35)', fontFamily: 'Satoshi, system-ui' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                formatter={(v) => [`$${Number(v).toFixed(3)}`, 'Cost']}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid rgba(10,10,10,0.1)', borderRadius: '10px', fontSize: '12px', fontFamily: 'Satoshi, system-ui', boxShadow: '0 4px 12px rgba(10,10,10,0.1)' }}
              />
              <Line type="monotone" dataKey="cost" stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cost breakdown donut */}
        <div className="bg-white rounded-2xl border border-[rgba(10,10,10,0.07)] p-6 shadow-[0_1px_4px_rgba(10,10,10,0.06)]">
          <p className="text-[15px] font-semibold text-[#0A0A0A] mb-0.5">Cost Breakdown</p>
          <p className="text-xs mb-2" style={{ color: 'rgba(10,10,10,0.40)' }}>By service component</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={breakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value" strokeWidth={0}>
                {breakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip
                formatter={(v) => [`$${Number(v).toFixed(4)}`, '']}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid rgba(10,10,10,0.1)', borderRadius: '10px', fontSize: '12px', fontFamily: 'Satoshi, system-ui' }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="space-y-2 mt-1">
            {breakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs" style={{ color: 'rgba(10,10,10,0.55)' }}>{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-[#0A0A0A]">${item.value.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
