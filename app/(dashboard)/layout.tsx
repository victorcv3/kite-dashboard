import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import type { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type CompanyRow = Database['public']['Tables']['companies']['Row']

const MOCK_PROFILE = { id: 'mock-user', company_id: 'mock-company', role: 'admin', full_name: 'John Doe' } as unknown as ProfileRow
const MOCK_COMPANY = { id: 'mock-company', name: 'Acme Corp', brand_color: '#6366f1', logo_url: null } as unknown as CompanyRow

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (process.env.SKIP_AUTH === 'true') {
    return (
      <div
        className="flex h-screen overflow-hidden bg-slate-50"
        style={{ '--brand': '#6366f1' } as React.CSSProperties}
      >
        <Sidebar isAdmin={true} companyName="Acme Corp" brandColor="#6366f1" logoUrl={null} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar userEmail="john.doe@example.com" userName={MOCK_PROFILE.full_name} companyName="Acme Corp" />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profileRaw) redirect('/login')

  const profile = profileRaw as unknown as ProfileRow

  const { data: companyRaw } = await supabase
    .from('companies')
    .select('*')
    .eq('id', profile.company_id)
    .single()

  const company = companyRaw as unknown as CompanyRow | null
  const brandColor = company?.brand_color ?? '#6366f1'

  return (
    <div
      className="flex h-screen overflow-hidden bg-slate-50"
      style={{ '--brand': brandColor } as React.CSSProperties}
    >
      <Sidebar
        isAdmin={profile.role === 'admin'}
        companyName={company?.name ?? 'Dashboard'}
        brandColor={brandColor}
        logoUrl={company?.logo_url}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar
          userEmail={user.email ?? ''}
          userName={profile.full_name}
          companyName={company?.name ?? ''}
        />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
