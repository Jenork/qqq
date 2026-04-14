'use client'

import { useEffect, useState } from 'react'
import { getItemIconPath } from '@/config/items'
import { useGameStore } from '@/hooks/useGameStore'
import { cn } from '@/lib/cn'

function formatCooldown(remainingMs: number) {
  if (remainingMs <= 0) {
    return 'Ready'
  }

  return `${(remainingMs / 1000).toFixed(1)}s`
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
        'action-button min-h-14 min-w-14 px-4 py-3 text-sm font-black uppercase tracking-[0.16em]',
        className,
      )}
      onPointerDown={() => onHoldChange(true)}
      onPointerUp={() => onHoldChange(false)}
      onPointerLeave={() => onHoldChange(false)}
      onPointerCancel={() => onHoldChange(false)}
    >
      {label}
    </button>
  )
}

export function Hud() {
  const hp = useGameStore((state) => state.hp)
  const maxHp = useGameStore((state) => state.maxHp)
  const score = useGameStore((state) => state.score)
  const wave = useGameStore((state) => state.wave)
  const activeMessage = useGameStore((state) => state.activeMessage)
  const grenadeCooldownRemaining = useGameStore((state) => state.grenadeCooldownRemaining)
  const abilityCooldownRemaining = useGameStore((state) => state.abilityCooldownRemaining)
  const healCooldownRemaining = useGameStore((state) => state.healCooldownRemaining)
  const shieldRemaining = useGameStore((state) => state.shieldRemaining)
  const healCharges = useGameStore((state) => state.healCharges)
  const status = useGameStore((state) => state.status)
  const togglePause = useGameStore((state) => state.togglePause)
  const setMobileControl = useGameStore((state) => state.setMobileControl)
  const pulseAction = useGameStore((state) => state.pulseAction)
  const [showTouchControls, setShowTouchControls] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: coarse), (max-width: 1023px)')
    const sync = () => setShowTouchControls(mediaQuery.matches)

    sync()
    mediaQuery.addEventListener('change', sync)

    return () => mediaQuery.removeEventListener('change', sync)
  }, [])

  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  const grenadeLabel = formatCooldown(grenadeCooldownRemaining)
  const abilityLabel = shieldRemaining > 0 ? `On ${formatCooldown(shieldRemaining)}` : formatCooldown(abilityCooldownRemaining)
  const healLabel = healCharges <= 0 ? 'Empty' : healCooldownRemaining > 0 ? formatCooldown(healCooldownRemaining) : `x${healCharges}`
  const grenadeIcon = getItemIconPath('frag-grenade')
  const abilityIcon = getItemIconPath('shield')
  const healIcon = getItemIconPath('medkit')
  const isWaveMessage = Boolean(activeMessage && /wave/i.test(activeMessage))

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2 sm:p-3">
      <div className="pointer-events-auto flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {status !== 'ready' && status !== 'gameover' ? (
            <button
              type="button"
              onClick={togglePause}
              className="rounded-full border border-white/10 bg-black/24 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-stone-100 backdrop-blur"
            >
              {status === 'paused' ? 'Play' : 'Pause'}
            </button>
          ) : null}
        </div>

        <div className="flex max-w-[72%] flex-col items-end gap-1 sm:max-w-[62%]">
          <div className="w-[min(100%,360px)] rounded-[20px] border border-white/10 bg-black/24 px-2.5 py-2 backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
                    HP {Math.ceil(hp)}/{maxHp}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="rounded-full border border-white/10 bg-black/28 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-orange-100">
                      W {wave}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/28 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-amber-200">
                      S {score}
                    </span>
                  </div>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-black/45">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-700 via-orange-500 to-yellow-300 transition-all"
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-1">
            <span className="flex items-center gap-1 rounded-full border border-white/10 bg-black/24 px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-orange-100 sm:text-[9px]">
              {grenadeIcon ? (
                <img src={grenadeIcon} alt="" className="h-3.5 w-3.5 object-contain [image-rendering:pixelated]" />
              ) : null}
              GR {grenadeLabel}
            </span>
            <span
              className={cn(
                'flex items-center gap-1 rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] sm:text-[9px]',
                shieldRemaining > 0
                  ? 'border-cyan-300/25 bg-cyan-500/12 text-cyan-100'
                  : 'border-white/10 bg-black/24 text-orange-100',
              )}
            >
              {abilityIcon ? (
                <img src={abilityIcon} alt="" className="h-3.5 w-3.5 object-contain [image-rendering:pixelated]" />
              ) : null}
              AB {abilityLabel}
            </span>
            <span className="flex items-center gap-1 rounded-full border border-white/10 bg-black/24 px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-orange-100 sm:text-[9px]">
              {healIcon ? (
                <img src={healIcon} alt="" className="h-3.5 w-3.5 object-contain [image-rendering:pixelated]" />
              ) : null}
              HL {healLabel}
            </span>
          </div>

          {activeMessage ? (
            <p
              className={cn(
                'max-w-[320px] rounded-full border px-2.5 py-1 text-right uppercase tracking-[0.14em] sm:text-[9px]',
                isWaveMessage
                  ? 'border-orange-300/22 bg-orange-500/14 text-[9px] font-black text-orange-50 shadow-[0_0_18px_rgba(255,145,63,0.18)]'
                  : 'border-orange-200/10 bg-black/24 text-[8px] text-orange-100/80',
              )}
            >
              {activeMessage}
            </p>
          ) : null}
        </div>
      </div>

      {showTouchControls ? (
        <div className="pointer-events-auto grid grid-cols-[1fr_auto] items-end gap-2">
          <div className="rounded-[24px] border border-white/10 bg-black/24 p-1.5 backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-2">
              <HoldButton
                label="L"
                onHoldChange={(value) => setMobileControl('left', value)}
                className="min-h-[72px] min-w-[72px] rounded-full border-white/10 bg-white/6 px-3"
              />
              <HoldButton
                label="R"
                onHoldChange={(value) => setMobileControl('right', value)}
                className="min-h-[72px] min-w-[72px] rounded-full border-white/10 bg-white/6 px-3"
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/24 p-1.5 backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-2">
              <HoldButton
                label="Jump"
                onHoldChange={(value) => setMobileControl('jump', value)}
                className="min-h-[68px] min-w-[74px] rounded-full border-white/10 bg-white/6 px-3 text-[12px]"
              />
              <HoldButton
                label="Shoot"
                onHoldChange={(value) => setMobileControl('shoot', value)}
                className="min-h-[68px] min-w-[74px] rounded-full border-orange-300/20 bg-orange-500/16 px-3 text-[12px]"
              />
              <button
                type="button"
                className="action-button min-h-[56px] rounded-full border-white/10 bg-white/6 px-2 py-2 text-[10px] font-black uppercase tracking-[0.16em]"
                onClick={() => pulseAction('grenade')}
              >
                Gren
              </button>
              <button
                type="button"
                className="action-button min-h-[56px] rounded-full border-white/10 bg-white/6 px-2 py-2 text-[10px] font-black uppercase tracking-[0.16em]"
                onClick={() => pulseAction('ability')}
              >
                Skill
              </button>
              <button
                type="button"
                className="action-button col-span-2 min-h-[52px] rounded-full border-white/10 bg-white/6 px-2 py-2 text-[10px] font-black uppercase tracking-[0.16em]"
                onClick={() => pulseAction('heal')}
              >
                Heal
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div />
      )}
    </div>
  )
}
