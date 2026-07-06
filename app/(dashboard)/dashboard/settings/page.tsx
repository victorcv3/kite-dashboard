'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
})

type CompanyForm = z.infer<typeof companySchema>

type CompanyRow = { id: string; name: string }

export default function SettingsPage() {
  const supabase = createClient()
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const companyForm = useForm<CompanyForm>({ resolver: zodResolver(companySchema) })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileRaw } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()
      const profile = profileRaw as unknown as { company_id: string } | null
      if (!profile) return

      const { data: companyRaw } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single()
      const comp = companyRaw as unknown as CompanyRow | null

      if (comp) {
        setCompanyId(comp.id)
        companyForm.reset({ name: comp.name })
      }
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function saveCompanyInfo(data: CompanyForm) {
    if (!companyId) return
    const { error } = await supabase
      .from('companies')
      .update({ name: data.name } as never)
      .eq('id', companyId)
    if (error) toast.error('Failed to save')
    else toast.success('Company info saved')
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4 max-w-2xl">
      <PageHeader title="Settings" description="Manage your company profile" />

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-700">Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={companyForm.handleSubmit(saveCompanyInfo)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Company Name</Label>
              <Input {...companyForm.register('name')} />
              {companyForm.formState.errors.name && (
                <p className="text-xs text-red-600">{companyForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={companyForm.formState.isSubmitting}>
                {companyForm.formState.isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : 'Save changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
