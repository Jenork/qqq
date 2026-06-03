'use client'

import { type PointerEvent as ReactPointerEvent, useEffect, useMemo, useState } from 'react'
import { SOCIAL_GRENADE_REWARD_ITEM_ID } from '@/config/missions'
import { useGameStore } from '@/hooks/useGameStore'
import { cn } from '@/lib/cn'

const JOYSTICK_RADIUS = 58
const MOVE_THRESHOLD = 18
const JUMP_THRESHOLD = 34
const JUMP_RESET_THRESHOLD = 16

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
        'action-button pointer-events-auto flex min-h-[52px] min-w-[52px] touch-none items-center justify-center rounded-full border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(8,32,55,0.9),rgba(4,12,24,0.96))] px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-100 shadow-[0_14px_26px_rgba(0,0,0,0.28)] backdrop-blur',
        className,
      )}
      disabled={disabled}
      onClick={onClick}
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
  const [joystick, setJoystick] = useState<JoystickState | null>(null)
  const [fire, setFire] = useState<FireState | null>(null)

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

    window.setTimeout(() => {
      useGameStore.getState().setMobileControl('jump', false)
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
    const nextJumpTriggered =
      state.jumpTriggered || clamped.y <= -JUMP_THRESHOLD

    setMobileControl('left', clamped.x <= -MOVE_THRESHOLD)
    setMobileControl('right', clamped.x >= MOVE_THRESHOLD)

    if (!state.jumpTriggered && clamped.y <= -JUMP_THRESHOLD) {
      pulseJump()
    }

    setJoystick({
      ...state,
      knob: clamped,
      jumpTriggered:
        nextJumpTriggered && clamped.y < -JUMP_RESET_THRESHOLD,
    })
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute left-3 top-3 right-3 flex items-start justify-end">
        <TapActionButton
          label={status === 'paused' ? 'Resume' : 'Pause'}
          onClick={() => togglePause()}
          className="min-h-[42px] min-w-[42px] px-2 py-2 text-[9px]"
        />
      </div>

      <div
        className={cn(
          'pointer-events-auto absolute bottom-[calc(18px+var(--safe-bottom))] left-3 touch-none overflow-hidden rounded-[30px]',
          portraitMode ? 'top-[42%] right-[50%]' : 'top-[54%] right-[52%]',
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
              className="absolute h-[116px] w-[116px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-100/14 bg-black/28 shadow-[0_0_26px_rgba(0,0,0,0.22)] backdrop-blur-[2px]"
              style={joystickStyle.base}
            />
            <div
              className="absolute h-[56px] w-[56px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/32 bg-cyan-500/18 shadow-[0_0_20px_rgba(65,196,255,0.22)] backdrop-blur"
              style={joystickStyle.knob}
            />
          </>
        ) : (
          <div className="absolute bottom-5 left-3 flex h-[92px] w-[92px] items-center justify-center rounded-full border border-cyan-100/10 bg-black/12 text-[9px] font-black uppercase tracking-[0.14em] text-slate-300/70">
            Move
          </div>
        )}
      </div>

      <div
        className={cn(
          'pointer-events-auto absolute bottom-[calc(18px+var(--safe-bottom))] right-3 touch-none overflow-hidden rounded-[32px]',
          portraitMode ? 'top-[36%] left-[52%]' : 'top-[42%] left-[58%]',
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
        <div className="absolute bottom-4 right-3 flex h-[98px] w-[98px] items-center justify-center rounded-full border border-cyan-300/12 bg-cyan-500/10 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100/72 backdrop-blur-[1px]">
          Fire
        </div>

        {fire ? (
          <div
            className="absolute h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/24 bg-cyan-500/18 shadow-[0_0_28px_rgba(65,196,255,0.22)]"
            style={{ left: fire.point.x, top: fire.point.y }}
          />
        ) : null}
      </div>

      <div
        className={cn(
          'pointer-events-auto absolute flex items-center gap-2',
          portraitMode
            ? 'bottom-[calc(20px+var(--safe-bottom))] left-[44%] -translate-x-1/2'
            : 'bottom-[calc(24px+var(--safe-bottom))] left-[40%] -translate-x-1/2',
        )}
      >
        <TapActionButton
          label="Gren"
          disabled={!grenadeUnlocked}
          onClick={() => pulseAction('grenade')}
          className="min-h-[48px] min-w-[58px] px-3 py-2 text-[9px]"
        />
        <TapActionButton
          label="Skill"
          onClick={() => pulseAction('ability')}
          className="min-h-[48px] min-w-[58px] px-3 py-2 text-[9px]"
        />
        <TapActionButton
          label="Heal"
          onClick={() => pulseAction('heal')}
          className="min-h-[48px] min-w-[58px] px-3 py-2 text-[9px]"
        />
      </div>
    </div>
  )
}
