import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import type { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type CompanyRow = Database['public']['Tables']['companies']['Row']

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (process.env.SKIP_AUTH === 'true') {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar isAdmin={true} companyName="Admin" brandColor="#6366f1" logoUrl={null} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar userEmail="demo@example.com" userName="Demo User" companyName="Admin" />
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

  if (profile.role !== 'admin') redirect('/dashboard')

  const { data: companyRaw } = await supabase
    .from('companies')
    .select('*')
    .eq('id', profile.company_id)
    .single()

  const company = companyRaw as unknown as CompanyRow | null

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        isAdmin={true}
        companyName={company?.name ?? 'Admin'}
        brandColor="#6366f1"
        logoUrl={company?.logo_url}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar
          userEmail={user.email ?? ''}
          userName={profile.full_name}
          companyName={company?.name ?? 'Admin'}
        />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
