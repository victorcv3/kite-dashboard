import { getSession } from '@/lib/supabase/get-session'
import { getAnalytics, listCalls, getPeriodRange, type Period } from '@/lib/vapi/client'
import { createClient } from '@/lib/supabase/server'
import { MOCK_ASSISTANT_IDS } from '@/lib/mock-data'
import type { AnalyticsData, VapiCall } from '@/types/app'
import { AnalyticsClient } from './AnalyticsClient'

export default async function AnalyticsPage({
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
  const [analytics, calls] = await Promise.all([
    getAnalytics(assistantIds, start, end) as Promise<AnalyticsData>,
    listCalls({ assistantIds, limit: 100, startDate: start, endDate: end }) as Promise<VapiCall[]>,
  ])

  return <AnalyticsClient analytics={analytics} calls={calls} period={period} />
}
