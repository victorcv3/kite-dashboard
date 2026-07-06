import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { VapiTranscriptMessage } from '@/types/app'

interface Message {
  role: 'AI' | 'User'
  text: string
}

// Only 'bot' and 'user' are actual spoken conversation — 'system' is the
// assistant's instructions and 'tool_calls'/'tool_call_result' are function-
// call internals, none of which belong in a caller-facing transcript.
export function messagesToTranscript(messages: VapiTranscriptMessage[]): Message[] {
  return messages
    .filter((m): m is VapiTranscriptMessage & { role: 'bot' | 'user' } => m.role === 'bot' || m.role === 'user')
    .filter(m => m.message?.trim())
    .sort((a, b) => a.time - b.time)
    .map(m => ({ role: m.role === 'bot' ? 'AI' as const : 'User' as const, text: m.message.trim() }))
}

export function TranscriptView({ messages }: { messages: Message[] }) {
  return (
    <ScrollArea className="h-[560px]">
      <div className="space-y-3 pr-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn('flex', msg.role === 'AI' ? 'justify-start' : 'justify-end')}
          >
            <div className={cn(
              'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
              msg.role === 'AI'
                ? 'bg-slate-100 text-slate-800 rounded-tl-sm'
                : 'bg-indigo-600 text-white rounded-tr-sm'
            )}>
              <p className="text-xs font-semibold mb-0.5 opacity-60">
                {msg.role === 'AI' ? 'Assistant' : 'Caller'}
              </p>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
