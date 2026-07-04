export type UserRole = 'admin' | 'company_owner' | 'company_user'

export interface Company {
  id: string
  name: string
  slug: string
  logo_url: string | null
  brand_color: string
  support_email: string | null
  booking_url: string | null
  created_at: string
}

export interface Profile {
  id: string
  company_id: string
  role: UserRole
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface VapiAssignedAssistant {
  id: string
  company_id: string
  vapi_assistant_id: string
  display_name: string
  is_active: boolean
  allowed_edit_fields: string[]
  created_at: string
}

export interface VapiAssignedPhoneNumber {
  id: string
  company_id: string
  vapi_phone_number_id: string
  display_name: string | null
  is_active: boolean
  created_at: string
}

export interface ClientSettings {
  company_id: string
  feature_flags: FeatureFlags
  usage_limits: UsageLimits
  advanced_mode: boolean
}

export interface FeatureFlags {
  showCost?: boolean
  showTranscripts?: boolean
  showAudioPlayer?: boolean
  showStructuredData?: boolean
  showAnalytics?: boolean
}

export interface UsageLimits {
  maxCallsPerMonth?: number
  maxMinutesPerMonth?: number
}

export interface SessionData {
  user: { id: string; email: string }
  profile: Profile
  company: Company
  settings: ClientSettings | null
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
  costBreakdown?: Record<string, number>
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
    transcript?: string
    recordingUrl?: string
    stereoRecordingUrl?: string
    messages?: VapiTranscriptMessage[]
  }
  metadata?: Record<string, unknown>
}

export interface VapiTranscriptMessage {
  role: 'assistant' | 'user' | 'tool' | 'system'
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
  callsByDay: { date: string; count: number; successful: number; failed: number }[]
  outcomeBreakdown: { name: string; value: number; color: string }[]
  previousPeriod: {
    totalCalls: number
    successfulCalls: number
    avgDuration: number
    estimatedCost: number
  }
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
