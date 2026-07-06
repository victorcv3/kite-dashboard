import { Badge } from '@/components/ui/badge'

interface StatusBadgeProps {
  successEvaluation?: string
}

export function StatusBadge({ successEvaluation }: StatusBadgeProps) {
  if (successEvaluation === 'true') {
    return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">Successful</Badge>
  }
  return <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">Unsuccessful</Badge>
}
