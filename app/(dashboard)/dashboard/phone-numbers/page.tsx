'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Phone, Pencil, Check, X } from 'lucide-react'
import { formatPhoneNumber } from '@/lib/utils'
import { toast } from 'sonner'
import type { VapiPhoneNumber } from '@/types/app'

export default function PhoneNumbersPage() {
  const [numbers, setNumbers] = useState<VapiPhoneNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/vapi/phone-numbers')
      .then(r => r.json())
      .then(data => {
        setNumbers(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function startEdit(number: VapiPhoneNumber) {
    setEditingId(number.id)
    setEditName(number.name ?? '')
  }

  async function saveEdit(number: VapiPhoneNumber) {
    setSaving(true)
    try {
      const res = await fetch(`/api/vapi/phone-numbers/${number.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName }),
      })
      if (!res.ok) throw new Error()
      setNumbers(prev => prev.map(n => n.id === number.id ? { ...n, name: editName } : n))
      toast.success('Phone number updated')
      setEditingId(null)
    } catch {
      toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Phone Numbers"
        description="Voice numbers assigned to your account"
      />

      {loading ? (
        <LoadingSpinner />
      ) : numbers.length === 0 ? (
        <EmptyState
          icon={Phone}
          title="No phone numbers assigned"
          description="Contact your administrator to assign phone numbers to your account."
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Number</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Display Name</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Provider</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {numbers.map(number => (
                <TableRow key={number.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-800 font-mono text-sm">
                    {formatPhoneNumber(number.number)}
                  </TableCell>
                  <TableCell>
                    {editingId === number.id ? (
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="h-7 text-sm w-40"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit(number)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                      />
                    ) : (
                      <span className="text-sm text-slate-600">{number.name ?? '—'}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-500 capitalize">{number.provider}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {editingId === number.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-emerald-600"
                          onClick={() => saveEdit(number)}
                          disabled={saving}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-slate-400"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7"
                        onClick={() => startEdit(number)}
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-400" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
