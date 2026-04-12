'use client'

import { useEffect, useRef, useState } from 'react'
import type Phaser from 'phaser'
import { GameOverModal } from '@/components/GameOverModal'
import { Hud } from '@/components/Hud'
import { InventoryPanel } from '@/components/InventoryPanel'
import { useGameStore } from '@/hooks/useGameStore'
import { cn } from '@/lib/cn'

export function GameShell() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const status = useGameStore((state) => state.status)
  const startRun = useGameStore((state) => state.startRun)
  const resumeRun = useGameStore((state) => state.resumeRun)
  const gameApiReady = useGameStore((state) => Boolean(state.gameApi))
  const [showRotateHint, setShowRotateHint] = useState(false)
  const [desktopMode, setDesktopMode] = useState(false)

  useEffect(() => {
    let mounted = true

    async function boot() {
      if (!containerRef.current || gameRef.current) {
        return
      }

      const { createGame } = await import('@/game/core/createGame')
      if (!mounted || !containerRef.current) {
        return
      }

      gameRef.current = createGame(containerRef.current)
    }

    void boot()

    return () => {
      mounted = false
      gameRef.current?.destroy(true)
      gameRef.current = null
      useGameStore.getState().registerGameApi(null)
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(orientation: portrait) and (max-width: 900px)')
    const sync = () => setShowRotateHint(mediaQuery.matches)

    sync()
    mediaQuery.addEventListener('change', sync)

    return () => mediaQuery.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: fine) and (min-width: 1024px)')
    const sync = () => setDesktopMode(mediaQuery.matches)

    sync()
    mediaQuery.addEventListener('change', sync)

    return () => mediaQuery.removeEventListener('change', sync)
  }, [])

  return (
    <section className="relative w-full overflow-hidden rounded-[28px] border border-white/8 bg-[#0d0504] shadow-[0_20px_48px_rgba(0,0,0,0.4)]">
      <div className="relative overflow-hidden bg-[#160603]">
        <div
          ref={containerRef}
          className="game-canvas aspect-[10/13] min-h-[72svh] w-full max-w-full overflow-hidden bg-[#160603] sm:aspect-[56/27] sm:min-h-0 lg:max-h-[82svh]"
        />

        <Hud />
        <InventoryPanel />
        <GameOverModal />

        {status === 'paused' ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
            <div className="panel w-full max-w-sm rounded-[2rem] p-6 text-center">
              <p className="panel-title">Paused</p>
              <h2 className="mt-2 text-4xl font-black text-stone-50">Pause</h2>
              <button
                type="button"
                onClick={() => resumeRun()}
                className="action-button retro-button mt-5 px-6 py-4 text-sm font-black uppercase tracking-[0.18em]"
              >
                Resume
              </button>
            </div>
          </div>
        ) : null}

        {showRotateHint ? (
          <div className="pointer-events-none absolute left-2 right-2 top-2 z-20 flex justify-center">
            <div className="pointer-events-auto rounded-full border border-white/10 bg-black/50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-orange-100 backdrop-blur">
              Landscape recommended for wider combat view.
            </div>
          </div>
        ) : null}

        {status === 'ready' ? (
          <div
            className={cn(
              'absolute inset-0 z-10 flex bg-gradient-to-b from-slate-950/18 via-slate-950/30 to-slate-950/58 p-3',
              desktopMode ? 'items-end justify-start p-5' : 'items-end justify-center pb-6',
            )}
          >
            <div
              className={cn(
                'rounded-[22px] border border-white/10 bg-black/40 p-4 backdrop-blur',
                desktopMode ? 'max-w-sm text-left' : 'mx-auto w-full max-w-[290px] text-center',
              )}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-200/80">
                Arena ready
              </p>
              <h1 className="mt-1 text-2xl font-black text-stone-50 sm:text-3xl">Inferno Arena</h1>
              <div className="mt-3 grid gap-1.5 text-left text-[11px] uppercase tracking-[0.14em] text-stone-300">
                {desktopMode ? (
                  <>
                    <p>A/D move, Space jump, click shoot</p>
                    <p>Q grenade, E ability, R heal</p>
                  </>
                ) : (
                  <>
                    <p>Left thumb move, right thumb attack.</p>
                    <p>Landscape gives a cleaner combat view.</p>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => startRun()}
                disabled={!gameApiReady}
                className={cn(
                  'action-button retro-button mt-4 px-5 py-3.5 text-sm font-black uppercase tracking-[0.18em]',
                  desktopMode ? 'min-w-[210px]' : 'w-full',
                )}
              >
                {gameApiReady ? 'Start Run' : 'Loading Arena...'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
