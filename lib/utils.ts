import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number | undefined): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatMinutes(seconds: number | undefined): string {
  if (!seconds) return '0 min'
  const min = (seconds / 60).toFixed(1)
  return `${min} min`
}

export function formatCost(cost: number | undefined): string {
  if (cost === undefined || cost === null) return '—'
  return `$${cost.toFixed(4)}`
}

export function formatCostDisplay(cost: number | undefined): string {
  if (cost === undefined || cost === null) return '—'
  return `$${cost.toFixed(2)}`
}

export function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function formatPhoneNumber(number: string | undefined): string {
  if (!number) return '—'
  const cleaned = number.replace(/\D/g, '')
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  return number
}

export function endedReasonLabel(reason: string | undefined): string {
  if (!reason) return '—'
  const map: Record<string, string> = {
    'assistant-ended-call': 'Completed',
    'customer-ended-call': 'Customer hung up',
    'assistant-forwarded-call': 'Forwarded',
    'max-duration-exceeded': 'Max duration',
    'voicemail': 'Voicemail',
    'silence-timed-out': 'Silence timeout',
    'assistant-error': 'Assistant error',
    'pipeline-error': 'System error',
    'customer-did-not-answer': 'No answer',
    'no-answer': 'No answer',
    'customer-busy': 'Busy',
    'exceeded-max-duration': 'Max duration',
  }
  return map[reason] ?? reason.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null
  return ((current - previous) / previous) * 100
}

export function isAdmin(role: string): boolean {
  return role === 'admin'
}
