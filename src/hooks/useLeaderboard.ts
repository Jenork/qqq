'use client'

import { useQuery } from '@tanstack/react-query'
import { usePublicClient } from 'wagmi'
import { HAS_GAME_PROGRESS_ADDRESS } from '@/config/contracts'
import { CURRENT_SEASON_START_BLOCK } from '@/config/season'
import { BASE_CHAIN_ID } from '@/config/web3'
import { readSeasonLeaderboard } from '@/lib/seasonProgress'

export type LeaderboardEntry = {
  address: string
  bestScore: number
  rank: number
}

export type LeaderboardSnapshot = {
  entries: LeaderboardEntry[]
  currentPlayerEntry: LeaderboardEntry | null
  totalPlayers: number
}

function emptyOnchainSnapshot(): LeaderboardSnapshot {
  return {
    entries: [],
    currentPlayerEntry: null,
    totalPlayers: 0,
  }
}

export function useLeaderboard(limit?: number, currentAddress?: string) {
  const publicClient = usePublicClient({ chainId: BASE_CHAIN_ID })
  const normalizedCurrentAddress = currentAddress?.toLowerCase()
  const normalizedLimit = typeof limit === 'number' && limit > 0 ? limit : null

  return useQuery({
    queryKey: ['leaderboard', CURRENT_SEASON_START_BLOCK.toString(), normalizedLimit ?? 'all', normalizedCurrentAddress],
    enabled: true,
    staleTime: 15_000,
    queryFn: async (): Promise<LeaderboardSnapshot> => {
      if (!publicClient || !HAS_GAME_PROGRESS_ADDRESS) {
        return emptyOnchainSnapshot()
      }

      try {
        const rankedEntries = await readSeasonLeaderboard(publicClient)

        return {
          entries: normalizedLimit === null ? rankedEntries : rankedEntries.slice(0, normalizedLimit),
          currentPlayerEntry:
            rankedEntries.find((entry) => entry.address.toLowerCase() === normalizedCurrentAddress) ?? null,
          totalPlayers: rankedEntries.length,
        }
      } catch (error) {
        console.warn('Current season leaderboard is unavailable for the configured contract.', error)
        return emptyOnchainSnapshot()
      }
    },
  })
}
