import 'server-only'
import {
  MOCK_ASSISTANTS,
  MOCK_CALLS,
  getMockCalls,
  getMockCall,
  getMockAssistant,
  computeMockAnalytics,
} from '@/lib/mock-data'

const USE_MOCK = process.env.USE_MOCK_DATA === 'true'
const VAPI_BASE = 'https://api.vapi.ai'

// VAPI's /call endpoint 400s on createdAtGt/createdAtLt outside this window —
// plan-level retention limit, not a per-feature choice. Single source of
// truth so UI period pickers and the getAnalytics clamp never drift apart.
export const VAPI_RETENTION_DAYS = 14

export type Period = 'today' | 'week' | 'max'

export function getPeriodRange(period: Period, now: Date = new Date()): { start: Date; end: Date } {
  const daysMap: Record<Period, number> = { today: 1, week: 7, max: VAPI_RETENTION_DAYS }
  return { start: new Date(now.getTime() - daysMap[period] * 24 * 60 * 60 * 1000), end: now }
}

export class VapiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'VapiError'
  }
}

async function vapiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${VAPI_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new VapiError(res.status, `Vapi API error ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// ─── Calls ──────────────────────────────────────────────────────────────────────

// The real /call endpoint returns neither `duration` nor a nested `assistant`
// object — only `startedAt`/`endedAt` and `assistantId`. Mock data fabricated
// both directly, which is why they only showed up empty against the real API.
interface RawCall {
  assistantId?: string
  assistant?: unknown
  duration?: number
  startedAt?: string | null
  endedAt?: string | null
  analysis?: Record<string, unknown>
  artifact?: { structuredOutputs?: Record<string, { name?: string; result?: unknown }> }
  [key: string]: unknown
}

function computeDuration(call: RawCall): number | undefined {
  if (typeof call.duration === 'number') return call.duration
  if (!call.startedAt || !call.endedAt) return undefined
  const seconds = (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000
  return seconds >= 0 ? Math.round(seconds) : undefined
}

// This assistant's Analysis Plan (summary/success-evaluation) is disabled —
// call summary and success are configured instead as Structured Outputs, a
// separate VAPI feature whose results land under
// call.artifact.structuredOutputs[id].result, not call.analysis. Bridge them
// into the analysis.summary/successEvaluation shape the rest of the app reads.
const STRUCTURED_OUTPUT_IDS = {
  callSummary: '193434f8-ed69-45cd-8e8a-5a85549091a8',
  successfulCall: 'e8dba824-3b3f-4252-9e71-f0315b8f91bb',
}

function getStructuredOutput(call: RawCall, outputId: string): unknown {
  return call.artifact?.structuredOutputs?.[outputId]?.result
}

function enrichAnalysis(call: RawCall): Record<string, unknown> {
  const existing = call.analysis ?? {}

  // Bridge every configured Structured Output into structuredData, keyed by
  // its name (call_summary, successful_call, phone_number, user_name, and
  // whatever gets added later — call_outcome, caller_intent, etc.) so the UI
  // can read them generically without hardcoding each output's id.
  const structuredByName: Record<string, unknown> = {}
  for (const output of Object.values(call.artifact?.structuredOutputs ?? {})) {
    if (output?.name) structuredByName[output.name] = output.result
  }

  const summary = existing.summary ?? getStructuredOutput(call, STRUCTURED_OUTPUT_IDS.callSummary)
  const successResult = getStructuredOutput(call, STRUCTURED_OUTPUT_IDS.successfulCall)
  const successEvaluation = existing.successEvaluation
    ?? (typeof successResult === 'boolean' ? String(successResult) : successResult)

  return {
    ...existing,
    summary,
    successEvaluation,
    structuredData: { ...structuredByName, ...(existing.structuredData as Record<string, unknown> ?? {}) },
  }
}

function attachAssistant(call: RawCall, assistantMap: Map<string, unknown>): RawCall {
  return {
    ...call,
    duration: computeDuration(call),
    assistant: call.assistant ?? (call.assistantId ? assistantMap.get(call.assistantId) : undefined),
    analysis: enrichAnalysis(call),
  }
}

export async function listCalls(params: {
  assistantIds: string[]
  limit?: number
  cursor?: string
  status?: string
  successEvaluation?: string
  search?: string
  startDate?: Date
  endDate?: Date
}) {
  if (USE_MOCK) {
    return getMockCalls({
      assistantIds: params.assistantIds,
      limit: params.limit,
      cursor: params.cursor,
      status: params.status,
      successEvaluation: params.successEvaluation,
      search: params.search,
      startDate: params.startDate,
      endDate: params.endDate,
    })
  }

  // Same retention clamp as getAnalytics — a period's start can't reach
  // further back than the plan allows.
  const retentionFloor = new Date(Date.now() - VAPI_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  const createdAtGt = params.startDate
    ? (params.startDate < retentionFloor ? retentionFloor : params.startDate).toISOString()
    : undefined
  // Cursor (pagination) is always tighter than a period's endDate, so it wins.
  const createdAtLt = params.cursor ?? params.endDate?.toISOString()

  const results = await Promise.allSettled(
    params.assistantIds.map(assistantId => {
      const qs = new URLSearchParams({
        assistantId,
        limit: String(params.limit ?? 20),
        ...(createdAtGt ? { createdAtGt } : {}),
        ...(createdAtLt ? { createdAtLt } : {}),
      })
      return vapiRequest<unknown[]>(`/call?${qs}`)
    })
  )

  const flat = results
    .filter((r): r is PromiseFulfilledResult<unknown[]> => r.status === 'fulfilled')
    .flatMap(r => r.value) as RawCall[]

  const assistants = await listAssistants(params.assistantIds)
  const assistantMap = new Map(assistants.map(a => [(a as { id: string }).id, a]))
  let enriched = flat.map(c => attachAssistant(c, assistantMap))

  // VAPI's /call endpoint has no query params for these — the real API
  // ignored them silently before this filtered client-side instead.
  // Outcome is binary from the customer's perspective: "true" literally means
  // successful, anything else (false, or no evaluation at all) counts as
  // unsuccessful — mirrors StatusBadge's Successful/Unsuccessful split.
  if (params.successEvaluation === 'true') {
    enriched = enriched.filter(c => c.analysis?.successEvaluation === 'true')
  } else if (params.successEvaluation === 'false') {
    enriched = enriched.filter(c => c.analysis?.successEvaluation !== 'true')
  }
  if (params.search) {
    const s = params.search.toLowerCase()
    enriched = enriched.filter(c => {
      const customer = c.customer as { number?: string; name?: string } | undefined
      return customer?.number?.toLowerCase().includes(s) || customer?.name?.toLowerCase().includes(s)
    })
  }

  enriched.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime())
  return enriched.slice(0, params.limit ?? 20)
}

export async function getCall(id: string) {
  if (USE_MOCK) return getMockCall(id)
  const raw = await vapiRequest<RawCall>(`/call/${id}`)
  const assistant = raw.assistantId ? await getAssistant(raw.assistantId).catch(() => undefined) : undefined
  const assistantMap = new Map(assistant ? [[raw.assistantId as string, assistant]] : [])
  return attachAssistant(raw, assistantMap)
}

// ─── Assistants ─────────────────────────────────────────────────────────────────

export async function listAssistants(ids: string[]) {
  if (USE_MOCK) return MOCK_ASSISTANTS.filter(a => ids.includes(a.id))
  const results = await Promise.allSettled(ids.map(id => vapiRequest(`/assistant/${id}`)))
  return results
    .filter((r): r is PromiseFulfilledResult<unknown> => r.status === 'fulfilled')
    .map(r => r.value)
}

export async function getAssistant(id: string) {
  if (USE_MOCK) return getMockAssistant(id)
  return vapiRequest(`/assistant/${id}`)
}

export async function listAllAssistants() {
  if (USE_MOCK) return MOCK_ASSISTANTS
  return vapiRequest<unknown[]>('/assistant?limit=100')
}

const ALLOWED_ASSISTANT_FIELDS = new Set([
  'name', 'firstMessage', 'voicemailMessage', 'endCallMessage', 'metadata',
])

export async function updateAssistant(id: string, body: Record<string, unknown>) {
  if (USE_MOCK) {
    const assistant = getMockAssistant(id)
    if (!assistant) return null
    const safeBody = Object.fromEntries(
      Object.entries(body).filter(([key]) => ALLOWED_ASSISTANT_FIELDS.has(key))
    )
    return { ...assistant, ...safeBody, updatedAt: new Date().toISOString() }
  }

  const safeBody = Object.fromEntries(
    Object.entries(body).filter(([key]) => ALLOWED_ASSISTANT_FIELDS.has(key))
  )
  return vapiRequest(`/assistant/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(safeBody),
  })
}

