'use client'

import { useGameStore } from '@/hooks/useGameStore'
import { cn } from '@/lib/cn'

export function AudioToggleButton({ className }: { className?: string }) {
  const audioMuted = useGameStore((state) => state.audioMuted)
  const toggleAudioMuted = useGameStore((state) => state.toggleAudioMuted)

  return (
    <button
      type="button"
      onClick={toggleAudioMuted}
      className={cn(
        'rounded-full border px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] shadow-[0_10px_24px_rgba(0,0,0,0.28)] backdrop-blur transition-colors',
        !className ? 'fixed right-3 top-3 z-40 sm:right-4 sm:top-4' : '',
        audioMuted
          ? 'border-white/10 bg-black/45 text-stone-100'
          : 'border-orange-300/25 bg-orange-500/16 text-orange-100',
        className,
      )}
    >
      {audioMuted ? 'Sound Off' : 'Sound On'}
    </button>
  )
}
