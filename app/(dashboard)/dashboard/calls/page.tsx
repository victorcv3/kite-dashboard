'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { PhoneCall, Search, ChevronRight } from 'lucide-react'
import {
  formatDateTime, formatDuration, formatPhoneNumber
} from '@/lib/utils'
import type { VapiCall } from '@/types/app'
import type { Period } from '@/lib/vapi/client'
import { PeriodFilter } from '@/components/dashboard/PeriodFilter'

const OUTCOME_OPTIONS = [
  { key: 'all', label: 'All outcomes' },
  { key: 'true', label: 'Successful' },
  { key: 'false', label: 'Unsuccessful' },
] as const
const OUTCOME_LABELS: Record<string, string> = Object.fromEntries(OUTCOME_OPTIONS.map(o => [o.key, o.label]))

// Duration has no query-param support on VAPI's /call endpoint, so it
// filters client-side over whatever page of calls is already loaded.
const DURATION_OPTIONS = [
  { key: 'all', label: 'All durations' },
  { key: 'under-1', label: 'Under 1 min' },
  { key: '1-3', label: '1 – 3 min' },
  { key: '3-5', label: '3 – 5 min' },
  { key: 'over-5', label: 'Over 5 min' },
] as const
const DURATION_LABELS: Record<string, string> = Object.fromEntries(DURATION_OPTIONS.map(o => [o.key, o.label]))

function matchesDurationFilter(duration: number | undefined, bucket: string): boolean {
  const mins = (duration ?? 0) / 60
  switch (bucket) {
    case 'under-1': return mins < 1
    case '1-3': return mins >= 1 && mins <= 3
    case '3-5': return mins > 3 && mins <= 5
    case 'over-5': return mins > 5
    default: return true
  }
}

export default function CallsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [calls, setCalls] = useState<VapiCall[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [successFilter, setSuccessFilter] = useState('all')
  const [durationFilter, setDurationFilter] = useState('all')
  const [period, setPeriod] = useState<Period>('max')
  const cursorRef = useRef<string | null>(null)

  const fetchCalls = useCallback(async (reset = true) => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '25', period })
    if (search) params.set('search', search)
    if (successFilter !== 'all') params.set('successEvaluation', successFilter)
    if (!reset && cursorRef.current) params.set('cursor', cursorRef.current)

    try {
      const res = await fetch(`/api/vapi/calls?${params}`)
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()
      const list: VapiCall[] = Array.isArray(data) ? data : []
      setCalls(prev => reset ? list : [...prev, ...list])
      setHasMore(list.length === 25)
      cursorRef.current = list.length > 0 ? list[list.length - 1].createdAt ?? null : null
    } finally {
      setLoading(false)
    }
  }, [search, successFilter, period])

  useEffect(() => {
    cursorRef.current = null
    const t = setTimeout(() => fetchCalls(true), 300)
    return () => clearTimeout(t)
  }, [search, successFilter, period, fetchCalls])

  const filteredCalls = calls.filter(c => matchesDurationFilter(c.duration, durationFilter))
  const hasActiveFilters = search || successFilter !== 'all' || durationFilter !== 'all'
  function clearFilters() {
    setSearch('')
    setSuccessFilter('all')
    setDurationFilter('all')
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Calls"
        description="All incoming and outgoing voice calls"
        actions={<PeriodFilter current={period} onChange={setPeriod} />}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by phone number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select
          value={durationFilter}
          onValueChange={(value: string | null) => setDurationFilter(value ?? 'all')}
        >
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="Duration">
              {(value: string) => DURATION_LABELS[value] ?? 'Duration'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {DURATION_OPTIONS.map(o => (
              <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={successFilter}
          onValueChange={(value: string | null) => setSuccessFilter(value ?? 'all')}
        >
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="Outcome">
              {(value: string) => OUTCOME_LABELS[value] ?? 'Outcome'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {OUTCOME_OPTIONS.map(o => (
              <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-slate-500"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && calls.length === 0 ? (
          <LoadingSpinner />
        ) : filteredCalls.length === 0 ? (
          <EmptyState
            icon={PhoneCall}
            title="No calls found"
            description={
              hasActiveFilters
                ? 'Try adjusting your filters.'
                : 'Wait for your first call to come in.'
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Caller</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Name</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Date & Time</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Duration</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Outcome</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalls.map(call => (
                  <TableRow
                    key={call.id}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => router.push(`/dashboard/calls/${call.id}`)}
                  >
                    <TableCell className="text-sm font-medium text-slate-800">
                      {formatPhoneNumber(call.customer?.number)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {(call.analysis?.structuredData?.user_name as string | undefined) ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">
                      {formatDateTime(call.startedAt ?? undefined)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 tabular-nums">
                      {formatDuration(call.duration)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge successEvaluation={call.analysis?.successEvaluation} />
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {hasMore && (
              <div className="flex justify-center py-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchCalls(false)}
                  disabled={loading}
                >
                  {loading ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
