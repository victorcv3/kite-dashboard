import 'server-only'
import {
  MOCK_ASSISTANTS,
  MOCK_PHONE_NUMBERS,
  MOCK_CALLS,
  getMockCalls,
  getMockCall,
  getMockAssistant,
  computeMockAnalytics,
} from '@/lib/mock-data'

const USE_MOCK = process.env.USE_MOCK_DATA === 'true'
const VAPI_BASE = 'https://api.vapi.ai'

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

export async function listCalls(params: {
  assistantIds: string[]
  limit?: number
  cursor?: string
  status?: string
  successEvaluation?: string
  search?: string
}) {
  if (USE_MOCK) {
    return getMockCalls({
      assistantIds: params.assistantIds,
      limit: params.limit,
      cursor: params.cursor,
      status: params.status,
      successEvaluation: params.successEvaluation,
      search: params.search,
    })
  }

  const results = await Promise.allSettled(
    params.assistantIds.map(assistantId => {
      const qs = new URLSearchParams({
        assistantId,
        limit: String(params.limit ?? 20),
        ...(params.cursor ? { createdAtLt: params.cursor } : {}),
      })
      return vapiRequest<unknown[]>(`/call?${qs}`)
    })
  )

  const flat = results
    .filter((r): r is PromiseFulfilledResult<unknown[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)
  flat.sort((a: unknown, b: unknown) => {
    const aDate = (a as { createdAt: string }).createdAt
    const bDate = (b as { createdAt: string }).createdAt
    return new Date(bDate).getTime() - new Date(aDate).getTime()
  })
  return flat.slice(0, params.limit ?? 20)
}

export async function getCall(id: string) {
  if (USE_MOCK) return getMockCall(id)
  return vapiRequest(`/call/${id}`)
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

// ─── Phone Numbers ───────────────────────────────────────────────────────────────

export async function listPhoneNumbers(ids: string[]) {
  if (USE_MOCK) return MOCK_PHONE_NUMBERS.filter(p => ids.includes(p.id))
  const results = await Promise.all(ids.map(id => vapiRequest(`/phone-number/${id}`)))
  return results
}

export async function listAllPhoneNumbers() {
  if (USE_MOCK) return MOCK_PHONE_NUMBERS
  return vapiRequest<unknown[]>('/phone-number?limit=100')
}

export async function updatePhoneNumber(id: string, body: Record<string, unknown>) {
  if (USE_MOCK) {
    const pn = MOCK_PHONE_NUMBERS.find(p => p.id === id)
    if (!pn) return null
    return { ...pn, ...body, updatedAt: new Date().toISOString() }
  }
  // Must fetch first to get provider for discriminated union
  const current = await vapiRequest<{ provider: string }>(`/phone-number/${id}`)
  const allowedFields = new Set(['name', 'assistantId', 'squadId'])
  const safeBody = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.has(key))
  )
  return vapiRequest(`/phone-number/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ provider: current.provider, ...safeBody }),
  })
}

// ─── Analytics ───────────────────────────────────────────────────────────────────

export async function getAnalytics(assistantIds: string[], startDate: Date, endDate: Date) {
  if (USE_MOCK) {
    const calls = getMockCalls({ assistantIds, startDate, endDate })
    return computeMockAnalytics(calls)
  }

  // Fetch calls for aggregation server-side
  const allCallsResults = await Promise.all(
    assistantIds.map(assistantId => {
      const qs = new URLSearchParams({
        assistantId,
        limit: '1000',
        createdAtGt: startDate.toISOString(),
        createdAtLt: endDate.toISOString(),
      })
      return vapiRequest<unknown[]>(`/call?${qs}`)
    })
  )
  const allCalls = allCallsResults.flat() as Parameters<typeof computeMockAnalytics>[0]
  return computeMockAnalytics(allCalls)
}
