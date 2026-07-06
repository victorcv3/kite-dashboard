import type { VapiCall, VapiAssistant, VapiPhoneNumber, AnalyticsData, VapiTranscriptMessage } from '@/types/app'
import { subDays, format, addMinutes } from 'date-fns'

// ─── Assistants ────────────────────────────────────────────────────────────────

export const MOCK_ASSISTANTS: VapiAssistant[] = [
  {
    id: 'asst_demo_001',
    orgId: 'org_demo',
    name: 'Appointment Scheduler',
    firstMessage: "Hi! Thanks for calling. I'm here to help schedule your appointment. What day works best for you?",
    voicemailMessage: "Hi, we missed your call. Please call us back and we'll be happy to help schedule your appointment.",
    endCallMessage: "Great, your appointment is confirmed. See you then, have a wonderful day!",
    voice: { provider: 'elevenlabs', voiceId: 'rachel' },
    model: { provider: 'openai', model: 'gpt-4o' },
    metadata: {
      businessHoursText: 'Monday through Friday, 9 AM to 5 PM Eastern Time.',
      faqs: 'Q: How long are appointments? A: Usually 30-60 minutes.\nQ: Can I reschedule? A: Yes, call us 24 hours before.',
      bookingLink: 'https://example.com/book',
      transferNumber: '+14155551234',
      toneInstructions: 'Be warm, professional, and efficient. Always confirm details before ending the call.',
    },
    createdAt: subDays(new Date(), 90).toISOString(),
    updatedAt: subDays(new Date(), 2).toISOString(),
  },
  {
    id: 'asst_demo_002',
    orgId: 'org_demo',
    name: 'Customer Support',
    firstMessage: "Hello! You've reached customer support. How can I assist you today?",
    voicemailMessage: "Hi, you've reached our support team. Please leave a message and we'll call back within 2 hours.",
    endCallMessage: "Thank you for contacting us. Is there anything else I can help you with before we go?",
    voice: { provider: 'elevenlabs', voiceId: 'adam' },
    model: { provider: 'openai', model: 'gpt-4o' },
    metadata: {
      businessHoursText: 'Available 24/7 for urgent support. General inquiries Monday-Friday 8 AM to 8 PM.',
      faqs: 'Q: What is your return policy? A: 30-day full refund.\nQ: How do I track my order? A: Use the link in your confirmation email.',
      bookingLink: '',
      transferNumber: '+14155559876',
      toneInstructions: 'Be empathetic and solution-focused. Always apologize for any inconvenience first.',
    },
    createdAt: subDays(new Date(), 60).toISOString(),
    updatedAt: subDays(new Date(), 5).toISOString(),
  },
  {
    id: 'asst_demo_003',
    orgId: 'org_demo',
    name: 'Sales Qualifier',
    firstMessage: "Hi there! I'm calling to learn more about your needs and see how we might be able to help. Do you have a moment?",
    voicemailMessage: "Hi, this is a call from our team. We'd love to learn about your needs. Please call us back!",
    endCallMessage: "Fantastic! I've noted everything down. A team member will follow up with you shortly.",
    voice: { provider: 'elevenlabs', voiceId: 'bella' },
    model: { provider: 'openai', model: 'gpt-4o' },
    metadata: {
      businessHoursText: 'Sales team available Monday-Friday 8 AM to 7 PM.',
      faqs: 'Q: How long does onboarding take? A: Typically 2-4 weeks.\nQ: Do you offer trials? A: Yes, 14-day free trial.',
      bookingLink: 'https://example.com/demo',
      transferNumber: '+14155554321',
      toneInstructions: 'Be enthusiastic but not pushy. Focus on understanding the prospect needs before pitching.',
    },
    createdAt: subDays(new Date(), 45).toISOString(),
    updatedAt: subDays(new Date(), 1).toISOString(),
  },
]

// ─── Phone Numbers ─────────────────────────────────────────────────────────────

