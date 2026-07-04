'use client'

import { useState } from 'react'
import { Copy, Check, Download } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ExportButtonProps {
  transcript: string
  callId: string
}

export function ExportButton({ transcript, callId }: ExportButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(transcript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([transcript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `call-${callId}-transcript.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1 h-7 px-3 text-xs font-medium rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition-colors outline-none">
        <Download className="w-3 h-3" />
        Export
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopy}>
          {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? 'Copied!' : 'Copy to clipboard'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download as .txt
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
