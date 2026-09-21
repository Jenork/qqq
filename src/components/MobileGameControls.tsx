'use client'

import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { PLAYER_CONFIG } from '@/config/game'
import { getItemIconPath } from '@/config/items'
import { useGameStore } from '@/hooks/useGameStore'
import { gameplayPoint, joystickVector } from '@/lib/gameplayInput'
import { cn } from '@/lib/cn'

function ActionButton({
  label, icon, count, remaining = 0, duration = 1, locked = false,
  active = false, unavailable = false, onAction, className,
}: {
  label: string
  icon: string | null
  count?: number
  remaining?: number
  duration?: number
  locked?: boolean
  active?: boolean
  unavailable?: boolean
  onAction: () => void
  className: string
}) {
  const ready = !locked && !unavailable && remaining <= 0
  const progress = locked ? 0 : Math.max(0, Math.min(1, 1 - remaining / duration))
  const previousReady = useRef(ready)
  const [flash, setFlash] = useState(0)

  useEffect(() => {
    if (ready && !previousReady.current) setFlash((value) => value + 1)
    previousReady.current = ready
  }, [ready])

  return (
    <button
      type="button"
      className={cn('mobile-control-button combat-action', className,
        ready || active ? 'mobile-control-ready' : 'mobile-control-muted',
        !ready && !locked && progress >= 0.9 && remaining > 0 && 'mobile-control-almost-ready',
        active && 'combat-action-selected',
      )}
      aria-label={label}
      aria-disabled={!ready}
      aria-pressed={className === 'mobile-control-shotgun' ? active : undefined}
      title={label}
      onPointerDown={(event) => {
        event.preventDefault()
        if (ready) onAction()
      }}
      onClick={(event) => { if (event.detail === 0 && ready) onAction() }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <svg className="combat-cooldown" viewBox="0 0 48 48" aria-hidden="true">
        <circle className="combat-cooldown-track" cx="24" cy="24" r="21" />
        <circle className="combat-cooldown-progress" cx="24" cy="24" r="21" pathLength="100"
          style={{ strokeDashoffset: 100 * (1 - progress) }} />
      </svg>
      {icon ? <Image src={icon} alt="" width={48} height={48} draggable={false}
        className={cn('combat-action-icon', !ready && !active && 'grayscale')} /> : label}
      {count !== undefined ? <span className="combat-action-count">{count}</span> : null}
      {locked ? <span className="combat-lock" aria-hidden="true" /> : null}
      {flash > 0 ? <span key={flash} className="combat-ready-flash" /> : null}
    </button>
  )
}

export function MobileGameControls({ rotatedFallbackMode = false }: { rotatedFallbackMode?: boolean }) {
  const unlocked = useGameStore((state) => state.unlockedItemIds)
  const weapon = useGameStore((state) => state.equippedWeapon)
  const grenade = useGameStore((state) => state.equippedGrenade)
  const ability = useGameStore((state) => state.equippedAbility)
  const heal = useGameStore((state) => state.equippedHeal)
  const grenadeRemaining = useGameStore((state) => state.grenadeCooldownRemaining)
  const abilityRemaining = useGameStore((state) => state.abilityCooldownRemaining)
  const healRemaining = useGameStore((state) => state.healCooldownRemaining)
  const shieldRemaining = useGameStore((state) => state.shieldRemaining)
  const charges = useGameStore((state) => state.healCharges)
  const hp = useGameStore((state) => state.hp)
  const maxHp = useGameStore((state) => state.maxHp)
  const joystickPointer = useRef<number | null>(null)
  const firePointer = useRef<number | null>(null)
  const jumpLatch = useRef(false)
  const jumpTimeout = useRef<number | null>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const [moving, setMoving] = useState(false)
  const [firing, setFiring] = useState(false)

  useEffect(() => () => {
    if (jumpTimeout.current !== null) window.clearTimeout(jumpTimeout.current)
    useGameStore.getState().resetInputState()
  }, [])

  // A viewport rotation must never leave a held pointer driving the marine.
  useEffect(() => {
    joystickPointer.current = null
    firePointer.current = null
    jumpLatch.current = false
    setKnob({ x: 0, y: 0 })
    setMoving(false)
    setFiring(false)
    useGameStore.getState().resetInputState()
  }, [rotatedFallbackMode])

  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.currentTarget
    const point = gameplayPoint(event.clientX, event.clientY, target.getBoundingClientRect(),
      target.clientWidth, target.clientHeight, rotatedFallbackMode)
    const radius = target.clientWidth * 0.3
    const vector = joystickVector(point.x - target.clientWidth / 2, point.y - target.clientHeight / 2, radius)
    const store = useGameStore.getState()
    store.setMobileControl('left', vector.x < -radius * 0.3)
    store.setMobileControl('right', vector.x > radius * 0.3)
    if (!jumpLatch.current && vector.y < -radius * 0.65) {
      store.setMobileControl('jump', true)
      if (jumpTimeout.current !== null) window.clearTimeout(jumpTimeout.current)
      jumpTimeout.current = window.setTimeout(() => {
        useGameStore.getState().setMobileControl('jump', false)
        jumpTimeout.current = null
      }, 80)
      jumpLatch.current = true
    } else if (vector.y > -radius * 0.3) {
      jumpLatch.current = false
    }
    setKnob(vector)
  }

  const releaseMovement = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (joystickPointer.current !== event.pointerId) return
    joystickPointer.current = null
    jumpLatch.current = false
    if (jumpTimeout.current !== null) window.clearTimeout(jumpTimeout.current)
    jumpTimeout.current = null
    setMoving(false)
    setKnob({ x: 0, y: 0 })
    const store = useGameStore.getState()
    store.setMobileControl('left', false)
    store.setMobileControl('right', false)
    store.setMobileControl('jump', false)
  }

  const releaseFire = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (firePointer.current !== event.pointerId) return
    firePointer.current = null
    setFiring(false)
    useGameStore.getState().setMobileControl('shoot', false)
  }

  const grenadeUnlocked = unlocked.includes('frag-grenade') || unlocked.includes('fire-grenade')

  return (
    <div className="mobile-combat-controls pointer-events-none absolute inset-0 z-20">
      <div
        className={cn('mobile-control-joystick', moving && 'mobile-joystick-active')}
        aria-label="Movement joystick"
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          if (joystickPointer.current !== null) return
          event.preventDefault()
          joystickPointer.current = event.pointerId
          event.currentTarget.setPointerCapture(event.pointerId)
          setMoving(true)
          move(event)
        }}
        onPointerMove={(event) => { if (joystickPointer.current === event.pointerId) move(event) }}
        onPointerUp={releaseMovement}
        onPointerCancel={releaseMovement}
        onLostPointerCapture={releaseMovement}
      >
        <span className="joystick-ring" />
        <span className="joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      </div>

      <div className="mobile-combat-cluster" role="group" aria-label="Combat controls">
        <button type="button" aria-label="Fire" title="Fire"
          className={cn('mobile-fire-button mobile-control-fire-zone', firing && 'mobile-fire-active')}
          onContextMenu={(event) => event.preventDefault()}
          onPointerDown={(event) => {
            if (firePointer.current !== null) return
            event.preventDefault()
            firePointer.current = event.pointerId
            event.currentTarget.setPointerCapture(event.pointerId)
            setFiring(true)
            useGameStore.getState().setMobileControl('shoot', true)
          }}
          onPointerUp={releaseFire} onPointerCancel={releaseFire} onLostPointerCapture={releaseFire}
          onKeyDown={(event) => {
            if (event.key === ' ' || event.key === 'Enter') {
              event.preventDefault()
              setFiring(true)
              useGameStore.getState().setMobileControl('shoot', true)
            }
          }}
          onKeyUp={() => { setFiring(false); useGameStore.getState().setMobileControl('shoot', false) }}
          onBlur={() => { setFiring(false); useGameStore.getState().setMobileControl('shoot', false) }}
        >Fire</button>
        <ActionButton label="Grenade" icon={getItemIconPath(grenade)} locked={!grenadeUnlocked}
          remaining={grenadeRemaining} duration={PLAYER_CONFIG.grenadeCooldownMs}
          onAction={() => useGameStore.getState().pulseAction('grenade')} className="mobile-control-grenade" />
        <ActionButton label="Skill" icon={getItemIconPath(ability)} active={shieldRemaining > 0}
          remaining={Math.max(abilityRemaining, shieldRemaining)} duration={PLAYER_CONFIG.abilityCooldownMs}
          onAction={() => useGameStore.getState().pulseAction('ability')} className="mobile-control-skill" />
        <ActionButton label="Shotgun" icon={getItemIconPath('shotgun')} locked={!unlocked.includes('shotgun')}
          active={weapon === 'shotgun'} onAction={() => useGameStore.getState().equipItem(weapon === 'shotgun' ? 'pistol' : 'shotgun')}
          className="mobile-control-shotgun" />
        <ActionButton label="Heal" icon={getItemIconPath(heal)} count={charges} locked={charges <= 0}
          unavailable={hp >= maxHp} remaining={healRemaining} duration={PLAYER_CONFIG.healCooldownMs}
          onAction={() => useGameStore.getState().pulseAction('heal')} className="mobile-control-heal" />
      </div>
    </div>
  )
}
