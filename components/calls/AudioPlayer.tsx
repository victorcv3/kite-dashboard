'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause, Volume2 } from 'lucide-react'

export function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  function togglePlay() {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => {
          if (audioRef.current) setProgress(audioRef.current.currentTime)
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration)
        }}
        onEnded={() => setPlaying(false)}
      />
      <Button
        variant="ghost"
        size="icon"
        className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white"
        onClick={togglePlay}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </Button>

      <div className="flex-1">
        <div className="relative h-1.5 bg-slate-200 rounded-full">
          <div
            className="absolute left-0 top-0 h-full bg-indigo-600 rounded-full transition-all"
            style={{ width: duration ? `${(progress / duration) * 100}%` : '0%' }}
          />
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={progress}
            onChange={e => {
              const t = Number(e.target.value)
              setProgress(t)
              if (audioRef.current) audioRef.current.currentTime = t
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <Volume2 className="w-4 h-4 text-slate-400" />
    </div>
  )
}
