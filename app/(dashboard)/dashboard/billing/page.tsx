import { getSession } from '@/lib/supabase/get-session'
import { getAnalytics, VAPI_RETENTION_DAYS } from '@/lib/vapi/client'
import { createClient } from '@/lib/supabase/server'
import { MOCK_ASSISTANT_IDS } from '@/lib/mock-data'
import { subDays } from 'date-fns'
import type { AnalyticsData } from '@/types/app'
import { BillingClient } from './BillingClient'

export default async function BillingPage() {
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

  // VAPI's plan retention only covers the last 14 days — split that window in
  // half instead of a real month-over-month compare (a true "last month" range
  // falls entirely outside retention and would always read as zero).
  const now = new Date()
  const halfWindow = VAPI_RETENTION_DAYS / 2
  const [current, previous] = await Promise.all([
    getAnalytics(assistantIds, subDays(now, halfWindow), now) as Promise<AnalyticsData>,
    getAnalytics(assistantIds, subDays(now, VAPI_RETENTION_DAYS), subDays(now, halfWindow)) as Promise<AnalyticsData>,
  ])

  return <BillingClient current={current} previous={previous} />
}
