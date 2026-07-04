'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Plus, ChevronRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

const createSchema = z.object({
  name: z.string().min(1, 'Company name required'),
  slug: z.string().min(1, 'Slug required').regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
  brand_color: z.string().min(1),
  support_email: z.string().email().or(z.literal('')).optional(),
})

type CreateForm = z.infer<typeof createSchema>

type CompanyListItem = {
  id: string
  name: string
  slug: string
  brand_color: string
  created_at: string
  vapi_assistants?: [{ count: number }]
  vapi_phone_numbers?: [{ count: number }]
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { brand_color: '#6366f1', name: '', slug: '', support_email: '' },
  })

  useEffect(() => {
    fetch('/api/admin/companies')
      .then(r => r.json())
      .then(data => { setCompanies(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleCreate(data: CreateForm) {
    const res = await fetch('/api/admin/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      toast.error(result.error ?? 'Failed to create company')
      return
    }
    setCompanies(prev => [result, ...prev])
    setShowCreate(false)
    form.reset({ brand_color: '#6366f1', name: '', slug: '', support_email: '' })
    toast.success('Company created successfully')
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Companies"
        description="All client companies in your system"
        actions={
          <Button className="bg-indigo-600 hover:bg-indigo-700" size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Company
          </Button>
        }
      />

      {loading ? <LoadingSpinner /> : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Company</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Slug</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Assistants</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Numbers</TableHead>
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
                  <TableCell><Badge variant="outline" className="font-mono text-xs">{company.slug}</Badge></TableCell>
                  <TableCell className="text-sm text-slate-600">{company.vapi_assistants?.[0]?.count ?? 0}</TableCell>
                  <TableCell className="text-sm text-slate-600">{company.vapi_phone_numbers?.[0]?.count ?? 0}</TableCell>
                  <TableCell className="text-sm text-slate-500">{formatDate(company.created_at)}</TableCell>
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
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create New Company</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Company Name</Label>
              <Input {...form.register('name')} placeholder="Acme Corp" />
              {form.formState.errors.name && <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input
                {...form.register('slug')}
                placeholder="acme-corp"
                onChange={e => form.setValue('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              />
              {form.formState.errors.slug && <p className="text-xs text-red-600">{form.formState.errors.slug.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Brand Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  {...form.register('brand_color')}
                  className="w-9 h-9 rounded border border-slate-200 cursor-pointer p-1"
                />
                <Input {...form.register('brand_color')} className="font-mono w-32" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Support Email (optional)</Label>
              <Input {...form.register('support_email')} type="email" placeholder="support@acme.com" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating…' : 'Create company'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
