import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from 'lucide-react'
import { formatPhoneNumber } from '@/lib/utils'

interface Props {
  structuredData: Record<string, unknown>
  callerNumber?: string
}

function asText(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value
  return undefined
}

export function ExtractedDetails({ structuredData, callerNumber }: Props) {
  const name = asText(structuredData.user_name) ?? asText(structuredData.customer_name)
  const extractedPhone = asText(structuredData.phone_number)
  const bestPhone = extractedPhone ?? callerNumber
  const phoneSource = extractedPhone ? 'Provided during call' : 'Caller ID'

  const successfulCall = structuredData.successful_call
  const outcome = asText(structuredData.call_outcome)
  const intent = asText(structuredData.caller_intent)
  const followUp = structuredData.follow_up_required

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <User className="w-4 h-4" />
          Extracted Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-slate-400 font-medium">Name</p>
          <p className="text-sm text-slate-800 mt-0.5">{name ?? '—'}</p>
        </div>

        <div>
          <p className="text-xs text-slate-400 font-medium">Best phone to reach</p>
          <p className="text-sm text-slate-800 mt-0.5">
            {bestPhone ? formatPhoneNumber(bestPhone) : '—'}
          </p>
          {bestPhone && (
            <p className="text-xs text-slate-400 mt-0.5">Source: {phoneSource}</p>
          )}
        </div>

        {typeof successfulCall === 'boolean' && (
          <div>
            <p className="text-xs text-slate-400 font-medium">Successful call</p>
            <p className={`text-sm font-semibold mt-0.5 ${successfulCall ? 'text-emerald-600' : 'text-red-500'}`}>
              {successfulCall ? 'Yes' : 'No'}
            </p>
          </div>
        )}

        {outcome && (
          <div>
            <p className="text-xs text-slate-400 font-medium">Call outcome</p>
            <p className="text-sm text-slate-800 mt-0.5">{outcome}</p>
          </div>
        )}

        {intent && (
          <div>
            <p className="text-xs text-slate-400 font-medium">Caller intent</p>
            <p className="text-sm text-slate-800 mt-0.5">{intent}</p>
          </div>
        )}

        {typeof followUp === 'boolean' && (
          <div>
            <p className="text-xs text-slate-400 font-medium">Follow-up required</p>
            <p className="text-sm text-slate-800 mt-0.5">{followUp ? 'Yes' : 'No'}</p>
          </div>
        )}

        {!name && !bestPhone && typeof successfulCall !== 'boolean' && !outcome && !intent && typeof followUp !== 'boolean' && (
          <p className="text-sm text-slate-400">No extracted data available for this call.</p>
        )}
      </CardContent>
    </Card>
  )
}
