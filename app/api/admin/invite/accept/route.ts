import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

type InviteRow = {
  id: string
  email: string
  company_id: string
  role: string
  expires_at: string
  accepted_at: string | null
}

export async function POST(request: NextRequest) {
  try {
    const { token, fullName, password } = await request.json()

    if (!token || !fullName || !password) {
      return NextResponse.json({ error: 'token, fullName, and password are required' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: inviteRaw, error: inviteError } = await admin
      .from('invites')
      .select('*')
      .eq('token', token)
      .single()

    if (inviteError || !inviteRaw) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    const invite = inviteRaw as unknown as InviteRow

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 })
    }
    if (invite.accepted_at) {
      return NextResponse.json({ error: 'Invite already accepted' }, { status: 409 })
    }

    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
      app_metadata: {
        company_id: invite.company_id,
        role: invite.role,
      },
      user_metadata: {
        full_name: fullName,
      },
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 422 })
    }

    await admin
      .from('invites')
      .update({ accepted_at: new Date().toISOString() } as never)
      .eq('id', invite.id)

    return NextResponse.json({ userId: newUser.user.id })
  } catch {
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
