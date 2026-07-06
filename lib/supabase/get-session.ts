import 'server-only'
import { createClient } from './server'
import type { SessionData } from '@/types/app'
import type { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type CompanyRow = Database['public']['Tables']['companies']['Row']

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

const MOCK_SESSION: SessionData = {
  user: { id: 'mock-user-id', email: 'john.doe@example.com' },
  profile: {
    id: 'mock-user-id',
    company_id: 'mock-company-id',
    role: 'admin',
    full_name: 'John Doe',
  } as SessionData['profile'],
  company: {
    id: 'mock-company-id',
    name: 'Acme Corp',
    slug: 'acme',
    created_at: new Date().toISOString(),
  } as SessionData['company'],
}

export async function getSession(): Promise<SessionData> {
  if (process.env.SKIP_AUTH === 'true') return MOCK_SESSION

  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new AuthError(401, 'Unauthorized')
  }

  const { data: profileRaw, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profileRaw) {
    throw new AuthError(401, 'Profile not found')
  }

  const profile = profileRaw as unknown as ProfileRow

  const { data: companyRaw, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', profile.company_id)
    .single()

  if (companyError || !companyRaw) {
    throw new AuthError(401, 'Company not found')
  }

  const company = companyRaw as unknown as CompanyRow

  return {
    user: { id: user.id, email: user.email! },
    profile: profile as SessionData['profile'],
    company: company as SessionData['company'],
  }
}
