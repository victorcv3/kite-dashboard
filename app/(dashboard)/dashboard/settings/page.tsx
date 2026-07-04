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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Building2, Palette } from 'lucide-react'
import { toast } from 'sonner'

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  support_email: z.string().email('Must be a valid email').or(z.literal('')).optional(),
  booking_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
})

const brandingSchema = z.object({
  brand_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
})

type CompanyForm = z.infer<typeof companySchema>
type BrandingForm = z.infer<typeof brandingSchema>

type CompanyRow = { id: string; name: string; brand_color: string; support_email: string | null; booking_url: string | null }

export default function SettingsPage() {
  const supabase = createClient()
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewColor, setPreviewColor] = useState('#6366f1')

  const companyForm = useForm<CompanyForm>({ resolver: zodResolver(companySchema) })
  const brandingForm = useForm<BrandingForm>({ resolver: zodResolver(brandingSchema) })

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
        setPreviewColor(comp.brand_color)
        companyForm.reset({
          name: comp.name,
          support_email: comp.support_email ?? '',
          booking_url: comp.booking_url ?? '',
        })
        brandingForm.reset({ brand_color: comp.brand_color })
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
      .update({ name: data.name, support_email: data.support_email ?? null, booking_url: data.booking_url ?? null } as never)
      .eq('id', companyId)
    if (error) toast.error('Failed to save')
    else toast.success('Company info saved')
  }

  async function saveBranding(data: BrandingForm) {
    if (!companyId) return
    const { error } = await supabase
      .from('companies')
      .update({ brand_color: data.brand_color } as never)
      .eq('id', companyId)
    if (error) toast.error('Failed to save')
    else toast.success('Branding saved')
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4 max-w-2xl">
      <PageHeader title="Settings" description="Manage your company profile and preferences" />

      <Tabs defaultValue="company">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="company" className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Company Info
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" />
            Branding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-4">
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
                <div className="space-y-1.5">
                  <Label>Support Email</Label>
                  <Input {...companyForm.register('support_email')} type="email" placeholder="support@yourcompany.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Booking URL</Label>
                  <Input {...companyForm.register('booking_url')} placeholder="https://calendly.com/…" />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={companyForm.formState.isSubmitting}>
                    {companyForm.formState.isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : 'Save changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-700">Brand Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={brandingForm.handleSubmit(saveBranding)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Brand Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={previewColor}
                      onChange={e => {
                        setPreviewColor(e.target.value)
                        brandingForm.setValue('brand_color', e.target.value)
                      }}
                      className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-1"
                    />
                    <Input
                      value={previewColor}
                      onChange={e => {
                        setPreviewColor(e.target.value)
                        brandingForm.setValue('brand_color', e.target.value)
                      }}
                      className="font-mono w-36"
                      maxLength={7}
                    />
                    <div className="flex-1 h-10 rounded-lg transition-colors" style={{ backgroundColor: previewColor }} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={brandingForm.formState.isSubmitting}>
                    {brandingForm.formState.isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : 'Save branding'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
