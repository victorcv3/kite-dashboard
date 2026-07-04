import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TranscriptView } from '@/components/calls/TranscriptView'
import { AudioPlayer } from '@/components/calls/AudioPlayer'
import { ArrowLeft, Download, Copy, Mic, FileText, BarChart2 } from 'lucide-react'
import {
  formatDateTime, formatDuration, formatCost, formatPhoneNumber, endedReasonLabel
} from '@/lib/utils'
import type { VapiCall } from '@/types/app'
import { ExportButton } from '@/components/calls/ExportButton'
import { getCall } from '@/lib/vapi/client'
import { getSession } from '@/lib/supabase/get-session'

async function fetchCall(id: string): Promise<VapiCall | null> {
  try {
    await getSession()
    const call = await getCall(id)
    return call as VapiCall | null
  } catch {
    return null
  }
}

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const call = await fetchCall(id)

  if (!call) notFound()

  const hasTranscript = !!call.artifact?.transcript
  const hasRecording = !!call.artifact?.recordingUrl
  const hasAnalysis = !!call.analysis

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/calls">
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-900">
            Call with {formatPhoneNumber(call.customer?.number)}
          </h1>
          <p className="text-sm text-slate-500">{formatDateTime(call.startedAt ?? undefined)} · {call.assistant?.name}</p>
        </div>
        <StatusBadge
          status={call.status}
          endedReason={call.endedReason}
          successEvaluation={call.analysis?.successEvaluation}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-4">
          {/* Summary */}
          {hasAnalysis && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Call Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {call.analysis?.summary ? (
                  <p className="text-sm text-slate-700 leading-relaxed">{call.analysis.summary}</p>
                ) : (
                  <p className="text-sm text-slate-400">No summary available</p>
                )}
                {call.analysis?.successEvaluation && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Outcome:</span>
                    <StatusBadge successEvaluation={call.analysis.successEvaluation} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Structured data */}
          {call.analysis?.structuredData && Object.keys(call.analysis.structuredData).length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" />
                  Extracted Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-2">
                  {Object.entries(call.analysis.structuredData).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start gap-4 py-1.5 border-b border-slate-50 last:border-0">
                      <dt className="text-xs text-slate-500 font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                      </dt>
                      <dd className="text-xs text-slate-800 font-semibold text-right">
                        {typeof value === 'boolean'
                          ? (value ? 'Yes' : 'No')
                          : String(value ?? '—')
                        }
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Call metadata */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">Call Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-3">
                {[
                  ['Call ID', call.id.slice(0, 16) + '…'],
                  ['Caller', formatPhoneNumber(call.customer?.number)],
                  ['Assistant', call.assistant?.name ?? '—'],
                  ['Started', formatDateTime(call.startedAt ?? undefined)],
                  ['Ended', formatDateTime(call.endedAt ?? undefined)],
                  ['Duration', formatDuration(call.duration)],
                  ['End Reason', endedReasonLabel(call.endedReason)],
                  ['Cost', formatCost(call.cost)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-slate-400 font-medium">{label}</dt>
                    <dd className="text-sm text-slate-800 mt-0.5">{value}</dd>
                  </div>
                ))}
              </dl>

              {call.costBreakdown && Object.keys(call.costBreakdown).length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 font-medium mb-2">Cost Breakdown</p>
                  <div className="space-y-1">
                    {Object.entries(call.costBreakdown).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-slate-500 capitalize">{k}</span>
                        <span className="text-slate-700 tabular-nums">{formatCost(v as number)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Recording */}
          {hasRecording && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Recording
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AudioPlayer url={call.artifact!.recordingUrl!} />
              </CardContent>
            </Card>
          )}

          {/* Transcript */}
          {hasTranscript && (
            <Card className="border-0 shadow-sm flex-1">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Transcript
                </CardTitle>
                <ExportButton transcript={call.artifact!.transcript!} callId={call.id} />
              </CardHeader>
              <CardContent>
                <TranscriptView transcript={call.artifact!.transcript!} />
              </CardContent>
            </Card>
          )}

          {!hasTranscript && !hasRecording && (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-slate-400">No transcript or recording available for this call.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
