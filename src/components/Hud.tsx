'use client'

import { SOCIAL_GRENADE_REWARD_ITEM_ID } from '@/config/missions'
import { getItemIconPath } from '@/config/items'
import { useGameStore } from '@/hooks/useGameStore'
import { useMobileViewport } from '@/hooks/useMobileViewport'
import { cn } from '@/lib/cn'

function formatCooldown(remainingMs: number) {
  if (remainingMs <= 0) {
    return 'Ready'
  }

  return `${(remainingMs / 1000).toFixed(1)}s`
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
  const { showTouchControls } = useMobileViewport()

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
  const compactHud = showTouchControls

  return (
    <div className={cn('pointer-events-none absolute inset-0 flex flex-col justify-between', compactHud ? 'p-1.5' : 'p-2 sm:p-3')}>
      <div className={cn('pointer-events-auto flex items-start justify-between', compactHud ? 'gap-1.5' : 'gap-2 sm:gap-3')}>
        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <div className={cn('inferno-frame', compactHud ? 'w-[min(44vw,242px)] px-2.5 py-2' : 'w-[min(100%,344px)] px-3 py-3')}>
            <div className="relative z-[1] flex items-center gap-3">
              <div className={cn(
                'flex items-center justify-center rounded-[18px] border border-[#7d2416] bg-[radial-gradient(circle_at_50%_25%,rgba(255,114,41,0.22),rgba(28,8,8,0.98)_68%)] text-[10px] font-black uppercase tracking-[0.18em] text-[#ffcf9f] shadow-[inset_0_0_18px_rgba(255,86,22,0.18)]',
                compactHud ? 'h-[48px] w-[48px]' : 'h-[62px] w-[62px]',
              )}>
                <img
                  src={armoredRewardActive ? '/ui/helmet-armored.png' : '/ui/helmet-base.png'}
                  alt="Marine portrait"
                  className={cn(
                    'object-contain [image-rendering:auto]',
                    compactHud ? 'h-[40px] w-[40px] scale-[2.2]' : 'h-[54px] w-[54px] scale-[3]',
                  )}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('font-black uppercase tracking-[0.16em] text-[#ffb47f]', compactHud ? 'text-[9px]' : 'text-[10px]')}>HP</span>
                  <span className={cn('font-black text-[#ffe1ba]', compactHud ? 'text-[12px]' : 'text-sm')}>{Math.ceil(hp)}/{maxHp}</span>
                </div>
                <div className={cn('overflow-hidden rounded-[4px] border border-[#7b2115] bg-black/50', compactHud ? 'mt-1 h-2.5' : 'mt-1 h-3')}>
                  <div
                    className="h-full bg-[linear-gradient(90deg,#b50b07_0%,#ff5f1e_62%,#ffc45e_100%)] transition-all"
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>

                <div className={cn('flex items-center justify-between gap-2', compactHud ? 'mt-1.5' : 'mt-2')}>
                  <span className={cn('font-black uppercase tracking-[0.16em] text-[#77dfff]', compactHud ? 'text-[9px]' : 'text-[10px]')}>Armor</span>
                  <span className={cn('font-black text-[#b3f0ff]', compactHud ? 'text-[12px]' : 'text-sm')}>{armor}/{maxArmor || 0}</span>
                </div>
                <div className={cn('overflow-hidden rounded-[4px] border border-cyan-400/18 bg-black/50', compactHud ? 'mt-1 h-2' : 'mt-1 h-2.5')}>
                  <div
                    className="h-full bg-[linear-gradient(90deg,#0b5d83_0%,#28b8db_100%)] transition-all"
                    style={{ width: `${maxArmor > 0 ? (armor / maxArmor) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={cn('flex flex-col items-end', compactHud ? 'max-w-[54%] gap-1.5' : 'max-w-[56%] gap-2')}>
            <div className={cn(
              'grid',
              compactHud ? 'grid-cols-3 gap-1.5' : 'grid-cols-[repeat(2,minmax(84px,1fr))] gap-2 sm:grid-cols-[repeat(5,minmax(82px,1fr))]',
            )}>
              <div className={cn('inferno-frame text-center', compactHud ? 'min-w-0 px-2 py-1.5' : 'min-w-[82px] px-3 py-2')}>
                <div className={cn('relative z-[1] font-black uppercase tracking-[0.16em] text-[#ffb37e]', compactHud ? 'text-[8px]' : 'text-[9px]')}>Score</div>
                <div className={cn('relative z-[1] mt-1 font-black text-[#ff9c36]', compactHud ? 'text-[17px]' : 'text-2xl')}>{score}</div>
              </div>
              <div className={cn('inferno-frame text-center', compactHud ? 'min-w-0 px-2 py-1.5' : 'min-w-[82px] px-3 py-2')}>
                <div className={cn('relative z-[1] font-black uppercase tracking-[0.16em] text-[#ffb37e]', compactHud ? 'text-[8px]' : 'text-[9px]')}>Wave</div>
                <div className={cn('relative z-[1] mt-1 font-black text-[#ff9c36]', compactHud ? 'text-[17px]' : 'text-2xl')}>{wave}</div>
              </div>

              {[
                { label: 'Grenade', value: grenadeLabel, icon: grenadeIcon, tone: 'text-[#ffb86e]' },
                { label: 'Ability', value: abilityLabel, icon: abilityIcon, tone: shieldRemaining > 0 ? 'text-cyan-100' : 'text-[#8ad5ff]' },
                { label: 'Heal', value: healLabel, icon: healIcon, tone: 'text-[#85ff78]' },
              ].map((entry) => (
                <div key={entry.label} className={cn('inferno-frame text-center', compactHud ? 'min-w-0 px-2 py-1.5' : 'min-w-[82px] px-3 py-2')}>
                  <div className={cn(
                    'relative z-[1] flex items-center justify-center gap-1 font-black uppercase tracking-[0.16em] text-[#ffb37e]',
                    compactHud ? 'text-[8px]' : 'text-[9px]',
                  )}>
                    {entry.icon ? (
                      <img
                        src={entry.icon}
                        alt=""
                        className={cn(
                          'object-contain [image-rendering:pixelated]',
                          compactHud ? 'h-3 w-3' : 'h-3.5 w-3.5',
                        )}
                      />
                    ) : null}
                    <span>{entry.label}</span>
                  </div>
                  <div className={cn('relative z-[1] mt-1 font-black', compactHud ? 'text-[13px]' : 'text-lg', entry.tone)}>{entry.value}</div>
                </div>
              ))}
            </div>

            {!compactHud && (armoredRewardActive || fireGrenadeUnlocked || shotgunUnlocked) ? (
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
                  'inferno-chip rounded-full px-2.5 py-1 text-right uppercase tracking-[0.14em]',
                  compactHud ? 'max-w-[220px] text-[8px]' : 'max-w-[320px] sm:text-[9px]',
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

        {!showTouchControls ? (
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
        ) : null}
      </div>
    </div>
  )
}
