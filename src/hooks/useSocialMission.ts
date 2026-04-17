'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { SOCIAL_GRENADE_REWARD_ITEM_ID, SOCIAL_TWITTER_URL, SOCIAL_TELEGRAM_URL } from '@/config/missions'
import { useGameStore } from '@/hooks/useGameStore'

const STORAGE_KEY = 'baseup-social-mission-v1'
const EVENT_NAME = 'baseup-social-mission-updated'

type SocialMissionState = {
  twitterOpened: boolean
  telegramOpened: boolean
  confirmedAt: number | null
}

const DEFAULT_STATE: SocialMissionState = {
  twitterOpened: false,
  telegramOpened: false,
  confirmedAt: null,
}

function readState(): SocialMissionState {
  if (typeof window === 'undefined') {
    return DEFAULT_STATE
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return DEFAULT_STATE
    }

    const parsed = JSON.parse(raw) as Partial<SocialMissionState>
    return {
      twitterOpened: parsed.twitterOpened === true,
      telegramOpened: parsed.telegramOpened === true,
      confirmedAt: typeof parsed.confirmedAt === 'number' ? parsed.confirmedAt : null,
    }
  } catch {
    return DEFAULT_STATE
  }
}

function writeState(next: SocialMissionState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVENT_NAME))
}

export function useSocialMission() {
  const [state, setState] = useState<SocialMissionState>(DEFAULT_STATE)
  const [error, setError] = useState<string | null>(null)
  const grenadeRewardActive = useGameStore((store) =>
    store.offchainUnlockedItemIds.includes(SOCIAL_GRENADE_REWARD_ITEM_ID),
  )

  useEffect(() => {
    const sync = () => setState(readState())

    sync()
    window.addEventListener('storage', sync)
    window.addEventListener(EVENT_NAME, sync as EventListener)

    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(EVENT_NAME, sync as EventListener)
    }
  }, [])

  const updateState = useCallback((patch: Partial<SocialMissionState>) => {
    const next = {
      ...readState(),
      ...patch,
    }

    writeState(next)
    setState(next)
  }, [])

  const openTwitter = useCallback(() => {
    window.open(SOCIAL_TWITTER_URL, '_blank', 'noopener,noreferrer')
    setError(null)
    updateState({ twitterOpened: true })
  }, [updateState])

  const openTelegram = useCallback(() => {
    window.open(SOCIAL_TELEGRAM_URL, '_blank', 'noopener,noreferrer')
    setError(null)
    updateState({ telegramOpened: true })
  }, [updateState])

  const confirmMission = useCallback(() => {
    if (state.confirmedAt) {
      setError('Social mission already confirmed.')
      return
    }

    if (!(state.twitterOpened && state.telegramOpened)) {
      setError('Open both mission links before confirming.')
      return
    }

    setError(null)
    updateState({ confirmedAt: Date.now() })
  }, [state.confirmedAt, state.telegramOpened, state.twitterOpened, updateState])

  const status = useMemo(() => {
    if (state.confirmedAt && grenadeRewardActive) {
      return 'reward-active' as const
    }

    if (state.confirmedAt) {
      return 'confirmed' as const
    }

    if (state.twitterOpened || state.telegramOpened) {
      return 'links-opened' as const
    }

    return 'not-started' as const
  }, [grenadeRewardActive, state.confirmedAt, state.telegramOpened, state.twitterOpened])

  return {
    twitterOpened: state.twitterOpened,
    telegramOpened: state.telegramOpened,
    confirmedAt: state.confirmedAt,
    status,
    rewardActive: Boolean(state.confirmedAt),
    grenadeRewardActive,
    error,
    openTwitter,
    openTelegram,
    confirmMission,
  }
}
