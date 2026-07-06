export type UserRole = 'admin' | 'company_owner' | 'company_user'

export interface Company {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Profile {
  id: string
  company_id: string
  role: UserRole
  full_name: string | null
  created_at: string
}

export interface SessionData {
  user: { id: string; email: string }
  profile: Profile
  company: Company
}

// Vapi types
export interface VapiCall {
  id: string
  orgId: string
  createdAt: string
  updatedAt: string
  startedAt: string | null
  endedAt: string | null
  type: string
  status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended'
  endedReason?: string
  cost?: number
  costBreakdown?: Record<string, number> & { analysisCostBreakdown?: Record<string, number> }
  duration?: number
  assistant?: VapiAssistant
  assistantId?: string
  customer?: { number: string; name?: string }
  phoneNumber?: { id: string; number: string }
  analysis?: {
    summary?: string
    structuredData?: Record<string, unknown>
    successEvaluation?: string
  }
  artifact?: {
    recordingUrl?: string
    stereoRecordingUrl?: string
    messages?: VapiTranscriptMessage[]
  }
  metadata?: Record<string, unknown>
}

export interface VapiTranscriptMessage {
  // Real values from VAPI's artifact.messages — not 'assistant', it's 'bot'.
  role: 'system' | 'bot' | 'user' | 'tool_calls' | 'tool_call_result'
  message: string
  time: number
  endTime?: number
  secondsFromStart?: number
}

export interface VapiAssistant {
  id: string
  orgId: string
  name: string
  firstMessage?: string
  voicemailMessage?: string
  endCallMessage?: string
  voice?: {
    provider: string
    voiceId: string
  }
  model?: {
    provider: string
    model: string
  }
  metadata?: {
    businessHoursText?: string
    faqs?: string
    bookingLink?: string
    transferNumber?: string
    toneInstructions?: string
    [key: string]: unknown
  }
  createdAt: string
  updatedAt: string
}

export interface VapiPhoneNumber {
  id: string
  orgId: string
  number: string
  name?: string
  assistantId?: string | null
  provider: string
  status?: string
  createdAt: string
  updatedAt: string
}

export interface AnalyticsData {
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  avgDuration: number
  totalMinutes: number
  estimatedCost: number
  uniqueCallers: number
  callsByDay: { date: string; count: number; successful: number; failed: number }[]
  outcomeBreakdown: { name: string; value: number; color: string }[]
}

export interface DateRange {
  from: Date
  to: Date
}

export interface CallFilters {
  dateRange?: DateRange
  assistantId?: string
  status?: string
  successEvaluation?: string
  search?: string
  cursor?: string
}
