'use client'

import { useEffect, useState } from 'react'

const TOUCH_UI_QUERY = '(pointer: coarse), (max-width: 1023px)'
const LANDSCAPE_QUERY = '(orientation: landscape)'

type MobileViewportState = {
  showTouchControls: boolean
  isLandscape: boolean
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
        isLandscape: landscapeQuery.matches,
      })

    sync()
    touchUiQuery.addEventListener('change', sync)
    landscapeQuery.addEventListener('change', sync)

    return () => {
      touchUiQuery.removeEventListener('change', sync)
      landscapeQuery.removeEventListener('change', sync)
    }
  }, [])

  return {
    showTouchControls: state.showTouchControls,
    isMobileLandscape: state.showTouchControls && state.isLandscape,
    isMobilePortrait: state.showTouchControls && !state.isLandscape,
  }
}
