import { Suspense } from 'react'
import { StatCard } from '@/components/dashboard/StatCard'
import { CallsByDayChart } from '@/components/dashboard/CallsByDayChart'
import { OutcomeChart } from '@/components/dashboard/OutcomeChart'
import { PeriodFilter } from '@/components/dashboard/PeriodFilter'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Timer, PhoneCall, DollarSign, TrendingUp } from 'lucide-react'
import { formatDuration, formatCostDisplay, formatDateTime, formatPhoneNumber } from '@/lib/utils'
import type { AnalyticsData, VapiCall } from '@/types/app'
import Link from 'next/link'
import { getSession } from '@/lib/supabase/get-session'
import { getAnalytics, listCalls } from '@/lib/vapi/client'
import { createClient } from '@/lib/supabase/server'
import { subDays } from 'date-fns'
import { MOCK_ASSISTANT_IDS } from '@/lib/mock-data'

type Period = 'today' | 'week' | 'month' | 'all'

function getDateRange(period: Period): { start: Date; end: Date } {
  const now = new Date()
  const rangeMap: Record<Period, Date> = {
    today: subDays(now, 1),
    week: subDays(now, 7),
    month: subDays(now, 30),
    all: subDays(now, 365),
  }
  return { start: rangeMap[period], end: now }
}

async function DashboardContent({ period }: { period: Period }) {
  const session = await getSession()
  const { profile } = session

  let assistantIds: string[]
  if (process.env.SKIP_AUTH === 'true') {
    assistantIds = MOCK_ASSISTANT_IDS
  } else {
    const supabase = await createClient()
    const { data: rows } = await supabase
      .from('vapi_assistants')
      .select('vapi_assistant_id')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
    assistantIds = (rows as unknown as Array<{ vapi_assistant_id: string }> | null)
      ?.map(r => r.vapi_assistant_id) ?? []
  }

  let analytics: AnalyticsData | null = null
  let recentCalls: VapiCall[] = []

  const { start, end } = getDateRange(period)

  try {
    ;[analytics, recentCalls] = await Promise.all([
      getAnalytics(assistantIds, start, end) as Promise<AnalyticsData>,
      listCalls({ assistantIds, limit: 8 }) as Promise<VapiCall[]>,
    ])
  } catch (err) {
    console.error('[dashboard] error:', err)
  }

  const p = analytics?.previousPeriod
  const totalMinutes = analytics ? Math.round(analytics.totalMinutes) : 0
  const prevMinutes = p ? Math.round((p.totalCalls / (analytics?.totalCalls || 1)) * (analytics?.totalMinutes || 0) * 0.85) : 0

  return (
    <div className="space-y-5">

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-[#0A0A0A]">Dashboard</h1>
          <p className="text-sm" style={{ color: 'rgba(10,10,10,0.40)' }}>
            Overview of your voice AI performance
          </p>
        </div>
        <Suspense>
          <PeriodFilter current={period} />
        </Suspense>
      </div>

      {/* Stat cards — 4 cols, Vapify style with colored icons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Call Minutes"
          value={totalMinutes}
          icon={Timer}
          iconBg="#eff6ff"
          iconColor="#3b82f6"
          current={totalMinutes}
          previous={prevMinutes}
        />
        <StatCard
          label="Number of Calls"
          value={analytics?.totalCalls ?? 0}
          icon={PhoneCall}
          iconBg="#f5f3ff"
          iconColor="#8b5cf6"
          current={analytics?.totalCalls}
          previous={p?.totalCalls}
        />
        <StatCard
          label="Total Spent"
          value={formatCostDisplay(analytics?.estimatedCost)}
          icon={DollarSign}
          iconBg="#ecfdf5"
          iconColor="#10b981"
          current={analytics?.estimatedCost}
          previous={p?.estimatedCost}
          positiveIsGood={false}
        />
        <StatCard
          label="Avg Cost per Call"
          value={analytics && analytics.totalCalls > 0
            ? `$${(analytics.estimatedCost / analytics.totalCalls).toFixed(2)}`
            : '$0.00'}
          icon={TrendingUp}
          iconBg="#fff7ed"
          iconColor="#f97316"
          current={analytics && analytics.totalCalls > 0 ? analytics.estimatedCost / analytics.totalCalls : undefined}
          previous={p && p.totalCalls > 0 ? (p as unknown as { estimatedCost: number }).estimatedCost / p.totalCalls : undefined}
          positiveIsGood={false}
        />
      </div>

      {/* Main content: chart (2/3) + outcomes (1/3) side by side — Vapify layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Calls over time — left 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[rgba(10,10,10,0.07)] p-6 shadow-[0_1px_4px_rgba(10,10,10,0.06)]">
          <div className="mb-1">
            <p className="text-[15px] font-semibold text-[#0A0A0A]">Call Volume Over Time</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(10,10,10,0.40)' }}>Performance overview</p>
          </div>
          <CallsByDayChart data={analytics?.callsByDay ?? []} />
        </div>

        {/* Call Outcomes — right 1/3 */}
        <div className="bg-white rounded-2xl border border-[rgba(10,10,10,0.07)] p-6 shadow-[0_1px_4px_rgba(10,10,10,0.06)]">
          <div className="mb-1">
            <p className="text-[15px] font-semibold text-[#0A0A0A]">Call Outcomes</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(10,10,10,0.40)' }}>Success vs unsuccessful calls</p>
          </div>
          <OutcomeChart
            data={analytics?.outcomeBreakdown ?? []}
            totalCalls={analytics?.totalCalls ?? 0}
            successfulCalls={analytics?.successfulCalls ?? 0}
          />
        </div>
      </div>

      {/* Recent Calls */}
      <div className="bg-white rounded-2xl border border-[rgba(10,10,10,0.07)] shadow-[0_1px_4px_rgba(10,10,10,0.06)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(10,10,10,0.06)]">
          <div>
            <p className="text-[15px] font-semibold text-[#0A0A0A]">Recent Calls</p>
            <p className="text-xs" style={{ color: 'rgba(10,10,10,0.40)' }}>Latest call activity</p>
          </div>
          <Link
            href="/dashboard/calls"
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] hover:bg-[rgba(10,10,10,0.04)] transition-colors"
          >
            View all →
          </Link>
        </div>
        {recentCalls.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: 'rgba(10,10,10,0.35)' }}>No calls yet</p>
        ) : (
          <div>
            {recentCalls.map((call, i) => (
              <Link
                key={call.id}
                href={`/dashboard/calls/${call.id}`}
                className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-[rgba(10,10,10,0.02)]"
                style={{ borderTop: i > 0 ? '1px solid rgba(10,10,10,0.04)' : undefined }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0A0A0A] truncate">
                    {formatPhoneNumber(call.customer?.number)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(10,10,10,0.40)' }}>
                    {call.assistant?.name} · {formatDateTime(call.startedAt ?? undefined)}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs" style={{ color: 'rgba(10,10,10,0.40)' }}>
                    {formatDuration(call.duration)}
                  </span>
                  <StatusBadge
                    status={call.status}
                    endedReason={call.endedReason}
                    successEvaluation={call.analysis?.successEvaluation}
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-72" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const params = await searchParams
  const valid = ['today', 'week', 'month', 'all'] as const
  const period = (valid.includes(params.period as Period) ? params.period : 'month') as Period

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent period={period} />
    </Suspense>
  )
}
