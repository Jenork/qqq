'use client'

import { type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { PLAYER_CONFIG } from '@/config/game'
import { getItemIconPath } from '@/config/items'
import { USDC_GRENADE_REWARD_ITEM_ID } from '@/config/missions'
import { useGameStore } from '@/hooks/useGameStore'
import { useMobileViewport } from '@/hooks/useMobileViewport'
import { cn } from '@/lib/cn'

const JOYSTICK_RADIUS = 46
const JOYSTICK_DIAMETER = 92
const JOYSTICK_KNOB_DIAMETER = 46
const MOVE_THRESHOLD = 16
const JUMP_THRESHOLD = 28
const JUMP_RESET_THRESHOLD = 14

type Point = {
  x: number
  y: number
}

type JoystickState = {
  pointerId: number
  origin: Point
  knob: Point
  jumpTriggered: boolean
}

type FireState = {
  pointerId: number
  point: Point
}

function getLocalPoint(event: ReactPointerEvent<HTMLDivElement>): Point {
  const rect = event.currentTarget.getBoundingClientRect()

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function clampJoystick(dx: number, dy: number) {
  const distance = Math.hypot(dx, dy)

  if (distance <= JOYSTICK_RADIUS || distance === 0) {
    return { x: dx, y: dy }
  }

  const scale = JOYSTICK_RADIUS / distance
  return { x: dx * scale, y: dy * scale }
}

function TapActionButton({
  label,
  onClick,
  disabled,
  iconSrc,
  count,
  cooldownProgress = 0,
  ready = true,
  primary = false,
  className,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  iconSrc?: string
  count?: number
  cooldownProgress?: number
  ready?: boolean
  primary?: boolean
  className?: string
}) {
  const boundedProgress = Math.max(0, Math.min(1, cooldownProgress))
  const almostReady = boundedProgress >= 0.9 && boundedProgress < 1
  const previousReadyRef = useRef(ready)
  const [readyFlash, setReadyFlash] = useState(false)

  useEffect(() => {
    if (ready && !previousReadyRef.current && !disabled) {
      setReadyFlash(true)
      const timeout = window.setTimeout(() => setReadyFlash(false), 460)
      previousReadyRef.current = ready
      return () => window.clearTimeout(timeout)
    }

    previousReadyRef.current = ready
  }, [disabled, ready])

  return (
    <button
      type="button"
      className={cn(
        'mobile-control-button pointer-events-auto relative flex touch-none items-center justify-center overflow-hidden rounded-full border text-[9px] font-black uppercase tracking-[0.12em] text-slate-100 backdrop-blur transition',
        ready && !disabled ? 'mobile-control-ready' : 'mobile-control-muted',
        almostReady && !disabled && 'mobile-control-almost-ready',
        readyFlash && 'mobile-control-ready-flash',
        primary && 'mobile-fire-button',
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
    >
      {boundedProgress > 0 ? (
        <span
          className="pointer-events-none absolute inset-0 rounded-full opacity-80"
          style={{
            background: `conic-gradient(rgba(102,225,255,0.82) ${boundedProgress * 360}deg, rgba(255,255,255,0.06) 0deg)`,
          }}
        />
      ) : null}
      <span className="pointer-events-none absolute inset-[3px] rounded-full bg-[radial-gradient(circle_at_45%_30%,rgba(123,232,255,0.2),rgba(3,10,20,0.9)_68%)]" />
      {iconSrc ? (
        <Image
          src={iconSrc}
          alt=""
          width={48}
          height={48}
          className={cn('relative z-[1] h-[56%] w-[56%] object-contain', disabled && 'grayscale opacity-45')}
        />
      ) : (
        <span className="relative z-[1]">{label}</span>
      )}
      {typeof count === 'number' ? (
        <span className="pointer-events-none absolute bottom-0.5 right-0.5 z-[2] flex h-4 min-w-4 items-center justify-center rounded-full border border-cyan-200/30 bg-black/70 px-1 text-[9px] leading-none text-cyan-50">
          {count}
        </span>
      ) : null}
      {disabled ? (
        <span className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center rounded-full bg-black/35">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[42%] w-[42%] fill-none stroke-cyan-50/82 stroke-[2.4]">
            <rect x="6.5" y="10" width="11" height="8" rx="1.5" />
            <path d="M8.5 10V8a3.5 3.5 0 0 1 7 0v2" />
          </svg>
        </span>
      ) : null}
    </button>
  )
}

export function MobileGameControls({
  portraitMode = false,
  forceLandscapeLayout = false,
  rotatedFallbackMode = false,
}: {
  portraitMode?: boolean
  forceLandscapeLayout?: boolean
  rotatedFallbackMode?: boolean
}) {
  const unlockedItemIds = useGameStore((state) => state.unlockedItemIds)
  const status = useGameStore((state) => state.status)
  const setMobileControl = useGameStore((state) => state.setMobileControl)
  const pulseAction = useGameStore((state) => state.pulseAction)
  const equipItem = useGameStore((state) => state.equipItem)
  const equippedWeapon = useGameStore((state) => state.equippedWeapon)
  const togglePause = useGameStore((state) => state.togglePause)
  const grenadeCooldownRemaining = useGameStore((state) => state.grenadeCooldownRemaining)
  const abilityCooldownRemaining = useGameStore((state) => state.abilityCooldownRemaining)
  const healCooldownRemaining = useGameStore((state) => state.healCooldownRemaining)
  const shieldRemaining = useGameStore((state) => state.shieldRemaining)
  const healCharges = useGameStore((state) => state.healCharges)
  const { isMobileLandscape } = useMobileViewport()
  const [joystick, setJoystick] = useState<JoystickState | null>(null)
  const [fire, setFire] = useState<FireState | null>(null)
  const jumpTimeoutRef = useRef<number | null>(null)
  const compactLandscapeControls = forceLandscapeLayout || (!portraitMode && isMobileLandscape)

  useEffect(() => {
    return () => {
      if (jumpTimeoutRef.current !== null) {
        window.clearTimeout(jumpTimeoutRef.current)
      }

      useGameStore.getState().resetInputState()
    }
  }, [])

  const grenadeUnlocked =
    unlockedItemIds.includes('frag-grenade') || unlockedItemIds.includes(USDC_GRENADE_REWARD_ITEM_ID)
  const shotgunUnlocked = unlockedItemIds.includes('shotgun')
  const grenadeReady = grenadeUnlocked && grenadeCooldownRemaining <= 0
  const abilityReady = abilityCooldownRemaining <= 0 && shieldRemaining <= 0
  const healReady = healCharges > 0 && healCooldownRemaining <= 0
  const grenadeCooldownProgress = grenadeUnlocked && grenadeCooldownRemaining > 0
    ? 1 - grenadeCooldownRemaining / PLAYER_CONFIG.grenadeCooldownMs
    : 0
  const abilityCooldownProgress = Math.max(abilityCooldownRemaining, shieldRemaining) > 0
    ? 1 - Math.max(abilityCooldownRemaining, shieldRemaining) / PLAYER_CONFIG.abilityCooldownMs
    : 0
  const healCooldownProgress = healCooldownRemaining > 0
    ? 1 - healCooldownRemaining / PLAYER_CONFIG.healCooldownMs
    : 0
  const grenadeIcon = getItemIconPath('frag-grenade') ?? undefined
  const shotgunIcon = getItemIconPath('shotgun') ?? undefined
  const abilityIcon = getItemIconPath('shield') ?? undefined
  const healIcon = getItemIconPath('medkit') ?? undefined

  const joystickStyle = useMemo(() => {
    if (!joystick) {
      return null
    }

    return {
      base: {
        left: joystick.origin.x,
        top: joystick.origin.y,
      },
      knob: {
        left: joystick.origin.x + joystick.knob.x,
        top: joystick.origin.y + joystick.knob.y,
      },
    }
  }, [joystick])

  const resetMovement = () => {
    setMobileControl('left', false)
    setMobileControl('right', false)
    setMobileControl('jump', false)
  }

  const pulseJump = () => {
    setMobileControl('jump', true)

    if (jumpTimeoutRef.current !== null) {
      window.clearTimeout(jumpTimeoutRef.current)
    }

    jumpTimeoutRef.current = window.setTimeout(() => {
      useGameStore.getState().setMobileControl('jump', false)
      jumpTimeoutRef.current = null
    }, 80)
  }

  const handleJoystickMove = (
    event: ReactPointerEvent<HTMLDivElement>,
    state: JoystickState,
  ) => {
    const point = getLocalPoint(event)
    const dx = point.x - state.origin.x
    const dy = point.y - state.origin.y
    const clamped = clampJoystick(dx, dy)
    const controlX = rotatedFallbackMode ? clamped.y : clamped.x
    const controlY = rotatedFallbackMode ? -clamped.x : clamped.y
    const nextJumpTriggered = state.jumpTriggered || controlY <= -JUMP_THRESHOLD

    setMobileControl('left', controlX <= -MOVE_THRESHOLD)
    setMobileControl('right', controlX >= MOVE_THRESHOLD)

    if (!state.jumpTriggered && controlY <= -JUMP_THRESHOLD) {
      pulseJump()
    }

    setJoystick({
      ...state,
      knob: clamped,
      jumpTriggered: nextJumpTriggered && controlY < -JUMP_RESET_THRESHOLD,
    })
  }

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-20',
        rotatedFallbackMode && 'mobile-controls-rotated-fallback',
      )}
    >
      {!compactLandscapeControls ? (
        <div className="absolute right-[calc(8px+var(--safe-right))] top-[calc(40px+var(--safe-top))] flex items-start justify-end">
          <TapActionButton
            label={status === 'paused' ? 'Resume' : 'Pause'}
            onClick={() => togglePause()}
            className="min-h-[38px] min-w-[38px] px-2 py-2 text-[8px]"
          />
        </div>
      ) : null}

      <div
        className={cn(
          'mobile-control-joystick',
          'pointer-events-auto absolute left-[calc(8px+var(--safe-left))] bottom-[calc(10px+var(--safe-bottom))] touch-none overflow-hidden rounded-[28px]',
          compactLandscapeControls ? 'h-[72px] w-[72px] left-[calc(7px+var(--safe-left))] bottom-[calc(18px+var(--safe-bottom))]' : portraitMode ? 'h-[112px] w-[112px] bottom-[calc(104px+var(--safe-bottom))]' : 'h-[100px] w-[100px] bottom-[calc(104px+var(--safe-bottom))]',
          joystick && 'mobile-joystick-active',
        )}
        onPointerDown={(event) => {
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
          const origin = getLocalPoint(event)
          setJoystick({
            pointerId: event.pointerId,
            origin,
            knob: { x: 0, y: 0 },
            jumpTriggered: false,
          })
          resetMovement()
        }}
        onPointerMove={(event) => {
          if (!joystick || event.pointerId !== joystick.pointerId) {
            return
          }

          handleJoystickMove(event, joystick)
        }}
        onPointerUp={(event) => {
          if (!joystick || event.pointerId !== joystick.pointerId) {
            return
          }

          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }

          setJoystick(null)
          resetMovement()
        }}
        onPointerCancel={(event) => {
          if (!joystick || event.pointerId !== joystick.pointerId) {
            return
          }

          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }

          setJoystick(null)
          resetMovement()
        }}
      >
        {joystickStyle ? (
          <>
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-100/14 bg-black/24 shadow-[0_0_22px_rgba(0,0,0,0.22)] backdrop-blur-[2px] transition-all duration-100"
              style={{ ...joystickStyle.base, height: `${JOYSTICK_DIAMETER}px`, width: `${JOYSTICK_DIAMETER}px` }}
            />
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/42 bg-cyan-500/24 shadow-[0_0_22px_rgba(65,196,255,0.32)] backdrop-blur transition-all duration-100"
              style={{ ...joystickStyle.knob, height: `${JOYSTICK_KNOB_DIAMETER + 8}px`, width: `${JOYSTICK_KNOB_DIAMETER + 8}px` }}
            />
          </>
        ) : (
          <div className={cn(
            'mobile-joystick-idle-pad absolute bottom-2.5 left-2.5 flex h-[78px] w-[78px] items-center justify-center rounded-full border border-cyan-100/10 bg-black/10 text-[0] shadow-[inset_0_0_18px_rgba(65,196,255,0.08)]',
            compactLandscapeControls && 'bottom-1 left-1 h-[58px] w-[58px]',
          )}>
            <span className="h-2 w-2 rounded-full bg-cyan-100/45 shadow-[0_0_14px_rgba(125,230,255,0.34)]" />
          </div>
        )}
      </div>

      <div
        className={cn(
          'mobile-control-fire-zone',
          'pointer-events-auto absolute right-[calc(28px+var(--safe-right))] touch-none overflow-hidden rounded-full',
          compactLandscapeControls ? 'bottom-[calc(18px+var(--safe-bottom))]' : 'bottom-[calc(104px+var(--safe-bottom))]',
          compactLandscapeControls ? 'h-[82px] w-[82px]' : portraitMode ? 'h-[108px] w-[108px]' : 'h-[98px] w-[98px]',
        )}
        onPointerDown={(event) => {
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
          setFire({
            pointerId: event.pointerId,
            point: getLocalPoint(event),
          })
          setMobileControl('shoot', true)
        }}
        onPointerMove={(event) => {
          if (!fire || event.pointerId !== fire.pointerId) {
            return
          }

          setFire({
            pointerId: fire.pointerId,
            point: getLocalPoint(event),
          })
        }}
        onPointerUp={(event) => {
          if (!fire || event.pointerId !== fire.pointerId) {
            return
          }

          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }

          setFire(null)
          setMobileControl('shoot', false)
        }}
        onPointerCancel={(event) => {
          if (!fire || event.pointerId !== fire.pointerId) {
            return
          }

          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }

          setFire(null)
          setMobileControl('shoot', false)
        }}
      >
        <div className={cn(
          'mobile-fire-button absolute bottom-1 right-1 flex h-[84px] w-[84px] items-center justify-center rounded-full text-[9px] font-black uppercase tracking-[0.14em] text-cyan-50',
          compactLandscapeControls && 'h-[72px] w-[72px] text-[8px]',
          fire && 'mobile-fire-active',
        )}>
          Fire
        </div>

        {fire ? (
          <div
            className={cn(
              'absolute h-[62px] w-[62px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/24 bg-cyan-500/18 shadow-[0_0_24px_rgba(65,196,255,0.22)]',
              compactLandscapeControls && 'h-[52px] w-[52px]',
            )}
            style={{ left: fire.point.x, top: fire.point.y }}
          />
        ) : null}
      </div>

      <div
        className={cn(
          'mobile-control-ability-cluster',
          'pointer-events-none absolute',
          portraitMode
            ? 'right-[calc(20px+var(--safe-right))] bottom-[calc(88px+var(--safe-bottom))] h-[194px] w-[226px]'
            : compactLandscapeControls
              ? 'right-[calc(18px+var(--safe-right))] bottom-[calc(14px+var(--safe-bottom))] h-[176px] w-[230px]'
              : 'right-[calc(22px+var(--safe-right))] bottom-[calc(88px+var(--safe-bottom))] h-[188px] w-[220px]',
        )}
      >
        <TapActionButton
          label="Grenade"
          iconSrc={grenadeIcon}
          count={grenadeUnlocked ? 1 : 0}
          disabled={!grenadeUnlocked}
          ready={grenadeReady}
          cooldownProgress={grenadeCooldownProgress}
          onClick={() => pulseAction('grenade')}
          className={cn(
            'absolute right-[38px] top-[14px] h-[52px] w-[52px]',
            compactLandscapeControls && 'right-[48px] top-[28px] h-[46px] w-[46px]',
          )}
        />
        <TapActionButton
          label="Shotgun"
          iconSrc={shotgunIcon}
          disabled={!shotgunUnlocked}
          ready={shotgunUnlocked}
          onClick={() => equipItem(equippedWeapon === 'shotgun' ? 'pistol' : 'shotgun')}
          className={cn(
            'absolute right-[104px] top-[92px] h-[52px] w-[52px]',
            compactLandscapeControls && 'right-[106px] top-[92px] h-[46px] w-[46px]',
            equippedWeapon === 'shotgun' && 'ring-2 ring-amber-200/70 shadow-[0_0_20px_rgba(251,191,36,0.42)]',
          )}
        />
        <TapActionButton
          label="Skill"
          iconSrc={abilityIcon}
          ready={abilityReady}
          cooldownProgress={abilityCooldownProgress}
          onClick={() => pulseAction('ability')}
          className={cn(
            'absolute left-[42px] top-[48px] h-[52px] w-[52px]',
            compactLandscapeControls && 'left-[66px] top-[42px] h-[46px] w-[46px]',
          )}
        />
        <TapActionButton
          label="Heal"
          iconSrc={healIcon}
          count={healCharges}
          disabled={healCharges <= 0}
          ready={healReady}
          cooldownProgress={healCooldownProgress}
          onClick={() => pulseAction('heal')}
          className={cn(
            'absolute left-[12px] bottom-[8px] h-[52px] w-[52px]',
            compactLandscapeControls && 'left-[26px] bottom-[4px] h-[46px] w-[46px]',
          )}
        />
      </div>
    </div>
  )
}
