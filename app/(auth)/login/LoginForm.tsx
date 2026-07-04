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
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const resetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type LoginForm = z.infer<typeof loginSchema>
type ResetForm = z.infer<typeof resetSchema>

export default function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<'login' | 'reset'>('login')
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) })

  async function handleLogin(data: LoginForm) {
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setError('Invalid email or password. Please try again.')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  async function handleReset(data: ResetForm) {
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/auth/callback`,
    })
    if (error) {
      setError(error.message)
      return
    }
    setResetSent(true)
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <Image src="/logo1.png" alt="Kite" width={80} height={46} className="object-contain" priority />
      </div>

      <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground mb-1">
          {mode === 'login' ? 'Sign in' : 'Reset password'}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === 'login' ? 'Welcome back to your dashboard' : 'Enter your email to receive a reset link'}
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                {...loginForm.register('email')}
                className={loginForm.formState.errors.email ? 'border-red-300' : ''}
              />
              {loginForm.formState.errors.email && (
                <p className="text-xs text-red-600">{loginForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => { setMode('reset'); setError(null) }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...loginForm.register('password')}
                className={loginForm.formState.errors.password ? 'border-red-300' : ''}
              />
              {loginForm.formState.errors.password && (
                <p className="text-xs text-red-600">{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-foreground text-background hover:bg-foreground/90 mt-2"
              disabled={loginForm.formState.isSubmitting}
            >
              {loginForm.formState.isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in…</>
              ) : 'Sign in'}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Access is by invitation only. Contact your administrator for access.
            </p>
          </form>
        )}

        {mode === 'reset' && !resetSent && (
          <form onSubmit={resetForm.handleSubmit(handleReset)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reset-email">Email address</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="you@company.com"
                {...resetForm.register('email')}
              />
              {resetForm.formState.errors.email && (
                <p className="text-xs text-red-600">{resetForm.formState.errors.email.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-foreground text-background hover:bg-foreground/90"
              disabled={resetForm.formState.isSubmitting}
            >
              {resetForm.formState.isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</>
              ) : 'Send reset link'}
            </Button>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null) }}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to sign in
            </button>
          </form>
        )}

        {mode === 'reset' && resetSent && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle className="w-10 h-10 text-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Check your email — we&apos;ve sent a password reset link.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setMode('login'); setResetSent(false) }}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
