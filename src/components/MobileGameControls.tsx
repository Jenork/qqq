'use client'

import { type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react'
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
  className,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      className={cn(
        'action-button pointer-events-auto flex min-h-[46px] min-w-[46px] touch-none items-center justify-center rounded-full border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(8,32,55,0.9),rgba(4,12,24,0.96))] px-2.5 py-2.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-100 shadow-[0_12px_22px_rgba(0,0,0,0.28)] backdrop-blur',
        className,
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export function MobileGameControls({
  portraitMode = false,
  forceLandscapeLayout = false,
}: {
  portraitMode?: boolean
  forceLandscapeLayout?: boolean
}) {
  const unlockedItemIds = useGameStore((state) => state.unlockedItemIds)
  const status = useGameStore((state) => state.status)
  const setMobileControl = useGameStore((state) => state.setMobileControl)
  const pulseAction = useGameStore((state) => state.pulseAction)
  const togglePause = useGameStore((state) => state.togglePause)
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
    const nextJumpTriggered = state.jumpTriggered || clamped.y <= -JUMP_THRESHOLD

    setMobileControl('left', clamped.x <= -MOVE_THRESHOLD)
    setMobileControl('right', clamped.x >= MOVE_THRESHOLD)

    if (!state.jumpTriggered && clamped.y <= -JUMP_THRESHOLD) {
      pulseJump()
    }

    setJoystick({
      ...state,
      knob: clamped,
      jumpTriggered: nextJumpTriggered && clamped.y < -JUMP_RESET_THRESHOLD,
    })
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
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
          'pointer-events-auto absolute left-[calc(8px+var(--safe-left))] bottom-[calc(10px+var(--safe-bottom))] touch-none overflow-hidden rounded-[28px]',
          compactLandscapeControls ? 'h-[88px] w-[88px] left-[calc(6px+var(--safe-left))] bottom-[calc(8px+var(--safe-bottom))]' : portraitMode ? 'h-[118px] w-[118px]' : 'h-[108px] w-[108px]',
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
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-100/14 bg-black/28 shadow-[0_0_22px_rgba(0,0,0,0.22)] backdrop-blur-[2px]"
              style={{ ...joystickStyle.base, height: `${JOYSTICK_DIAMETER}px`, width: `${JOYSTICK_DIAMETER}px` }}
            />
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/32 bg-cyan-500/18 shadow-[0_0_18px_rgba(65,196,255,0.22)] backdrop-blur"
              style={{ ...joystickStyle.knob, height: `${JOYSTICK_KNOB_DIAMETER}px`, width: `${JOYSTICK_KNOB_DIAMETER}px` }}
            />
          </>
        ) : (
          <div className={cn(
            'absolute bottom-2.5 left-2.5 flex h-[82px] w-[82px] items-center justify-center rounded-full border border-cyan-100/10 bg-black/12 text-[8px] font-black uppercase tracking-[0.12em] text-slate-300/70',
            compactLandscapeControls && 'bottom-1.5 left-1.5 h-[66px] w-[66px] text-[7px]',
          )}>
            Move
          </div>
        )}
      </div>

      <div className={cn(
        'pointer-events-auto absolute left-[calc(18px+var(--safe-left))] bottom-[calc(110px+var(--safe-bottom))]',
        compactLandscapeControls && 'left-[calc(12px+var(--safe-left))] bottom-[calc(90px+var(--safe-bottom))]',
      )}>
        <TapActionButton
          label="Gren"
          disabled={!grenadeUnlocked}
          onClick={() => pulseAction('grenade')}
          className={cn('min-h-[38px] min-w-[44px] px-2 py-2 text-[8px]', compactLandscapeControls && 'min-h-[30px] min-w-[34px] px-1.5 py-1 text-[7px]')}
        />
      </div>

      <div
        className={cn(
          'pointer-events-auto absolute right-[calc(8px+var(--safe-right))] bottom-[calc(12px+var(--safe-bottom))] touch-none overflow-hidden rounded-[30px]',
          compactLandscapeControls ? 'right-[calc(6px+var(--safe-right))] bottom-[calc(8px+var(--safe-bottom))] h-[84px] w-[84px]' : portraitMode ? 'h-[112px] w-[112px]' : 'h-[98px] w-[98px]',
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
          'absolute bottom-2 right-2 flex h-[82px] w-[82px] items-center justify-center rounded-full border border-cyan-300/12 bg-cyan-500/10 text-[9px] font-black uppercase tracking-[0.14em] text-cyan-100/72 backdrop-blur-[1px]',
          compactLandscapeControls && 'bottom-1.5 right-1.5 h-[68px] w-[68px] text-[8px]',
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
          'pointer-events-auto absolute flex flex-col gap-2',
          portraitMode
            ? 'right-[calc(90px+var(--safe-right))] bottom-[calc(28px+var(--safe-bottom))]'
            : compactLandscapeControls
              ? 'right-[calc(74px+var(--safe-right))] bottom-[calc(10px+var(--safe-bottom))] gap-1.5'
              : 'right-[calc(96px+var(--safe-right))] bottom-[calc(16px+var(--safe-bottom))]',
        )}
      >
        <TapActionButton
          label="Skill"
          onClick={() => pulseAction('ability')}
          className={cn('min-h-[40px] min-w-[44px] px-2 py-2 text-[8px]', compactLandscapeControls && 'min-h-[34px] min-w-[38px] px-1.5 py-1.5 text-[7px]')}
        />
        <TapActionButton
          label="Heal"
          onClick={() => pulseAction('heal')}
          className={cn('min-h-[40px] min-w-[44px] px-2 py-2 text-[8px]', compactLandscapeControls && 'min-h-[34px] min-w-[38px] px-1.5 py-1.5 text-[7px]')}
        />
      </div>
    </div>
  )
}
