'use client'

import { useRouter } from 'next/navigation'
import { TableCell, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ChevronRight } from 'lucide-react'
import { formatDateTime, formatPhoneNumber } from '@/lib/utils'

interface Props {
  number: string
  name?: string
  callCount: number
  lastCallAt: string
  lastSuccessEvaluation?: string
}

export function CallerRow({ number, name, callCount, lastCallAt, lastSuccessEvaluation }: Props) {
  const router = useRouter()

  return (
    <TableRow
      className="cursor-pointer hover:bg-slate-50 transition-colors"
      onClick={() => router.push(`/dashboard/calls?search=${encodeURIComponent(number)}`)}
    >
      <TableCell className="text-sm font-medium text-slate-800">
        {formatPhoneNumber(number)}
      </TableCell>
      <TableCell className="text-sm text-slate-600">{name ?? '—'}</TableCell>
      <TableCell className="text-sm text-slate-700 tabular-nums">{callCount}</TableCell>
      <TableCell className="text-sm text-slate-700">{formatDateTime(lastCallAt)}</TableCell>
      <TableCell>
        <StatusBadge successEvaluation={lastSuccessEvaluation} />
      </TableCell>
      <TableCell>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </TableCell>
    </TableRow>
  )
}
