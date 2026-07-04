import { NextRequest, NextResponse } from 'next/server'
import { getSession, AuthError } from '@/lib/supabase/get-session'
import { listAssistants } from '@/lib/vapi/client'
import { createClient } from '@/lib/supabase/server'
import { MOCK_ASSISTANT_IDS } from '@/lib/mock-data'

type AssignmentRow = { id: string; vapi_assistant_id: string; display_name: string; is_active: boolean; allowed_edit_fields: unknown }

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession()
    const { profile } = session

    let assignments: AssignmentRow[] | null
    let vapiIds: string[]

    if (process.env.SKIP_AUTH === 'true') {
      vapiIds = MOCK_ASSISTANT_IDS
      assignments = MOCK_ASSISTANT_IDS.map((id, i) => ({
        id: `mock-assignment-${i}`,
        vapi_assistant_id: id,
        display_name: '',
        is_active: true,
        allowed_edit_fields: null,
      }))
    } else {
      const supabase = await createClient()
      const { data: assignmentsRaw } = await supabase
        .from('vapi_assistants')
        .select('*')
        .eq('company_id', profile.company_id)

      assignments = assignmentsRaw as unknown as AssignmentRow[] | null
      vapiIds = assignments?.map(a => a.vapi_assistant_id) ?? []
    }
    if (!vapiIds.length) return NextResponse.json([])

    const assistants = await listAssistants(vapiIds)

    const merged = (assistants as Record<string, unknown>[]).map(a => {
      const assignment = assignments?.find(
        ass => ass.vapi_assistant_id === (a as { id: string }).id
      )
      return { ...a, _assignment: assignment }
    })

    return NextResponse.json(merged)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Failed to fetch assistants' }, { status: 500 })
  }
}
