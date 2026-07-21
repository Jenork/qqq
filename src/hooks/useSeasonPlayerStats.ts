'use client'

import type { Address } from 'viem'
import { usePublicClient } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { HAS_DAILY_CHECKIN_CONTRACT_ADDRESS, HAS_GAME_PROGRESS_ADDRESS } from '@/config/contracts'
import { CURRENT_SEASON_START_BLOCK } from '@/config/season'
import { BASE_CHAIN_ID } from '@/config/web3'
import { readSeasonPlayerStats } from '@/lib/seasonProgress'

const EMPTY_SEASON_STATS = {
  bestScore: 0,
  checkInCount: 0,
  lastCheckInAt: 0,
}

async function fetchSeasonPlayerStats(address: string) {
  const searchParams = new URLSearchParams({ address })

  const response = await fetch(`/api/season/player?${searchParams.toString()}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Season player API failed with status ${response.status}`)
  }

  return (await response.json()) as typeof EMPTY_SEASON_STATS
}

export function useSeasonPlayerStats(address?: string | null) {
  const publicClient = usePublicClient({ chainId: BASE_CHAIN_ID })

  return useQuery({
    queryKey: ['season-player-stats', CURRENT_SEASON_START_BLOCK.toString(), address?.toLowerCase() ?? 'guest'],
    enabled: Boolean(address) && (HAS_GAME_PROGRESS_ADDRESS || HAS_DAILY_CHECKIN_CONTRACT_ADDRESS),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!address) {
        return EMPTY_SEASON_STATS
      }

      try {
        return await fetchSeasonPlayerStats(address)
      } catch (error) {
        console.warn('Season player stats API is unavailable; falling back to direct RPC.', error)
      }

      if (!publicClient) {
        return EMPTY_SEASON_STATS
      }

      return readSeasonPlayerStats(publicClient, address as Address)
    },
  })
}
