import { NextRequest, NextResponse } from 'next/server'
import { getSession, AuthError } from '@/lib/supabase/get-session'
import { listPhoneNumbers } from '@/lib/vapi/client'
import { createClient } from '@/lib/supabase/server'
import { MOCK_PHONE_IDS } from '@/lib/mock-data'

type PhoneRow = { id: string; vapi_phone_number_id: string; display_name: string | null; is_active: boolean }

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession()
    const { profile } = session

    let assignments: PhoneRow[] | null
    let vapiIds: string[]

    if (process.env.SKIP_AUTH === 'true') {
      vapiIds = MOCK_PHONE_IDS
      assignments = MOCK_PHONE_IDS.map((id, i) => ({
        id: `mock-phone-assignment-${i}`,
        vapi_phone_number_id: id,
        display_name: null,
        is_active: true,
      }))
    } else {
      const supabase = await createClient()
      const { data: assignmentsRaw } = await supabase
        .from('vapi_phone_numbers')
        .select('*')
        .eq('company_id', profile.company_id)

      assignments = assignmentsRaw as unknown as PhoneRow[] | null
      vapiIds = assignments?.map(a => a.vapi_phone_number_id) ?? []
    }
    if (!vapiIds.length) return NextResponse.json([])

    const numbers = await listPhoneNumbers(vapiIds)

    const merged = (numbers as Record<string, unknown>[]).map(n => {
      const assignment = assignments?.find(
        a => a.vapi_phone_number_id === (n as { id: string }).id
      )
      return { ...n, _assignment: assignment }
    })

    return NextResponse.json(merged)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Failed to fetch phone numbers' }, { status: 500 })
  }
}
