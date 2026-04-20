'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { SOCIAL_GRENADE_REWARD_ITEM_ID, SOCIAL_TWITTER_URL, SOCIAL_TELEGRAM_URL } from '@/config/missions'
import { useGameStore } from '@/hooks/useGameStore'

const STORAGE_KEY = 'baseup-social-mission-v1'
const EVENT_NAME = 'baseup-social-mission-updated'
const LEGACY_STORAGE_KEY = 'baseup-social-mission-v1-legacy'

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

type SocialMissionStore = Record<string, SocialMissionState>

function normalizeAddress(address?: string | null) {
  return address?.trim().toLowerCase() ?? ''
}

function sanitizeState(value: Partial<SocialMissionState> | null | undefined): SocialMissionState {
  return {
    twitterOpened: value?.twitterOpened === true,
    telegramOpened: value?.telegramOpened === true,
    confirmedAt: typeof value?.confirmedAt === 'number' ? value.confirmedAt : null,
  }
}

function readStore(): SocialMissionStore {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw) as Record<string, Partial<SocialMissionState>>

    return Object.fromEntries(
      Object.entries(parsed).flatMap(([address, state]) => {
        const normalizedAddress = normalizeAddress(address)

        if (!normalizedAddress) {
          return []
        }

        return [[normalizedAddress, sanitizeState(state)]]
      }),
    )
  } catch {
    return {}
  }
}

function writeStore(next: SocialMissionStore) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVENT_NAME))
}

export function useSocialMission() {
  const { address } = useAccount()
  const normalizedAddress = normalizeAddress(address)
  const [state, setState] = useState<SocialMissionState>(DEFAULT_STATE)
  const [error, setError] = useState<string | null>(null)
  const grenadeRewardActive = useGameStore((store) =>
    store.offchainUnlockedItemIds.includes(SOCIAL_GRENADE_REWARD_ITEM_ID),
  )

  useEffect(() => {
    const sync = () => {
      if (!normalizedAddress) {
        setState(DEFAULT_STATE)
        return
      }

      const store = readStore()
      const currentState = store[normalizedAddress]

      if (currentState) {
        setState(currentState)
        return
      }

      // One-time migration from the old global shape into the active wallet bucket.
      try {
        const legacyRaw =
          window.localStorage.getItem(LEGACY_STORAGE_KEY) ?? window.localStorage.getItem(STORAGE_KEY)

        if (!legacyRaw) {
          setState(DEFAULT_STATE)
          return
        }

        const legacyParsed = JSON.parse(legacyRaw) as Partial<SocialMissionState>
        const migratedState = sanitizeState(legacyParsed)

        if (!migratedState.twitterOpened && !migratedState.telegramOpened && !migratedState.confirmedAt) {
          setState(DEFAULT_STATE)
          return
        }

        const nextStore = {
          ...store,
          [normalizedAddress]: migratedState,
        }

        window.localStorage.setItem(LEGACY_STORAGE_KEY, legacyRaw)
        writeStore(nextStore)
        setState(migratedState)
      } catch {
        setState(DEFAULT_STATE)
      }
    }

    sync()
    window.addEventListener('storage', sync)
    window.addEventListener(EVENT_NAME, sync as EventListener)

    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(EVENT_NAME, sync as EventListener)
    }
  }, [normalizedAddress])

  const updateState = useCallback((patch: Partial<SocialMissionState>) => {
    if (!normalizedAddress) {
      setError('Connect a wallet to save socials mission reward for this wallet.')
      return
    }

    const store = readStore()
    const next = {
      ...(store[normalizedAddress] ?? DEFAULT_STATE),
      ...patch,
    }

    writeStore({
      ...store,
      [normalizedAddress]: next,
    })
    setState(next)
  }, [normalizedAddress])

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
    if (!normalizedAddress) {
      setError('Connect a wallet before confirming socials mission reward.')
      return
    }

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
  }, [normalizedAddress, state.confirmedAt, state.telegramOpened, state.twitterOpened, updateState])

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
