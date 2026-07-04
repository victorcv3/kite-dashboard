import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status?: string
  endedReason?: string
  successEvaluation?: string
}

export function StatusBadge({ status, endedReason, successEvaluation }: StatusBadgeProps) {
  if (successEvaluation === 'true') {
    return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">Successful</Badge>
  }
  if (successEvaluation === 'false') {
    return <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">Failed</Badge>
  }

  if (endedReason === 'voicemail') {
    return <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">Voicemail</Badge>
  }
  if (endedReason?.includes('forwarded')) {
    return <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">Forwarded</Badge>
  }
  if (endedReason === 'assistant-ended-call' || endedReason === 'customer-ended-call') {
    return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">Completed</Badge>
  }

  if (status === 'in-progress') {
    return <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">Live</Badge>
  }

  return <Badge variant="outline" className="text-slate-500">{status ?? 'Unknown'}</Badge>
}
