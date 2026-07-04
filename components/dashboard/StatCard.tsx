import { LucideIcon } from 'lucide-react'
import { percentChange } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  iconBg?: string
  iconColor?: string
  current?: number
  previous?: number
  positiveIsGood?: boolean
}

export function StatCard({
  label, value, icon: Icon,
  iconBg = '#eff6ff', iconColor = '#3b82f6',
  current, previous, positiveIsGood = true
}: StatCardProps) {
  const trend = current !== undefined && previous !== undefined
    ? percentChange(current, previous)
    : null

  const isPositive = trend !== null && trend > 0
  const isGood = trend !== null ? (positiveIsGood ? isPositive : !isPositive) : null

  return (
    <div className="bg-white rounded-2xl border border-[rgba(10,10,10,0.07)] p-5 flex flex-col gap-3 shadow-[0_1px_4px_rgba(10,10,10,0.06)]">
      {/* Top row: icon + trend */}
      <div className="flex items-start justify-between">
        {/* Colored icon square */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="w-5 h-5" strokeWidth={1.8} style={{ color: iconColor }} />
        </div>

        {/* Trend badge top-right */}
        {trend !== null && (
          <div
            className="flex items-center gap-0.5 text-xs font-semibold"
            style={{ color: isGood ? '#10b981' : '#ef4444' }}
          >
            {isPositive
              ? <TrendingUp className="w-3 h-3" strokeWidth={2} />
              : <TrendingDown className="w-3 h-3" strokeWidth={2} />
            }
            {isPositive ? '+' : ''}{trend.toFixed(1)}%
          </div>
        )}
      </div>

      {/* Value + label */}
      <div>
        <p className="text-[1.9rem] font-bold tracking-[-0.03em] leading-none text-[#0A0A0A]">
          {value}
        </p>
        <p className="text-xs mt-1.5" style={{ color: 'rgba(10,10,10,0.45)' }}>
          {label}
        </p>
        {trend !== null && (
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(10,10,10,0.30)' }}>
            vs last period
          </p>
        )}
      </div>
    </div>
  )
}
