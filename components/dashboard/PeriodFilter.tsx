'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Period } from '@/lib/vapi/client'

export const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'max', label: 'Last 14 days' },
] as const

interface Props {
  current: Period
  // Omit to drive the period via the URL's `?period=` query param (server
  // pages re-fetch on navigation). Pass it when the parent is a client
  // component managing its own filter state instead (e.g. Calls page).
  onChange?: (period: Period) => void
}

export function PeriodFilter({ current, onChange }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleSelect(key: Period) {
    if (onChange) {
      onChange(key)
      return
    }
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', key)
    router.push(`${pathname}?${params.toString()}`)
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
