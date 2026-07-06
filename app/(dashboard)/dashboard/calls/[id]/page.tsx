import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TranscriptView, messagesToTranscript } from '@/components/calls/TranscriptView'
import { AudioPlayer } from '@/components/calls/AudioPlayer'
import { CostBreakdownCollapse } from '@/components/calls/CostBreakdownCollapse'
import { ExtractedDetails } from '@/components/calls/ExtractedDetails'
import { ArrowLeft, Mic, FileText } from 'lucide-react'
import {
  formatDateTime, formatDuration, formatPhoneNumber
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

  const transcriptMessages = messagesToTranscript(call.artifact?.messages ?? [])
  const hasTranscript = transcriptMessages.length > 0
  const hasRecording = !!call.artifact?.recordingUrl
  const hasAnalysis = !!call.analysis

  const overviewFields: [string, string][] = [
    ['Call ID', call.id.slice(0, 16) + '…'],
    ['Caller', formatPhoneNumber(call.customer?.number)],
    ['Assistant', call.assistant?.name ?? '—'],
    ['Started', formatDateTime(call.startedAt ?? undefined)],
    ['Ended', formatDateTime(call.endedAt ?? undefined)],
    ['Duration', formatDuration(call.duration)],
  ]

  return (
    <div className="space-y-4">
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
      </div>

      {/* Call Overview — compact header strip, full width */}
      <Card className="border-0 shadow-sm">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {overviewFields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-slate-400 font-medium">{label}</dt>
                <dd className="text-sm text-slate-800 mt-0.5 whitespace-nowrap">{value}</dd>
              </div>
            ))}
            <div>
              <dt className="text-xs text-slate-400 font-medium mb-1">Status</dt>
              <dd>
                <StatusBadge successEvaluation={call.analysis?.successEvaluation} />
              </dd>
            </div>
          </div>

          {call.costBreakdown && Object.keys(call.costBreakdown).length > 0 && (
            <CostBreakdownCollapse costBreakdown={call.costBreakdown} />
          )}
        </CardContent>
      </Card>

      {/* Main content — extracted details + recording (left), summary (middle), transcript (right, widest) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1.4fr] gap-5 items-start">
        {/* Left column: extracted details + recording — both sized to their own content */}
        <div className="flex flex-col gap-5">
          <ExtractedDetails
            structuredData={call.analysis?.structuredData ?? {}}
            callerNumber={call.customer?.number}
          />

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
        </div>

        {/* Middle column: call summary — natural height, no forced stretch */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Call Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasAnalysis && call.analysis?.summary ? (
              <p className="text-sm text-slate-700 leading-relaxed">{call.analysis.summary}</p>
            ) : (
              <p className="text-sm text-slate-400">No summary available</p>
            )}
          </CardContent>
        </Card>

        {/* Right column: transcript — widest, fixed internal scroll height */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Transcript
            </CardTitle>
            {hasTranscript && (
              <ExportButton
                transcript={transcriptMessages.map(m => `${m.role === 'AI' ? 'Assistant' : 'Caller'}: ${m.text}`).join('\n')}
                callId={call.id}
              />
            )}
          </CardHeader>
          <CardContent>
            {hasTranscript ? (
              <TranscriptView messages={transcriptMessages} />
            ) : (
              <p className="text-sm text-slate-400 py-8 text-center">No transcript available for this call.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
