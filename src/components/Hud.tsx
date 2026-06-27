'use client'

import Image from 'next/image'
import { USDC_GRENADE_REWARD_ITEM_ID } from '@/config/missions'
import { getItemById, getItemIconPath } from '@/config/items'
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
  const bossHp = useGameStore((state) => state.bossHp)
  const bossMaxHp = useGameStore((state) => state.bossMaxHp)
  const equippedWeapon = useGameStore((state) => state.equippedWeapon)
  const unlockedItemIds = useGameStore((state) => state.unlockedItemIds)
  const status = useGameStore((state) => state.status)
  const togglePause = useGameStore((state) => state.togglePause)
  const { showTouchControls, isMobileLandscape } = useMobileViewport()

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
  const fireGrenadeUnlocked = unlockedItemIds.includes(USDC_GRENADE_REWARD_ITEM_ID)
  const shotgunUnlocked = unlockedItemIds.includes('shotgun')
  const compactHud = showTouchControls
  const weaponLabel = getItemById(equippedWeapon)?.label ?? 'Pistol'
  const shortWeaponLabel =
    equippedWeapon === 'shotgun' ? 'SG' : equippedWeapon === 'burst-rifle' ? 'BR' : 'PI'
  const ammoLabel = equippedWeapon === 'shotgun' ? '8+' : 'INF'
  const bossVisible = bossMaxHp > 0 && bossHp > 0
  const bossHpPercent = bossVisible ? Math.max(0, Math.min(100, (bossHp / bossMaxHp) * 100)) : 0

  const desktopStatusEntries = [
    { label: 'Weapon', value: weaponLabel, icon: null, tone: 'text-cyan-50' },
    { label: 'Ammo', value: ammoLabel, icon: null, tone: 'text-cyan-50' },
    { label: 'Grenade', value: grenadeLabel, icon: grenadeIcon, tone: 'text-amber-200' },
    {
      label: 'Ability',
      value: abilityLabel,
      icon: abilityIcon,
      tone: shieldRemaining > 0 ? 'text-cyan-100' : 'text-[#8ad5ff]',
    },
    { label: 'Heal', value: healLabel, icon: healIcon, tone: 'text-[#85ff78]' },
  ]

  const mobileStatusEntries = [
    { label: 'Score', value: String(score), tone: 'text-amber-200' },
    { label: 'Wave', value: String(wave), tone: 'text-amber-200' },
    { label: 'Wpn', value: shortWeaponLabel, tone: 'text-cyan-50' },
    { label: 'Ammo', value: ammoLabel, tone: 'text-cyan-50' },
    { label: 'Gren', value: grenadeLabel, tone: 'text-cyan-100' },
    { label: 'Skill', value: abilityLabel, tone: shieldRemaining > 0 ? 'text-cyan-100' : 'text-[#8ad5ff]' },
    { label: 'Heal', value: healLabel, tone: 'text-[#85ff78]' },
  ]

  if (compactHud) {
    return (
      <div className="pointer-events-none absolute left-[calc(4px+var(--safe-left))] right-[calc(4px+var(--safe-right))] top-[calc(4px+var(--safe-top))] z-20 flex flex-col gap-1">
        <div className="pointer-events-auto flex items-stretch gap-1">
          <div className="inferno-frame flex min-w-0 flex-[1.2] items-center gap-1.5 px-2 py-1.5">
            <div className="relative z-[1] flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px] border border-cyan-300/18 bg-[radial-gradient(circle_at_50%_25%,rgba(73,202,255,0.18),rgba(3,12,24,0.98)_68%)] shadow-[inset_0_0_18px_rgba(65,196,255,0.16)]">
              <Image
                src={armoredRewardActive ? '/ui/helmet-armored.png' : '/ui/helmet-base.png'}
                alt="Marine portrait"
                width={64}
                height={64}
                className="h-[22px] w-[22px] scale-[1.65] object-contain [image-rendering:auto]"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[7px] font-black uppercase tracking-[0.1em] text-rose-200">HP</span>
                <span className="text-[9px] font-black text-rose-50">
                  {Math.ceil(hp)}/{maxHp}
                </span>
              </div>
              <div className="mt-0.5 h-1.5 overflow-hidden rounded-[4px] border border-rose-300/18 bg-black/50">
                <div
                  className="h-full bg-[linear-gradient(90deg,#b50b07_0%,#ff5f1e_62%,#ffc45e_100%)] transition-all"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>

              <div className="mt-0.5 flex items-center justify-between gap-1.5">
                <span className="text-[7px] font-black uppercase tracking-[0.1em] text-cyan-200">Armor</span>
                <span className="text-[9px] font-black text-cyan-50">
                  {armor}/{maxArmor || 0}
                </span>
              </div>
              <div className="mt-0.5 h-1 overflow-hidden rounded-[4px] border border-cyan-400/18 bg-black/50">
                <div
                  className="h-full bg-[linear-gradient(90deg,#0b5d83_0%,#28b8db_100%)] transition-all"
                  style={{ width: `${armorPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div
            className={cn(
              'grid min-w-0 flex-1 gap-1',
              isMobileLandscape ? 'grid-cols-7' : 'grid-cols-4',
            )}
          >
            {mobileStatusEntries.map((entry) => (
              <div key={entry.label} className="inferno-frame min-w-0 px-1 py-1 text-center">
                <div className="relative z-[1] truncate text-[6px] font-black uppercase tracking-[0.1em] text-cyan-100/80">
                  {entry.label}
                </div>
                <div className={cn('relative z-[1] mt-0.5 truncate text-[9px] font-black', entry.tone)}>
                  {entry.value}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="action-button shrink-0 rounded-2xl px-2 py-1.5 text-[8px] font-black uppercase tracking-[0.1em]"
            disabled={status === 'ready' || status === 'gameover'}
            onClick={() => togglePause()}
          >
            {status === 'paused' ? 'Run' : 'Pause'}
          </button>
        </div>

        {activeMessage ? (
          <p
            className={cn(
              'pointer-events-none self-center rounded-full px-2 py-0.5 text-[7px] uppercase tracking-[0.1em]',
              isWaveMessage
                ? 'inferno-chip font-black text-cyan-50 shadow-[0_0_14px_rgba(65,196,255,0.18)]'
                : 'text-cyan-100/82',
            )}
          >
            {activeMessage}
          </p>
        ) : null}

        {bossVisible ? (
          <div className="inferno-frame pointer-events-none mx-auto w-[min(100%,260px)] px-2 py-1">
            <div className="relative z-[1] flex items-center justify-between gap-2">
              <span className="text-[7px] font-black uppercase tracking-[0.1em] text-cyan-100">Boss</span>
              <span className="text-[9px] font-black text-cyan-50">
                {bossHp}/{bossMaxHp}
              </span>
            </div>
            <div className="relative z-[1] mt-1 h-1.5 overflow-hidden rounded-full border border-cyan-200/18 bg-black/50">
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
              <div className="inferno-frame min-w-[82px] px-3 py-2 text-center">
                <div className="relative z-[1] text-[9px] font-black uppercase tracking-[0.16em] text-cyan-100/80">Wave</div>
                <div className="relative z-[1] mt-1 text-2xl font-black text-amber-200">{wave}</div>
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
