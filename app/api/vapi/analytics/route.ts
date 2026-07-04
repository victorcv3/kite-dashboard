import { NextRequest, NextResponse } from 'next/server'
import { getSession, AuthError } from '@/lib/supabase/get-session'
import { getAnalytics } from '@/lib/vapi/client'
import { createClient } from '@/lib/supabase/server'
import { MOCK_ASSISTANT_IDS } from '@/lib/mock-data'
import { subDays } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const { profile } = session

    let assistantIds: string[]
    if (process.env.SKIP_AUTH === 'true') {
      assistantIds = MOCK_ASSISTANT_IDS
    } else {
      const supabase = await createClient()
      const { data: assignments } = await supabase
        .from('vapi_assistants')
        .select('vapi_assistant_id')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)

      const rows = assignments as unknown as Array<{ vapi_assistant_id: string }> | null
      assistantIds = rows?.map(a => a.vapi_assistant_id) ?? []
    }

    const body = await request.json().catch(() => ({}))
    const endDate = body.endDate ? new Date(body.endDate) : new Date()
    const startDate = body.startDate ? new Date(body.startDate) : subDays(endDate, 10)

    const data = await getAnalytics(assistantIds, startDate, endDate)
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('Analytics error:', err)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
