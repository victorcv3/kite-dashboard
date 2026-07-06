import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
