'use client'

import { type RefObject, useCallback, useEffect, useState } from 'react'

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

export function useLandscapeGameplay({
  shellRef,
  enabled,
}: {
  shellRef: RefObject<HTMLElement | null>
  enabled: boolean
}) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const getFullscreenElement = useCallback(() => {
    const fullscreenDocument = document as FullscreenDocument
    return document.fullscreenElement ?? fullscreenDocument.webkitFullscreenElement ?? null
  }, [])

  const syncFullscreen = useCallback(() => {
    setIsFullscreen(getFullscreenElement() === shellRef.current)
  }, [getFullscreenElement, shellRef])

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
    const fullscreenDocument = document as FullscreenDocument

    setImmersiveDomState(false)
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
    const shell = shellRef.current as FullscreenHost | null

    setImmersiveDomState(true)
    window.scrollTo(0, 1)

    if (!getFullscreenElement()) {
      await requestFullscreen(shell)
      await requestFullscreen(document.documentElement)
    }

    await lockOrientation()
    syncFullscreen()
  }, [getFullscreenElement, lockOrientation, requestFullscreen, shellRef, syncFullscreen])

  useEffect(() => {
    syncFullscreen()
    document.addEventListener('fullscreenchange', syncFullscreen)

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen)
    }
  }, [syncFullscreen])

  useEffect(() => {
    if (enabled) {
      setImmersiveDomState(true)
      window.scrollTo(0, 1)
      if (!getFullscreenElement()) {
        void requestFullscreen(shellRef.current)
        void requestFullscreen(document.documentElement)
      }
      void lockOrientation()
      return
    }

    void exitImmersive()
  }, [enabled, exitImmersive, getFullscreenElement, lockOrientation, requestFullscreen, shellRef])

  useEffect(
    () => () => {
      setImmersiveDomState(false)
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