// ─── Analytics ───────────────────────────────────────────────────────────────────

export async function getAnalytics(assistantIds: string[], startDate: Date, endDate: Date) {
  if (USE_MOCK) {
    const calls = getMockCalls({ assistantIds, startDate, endDate })
    return computeMockAnalytics(calls)
  }

  // VAPI retention window is plan-limited (e.g. 14 days) — clamp so requests
  // for older ranges (month/all periods, or prior-period comparisons) don't
  // 400 against the real API. If the whole range falls before the window,
  // there's nothing to fetch — return a zeroed result instead of calling out.
  const retentionFloor = new Date(Date.now() - VAPI_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  const clampedStart = startDate < retentionFloor ? retentionFloor : startDate
  const clampedEnd = endDate < retentionFloor ? retentionFloor : endDate
  if (clampedEnd <= clampedStart) {
    return computeMockAnalytics([])
  }

  // Fetch calls for aggregation server-side
  const allCallsResults = await Promise.all(
    assistantIds.map(assistantId => {
      const qs = new URLSearchParams({
        assistantId,
        limit: '1000',
        createdAtGt: clampedStart.toISOString(),
        createdAtLt: clampedEnd.toISOString(),
      })
      return vapiRequest<unknown[]>(`/call?${qs}`)
    })
  )
  const allCalls = allCallsResults.flat().map(c => ({
    ...(c as RawCall),
    duration: computeDuration(c as RawCall),
    analysis: enrichAnalysis(c as RawCall),
  })) as Parameters<typeof computeMockAnalytics>[0]
  return computeMockAnalytics(allCalls)
}
