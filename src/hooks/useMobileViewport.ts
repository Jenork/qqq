'use client'

import { useEffect, useState } from 'react'

const TOUCH_UI_QUERY = '(pointer: coarse), (max-width: 1023px)'
const LANDSCAPE_QUERY = '(orientation: landscape)'

type MobileViewportState = {
  showTouchControls: boolean
  isLandscape: boolean
}

type OrientationWithAngle = ScreenOrientation & {
  angle?: number
}

function resolveLandscape(landscapeQuery: MediaQueryList) {
  if (landscapeQuery.matches) {
    return true
  }

  if (window.innerWidth > window.innerHeight) {
    return true
  }

  if (window.visualViewport && window.visualViewport.width > window.visualViewport.height) {
    return true
  }

  const orientation = screen.orientation as OrientationWithAngle | undefined
  if (orientation?.type?.startsWith('landscape')) {
    return true
  }

  const angle = typeof orientation?.angle === 'number' ? orientation.angle : typeof window.orientation === 'number' ? Number(window.orientation) : 0
  return Math.abs(angle) === 90
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
        isLandscape: resolveLandscape(landscapeQuery),
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
