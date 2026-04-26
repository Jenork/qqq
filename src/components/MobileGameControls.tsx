'use client'

import { type PointerEvent as ReactPointerEvent, useEffect } from 'react'
import { SOCIAL_GRENADE_REWARD_ITEM_ID } from '@/config/missions'
import { useGameStore } from '@/hooks/useGameStore'
import { cn } from '@/lib/cn'

function releaseHeldControl(
  event: ReactPointerEvent<HTMLButtonElement>,
  onHoldChange: (active: boolean) => void,
) {
  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  onHoldChange(false)
}

function HoldButton({
  label,
  onHoldChange,
  className,
}: {
  label: string
  onHoldChange: (active: boolean) => void
  className?: string
}) {
  return (
    <button
      type="button"
      className={cn(
        'action-button touch-none select-none rounded-[18px] px-3 py-3 text-xs font-black uppercase tracking-[0.16em]',
        className,
      )}
      onPointerDown={(event) => {
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        onHoldChange(true)
      }}
      onPointerUp={(event) => releaseHeldControl(event, onHoldChange)}
      onPointerCancel={(event) => releaseHeldControl(event, onHoldChange)}
      onLostPointerCapture={() => onHoldChange(false)}
    >
      {label}
    </button>
  )
}

export function MobileGameControls({ portraitMode = false }: { portraitMode?: boolean }) {
  const unlockedItemIds = useGameStore((state) => state.unlockedItemIds)
  const status = useGameStore((state) => state.status)
  const setMobileControl = useGameStore((state) => state.setMobileControl)
  const pulseAction = useGameStore((state) => state.pulseAction)
  const togglePause = useGameStore((state) => state.togglePause)

  useEffect(() => {
    return () => {
      const store = useGameStore.getState()
      store.setMobileControl('left', false)
      store.setMobileControl('right', false)
      store.setMobileControl('jump', false)
      store.setMobileControl('shoot', false)
    }
  }, [])

  const grenadeUnlocked =
    unlockedItemIds.includes('frag-grenade') || unlockedItemIds.includes(SOCIAL_GRENADE_REWARD_ITEM_ID)

  return (
    <div
      className={cn(
        'grid gap-3',
        portraitMode
          ? 'grid-cols-1'
          : 'grid-cols-1 items-stretch md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.1fr)]',
      )}
    >
      <div className="inferno-frame p-3 sm:p-4">
        <div className="relative z-[1]">
          <p className="panel-title">Move</p>
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            <HoldButton
              label="Left"
              onHoldChange={(value) => setMobileControl('left', value)}
              className="min-h-[76px] px-4 py-4"
            />
            <HoldButton
              label="Jump"
              onHoldChange={(value) => setMobileControl('jump', value)}
              className="min-h-[76px] border-cyan-300/18 bg-cyan-500/10 px-4 py-4"
            />
            <HoldButton
              label="Right"
              onHoldChange={(value) => setMobileControl('right', value)}
              className="min-h-[76px] px-4 py-4"
            />
          </div>
        </div>
      </div>

      <div className="inferno-frame p-3 sm:p-4">
        <div className="relative z-[1]">
          <p className="panel-title">Combat</p>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <HoldButton
              label="Shoot"
              onHoldChange={(value) => setMobileControl('shoot', value)}
              className="col-span-2 min-h-[84px] border-orange-300/20 bg-orange-500/16 px-4 py-4 text-sm"
            />

            <button
              type="button"
              className="action-button min-h-[68px] rounded-[18px] px-4 py-4 text-xs font-black uppercase tracking-[0.16em]"
              disabled={!grenadeUnlocked}
              onClick={() => pulseAction('grenade')}
            >
              Grenade
            </button>
            <button
              type="button"
              className="action-button min-h-[68px] rounded-[18px] px-4 py-4 text-xs font-black uppercase tracking-[0.16em]"
              onClick={() => pulseAction('ability')}
            >
              Ability
            </button>
            <button
              type="button"
              className="action-button min-h-[68px] rounded-[18px] px-4 py-4 text-xs font-black uppercase tracking-[0.16em]"
              onClick={() => pulseAction('heal')}
            >
              Heal
            </button>
            <button
              type="button"
              className="action-button min-h-[68px] rounded-[18px] px-4 py-4 text-xs font-black uppercase tracking-[0.16em]"
              onClick={() => togglePause()}
            >
              {status === 'paused' ? 'Resume' : 'Pause'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
