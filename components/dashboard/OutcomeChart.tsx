'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts'

interface OutcomeData {
  name: string
  value: number
  color: string
}

interface OutcomeChartProps {
  data: OutcomeData[]
  totalCalls?: number
  successfulCalls?: number
}

// Match Vapify colors exactly: green success, red unsuccessful
const VAPIFY_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#94a3b8']

export function OutcomeChart({ data, totalCalls = 0, successfulCalls = 0 }: OutcomeChartProps) {
  const isEmpty = !data.length || data.every(d => d.value === 0)
  const successRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0
  const failedCalls = totalCalls - successfulCalls

  // Remap colors to Vapify style
  const coloredData = data.map((d, i) => ({ ...d, color: VAPIFY_COLORS[i] ?? d.color }))

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'rgba(10,10,10,0.35)' }}>
        No data available
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Large donut with center label */}
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={coloredData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {coloredData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
            <Label
              content={({ viewBox }) => {
                const { cx, cy } = viewBox as { cx: number; cy: number }
                return (
                  <g>
                    <text x={cx} y={cy - 14} textAnchor="middle">
                      <tspan fontSize="12" fill="rgba(10,10,10,0.45)" fontFamily="Satoshi, system-ui" letterSpacing="0.05em">
                        Total Calls
                      </tspan>
                    </text>
                    <text x={cx} y={cy + 14} textAnchor="middle">
                      <tspan fontSize="32" fontWeight="700" fill="#0A0A0A" fontFamily="Satoshi, system-ui">
                        {totalCalls}
                      </tspan>
                    </text>
                  </g>
                )
              }}
            />
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid rgba(10,10,10,0.1)',
              borderRadius: '10px',
              fontSize: '12px',
              fontFamily: 'Satoshi, system-ui',
              boxShadow: '0 4px 12px -4px rgba(10,10,10,0.12)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Successful / Unsuccessful boxes — exact Vapify layout */}
      <div className="w-full grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 border border-[rgba(16,185,129,0.2)]" style={{ backgroundColor: 'rgba(16,185,129,0.07)' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span className="text-[11px] font-medium" style={{ color: 'rgba(10,10,10,0.50)' }}>Successful</span>
          </div>
          <p className="text-2xl font-bold text-[#0A0A0A] tracking-[-0.02em]">{successfulCalls}</p>
        </div>
        <div className="rounded-xl p-3 border border-[rgba(239,68,68,0.2)]" style={{ backgroundColor: 'rgba(239,68,68,0.07)' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
            <span className="text-[11px] font-medium" style={{ color: 'rgba(10,10,10,0.50)' }}>Unsuccessful</span>
          </div>
          <p className="text-2xl font-bold text-[#ef4444] tracking-[-0.02em]">{failedCalls}</p>
        </div>
      </div>

      {/* Success Rate bar */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: 'rgba(10,10,10,0.50)' }}>Success Rate</span>
          <span className="text-sm font-bold" style={{ color: '#10b981' }}>{successRate}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(10,10,10,0.07)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${successRate}%`, backgroundColor: '#10b981' }}
          />
        </div>
      </div>
    </div>
  )
}
