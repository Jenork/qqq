'use client'

import { useEffect, useState } from 'react'

const TOUCH_UI_QUERY = '(pointer: coarse), (max-width: 1023px)'
const LANDSCAPE_QUERY = '(orientation: landscape)'

type MobileViewportState = {
  showTouchControls: boolean
  isLandscape: boolean
}

function resolveLandscape() {
  // A host can keep its webview portrait even while the physical screen rotates.
  const viewport = window.visualViewport
  return (viewport?.width ?? window.innerWidth) > (viewport?.height ?? window.innerHeight)
}

export function useMobileViewport() {
  const [state, setState] = useState<MobileViewportState>({
    showTouchControls: false,
    isLandscape: false,
  })

  useEffect(() => {
    const touchUiQuery = window.matchMedia(TOUCH_UI_QUERY)
    const landscapeQuery = window.matchMedia(LANDSCAPE_QUERY)

    const sync = () =>
      setState({
        showTouchControls: touchUiQuery.matches,
        isLandscape: resolveLandscape(),
      })

    sync()

    touchUiQuery.addEventListener('change', sync)
    landscapeQuery.addEventListener('change', sync)
    window.addEventListener('resize', sync)
    window.addEventListener('orientationchange', sync)
    screen.orientation?.addEventListener?.('change', sync)
    window.visualViewport?.addEventListener?.('resize', sync)

    return () => {
      touchUiQuery.removeEventListener('change', sync)
      landscapeQuery.removeEventListener('change', sync)
      window.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', sync)
      screen.orientation?.removeEventListener?.('change', sync)
      window.visualViewport?.removeEventListener?.('resize', sync)
    }
  }, [])

  return {
    showTouchControls: state.showTouchControls,
    isMobileLandscape: state.showTouchControls && state.isLandscape,
    isMobilePortrait: state.showTouchControls && !state.isLandscape,
  }
}