export const MOCK_PHONE_NUMBERS: VapiPhoneNumber[] = [
  {
    id: 'pn_demo_001',
    orgId: 'org_demo',
    number: '+14155550101',
    name: 'Main Inbound Line',
    assistantId: 'asst_demo_001',
    provider: 'twilio',
    status: 'active',
    createdAt: subDays(new Date(), 90).toISOString(),
    updatedAt: subDays(new Date(), 2).toISOString(),
  },
  {
    id: 'pn_demo_002',
    orgId: 'org_demo',
    number: '+14155550202',
    name: 'Support Line',
    assistantId: 'asst_demo_002',
    provider: 'twilio',
    status: 'active',
    createdAt: subDays(new Date(), 60).toISOString(),
    updatedAt: subDays(new Date(), 10).toISOString(),
  },
  {
    id: 'pn_demo_003',
    orgId: 'org_demo',
    number: '+14155550303',
    name: 'Sales Outbound',
    assistantId: 'asst_demo_003',
    provider: 'twilio',
    status: 'active',
    createdAt: subDays(new Date(), 45).toISOString(),
    updatedAt: subDays(new Date(), 5).toISOString(),
  },
]

// ─── Calls ─────────────────────────────────────────────────────────────────────

const CALLER_NUMBERS = [
  '+14082221111', '+17142223333', '+16505554444', '+13105556666',
  '+12125557777', '+18185558888', '+14154449999', '+19494440000',
  '+14084441122', '+17144443344',
]

const END_REASONS = [
  'assistant-ended-call', 'customer-ended-call', 'assistant-forwarded-call',
  'max-duration-exceeded', 'voicemail', 'silence-timed-out',
]

const SUMMARIES = [
  "The caller requested an appointment for next Tuesday at 2 PM. Successfully scheduled and confirmed. Caller provided their email for reminder.",
  "Customer called about a billing discrepancy on their account. Issue was identified and escalated to the billing team. Follow-up expected within 24 hours.",
  "Prospective client inquired about enterprise pricing. Qualified as a hot lead with budget authority. Demo scheduled for Thursday at 3 PM.",
  "Caller wanted to reschedule their existing appointment. New time set for Friday at 10 AM. Previous slot released.",
  "Customer reported a technical issue with their account login. Walked through troubleshooting steps. Issue resolved during the call.",
  "Voicemail left for customer regarding their pending order. No live contact made.",
  "Sales call to follow up on submitted demo request. Customer expressed strong interest. Pricing proposal to be sent via email.",
  "Customer called to cancel their subscription. Retention attempt made with discount offer. Customer agreed to stay for 3 more months.",
]

const STRUCTURED_DATA_EXAMPLES = [
  { appointmentDate: '2025-05-20', appointmentTime: '14:00', patientName: 'John Smith', reason: 'Annual checkup', confirmed: true },
  { issueType: 'billing', ticketNumber: 'TKT-4892', priority: 'medium', resolution: 'escalated', estimatedResolution: '24h' },
  { leadScore: 8, companySize: '50-200', budget: '$5000-$10000', timeline: 'Q3 2025', decision_maker: true },
  { rescheduled: true, newDate: '2025-05-23', newTime: '10:00', originalDate: '2025-05-20' },
]

