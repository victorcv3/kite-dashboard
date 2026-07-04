import { NextRequest, NextResponse } from 'next/server'
import { getSession, AuthError } from '@/lib/supabase/get-session'
import { listCalls } from '@/lib/vapi/client'
import { createClient } from '@/lib/supabase/server'
import { MOCK_ASSISTANT_IDS } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
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
    if (!assistantIds.length) return NextResponse.json([])

    const { searchParams } = request.nextUrl
    const calls = await listCalls({
      assistantIds,
      limit: Number(searchParams.get('limit') ?? 20),
      cursor: searchParams.get('cursor') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      successEvaluation: searchParams.get('successEvaluation') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    })

    return NextResponse.json(calls)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 })
  }
}
