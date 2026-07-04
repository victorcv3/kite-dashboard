import { NextRequest, NextResponse } from 'next/server'
import { getSession, AuthError } from '@/lib/supabase/get-session'
import { getCall } from '@/lib/vapi/client'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    const { profile } = session

    const supabase = await createClient()
    const { data: assignments } = await supabase
      .from('vapi_assistants')
      .select('vapi_assistant_id')
      .eq('company_id', profile.company_id)

    const rows = assignments as unknown as Array<{ vapi_assistant_id: string }> | null
    const assistantIds = new Set(rows?.map(a => a.vapi_assistant_id) ?? [])

    const call = await getCall(id)
    if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 })

    const callData = call as { assistantId?: string }
    if (callData.assistantId && !assistantIds.has(callData.assistantId) && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(call)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Failed to fetch call' }, { status: 500 })
  }
}
