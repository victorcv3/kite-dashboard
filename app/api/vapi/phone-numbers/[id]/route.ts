import { NextRequest, NextResponse } from 'next/server'
import { getSession, AuthError } from '@/lib/supabase/get-session'
import { updatePhoneNumber } from '@/lib/vapi/client'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    const { profile } = session

    const supabase = await createClient()
    const { data: assignmentRaw } = await supabase
      .from('vapi_phone_numbers')
      .select('*')
      .eq('vapi_phone_number_id', id)
      .eq('company_id', profile.company_id)
      .single()

    if (!assignmentRaw) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const updated = await updatePhoneNumber(id, body)
    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Failed to update phone number' }, { status: 500 })
  }
}
