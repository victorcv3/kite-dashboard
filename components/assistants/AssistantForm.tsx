'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { VapiAssistant } from '@/types/app'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  firstMessage: z.string().optional(),
  voicemailMessage: z.string().optional(),
  endCallMessage: z.string().optional(),
  businessHoursText: z.string().optional(),
  faqs: z.string().optional(),
  bookingLink: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  transferNumber: z.string().optional(),
  toneInstructions: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AssistantFormProps {
  assistant: VapiAssistant
  onSuccess?: (updated: VapiAssistant) => void
  onCancel?: () => void
}

export function AssistantForm({ assistant, onSuccess, onCancel }: AssistantFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: assistant.name,
      firstMessage: assistant.firstMessage ?? '',
      voicemailMessage: assistant.voicemailMessage ?? '',
      endCallMessage: assistant.endCallMessage ?? '',
      businessHoursText: assistant.metadata?.businessHoursText ?? '',
      faqs: assistant.metadata?.faqs ?? '',
      bookingLink: assistant.metadata?.bookingLink ?? '',
      transferNumber: assistant.metadata?.transferNumber ?? '',
      toneInstructions: assistant.metadata?.toneInstructions ?? '',
    },
  })

  async function onSubmit(data: FormData) {
    const { businessHoursText, faqs, bookingLink, transferNumber, toneInstructions, ...top } = data

    const body = {
      ...top,
      metadata: {
        ...assistant.metadata,
        businessHoursText,
        faqs,
        bookingLink,
        transferNumber,
        toneInstructions,
      },
    }

    try {
      const res = await fetch(`/api/vapi/assistants/${assistant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to save')
      const updated = await res.json()
      toast.success('Assistant updated successfully')
      onSuccess?.(updated)
    } catch {
      toast.error('Failed to update assistant')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-1.5">
          <Label>Display Name</Label>
          <Input {...form.register('name')} />
          {form.formState.errors.name && (
            <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Opening Message</Label>
          <Textarea
            {...form.register('firstMessage')}
            placeholder="What the assistant says when the call connects…"
            rows={2}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Voicemail Message</Label>
          <Textarea
            {...form.register('voicemailMessage')}
            placeholder="Message left on voicemail…"
            rows={2}
          />
        </div>

        <div className="space-y-1.5">
          <Label>End Call Message</Label>
          <Input
            {...form.register('endCallMessage')}
            placeholder="Goodbye message…"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Business Hours</Label>
          <Textarea
            {...form.register('businessHoursText')}
            placeholder="e.g. Monday–Friday 9 AM to 5 PM Eastern…"
            rows={2}
          />
        </div>

        <div className="space-y-1.5">
          <Label>FAQs</Label>
          <Textarea
            {...form.register('faqs')}
            placeholder="Q: How long are appointments? A: 30-60 minutes."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Booking Link</Label>
            <Input
              {...form.register('bookingLink')}
              placeholder="https://…"
            />
            {form.formState.errors.bookingLink && (
              <p className="text-xs text-red-600">{form.formState.errors.bookingLink.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Transfer Number</Label>
            <Input
              {...form.register('transferNumber')}
              placeholder="+1 (415) 555-0100"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Tone & Style Instructions</Label>
          <Textarea
            {...form.register('toneInstructions')}
            placeholder="e.g. Be warm, professional, and concise…"
            rows={2}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
          ) : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
