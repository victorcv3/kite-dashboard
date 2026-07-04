import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface Message {
  role: 'AI' | 'User'
  text: string
}

function parseTranscript(transcript: string): Message[] {
  return transcript
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      if (line.startsWith('AI:')) return { role: 'AI' as const, text: line.slice(3).trim() }
      if (line.startsWith('User:')) return { role: 'User' as const, text: line.slice(5).trim() }
      if (line.startsWith('Assistant:')) return { role: 'AI' as const, text: line.slice(10).trim() }
      return { role: 'User' as const, text: line }
    })
}

export function TranscriptView({ transcript }: { transcript: string }) {
  const messages = parseTranscript(transcript)

  return (
    <ScrollArea className="h-80">
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
