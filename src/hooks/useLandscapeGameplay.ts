'use client'

import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'

type FullscreenHost = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
}

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void
  webkitFullscreenElement?: Element | null
}

type OrientationController = ScreenOrientation & {
  lock?: (orientation: 'landscape' | 'landscape-primary') => Promise<void>
  unlock?: () => void
}

function setImmersiveDomState(active: boolean) {
  document.documentElement.classList.toggle('gameplay-immersive', active)
  document.body.classList.toggle('gameplay-immersive', active)
}

function setImmersiveViewportVars() {
  const viewport = window.visualViewport
  const width = Math.round(viewport?.width ?? window.innerWidth)
  const height = Math.round(viewport?.height ?? window.innerHeight)

  document.documentElement.style.setProperty('--game-viewport-width', `${width}px`)
  document.documentElement.style.setProperty('--game-viewport-height', `${height}px`)
}

function clearImmersiveViewportVars() {
  document.documentElement.style.removeProperty('--game-viewport-width')
  document.documentElement.style.removeProperty('--game-viewport-height')
}

export function useLandscapeGameplay({
  shellRef,
  enabled,
}: {
  shellRef: RefObject<HTMLElement | null>
  enabled: boolean
}) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const requestVersion = useRef(0)

  const getFullscreenElement = useCallback(() => {
    const fullscreenDocument = document as FullscreenDocument
    return document.fullscreenElement ?? fullscreenDocument.webkitFullscreenElement ?? null
  }, [])

  const syncFullscreen = useCallback(() => {
    setIsFullscreen(Boolean(getFullscreenElement()))
  }, [getFullscreenElement])

  const unlockOrientation = useCallback(() => {
    const orientation = screen.orientation as OrientationController | undefined

    try {
      orientation?.unlock?.()
    } catch {
      // Optional API.
    }
  }, [])

  const lockOrientation = useCallback(async () => {
    const orientation = screen.orientation as OrientationController | undefined

    if (!orientation?.lock) {
      return
    }

    try {
      await orientation.lock('landscape-primary')
    } catch {
      try {
        await orientation.lock('landscape')
      } catch {
        // Optional API.
      }
    }
  }, [])

  const exitImmersive = useCallback(async () => {
    requestVersion.current += 1
    const fullscreenDocument = document as FullscreenDocument

    setImmersiveDomState(false)
    clearImmersiveViewportVars()
    unlockOrientation()

    if (getFullscreenElement()) {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else {
          await fullscreenDocument.webkitExitFullscreen?.()
        }
      } catch {
        // Ignore blocked exits.
      }
    }

    syncFullscreen()
  }, [getFullscreenElement, syncFullscreen, unlockOrientation])

  const requestFullscreen = useCallback(async (target: FullscreenHost | HTMLElement | null) => {
    const host = target as FullscreenHost | null

    if (!host || getFullscreenElement()) {
      return
    }

    try {
      if (host.requestFullscreen) {
        await host.requestFullscreen({ navigationUI: 'hide' })
      } else {
        await host.webkitRequestFullscreen?.()
      }
    } catch {
      // Some mobile webviews expose fullscreen but still block it.
    }
  }, [getFullscreenElement])

  const enterImmersive = useCallback(async () => {
    const version = ++requestVersion.current
    const shell = shellRef.current as FullscreenHost | null

    setImmersiveViewportVars()
    setImmersiveDomState(true)
    window.scrollTo(0, 1)

    if (!getFullscreenElement()) {
      await requestFullscreen(shell)
    }

    if (version !== requestVersion.current) {
      void exitImmersive()
      return
    }

    await lockOrientation()
    syncFullscreen()
  }, [exitImmersive, getFullscreenElement, lockOrientation, requestFullscreen, shellRef, syncFullscreen])

  useEffect(() => {
    syncFullscreen()
    document.addEventListener('fullscreenchange', syncFullscreen)
    document.addEventListener('webkitfullscreenchange', syncFullscreen)

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen)
      document.removeEventListener('webkitfullscreenchange', syncFullscreen)
    }
  }, [syncFullscreen])

  useEffect(() => {
    if (enabled) {
      setImmersiveViewportVars()
      setImmersiveDomState(true)
      window.scrollTo(0, 1)
      return
    }

    void exitImmersive()
  }, [enabled, exitImmersive])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const syncViewport = () => {
      setImmersiveViewportVars()
      syncFullscreen()
    }

    syncViewport()
    window.addEventListener('resize', syncViewport)
    window.addEventListener('orientationchange', syncViewport)
    window.visualViewport?.addEventListener?.('resize', syncViewport)
    window.visualViewport?.addEventListener?.('scroll', syncViewport)

    return () => {
      window.removeEventListener('resize', syncViewport)
      window.removeEventListener('orientationchange', syncViewport)
      window.visualViewport?.removeEventListener?.('resize', syncViewport)
      window.visualViewport?.removeEventListener?.('scroll', syncViewport)
    }
  }, [enabled, syncFullscreen])

  useEffect(
    () => () => {
      requestVersion.current += 1
      setImmersiveDomState(false)
      clearImmersiveViewportVars()
      unlockOrientation()
    },
    [unlockOrientation],
  )

  return {
    immersiveActive: enabled,
    isFullscreen,
    enterImmersive,
    exitImmersive,
  }
}
