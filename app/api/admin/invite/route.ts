import { NextRequest, NextResponse } from 'next/server'
import { getSession, AuthError } from '@/lib/supabase/get-session'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type InviteRow = { email: string; role: string; expires_at: string; accepted_at: string | null; companies: { name: string } }

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const token = searchParams.get('token')

  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('invites')
    .select('email, role, expires_at, accepted_at, companies(name)')
    .eq('token', token)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })

  const row = data as unknown as InviteRow

  return NextResponse.json({
    email: row.email,
    role: row.role,
    company: row.companies,
    expired: new Date(row.expires_at) < new Date(),
    accepted: !!row.accepted_at,
  })
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const { profile } = session

    if (!['admin', 'company_owner'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email, role, company_id } = body

    const targetCompanyId = profile.role === 'admin' ? company_id : profile.company_id
    if (!targetCompanyId) return NextResponse.json({ error: 'company_id required' }, { status: 400 })
    if (!email || !role) return NextResponse.json({ error: 'email and role required' }, { status: 400 })

    const supabase = await createClient()
    const { data: inviteRaw, error } = await supabase
      .from('invites')
      .insert({ company_id: targetCompanyId, email, role } as never)
      .select()
      .single()

    if (error) throw error
    const invite = inviteRaw as unknown as { token: string }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const inviteUrl = `${appUrl}/invite/${invite.token}`

    return NextResponse.json({ invite, inviteUrl }, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }
}
