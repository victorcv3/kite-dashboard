'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, Plus, Trash2, Send, Copy, Check } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { formatDate, formatPhoneNumber } from '@/lib/utils'

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['company_owner', 'company_user']),
})

const assignAssistantSchema = z.object({
  vapi_assistant_id: z.string().min(1),
  display_name: z.string().min(1),
})

const assignPhoneSchema = z.object({
  vapi_phone_number_id: z.string().min(1),
  display_name: z.string().optional(),
})

type CompanyDetail = {
  id: string; name: string; slug: string; brand_color: string;
  client_settings: {
    feature_flags: Record<string, boolean>;
    usage_limits: Record<string, number>;
    advanced_mode: boolean
  } | null;
  vapi_assistants: Array<{ id: string; vapi_assistant_id: string; display_name: string; is_active: boolean }>;
  vapi_phone_numbers: Array<{ id: string; vapi_phone_number_id: string; display_name: string | null }>;
  invites: Array<{ id: string; email: string; role: string; expires_at: string; accepted_at: string | null }>;
}

export default function AdminCompanyDetailPage() {
  const params = useParams()
  const companyId = params.id as string

  const [company, setCompany] = useState<CompanyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [showAssistant, setShowAssistant] = useState(false)
  const [showPhone, setShowPhone] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  const inviteForm = useForm({ resolver: zodResolver(inviteSchema), defaultValues: { email: '', role: 'company_user' as const } })
  const assistantForm = useForm({ resolver: zodResolver(assignAssistantSchema), defaultValues: { vapi_assistant_id: '', display_name: '' } })
  const phoneForm = useForm({ resolver: zodResolver(assignPhoneSchema), defaultValues: { vapi_phone_number_id: '', display_name: '' } })

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/companies/${companyId}`)
    if (res.ok) setCompany(await res.json())
    setLoading(false)
  }, [companyId])

  useEffect(() => { load() }, [load])

  async function sendInvite(data: { email: string; role: 'company_owner' | 'company_user' }) {
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, company_id: companyId }),
    })
    const result = await res.json()
    if (!res.ok) { toast.error(result.error); return }
    setInviteUrl(result.inviteUrl)
    inviteForm.reset()
  }

  async function assignAssistant(data: { vapi_assistant_id: string; display_name: string }) {
    const res = await fetch(`/api/admin/companies/${companyId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'assistant', ...data }),
    })
    if (!res.ok) { toast.error('Failed to assign assistant'); return }
    toast.success('Assistant assigned')
    setShowAssistant(false)
    assistantForm.reset()
    load()
  }

  async function assignPhone(data: { vapi_phone_number_id: string; display_name?: string }) {
    const res = await fetch(`/api/admin/companies/${companyId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'phone_number', ...data }),
    })
    if (!res.ok) { toast.error('Failed to assign number'); return }
    toast.success('Phone number assigned')
    setShowPhone(false)
    phoneForm.reset()
    load()
  }

  async function removeAssistant(id: string) {
    await fetch(`/api/admin/companies/${companyId}/assign?type=assistant&id=${id}`, { method: 'DELETE' })
    load()
  }

  async function removePhone(id: string) {
    await fetch(`/api/admin/companies/${companyId}/assign?type=phone_number&id=${id}`, { method: 'DELETE' })
    load()
  }

  async function saveFeatureFlags(flags: Record<string, boolean>) {
    setSaving(true)
    await fetch(`/api/admin/companies/${companyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature_flags: flags }),
    })
    setSaving(false)
    toast.success('Saved')
  }

  async function copyInviteUrl() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <LoadingSpinner />
  if (!company) return <p className="text-slate-500">Company not found</p>

  const flags = company.client_settings?.feature_flags ?? {}

  const featureList = [
    { key: 'showAnalytics', label: 'Analytics dashboard' },
    { key: 'showCost', label: 'Show call costs' },
    { key: 'showTranscripts', label: 'Transcripts' },
    { key: 'showAudioPlayer', label: 'Audio recordings' },
    { key: 'showStructuredData', label: 'Extracted data' },
  ]

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/companies">
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md" style={{ backgroundColor: company.brand_color }} />
          <h1 className="text-lg font-bold text-slate-900">{company.name}</h1>
          <Badge variant="outline" className="font-mono text-xs">{company.slug}</Badge>
        </div>
      </div>

      <Tabs defaultValue="assistants">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="assistants">Assistants</TabsTrigger>
          <TabsTrigger value="phones">Phone Numbers</TabsTrigger>
          <TabsTrigger value="invites">Users & Invites</TabsTrigger>
          <TabsTrigger value="features">Feature Flags</TabsTrigger>
        </TabsList>

        {/* Assistants */}
        <TabsContent value="assistants" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowAssistant(true)}>
              <Plus className="w-4 h-4 mr-1.5" />Assign Assistant
            </Button>
          </div>
          {company.vapi_assistants.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No assistants assigned</p>
          ) : (
            <div className="space-y-2">
              {company.vapi_assistants.map(a => (
                <Card key={a.id} className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-slate-800">{a.display_name}</p>
                      <p className="text-xs text-slate-400 font-mono">{a.vapi_assistant_id}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-red-400 hover:text-red-600" onClick={() => removeAssistant(a.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Phone Numbers */}
        <TabsContent value="phones" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowPhone(true)}>
              <Plus className="w-4 h-4 mr-1.5" />Assign Number
            </Button>
          </div>
          {company.vapi_phone_numbers.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No phone numbers assigned</p>
          ) : (
            <div className="space-y-2">
              {company.vapi_phone_numbers.map(p => (
                <Card key={p.id} className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-slate-800">{p.display_name ?? 'Unnamed'}</p>
                      <p className="text-xs text-slate-400 font-mono">{formatPhoneNumber(p.vapi_phone_number_id)}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-red-400 hover:text-red-600" onClick={() => removePhone(p.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Invites */}
        <TabsContent value="invites" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowInvite(true)}>
              <Send className="w-4 h-4 mr-1.5" />Send Invite
            </Button>
          </div>
          {company.invites.map(invite => (
            <Card key={invite.id} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-slate-800">{invite.email}</p>
                  <p className="text-xs text-slate-400">
                    {invite.role} · {invite.accepted_at ? 'Accepted' : `Expires ${formatDate(invite.expires_at)}`}
                  </p>
                </div>
                <Badge className={invite.accepted_at
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
                }>
                  {invite.accepted_at ? 'Joined' : 'Pending'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Feature Flags */}
        <TabsContent value="features" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-700">Feature Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {featureList.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-sm text-slate-700">{label}</Label>
                  <Switch
                    checked={!!(flags as Record<string, boolean>)[key]}
                    onCheckedChange={checked => {
                      const updated = { ...flags, [key]: checked }
                      saveFeatureFlags(updated as Record<string, boolean>)
                    }}
                    disabled={saving}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite dialog */}
      <Dialog open={showInvite} onOpenChange={open => { setShowInvite(open); if (!open) { setInviteUrl(null); inviteForm.reset() } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
          {inviteUrl ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Invite created! Share this link with the user:</p>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <code className="text-xs text-slate-700 flex-1 break-all">{inviteUrl}</code>
                <Button variant="ghost" size="icon" className="w-8 h-8 flex-shrink-0" onClick={copyInviteUrl}>
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Button className="w-full" variant="outline" onClick={() => { setInviteUrl(null); inviteForm.reset() }}>
                Send another
              </Button>
            </div>
          ) : (
            <form onSubmit={inviteForm.handleSubmit(sendInvite)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input {...inviteForm.register('email')} type="email" placeholder="user@company.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <select {...inviteForm.register('role')} className="w-full h-9 rounded-md border border-slate-200 px-3 text-sm">
                  <option value="company_user">User</option>
                  <option value="company_owner">Owner</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowInvite(false)}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={inviteForm.formState.isSubmitting}>
                  {inviteForm.formState.isSubmitting ? 'Sending…' : 'Create invite'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign assistant dialog */}
      <Dialog open={showAssistant} onOpenChange={setShowAssistant}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Assign Assistant</DialogTitle></DialogHeader>
          <form onSubmit={assistantForm.handleSubmit(assignAssistant)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Vapi Assistant ID</Label>
              <Input {...assistantForm.register('vapi_assistant_id')} placeholder="asst_…" className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>Display Name</Label>
              <Input {...assistantForm.register('display_name')} placeholder="Appointment Scheduler" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowAssistant(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Assign</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign phone dialog */}
      <Dialog open={showPhone} onOpenChange={setShowPhone}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Assign Phone Number</DialogTitle></DialogHeader>
          <form onSubmit={phoneForm.handleSubmit(assignPhone)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Vapi Phone Number ID</Label>
              <Input {...phoneForm.register('vapi_phone_number_id')} placeholder="pn_…" className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>Display Name (optional)</Label>
              <Input {...phoneForm.register('display_name')} placeholder="Main Inbound Line" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowPhone(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Assign</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
