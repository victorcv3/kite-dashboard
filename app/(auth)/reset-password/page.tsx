'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle } from 'lucide-react'

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FormData>({ resolver: zodResolver(schema) })

  async function handleSubmit(data: FormData) {
    setError(null)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      setError(error.message)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex justify-center mb-8">
        <Image src="/logo1.png" alt="Kite" width={80} height={46} className="object-contain" priority />
      </div>

      <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground mb-1">Set new password</h1>
        <p className="text-sm text-muted-foreground mb-6">Choose a new password for your account</p>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...form.register('password')}
              className={form.formState.errors.password ? 'border-red-300' : ''}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...form.register('confirmPassword')}
              className={form.formState.errors.confirmPassword ? 'border-red-300' : ''}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-red-600">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-foreground text-background hover:bg-foreground/90 mt-2"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating…</>
            ) : 'Update password'}
          </Button>
        </form>
      </div>
    </div>
  )
}
