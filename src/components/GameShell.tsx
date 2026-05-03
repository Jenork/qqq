'use client'

import { useEffect, useRef, useState } from 'react'
import type Phaser from 'phaser'
import { GameOverModal } from '@/components/GameOverModal'
import { Hud } from '@/components/Hud'
import { MobileGameControls } from '@/components/MobileGameControls'
import { useGameStore } from '@/hooks/useGameStore'
import { useMobileViewport } from '@/hooks/useMobileViewport'
import { cn } from '@/lib/cn'

export function GameShell() {
  const shellRef = useRef<HTMLElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const status = useGameStore((state) => state.status)
  const startRun = useGameStore((state) => state.startRun)
  const resumeRun = useGameStore((state) => state.resumeRun)
  const gameApiReady = useGameStore((state) => Boolean(state.gameApi))
  const { showTouchControls, isMobileLandscape, isMobilePortrait } = useMobileViewport()
  const [desktopMode, setDesktopMode] = useState(false)
  const [mobileFullscreen, setMobileFullscreen] = useState(false)
  const [mobileFullscreenDismissed, setMobileFullscreenDismissed] = useState(false)

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
    const mediaQuery = window.matchMedia('(pointer: fine) and (min-width: 1024px)')
    const sync = () => setDesktopMode(mediaQuery.matches)

    sync()
    mediaQuery.addEventListener('change', sync)

    return () => mediaQuery.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const syncFullscreen = () => {
      setMobileFullscreen(document.fullscreenElement === shellRef.current)
    }

    document.addEventListener('fullscreenchange', syncFullscreen)
    return () => document.removeEventListener('fullscreenchange', syncFullscreen)
  }, [])

  const showMobileControlDeck = showTouchControls && status === 'playing'
  const shouldUseMobileFullscreen =
    showTouchControls &&
    !mobileFullscreenDismissed &&
    (mobileFullscreen || status === 'playing' || status === 'paused' || status === 'gameover')

  const enterMobileFullscreen = async () => {
    if (!showTouchControls) {
      return
    }

    setMobileFullscreenDismissed(false)
    setMobileFullscreen(true)

    try {
      await shellRef.current?.requestFullscreen?.()
    } catch {
      // CSS fullscreen fallback keeps the arena usable on mobile browsers without element fullscreen support.
    }
  }

  const exitMobileFullscreen = async () => {
    setMobileFullscreenDismissed(true)
    setMobileFullscreen(false)

    if (document.fullscreenElement === shellRef.current) {
      try {
        await document.exitFullscreen()
      } catch {
        // Browser already left fullscreen or blocked the request.
      }
    }
  }

  const handleStartRun = async () => {
    await enterMobileFullscreen()
    startRun()
  }

  return (
    <section
      ref={shellRef}
      className={cn(
        'panel inferno-subtle-grid relative w-full overflow-hidden border border-[#4a1912] bg-[#0d0504] shadow-[0_22px_52px_rgba(0,0,0,0.44)]',
        showTouchControls ? 'rounded-[22px]' : 'rounded-[30px]',
        shouldUseMobileFullscreen ? 'mobile-fullscreen-shell' : '',
      )}
    >
      <div className="relative overflow-hidden bg-[#160603]">
        <div
          ref={containerRef}
          className={cn(
            'game-canvas w-full max-w-full overflow-hidden bg-[#160603]',
            shouldUseMobileFullscreen
              ? 'aspect-auto h-[100dvh] min-h-[100dvh] max-h-[100dvh]'
              : isMobileLandscape
              ? 'aspect-auto h-[calc(100svh-116px)] min-h-[400px] max-h-[calc(100svh-116px)]'
              : showTouchControls
                ? 'aspect-auto h-[calc(100svh-182px)] min-h-[60svh] max-h-[calc(100svh-182px)]'
                : 'aspect-[10/13] min-h-[72svh] sm:aspect-[56/27] sm:min-h-0 lg:max-h-[82svh]',
          )}
        />

        <div className="pointer-events-none absolute inset-0 border border-[#762314]/40" />
        <div className="pointer-events-none absolute inset-[14px] border border-[#4e1d16]/60 [clip-path:polygon(0_14px,14px_0,calc(100%-18px)_0,100%_18px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-18px))]" />

        {status !== 'ready' ? <Hud /> : null}
        {showMobileControlDeck ? <MobileGameControls portraitMode={isMobilePortrait} /> : null}
        <GameOverModal />

        {status === 'paused' ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
            <div className="inferno-frame w-full max-w-sm rounded-[2rem] p-6 text-center">
              <p className="panel-title">Paused</p>
              <h2 className="inferno-heading mt-2 text-4xl font-black">Pause</h2>
              <button
                type="button"
                onClick={() => resumeRun()}
                className="action-button retro-button mt-5 px-6 py-4 text-sm font-black uppercase tracking-[0.18em]"
              >
                Resume
              </button>
              {showTouchControls ? (
                <button
                  type="button"
                  onClick={() => void exitMobileFullscreen()}
                  className="action-button mt-3 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-[0.16em]"
                >
                  Exit Fullscreen
                </button>
              ) : null}
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
                'inferno-frame p-4 backdrop-blur',
                desktopMode ? 'max-w-sm text-left' : 'mx-auto w-full max-w-[290px] text-center',
              )}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-200/80">
                Arena ready
              </p>
              <h1 className="inferno-heading mt-1 text-2xl font-black sm:text-3xl">Based DOOM</h1>
              <button
                type="button"
                onClick={() => void handleStartRun()}
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
