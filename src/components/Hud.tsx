'use client'

import { useEffect, useState } from 'react'
import { SOCIAL_GRENADE_REWARD_ITEM_ID } from '@/config/missions'
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
  const armor = useGameStore((state) => state.armor)
  const maxArmor = useGameStore((state) => state.maxArmor)
  const score = useGameStore((state) => state.score)
  const wave = useGameStore((state) => state.wave)
  const activeMessage = useGameStore((state) => state.activeMessage)
  const grenadeCooldownRemaining = useGameStore((state) => state.grenadeCooldownRemaining)
  const abilityCooldownRemaining = useGameStore((state) => state.abilityCooldownRemaining)
  const healCooldownRemaining = useGameStore((state) => state.healCooldownRemaining)
  const shieldRemaining = useGameStore((state) => state.shieldRemaining)
  const healCharges = useGameStore((state) => state.healCharges)
  const unlockedItemIds = useGameStore((state) => state.unlockedItemIds)
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

  const grenadeUnlocked =
    unlockedItemIds.includes('frag-grenade') || unlockedItemIds.includes(SOCIAL_GRENADE_REWARD_ITEM_ID)
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  const grenadeLabel = grenadeUnlocked ? formatCooldown(grenadeCooldownRemaining) : 'Locked'
  const abilityLabel = shieldRemaining > 0 ? `On ${formatCooldown(shieldRemaining)}` : formatCooldown(abilityCooldownRemaining)
  const healLabel = healCharges <= 0 ? 'Empty' : healCooldownRemaining > 0 ? formatCooldown(healCooldownRemaining) : `x${healCharges}`
  const grenadeIcon = getItemIconPath('frag-grenade')
  const abilityIcon = getItemIconPath('shield')
  const healIcon = getItemIconPath('medkit')
  const isWaveMessage = Boolean(activeMessage && /wave/i.test(activeMessage))
  const armoredRewardActive = maxArmor > 0
  const fireGrenadeUnlocked = unlockedItemIds.includes(SOCIAL_GRENADE_REWARD_ITEM_ID)
  const shotgunUnlocked = unlockedItemIds.includes('shotgun')

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2 sm:p-3">
      <div className="pointer-events-auto flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <div className="inferno-frame w-[min(100%,344px)] px-3 py-3">
            <div className="relative z-[1] flex items-center gap-3">
              <div className="flex h-[62px] w-[62px] items-center justify-center rounded-[18px] border border-[#7d2416] bg-[radial-gradient(circle_at_50%_25%,rgba(255,114,41,0.22),rgba(28,8,8,0.98)_68%)] text-[10px] font-black uppercase tracking-[0.18em] text-[#ffcf9f] shadow-[inset_0_0_18px_rgba(255,86,22,0.18)]">
                Marine
              </div>

              <div className="min-w-0 flex-1">
                <p className="micro-copy mb-1">Gameplay HUD - In Game</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ffb47f]">HP</span>
                  <span className="text-sm font-black text-[#ffe1ba]">{Math.ceil(hp)}/{maxHp}</span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-[4px] border border-[#7b2115] bg-black/50">
                  <div
                    className="h-full bg-[linear-gradient(90deg,#b50b07_0%,#ff5f1e_62%,#ffc45e_100%)] transition-all"
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#77dfff]">Armor</span>
                  <span className="text-sm font-black text-[#b3f0ff]">{armor}/{maxArmor || 0}</span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-[4px] border border-cyan-400/18 bg-black/50">
                  <div
                    className="h-full bg-[linear-gradient(90deg,#0b5d83_0%,#28b8db_100%)] transition-all"
                    style={{ width: `${maxArmor > 0 ? (armor / maxArmor) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex max-w-[56%] flex-col items-end gap-2">
            <div className="grid grid-cols-[repeat(2,minmax(84px,1fr))] gap-2 sm:grid-cols-[repeat(5,minmax(82px,1fr))]">
              <div className="inferno-frame min-w-[82px] px-3 py-2 text-center">
                <div className="relative z-[1] text-[9px] font-black uppercase tracking-[0.16em] text-[#ffb37e]">Score</div>
                <div className="relative z-[1] mt-1 text-2xl font-black text-[#ff9c36]">{score}</div>
              </div>
              <div className="inferno-frame min-w-[82px] px-3 py-2 text-center">
                <div className="relative z-[1] text-[9px] font-black uppercase tracking-[0.16em] text-[#ffb37e]">Wave</div>
                <div className="relative z-[1] mt-1 text-2xl font-black text-[#ff9c36]">{wave}</div>
              </div>

              {[
                { label: 'Grenade', value: grenadeLabel, icon: grenadeIcon, tone: 'text-[#ffb86e]' },
                { label: 'Ability', value: abilityLabel, icon: abilityIcon, tone: shieldRemaining > 0 ? 'text-cyan-100' : 'text-[#8ad5ff]' },
                { label: 'Heal', value: healLabel, icon: healIcon, tone: 'text-[#85ff78]' },
              ].map((entry) => (
                <div key={entry.label} className="inferno-frame min-w-[82px] px-3 py-2 text-center">
                  <div className="relative z-[1] flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#ffb37e]">
                    {entry.icon ? (
                      <img src={entry.icon} alt="" className="h-3.5 w-3.5 object-contain [image-rendering:pixelated]" />
                    ) : null}
                    <span>{entry.label}</span>
                  </div>
                  <div className={cn('relative z-[1] mt-1 text-lg font-black', entry.tone)}>{entry.value}</div>
                </div>
              ))}
            </div>

            {armoredRewardActive || fireGrenadeUnlocked || shotgunUnlocked ? (
              <div className="flex flex-wrap justify-end gap-1">
                {armoredRewardActive ? (
                  <span className="inferno-chip rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-rose-100 sm:text-[9px]">
                    Armored
                  </span>
                ) : null}
                {fireGrenadeUnlocked ? (
                  <span className="inferno-chip rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-orange-50 sm:text-[9px]">
                    Fire Grenade
                  </span>
                ) : null}
                {shotgunUnlocked ? (
                  <span className="inferno-chip rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-amber-100 sm:text-[9px]">
                    Shotgun Unlocked
                  </span>
                ) : null}
              </div>
            ) : null}

            {activeMessage ? (
              <p
                className={cn(
                  'inferno-chip max-w-[320px] rounded-full px-2.5 py-1 text-right uppercase tracking-[0.14em] sm:text-[9px]',
                  isWaveMessage
                    ? 'text-[9px] font-black text-orange-50 shadow-[0_0_18px_rgba(255,145,63,0.18)]'
                    : 'text-[8px] text-orange-100/80',
                )}
              >
                {activeMessage}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="action-button rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em]"
            disabled={status === 'ready' || status === 'gameover'}
            onClick={() => togglePause()}
          >
            {status === 'paused' ? 'Resume' : 'Pause'}
          </button>
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
                disabled={!grenadeUnlocked}
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
