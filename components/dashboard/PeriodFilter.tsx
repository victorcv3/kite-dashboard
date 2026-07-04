'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'all', label: 'All time' },
] as const

export function PeriodFilter({ current }: { current: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSelect(key: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', key)
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      {PERIODS.map(({ key, label }) => {
        const isActive = current === key
        return (
          <button
            key={key}
            onClick={() => handleSelect(key)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 border',
              isActive
                ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                : 'bg-white text-[rgba(10,10,10,0.55)] border-[rgba(10,10,10,0.12)] hover:border-[rgba(10,10,10,0.3)] hover:text-[#0A0A0A]'
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
