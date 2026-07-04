import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrendBadgeProps {
  value: number | null
  suffix?: string
  positiveIsGood?: boolean
}

export function TrendBadge({ value, suffix = '%', positiveIsGood = true }: TrendBadgeProps) {
  if (value === null) return null

  const isPositive = value > 0
  const isGood = positiveIsGood ? isPositive : !isPositive
  const isNeutral = value === 0

  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-xs font-medium',
      isNeutral ? 'text-slate-500' : isGood ? 'text-emerald-600' : 'text-red-500'
    )}>
      {isNeutral
        ? <Minus className="w-3 h-3" />
        : isPositive
        ? <TrendingUp className="w-3 h-3" />
        : <TrendingDown className="w-3 h-3" />
      }
      {isPositive && '+'}{value.toFixed(1)}{suffix}
    </span>
  )
}
