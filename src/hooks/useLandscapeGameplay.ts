'use client'

import { type RefObject, useCallback, useEffect, useState } from 'react'

type FullscreenHost = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
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

  const syncFullscreen = useCallback(() => {
    setIsFullscreen(document.fullscreenElement === shellRef.current)
  }, [shellRef])

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
    setImmersiveDomState(false)
    unlockOrientation()

    if (document.fullscreenElement === shellRef.current) {
      try {
        await document.exitFullscreen()
      } catch {
        // Ignore blocked exits.
      }
    }

    syncFullscreen()
  }, [shellRef, syncFullscreen, unlockOrientation])

  const enterImmersive = useCallback(async () => {
    const shell = shellRef.current as FullscreenHost | null

    setImmersiveDomState(true)
    window.scrollTo(0, 1)

    if (shell && document.fullscreenElement !== shell) {
      try {
        if (shell.requestFullscreen) {
          await shell.requestFullscreen()
        } else {
          await shell.webkitRequestFullscreen?.()
        }
      } catch {
        // Fullscreen is commonly blocked in some mobile webviews.
      }
    }

    await lockOrientation()
    syncFullscreen()
  }, [lockOrientation, shellRef, syncFullscreen])

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
      return
    }

    void exitImmersive()
  }, [enabled, exitImmersive])

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
