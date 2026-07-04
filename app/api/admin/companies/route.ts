import { NextRequest, NextResponse } from 'next/server'
import { getSession, AuthError } from '@/lib/supabase/get-session'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const session = await getSession()
    if (session.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('companies')
      .select('*, client_settings(*), vapi_assistants(count), vapi_phone_numbers(count)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (session.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, brand_color, support_email, booking_url } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'name and slug are required' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: companyRaw, error } = await admin
      .from('companies')
      .insert({ name, slug, brand_color: brand_color ?? '#6366f1', support_email, booking_url } as never)
      .select()
      .single()

    if (error) throw error
    const company = companyRaw as unknown as { id: string }

    await admin.from('client_settings').insert({
      company_id: company.id,
      feature_flags: { showCost: true, showTranscripts: true, showAudioPlayer: true, showStructuredData: true, showAnalytics: true },
      usage_limits: {},
      advanced_mode: false,
    } as never)

    return NextResponse.json(company, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
  }
}
