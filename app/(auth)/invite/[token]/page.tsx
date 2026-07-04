'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PhoneCall, Loader2, AlertCircle, XCircle } from 'lucide-react'

const schema = z.object({
  fullName: z.string().min(2, 'Please enter your full name'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

interface InviteData {
  email: string
  role: string
  company: { name: string }
  expired: boolean
  accepted: boolean
}

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const token = params.token as string

  const [invite, setInvite] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FormData>({ resolver: zodResolver(schema) })
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'VoiceDesk'

  useEffect(() => {
    fetch(`/api/admin/invite?token=${token}`)
      .then(r => r.json())
      .then(data => {
        setInvite(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load invitation')
        setLoading(false)
      })
  }, [token])

  async function handleSubmit(data: FormData) {
    setError(null)
    const res = await fetch('/api/admin/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, fullName: data.fullName, password: data.password }),
    })
    const result = await res.json()
    if (!res.ok) {
      setError(result.error ?? 'Failed to create account')
      return
    }
    // Sign in with the new credentials
    await supabase.auth.signInWithPassword({
      email: invite!.email,
      password: data.password,
    })
    router.push('/dashboard')
    router.refresh()
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md shadow-xl border-0 bg-white">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </CardContent>
      </Card>
    )
  }

  if (!invite || invite.expired || invite.accepted) {
    return (
      <Card className="w-full max-w-md shadow-xl border-0 bg-white">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <XCircle className="w-12 h-12 text-red-400" />
          <div className="text-center">
            <p className="font-semibold text-slate-800">Invitation not valid</p>
            <p className="text-sm text-slate-500 mt-1">
              {invite?.expired
                ? 'This invitation has expired. Please request a new one.'
                : invite?.accepted
                ? 'This invitation has already been used.'
                : 'Invitation not found.'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-0 bg-white">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
            <PhoneCall className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-slate-900">Join {invite.company.name}</CardTitle>
        <CardDescription>
          You&apos;ve been invited to {appName} as a{' '}
          <span className="font-medium">{invite.role.replace('company_', '')}</span>.
          <br />
          <span className="text-indigo-600 font-medium">{invite.email}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              placeholder="Jane Smith"
              {...form.register('fullName')}
              className={form.formState.errors.fullName ? 'border-red-300' : ''}
            />
            {form.formState.errors.fullName && (
              <p className="text-xs text-red-600">{form.formState.errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Create password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...form.register('password')}
              className={form.formState.errors.password ? 'border-red-300' : ''}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...form.register('confirmPassword')}
              className={form.formState.errors.confirmPassword ? 'border-red-300' : ''}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-red-600">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account…</>
            ) : 'Create account & sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
