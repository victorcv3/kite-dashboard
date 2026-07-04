import { NextRequest, NextResponse } from 'next/server'
import { getSession, AuthError } from '@/lib/supabase/get-session'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params
    const session = await getSession()
    if (session.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const admin = createAdminClient()

    if (body.type === 'assistant') {
      const { vapi_assistant_id, display_name } = body
      if (!vapi_assistant_id || !display_name) {
        return NextResponse.json({ error: 'vapi_assistant_id and display_name required' }, { status: 400 })
      }
      const { data, error } = await admin
        .from('vapi_assistants')
        .upsert({ company_id: companyId, vapi_assistant_id, display_name } as never)
        .select()
        .single()
      if (error) throw error
      return NextResponse.json(data, { status: 201 })
    }

    if (body.type === 'phone_number') {
      const { vapi_phone_number_id, display_name } = body
      if (!vapi_phone_number_id) {
        return NextResponse.json({ error: 'vapi_phone_number_id required' }, { status: 400 })
      }
      const { data, error } = await admin
        .from('vapi_phone_numbers')
        .upsert({ company_id: companyId, vapi_phone_number_id, display_name } as never)
        .select()
        .single()
      if (error) throw error
      return NextResponse.json(data, { status: 201 })
    }

    return NextResponse.json({ error: 'type must be assistant or phone_number' }, { status: 400 })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Failed to assign resource' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params
    const session = await getSession()
    if (session.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const type = searchParams.get('type')
    const resourceId = searchParams.get('id')

    const admin = createAdminClient()

    if (type === 'assistant') {
      await admin.from('vapi_assistants').delete().eq('id', resourceId!).eq('company_id', companyId)
    } else if (type === 'phone_number') {
      await admin.from('vapi_phone_numbers').delete().eq('id', resourceId!).eq('company_id', companyId)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 })
  }
}
