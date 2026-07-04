import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Building2, Users, Bot, Phone, Plus, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type CompanyRow = {
  id: string
  name: string
  slug: string
  brand_color: string
  created_at: string
  vapi_assistants: Array<{ count: number }>
  vapi_phone_numbers: Array<{ count: number }>
}

async function getAdminStats() {
  const admin = createAdminClient()

  const [
    { count: companyCount },
    { count: userCount },
    { count: assistantCount },
    { data: companiesRaw },
  ] = await Promise.all([
    admin.from('companies').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('vapi_assistants').select('*', { count: 'exact', head: true }),
    admin.from('companies')
      .select('id, name, slug, brand_color, created_at, vapi_assistants(count), vapi_phone_numbers(count)')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const companies = (companiesRaw ?? []) as unknown as CompanyRow[]

  return { companyCount, userCount, assistantCount, companies }
}

export default async function AdminPage() {
  const { companyCount, userCount, assistantCount, companies } = await getAdminStats()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Panel"
        description="Manage all client companies and their configurations"
        actions={
          <Link href="/admin/companies">
            <Button className="bg-indigo-600 hover:bg-indigo-700" size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              New Company
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Companies', value: companyCount ?? 0, icon: Building2, color: '#6366f1' },
          { label: 'Total Users', value: userCount ?? 0, icon: Users, color: '#22c55e' },
          { label: 'Assistants', value: assistantCount ?? 0, icon: Bot, color: '#f59e0b' },
          { label: 'Active', value: companyCount ?? 0, icon: Phone, color: '#06b6d4' },
        ].map(stat => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Companies table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">All Companies</h2>
          <Link href="/admin/companies">
            <Button variant="outline" size="sm" className="text-xs">Manage all</Button>
          </Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-xs font-semibold text-slate-500 uppercase">Company</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase">Slug</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase">Assistants</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase">Phone Numbers</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase">Created</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map(company => (
              <TableRow key={company.id} className="hover:bg-slate-50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md flex-shrink-0" style={{ backgroundColor: company.brand_color }} />
                    <span className="font-medium text-sm text-slate-800">{company.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">{company.slug}</Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {company.vapi_assistants?.[0]?.count ?? 0}
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {company.vapi_phone_numbers?.[0]?.count ?? 0}
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {formatDate(company.created_at)}
                </TableCell>
                <TableCell>
                  <Link href={`/admin/companies/${company.id}`}>
                    <Button variant="ghost" size="icon" className="w-7 h-7">
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
