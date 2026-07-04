import { NextRequest, NextResponse } from 'next/server'
import { getSession, AuthError } from '@/lib/supabase/get-session'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (session.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('companies')
      .select('*, client_settings(*), vapi_assistants(*), vapi_phone_numbers(*), invites(*)')
      .eq('id', id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (session.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const admin = createAdminClient()

    const companyFields = ['name', 'slug', 'brand_color', 'support_email', 'booking_url', 'logo_url']
    const companyUpdate = Object.fromEntries(
      Object.entries(body).filter(([k]) => companyFields.includes(k))
    )

    if (Object.keys(companyUpdate).length > 0) {
      const { error } = await admin.from('companies').update(companyUpdate as never).eq('id', id)
      if (error) throw error
    }

    if (body.feature_flags !== undefined || body.usage_limits !== undefined || body.advanced_mode !== undefined) {
      const settingsUpdate = Object.fromEntries(
        Object.entries({
          feature_flags: body.feature_flags,
          usage_limits: body.usage_limits,
          advanced_mode: body.advanced_mode,
        }).filter(([, v]) => v !== undefined)
      )
      await admin.from('client_settings').upsert({ company_id: id, ...settingsUpdate } as never)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
  }
}
