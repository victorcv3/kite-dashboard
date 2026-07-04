'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  formatDateTime, formatDuration, formatCost, formatPhoneNumber, endedReasonLabel
} from '@/lib/utils'
import type { VapiCall } from '@/types/app'

export default function CallsPage() {
  const router = useRouter()
  const [calls, setCalls] = useState<VapiCall[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [search, setSearch] = useState('')
  const [successFilter, setSuccessFilter] = useState('all')
  const cursorRef = useRef<string | null>(null)

  const fetchCalls = useCallback(async (reset = true) => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '25' })
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
  }, [search, successFilter])

  useEffect(() => {
    cursorRef.current = null
    const t = setTimeout(() => fetchCalls(true), 300)
    return () => clearTimeout(t)
  }, [search, successFilter, fetchCalls])

  return (
    <div className="space-y-4">
      <PageHeader title="Calls" description="All incoming and outgoing voice calls" />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by phone number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select
          value={successFilter}
          onValueChange={(value: string | null) => setSuccessFilter(value ?? 'all')}
        >
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Outcome" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All outcomes</SelectItem>
            <SelectItem value="true">Successful</SelectItem>
            <SelectItem value="false">Failed</SelectItem>
          </SelectContent>
        </Select>
        {(search || successFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(''); setSuccessFilter('all') }}
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
        ) : calls.length === 0 ? (
          <EmptyState
            icon={PhoneCall}
            title="No calls found"
            description="Try adjusting your filters or wait for your first call to come in."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Date & Time</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Caller</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Assistant</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Duration</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Outcome</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">End Reason</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Cost</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map(call => (
                  <TableRow
                    key={call.id}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => router.push(`/dashboard/calls/${call.id}`)}
                  >
                    <TableCell className="text-sm text-slate-700">
                      {formatDateTime(call.startedAt ?? undefined)}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-800">
                      {formatPhoneNumber(call.customer?.number)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{call.assistant?.name ?? '—'}</span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 tabular-nums">
                      {formatDuration(call.duration)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={call.status}
                        endedReason={call.endedReason}
                        successEvaluation={call.analysis?.successEvaluation}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {endedReasonLabel(call.endedReason)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500 tabular-nums">
                      {formatCost(call.cost)}
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