function generateMockCall(index: number, daysAgo: number): VapiCall {
  const assistantIdx = index % 3
  const assistant = MOCK_ASSISTANTS[assistantIdx]
  const isSuccessful = Math.random() > 0.3
  const isVoicemail = !isSuccessful && Math.random() > 0.5
  const duration = isVoicemail ? 30 + Math.floor(Math.random() * 30) : 90 + Math.floor(Math.random() * 300)
  const startedAt = subDays(new Date(), daysAgo)
  startedAt.setHours(9 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60))
  const endedAt = addMinutes(startedAt, Math.ceil(duration / 60))
  const cost = (duration / 60) * 0.05 + Math.random() * 0.02

  const endedReason = isVoicemail ? 'voicemail' : (
    isSuccessful
      ? (Math.random() > 0.2 ? 'assistant-ended-call' : 'customer-ended-call')
      : END_REASONS[Math.floor(Math.random() * END_REASONS.length)]
  )

  const summaryIdx = index % SUMMARIES.length
  const structuredDataIdx = index % STRUCTURED_DATA_EXAMPLES.length

  const messages = isVoicemail ? undefined : generateMockMessages(duration)

  return {
    id: `call_demo_${String(index).padStart(4, '0')}`,
    orgId: 'org_demo',
    createdAt: startedAt.toISOString(),
    updatedAt: endedAt.toISOString(),
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    type: 'inboundPhoneCall',
    status: 'ended',
    endedReason,
    cost,
    costBreakdown: {
      llm: cost * 0.4,
      stt: cost * 0.3,
      tts: cost * 0.2,
      vapi: cost * 0.1,
    },
    duration,
    assistant: { ...assistant },
    assistantId: assistant.id,
    customer: {
      number: CALLER_NUMBERS[index % CALLER_NUMBERS.length],
      name: isSuccessful ? `Customer ${index + 1}` : undefined,
    },
    phoneNumber: {
      id: MOCK_PHONE_NUMBERS[assistantIdx].id,
      number: MOCK_PHONE_NUMBERS[assistantIdx].number,
    },
    analysis: isVoicemail ? undefined : {
      summary: SUMMARIES[summaryIdx],
      structuredData: isSuccessful ? STRUCTURED_DATA_EXAMPLES[structuredDataIdx] : undefined,
      successEvaluation: isSuccessful ? 'true' : 'false',
    },
    artifact: {
      recordingUrl: isSuccessful ? `https://storage.vapi.ai/recordings/demo_${index}.wav` : undefined,
      messages,
    },
  }
}

// Mirrors VAPI's real artifact.messages shape ('bot'/'user' roles, not 'assistant').
function generateMockMessages(duration: number): VapiTranscriptMessage[] {
  const exchanges = Math.floor(duration / 30)
  const lines: { role: 'bot' | 'user'; message: string }[] = [
    { role: 'bot', message: "Hi! Thanks for calling. I'm here to help you today. How can I assist you?" },
    { role: 'user', message: 'Hi, yes I was calling to get some information.' },
    { role: 'bot', message: "Of course, I'd be happy to help! What information are you looking for?" },
    { role: 'user', message: 'I wanted to know about scheduling an appointment.' },
    { role: 'bot', message: 'Absolutely! I can help with that. What day and time works best for you?' },
    { role: 'user', message: 'How about next Tuesday around 2 PM?' },
    { role: 'bot', message: 'Let me check our availability for Tuesday at 2 PM... Yes, that time is available!' },
    { role: 'user', message: "Perfect, let's go with that." },
    { role: 'bot', message: "Great! I've got you down for Tuesday at 2 PM. Can I get your name and contact information?" },
    { role: 'user', message: "Sure, it's John Smith and my email is john@example.com." },
    { role: 'bot', message: "Perfect! You're all set. You'll receive a confirmation email shortly. Is there anything else I can help you with?" },
    { role: 'user', message: "No, that's all. Thank you!" },
    { role: 'bot', message: 'You\'re welcome! Have a wonderful day. Goodbye!' },
  ]

  return lines.slice(0, Math.min(exchanges * 2 + 1, lines.length)).map((line, i) => ({
    role: line.role,
    message: line.message,
    time: i * 15000,
  }))
}

// Generate calls with a realistic distribution — starts low, builds to a peak, slight drop
// Days ago per call: clusters more calls on certain days to create an interesting curve
const CALL_SCHEDULE = [
  29, 29, 28, 27, 27, 26, 25, 25, 24, 24, 23, 23, 23,  // slow start (weeks ago)
  22, 21, 20, 20, 19, 19, 18, 18, 18, 17, 17,           // building up
  16, 15, 15, 14, 14, 13, 13, 13, 12, 12, 12,           // picking up
  11, 10, 10, 9, 9, 9, 9, 8, 8, 8,                      // peak week
  7, 7, 7, 6, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 1, 1, 1, 0, 0, 0,  // recent (more calls = higher end)
]

