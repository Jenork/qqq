'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { USDC_GRENADE_REWARD_ITEM_ID } from '@/config/missions'
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

export function Hud({ forceLandscapeLayout = false }: { forceLandscapeLayout?: boolean }) {
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
  const bossHp = useGameStore((state) => state.bossHp)
  const bossMaxHp = useGameStore((state) => state.bossMaxHp)
  const unlockedItemIds = useGameStore((state) => state.unlockedItemIds)
  const status = useGameStore((state) => state.status)
  const togglePause = useGameStore((state) => state.togglePause)
  const { showTouchControls, isMobileLandscape } = useMobileViewport()
  const previousHpRef = useRef(hp)
  const previousArmorRef = useRef(armor)
  const [hpHit, setHpHit] = useState(false)
  const [armorHit, setArmorHit] = useState(false)
  const [waveToast, setWaveToast] = useState<number | null>(null)

  const grenadeUnlocked =
    unlockedItemIds.includes('frag-grenade') || unlockedItemIds.includes(USDC_GRENADE_REWARD_ITEM_ID)
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  const armorPercent = maxArmor > 0 ? Math.max(0, Math.min(100, (armor / maxArmor) * 100)) : 0
  const grenadeLabel = grenadeUnlocked ? formatCooldown(grenadeCooldownRemaining) : 'Locked'
  const abilityLabel =
    shieldRemaining > 0 ? `On ${formatCooldown(shieldRemaining)}` : formatCooldown(abilityCooldownRemaining)
  const healLabel =
    healCharges <= 0 ? 'Empty' : healCooldownRemaining > 0 ? formatCooldown(healCooldownRemaining) : `x${healCharges}`
  const grenadeIcon = getItemIconPath('frag-grenade')
  const abilityIcon = getItemIconPath('shield')
  const healIcon = getItemIconPath('medkit')
  const isWaveMessage = Boolean(activeMessage && /wave/i.test(activeMessage))
  const armoredRewardActive = maxArmor > 0
  const shotgunUnlocked = unlockedItemIds.includes('shotgun')
  const compactHud = showTouchControls
  const compactLandscapeHud = compactHud && (isMobileLandscape || forceLandscapeLayout)
  const bossVisible = bossMaxHp > 0 && bossHp > 0
  const bossHpPercent = bossVisible ? Math.max(0, Math.min(100, (bossHp / bossMaxHp) * 100)) : 0
  const lowHp = status === 'playing' && hpPercent <= 35

  useEffect(() => {
    if (hp < previousHpRef.current) {
      setHpHit(true)
      const timeout = window.setTimeout(() => setHpHit(false), 420)
      previousHpRef.current = hp
      return () => window.clearTimeout(timeout)
    }

    previousHpRef.current = hp
  }, [hp])

  useEffect(() => {
    if (armor < previousArmorRef.current) {
      setArmorHit(true)
      const timeout = window.setTimeout(() => setArmorHit(false), 420)
      previousArmorRef.current = armor
      return () => window.clearTimeout(timeout)
    }

    previousArmorRef.current = armor
  }, [armor])

  useEffect(() => {
    if (status === 'ready') {
      setWaveToast(null)
      return
    }

    setWaveToast(wave)
    const timeout = window.setTimeout(() => setWaveToast(null), 1100)
    return () => window.clearTimeout(timeout)
  }, [status, wave])

  const desktopStatusEntries = [
    { label: 'Grenade', value: grenadeLabel, icon: grenadeIcon, tone: 'text-amber-200' },
    {
      label: 'Ability',
      value: abilityLabel,
      icon: abilityIcon,
      tone: shieldRemaining > 0 ? 'text-cyan-100' : 'text-[#8ad5ff]',
    },
    { label: 'Heal', value: healLabel, icon: healIcon, tone: 'text-[#85ff78]' },
  ]

  if (compactHud) {
    return (
      <div className="pointer-events-none absolute inset-0 z-20">
        {lowHp ? <div className="mobile-low-hp-vignette" /> : null}

        <div className={cn(
          'absolute left-[calc(6px+var(--safe-left))] right-[calc(6px+var(--safe-right))] top-[calc(5px+var(--safe-top))] grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2',
          compactLandscapeHud && 'left-[calc(7px+var(--safe-left))] right-[calc(7px+var(--safe-right))] top-[calc(5px+var(--safe-top))] gap-1.5',
        )}>
          <div className={cn(
            'mobile-hud-glass flex min-w-0 items-center gap-1.5 rounded-full px-2 py-1',
            compactLandscapeHud && 'max-w-[54vw] gap-1 px-1.5 py-0.5',
          )}>
            <div className={cn(
              'relative z-[1] flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full border border-cyan-200/20 bg-cyan-300/10 shadow-[inset_0_0_12px_rgba(65,196,255,0.16)]',
              compactLandscapeHud && 'h-[24px] w-[24px]',
            )}>
              <Image
                src={armoredRewardActive ? '/ui/helmet-armored.png' : '/ui/helmet-base.png'}
                alt="Marine portrait"
                width={64}
                height={64}
                className={cn(
                  'h-[20px] w-[20px] scale-[1.55] object-contain [image-rendering:auto]',
                  compactLandscapeHud && 'h-[17px] w-[17px] scale-[1.35]',
                )}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className={cn('flex items-center justify-between gap-1.5', compactLandscapeHud && 'gap-1')}>
                <span className={cn('text-[7px] font-black uppercase tracking-[0.1em] text-rose-100', compactLandscapeHud && 'text-[6px]')}>
                  HP
                </span>
                <span className={cn('text-[8px] font-black text-rose-50', compactLandscapeHud && 'text-[7px]')}>
                  {Math.ceil(hp)}/{maxHp}
                </span>
              </div>
              <div className={cn('mt-0.5 h-1.5 overflow-hidden rounded-full border border-rose-200/12 bg-black/45', compactLandscapeHud && 'h-1', hpHit && 'mobile-hp-hit', lowHp && 'mobile-hp-low')}>
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#d80f10_0%,#ff5f1e_62%,#ffc45e_100%)] transition-[width] duration-300 ease-out"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>

              <div className={cn('mt-0.5 flex items-center justify-between gap-1.5', compactLandscapeHud && 'gap-1')}>
                <span className={cn('text-[7px] font-black uppercase tracking-[0.1em] text-cyan-100', compactLandscapeHud && 'text-[6px]')}>
                  Armor
                </span>
                <span className={cn('text-[8px] font-black text-cyan-50', compactLandscapeHud && 'text-[7px]')}>
                  {armor}/{maxArmor || 0}
                </span>
              </div>
              <div className={cn('mt-0.5 h-1 overflow-hidden rounded-full border border-cyan-300/12 bg-black/45', compactLandscapeHud && 'h-[3px]', armorHit && 'mobile-armor-hit')}>
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#0b5d83_0%,#28b8db_100%)] transition-[width] duration-300 ease-out"
                  style={{ width: `${armorPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mobile-hud-glass justify-self-center rounded-full px-2.5 py-1 text-center">
            <div className="text-[6px] font-black uppercase tracking-[0.12em] text-cyan-100/70">Wave</div>
            <div className="text-[12px] font-black leading-none text-cyan-50">{wave}</div>
          </div>

          <div className="flex items-start justify-end gap-1">
            <div className="mobile-hud-glass rounded-full px-2.5 py-1 text-right">
              <div className="text-[6px] font-black uppercase tracking-[0.12em] text-cyan-100/70">Score</div>
              <div className="text-[12px] font-black leading-none text-amber-200">{score}</div>
            </div>
            <button
              type="button"
              className={cn(
                'mobile-hud-glass pointer-events-auto rounded-full px-2.5 py-2 text-[8px] font-black uppercase tracking-[0.1em] text-cyan-50 transition active:scale-95',
                compactLandscapeHud && 'px-2 py-1.5 text-[7px]',
              )}
              disabled={status === 'ready' || status === 'gameover'}
              onClick={() => togglePause()}
            >
              {status === 'paused' ? 'Run' : 'Pause'}
            </button>
          </div>
        </div>

        {waveToast !== null ? (
          <div key={waveToast} className="mobile-wave-toast">
            WAVE {waveToast}
          </div>
        ) : null}

        {bossVisible ? (
          <div className={cn('inferno-frame pointer-events-none mx-auto w-[min(100%,260px)] px-2 py-1', compactLandscapeHud && 'w-[min(100%,220px)] px-1.5 py-0.5')}>
            <div className="relative z-[1] flex items-center justify-between gap-2">
              <span className={cn('text-[7px] font-black uppercase tracking-[0.1em] text-cyan-100', compactLandscapeHud && 'text-[6px]')}>Boss</span>
              <span className={cn('text-[9px] font-black text-cyan-50', compactLandscapeHud && 'text-[8px]')}>
                {bossHp}/{bossMaxHp}
              </span>
            </div>
            <div className={cn('relative z-[1] mt-1 h-1.5 overflow-hidden rounded-full border border-cyan-200/18 bg-black/50', compactLandscapeHud && 'mt-0.5 h-1')}>
              <div
                className="h-full bg-[linear-gradient(90deg,#1b8be0_0%,#72e7ff_70%,#e7fbff_100%)] transition-all"
                style={{ width: `${bossHpPercent}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2 sm:p-3">
      <div className="pointer-events-auto flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <div className="inferno-frame w-[min(100%,344px)] px-3 py-3">
            <div className="relative z-[1] flex items-center gap-3">
              <div className="flex h-[62px] w-[62px] items-center justify-center rounded-[18px] border border-cyan-300/18 bg-[radial-gradient(circle_at_50%_25%,rgba(73,202,255,0.18),rgba(3,12,24,0.98)_68%)] text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100 shadow-[inset_0_0_18px_rgba(65,196,255,0.16)]">
                <Image
                  src={armoredRewardActive ? '/ui/helmet-armored.png' : '/ui/helmet-base.png'}
                  alt="Marine portrait"
                  width={96}
                  height={96}
                  className="h-[54px] w-[54px] scale-[2.9] object-contain [image-rendering:auto]"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-200">HP</span>
                  <span className="text-sm font-black text-rose-50">{Math.ceil(hp)}/{maxHp}</span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-[4px] border border-rose-300/18 bg-black/50">
                  <div
                    className="h-full bg-[linear-gradient(90deg,#b50b07_0%,#ff5f1e_62%,#ffc45e_100%)] transition-all"
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">Armor</span>
                  <span className="text-sm font-black text-cyan-50">{armor}/{maxArmor || 0}</span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-[4px] border border-cyan-400/18 bg-black/50">
                  <div
                    className="h-full bg-[linear-gradient(90deg,#0b5d83_0%,#28b8db_100%)] transition-all"
                    style={{ width: `${armorPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex max-w-[62%] flex-col items-end gap-2">
            <div className="grid grid-cols-[repeat(2,minmax(84px,1fr))] gap-2 sm:grid-cols-[repeat(7,minmax(72px,1fr))]">
              <div className="inferno-frame min-w-[82px] px-3 py-2 text-center">
                <div className="relative z-[1] text-[9px] font-black uppercase tracking-[0.16em] text-cyan-100/80">Score</div>
                <div className="relative z-[1] mt-1 text-2xl font-black text-amber-200">{score}</div>
              </div>
              {desktopStatusEntries.map((entry) => (
                <div key={entry.label} className="inferno-frame min-w-[82px] px-3 py-2 text-center">
                  <div className="relative z-[1] flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-100/80">
                    {entry.icon ? (
                      <Image
                        src={entry.icon}
                        alt=""
                        width={24}
                        height={24}
                        className="h-3.5 w-3.5 object-contain [image-rendering:pixelated]"
                      />
                    ) : null}
                    <span>{entry.label}</span>
                  </div>
                  <div className={cn('relative z-[1] mt-1 text-lg font-black', entry.tone)}>{entry.value}</div>
                </div>
              ))}
            </div>

            {shotgunUnlocked ? (
              <div className="flex flex-wrap justify-end gap-1">
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
                    ? 'text-[9px] font-black text-cyan-50 shadow-[0_0_18px_rgba(65,196,255,0.18)]'
                    : 'text-[8px] text-cyan-100/80',
                )}
              >
                {activeMessage}
              </p>
            ) : null}

            {bossVisible ? (
              <div className="inferno-frame w-[min(100%,420px)] px-3 py-2">
                <div className="relative z-[1] flex items-center justify-between gap-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">Boss Core</span>
                  <span className="text-sm font-black text-cyan-50">
                    {bossHp}/{bossMaxHp}
                  </span>
                </div>
                <div className="relative z-[1] mt-1.5 h-2.5 overflow-hidden rounded-full border border-cyan-200/18 bg-black/50">
                  <div
                    className="h-full bg-[linear-gradient(90deg,#1b8be0_0%,#72e7ff_70%,#e7fbff_100%)] transition-all"
                    style={{ width: `${bossHpPercent}%` }}
                  />
                </div>
              </div>
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
    </div>
  )
}
