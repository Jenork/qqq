'use client'

import { useEffect, useRef, useState } from 'react'
import type Phaser from 'phaser'
import { GameOverModal } from '@/components/GameOverModal'
import { Hud } from '@/components/Hud'
import { MobileGameControls } from '@/components/MobileGameControls'
import { useGameStore } from '@/hooks/useGameStore'
import { useLandscapeGameplay } from '@/hooks/useLandscapeGameplay'
import { useMobileViewport } from '@/hooks/useMobileViewport'
import { cn } from '@/lib/cn'

export function GameShell({ isActive = true }: { isActive?: boolean }) {
  const shellRef = useRef<HTMLElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const status = useGameStore((state) => state.status)
  const startRun = useGameStore((state) => state.startRun)
  const resumeRun = useGameStore((state) => state.resumeRun)
  const gameApiReady = useGameStore((state) => Boolean(state.gameApi))
  const { showTouchControls, isMobileLandscape, isMobilePortrait } = useMobileViewport()
  const [desktopMode, setDesktopMode] = useState(false)
  const mobileGameplayActive = showTouchControls && isActive && (status === 'playing' || status === 'paused')
  const { immersiveActive, isFullscreen, enterImmersive } = useLandscapeGameplay({
    shellRef,
    enabled: mobileGameplayActive,
  })
  const portraitLandscapeFallback = showTouchControls && immersiveActive && isMobilePortrait && status !== 'ready'
  const browserFallbackLayout = mobileGameplayActive && immersiveActive && !isFullscreen

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
      const store = useGameStore.getState()
      store.resetInputState()
      store.registerGameApi(null)
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
    const refreshTimers: number[] = []

    const refreshLayout = () => {
      if (!gameRef.current) {
        return
      }

      window.requestAnimationFrame(() => {
        gameRef.current?.scale.refresh()
      })
    }

    const scheduleRefresh = () => {
      refreshLayout()
      refreshTimers.push(window.setTimeout(refreshLayout, 80))
      refreshTimers.push(window.setTimeout(refreshLayout, 220))
    }

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => scheduleRefresh())
        : null

    if (containerRef.current) {
      resizeObserver?.observe(containerRef.current)
    }

    if (shellRef.current) {
      resizeObserver?.observe(shellRef.current)
    }

    scheduleRefresh()
    window.addEventListener('resize', scheduleRefresh)
    window.addEventListener('orientationchange', scheduleRefresh)
    document.addEventListener('fullscreenchange', scheduleRefresh)

    return () => {
      window.removeEventListener('resize', scheduleRefresh)
      window.removeEventListener('orientationchange', scheduleRefresh)
      document.removeEventListener('fullscreenchange', scheduleRefresh)
      resizeObserver?.disconnect()
      refreshTimers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [immersiveActive, isActive, isMobileLandscape, isMobilePortrait, portraitLandscapeFallback, showTouchControls, status])

  const showMobileControlDeck = showTouchControls && status === 'playing'

  const handleStartRun = async () => {
    await enterImmersive()
    startRun()
  }

  return (
    <section
      ref={shellRef}
      className={cn(
        'panel inferno-subtle-grid relative w-full overflow-hidden border border-cyan-300/15 bg-[#020713] shadow-[0_22px_52px_rgba(0,0,0,0.44)]',
        showTouchControls ? 'rounded-[22px]' : 'rounded-[30px]',
        immersiveActive ? 'mobile-fullscreen-shell' : '',
        browserFallbackLayout ? 'mobile-browser-fallback-shell' : '',
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden bg-[#020713]',
          portraitLandscapeFallback && 'mobile-landscape-fallback-stage',
          browserFallbackLayout && 'mobile-browser-fallback-stage',
        )}
      >
        <div
          className={cn(
            'relative flex w-full items-center justify-center overflow-hidden bg-[#020713]',
            browserFallbackLayout
              ? 'h-full min-h-full max-h-full px-[calc(2px+var(--safe-left))] pr-[calc(2px+var(--safe-right))] pt-[calc(2px+var(--safe-top))] pb-[calc(2px+var(--safe-bottom))]'
              : portraitLandscapeFallback
              ? 'h-full min-h-full max-h-full px-[calc(2px+var(--safe-left))] pr-[calc(2px+var(--safe-right))] pt-[calc(2px+var(--safe-top))] pb-[calc(2px+var(--safe-bottom))]'
              : immersiveActive
              ? 'h-[100dvh] min-h-[100dvh] max-h-[100dvh] px-[calc(2px+var(--safe-left))] pr-[calc(2px+var(--safe-right))] pt-[calc(2px+var(--safe-top))] pb-[calc(2px+var(--safe-bottom))]'
              : isMobileLandscape
                ? 'h-[calc(100svh-84px)] min-h-[400px] max-h-[calc(100svh-84px)] px-1 pt-1 pb-1'
                : showTouchControls
                  ? 'h-[calc(100svh-182px)] min-h-[60svh] max-h-[calc(100svh-182px)] px-1.5 pt-12 pb-24'
                  : 'aspect-[16/9] min-h-0 lg:max-h-[82svh]',
          )}
        >
          <div
            ref={containerRef}
            className={cn(
              'game-canvas h-full w-full max-w-full overflow-hidden bg-[#020713]',
              portraitLandscapeFallback && 'h-full w-full',
              !showTouchControls && 'aspect-[16/9]',
            )}
          />
        </div>

        {!mobileGameplayActive ? (
          <>
            <div className="pointer-events-none absolute inset-0 border border-cyan-300/20" />
            <div className="pointer-events-none absolute inset-[14px] border border-cyan-300/15 [clip-path:polygon(0_14px,14px_0,calc(100%-18px)_0,100%_18px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-18px))]" />
          </>
        ) : null}

        {status !== 'ready' ? (
          <Hud forceLandscapeLayout={portraitLandscapeFallback} rotatedFallbackMode={portraitLandscapeFallback} />
        ) : null}
        {showMobileControlDeck ? (
          <MobileGameControls
            portraitMode={isMobilePortrait}
            forceLandscapeLayout={portraitLandscapeFallback}
            rotatedFallbackMode={portraitLandscapeFallback}
          />
        ) : null}
        {showTouchControls && isMobilePortrait && status !== 'ready' && !portraitLandscapeFallback ? (
          <div className="pointer-events-none absolute left-1/2 top-[calc(10px+var(--safe-top))] z-30 -translate-x-1/2">
            <div className="inferno-chip rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-cyan-50 shadow-[0_0_18px_rgba(65,196,255,0.16)]">
              Rotate for full arena
            </div>
          </div>
        ) : null}
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