export const MOCK_CALLS: VapiCall[] = CALL_SCHEDULE.map((daysAgo, i) =>
  generateMockCall(i, daysAgo)
).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

// ─── Analytics ─────────────────────────────────────────────────────────────────

export function computeMockAnalytics(calls: VapiCall[]): AnalyticsData {
  const totalCalls = calls.length
  const successfulCalls = calls.filter(c => c.analysis?.successEvaluation === 'true').length
  const failedCalls = totalCalls - successfulCalls
  const totalDuration = calls.reduce((sum, c) => sum + (c.duration ?? 0), 0)
  const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0
  const totalMinutes = totalDuration / 60
  const estimatedCost = calls.reduce((sum, c) => sum + (c.cost ?? 0), 0)
  const uniqueCallers = new Set(calls.map(c => c.customer?.number).filter(Boolean)).size

  // Group by day
  const byDay: Record<string, { count: number; successful: number; failed: number }> = {}
  calls.forEach(call => {
    const day = format(new Date(call.createdAt), 'MMM d')
    if (!byDay[day]) byDay[day] = { count: 0, successful: 0, failed: 0 }
    byDay[day].count++
    if (call.analysis?.successEvaluation === 'true') byDay[day].successful++
    else byDay[day].failed++
  })

  const callsByDay = Object.entries(byDay)
    .map(([date, data]) => ({ date, ...data }))
    .reverse()

  // Outcome breakdown — binary from the customer's perspective, matching
  // StatusBadge's Successful/Unsuccessful split (no fabricated sub-buckets).
  const outcomeBreakdown = [
    { name: 'Successful', value: successfulCalls, color: '#10b981' },
    { name: 'Unsuccessful', value: failedCalls, color: '#ef4444' },
  ].filter(o => o.value > 0)

  return {
    totalCalls,
    successfulCalls,
    failedCalls,
    avgDuration,
    totalMinutes,
    estimatedCost,
    uniqueCallers,
    callsByDay,
    outcomeBreakdown,
  }
}

// ─── Mock API handlers ──────────────────────────────────────────────────────────

export function getMockCalls(params: {
  assistantIds?: string[]
  status?: string
  limit?: number
  cursor?: string
  search?: string
  successEvaluation?: string
  startDate?: Date
  endDate?: Date
}): VapiCall[] {
  let calls = [...MOCK_CALLS]

  if (params.startDate) {
    calls = calls.filter(c => new Date(c.createdAt) >= params.startDate!)
  }
  if (params.endDate) {
    calls = calls.filter(c => new Date(c.createdAt) <= params.endDate!)
  }

  if (params.assistantIds?.length) {
    calls = calls.filter(c => c.assistantId && params.assistantIds!.includes(c.assistantId))
  }
  if (params.status) {
    calls = calls.filter(c => c.status === params.status)
  }
  if (params.successEvaluation === 'true') {
    calls = calls.filter(c => c.analysis?.successEvaluation === 'true')
  } else if (params.successEvaluation === 'false') {
    calls = calls.filter(c => c.analysis?.successEvaluation !== 'true')
  }
  if (params.search) {
    const s = params.search.toLowerCase()
    calls = calls.filter(c =>
      c.customer?.number?.includes(s) ||
      c.customer?.name?.toLowerCase().includes(s) ||
      c.assistant?.name?.toLowerCase().includes(s)
    )
  }
  if (params.cursor) {
    const idx = calls.findIndex(c => c.id === params.cursor)
    if (idx !== -1) calls = calls.slice(idx + 1)
  }

  return calls.slice(0, params.limit ?? 20)
}

export function getMockCall(id: string): VapiCall | null {
  return MOCK_CALLS.find(c => c.id === id) ?? null
}

export function getMockAssistant(id: string): VapiAssistant | null {
  return MOCK_ASSISTANTS.find(a => a.id === id) ?? null
}

export const MOCK_ASSISTANT_IDS = ['6f891a52-5606-40a7-980d-4e3dc35bfb72']
