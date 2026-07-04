'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { AssistantForm } from '@/components/assistants/AssistantForm'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Bot, Pencil, Zap } from 'lucide-react'
import type { VapiAssistant } from '@/types/app'

export default function AssistantsPage() {
  const [assistants, setAssistants] = useState<VapiAssistant[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<VapiAssistant | null>(null)

  useEffect(() => {
    fetch('/api/vapi/assistants')
      .then(r => r.json())
      .then(data => {
        setAssistants(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function handleUpdated(updated: VapiAssistant) {
    setAssistants(prev => prev.map(a => a.id === updated.id ? updated : a))
    setEditing(null)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Assistants"
        description="Your voice AI assistants and their configurations"
      />

      {loading ? (
        <LoadingSpinner />
      ) : assistants.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No assistants assigned"
          description="Contact your administrator to assign voice AI assistants to your account."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {assistants.map(assistant => (
            <Card key={assistant.id} className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">{assistant.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Zap className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-400">{assistant.model?.provider ?? 'AI'} · {assistant.voice?.provider ?? 'voice'}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {assistant.firstMessage && (
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-1">Opening message</p>
                    <p className="text-xs text-slate-600 line-clamp-2">{assistant.firstMessage}</p>
                  </div>
                )}
                {assistant.metadata?.businessHoursText && (
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-1">Business hours</p>
                    <p className="text-xs text-slate-600 line-clamp-1">{assistant.metadata.businessHoursText}</p>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs"
                  onClick={() => setEditing(assistant)}
                >
                  <Pencil className="w-3 h-3 mr-1.5" />
                  Edit settings
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editing?.name}</DialogTitle>
          </DialogHeader>
          {editing && (
            <AssistantForm
              assistant={editing}
              onSuccess={handleUpdated}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
