'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn, formatCost } from '@/lib/utils'

const COST_ROWS = [
  { key: 'transport', label: 'Transport', type: 'cost' },
  { key: 'stt', label: 'STT', type: 'cost' },
  { key: 'llm', label: 'LLM', type: 'cost' },
  { key: 'tts', label: 'TTS', type: 'cost' },
  { key: 'vapi', label: 'Vapi', type: 'cost' },
  { key: 'chat', label: 'Chat', type: 'cost' },
  { key: 'total', label: 'Total', type: 'cost' },
  { key: 'llmPromptTokens', label: 'Prompt tokens', type: 'count' },
  { key: 'llmCompletionTokens', label: 'Completion tokens', type: 'count' },
  { key: 'llmCachedPromptTokens', label: 'Cached prompt tokens', type: 'count' },
  { key: 'ttsCharacters', label: 'TTS characters', type: 'count' },
  { key: 'knowledgeBaseCost', label: 'Knowledge base cost', type: 'cost' },
  { key: 'voicemailDetectionCost', label: 'Voicemail detection cost', type: 'cost' },
] as const

// Cost of running the Structured Outputs (call_summary, user_name, phone_number,
// successful_call) — separate from the conversation cost above, lives nested
// under analysisCostBreakdown rather than at the top level.
const ANALYSIS_COST_ROWS = [
  { key: 'structuredOutput', label: 'Structured outputs (summary, name, etc.)', type: 'cost' },
  { key: 'structuredOutputPromptTokens', label: 'Structured output prompt tokens', type: 'count' },
  { key: 'structuredOutputCompletionTokens', label: 'Structured output completion tokens', type: 'count' },
] as const

interface Props {
  costBreakdown: Record<string, number> & { analysisCostBreakdown?: Record<string, number> }
}

export function CostBreakdownCollapse({ costBreakdown }: Props) {
  const [open, setOpen] = useState(false)
  const rows = COST_ROWS.filter(r => typeof costBreakdown[r.key] === 'number')
  const analysisCosts = costBreakdown.analysisCostBreakdown ?? {}
  const analysisRows = ANALYSIS_COST_ROWS.filter(r => typeof analysisCosts[r.key] === 'number' && analysisCosts[r.key] > 0)

  if (!rows.length && !analysisRows.length) return null

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between text-xs text-slate-500 font-medium"
      >
        Cost Breakdown
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 mt-2.5">
            {rows.map(row => (
              <div key={row.key} className="flex justify-between text-xs gap-2">
                <span className="text-slate-500">{row.label}</span>
                <span className="text-slate-700 tabular-nums">
                  {row.type === 'cost' ? formatCost(costBreakdown[row.key]) : costBreakdown[row.key].toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {analysisRows.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400 font-medium mb-1.5">AI Analysis (Summary, Name, Phone, Outcome)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
                {analysisRows.map(row => (
                  <div key={row.key} className="flex justify-between text-xs gap-2">
                    <span className="text-slate-500">{row.label}</span>
                    <span className="text-slate-700 tabular-nums">
                      {row.type === 'cost' ? formatCost(analysisCosts[row.key]) : analysisCosts[row.key].toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
