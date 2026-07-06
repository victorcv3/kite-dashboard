import { getSession } from '@/lib/supabase/get-session'
import { listCalls, getPeriodRange, type Period } from '@/lib/vapi/client'
import { createClient } from '@/lib/supabase/server'
import { MOCK_ASSISTANT_IDS } from '@/lib/mock-data'
import { PageHeader } from '@/components/shared/PageHeader'
import { PeriodFilter } from '@/components/dashboard/PeriodFilter'
import { EmptyState } from '@/components/shared/EmptyState'
import { CallerRow } from '@/components/callers/CallerRow'
import {
  Table, TableBody, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Users } from 'lucide-react'
import type { VapiCall } from '@/types/app'

interface CallerSummary {
  number: string
  name?: string
  callCount: number
  lastCallAt: string
  lastSuccessEvaluation?: string
}

function aggregateByCaller(calls: VapiCall[]): CallerSummary[] {
  const byNumber = new Map<string, CallerSummary>()

  for (const call of calls) {
    const number = call.customer?.number
    if (!number) continue

    const name = (call.analysis?.structuredData?.user_name as string | undefined) || call.customer?.name
    const existing = byNumber.get(number)

    if (!existing) {
      byNumber.set(number, {
        number,
        name,
        callCount: 1,
        lastCallAt: call.createdAt,
        lastSuccessEvaluation: call.analysis?.successEvaluation,
      })
      continue
    }

    existing.callCount += 1
    if (!existing.name && name) existing.name = name
    if (new Date(call.createdAt).getTime() > new Date(existing.lastCallAt).getTime()) {
      existing.lastCallAt = call.createdAt
      existing.lastSuccessEvaluation = call.analysis?.successEvaluation
    }
  }

  return Array.from(byNumber.values()).sort(
    (a, b) => new Date(b.lastCallAt).getTime() - new Date(a.lastCallAt).getTime()
  )
}

export default async function CallersPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const params = await searchParams
  const valid = ['today', 'week', 'max'] as const
  const period = (valid.includes(params.period as Period) ? params.period : 'max') as Period

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

  const { start, end } = getPeriodRange(period)
  const calls = assistantIds.length
    ? (await listCalls({ assistantIds, limit: 1000, startDate: start, endDate: end })) as VapiCall[]
    : []

  const callers = aggregateByCaller(calls)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Callers"
        description="Calls grouped by phone number — who's calling and how often"
        actions={<PeriodFilter current={period} />}
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {callers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No callers found"
            description="No calls in this period yet."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Caller</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Name</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Calls</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Last Call</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Last Outcome</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {callers.map(caller => (
                <CallerRow key={caller.number} {...caller} />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
