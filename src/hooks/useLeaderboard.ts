'use client'

import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { usePublicClient } from 'wagmi'
import { GAME_PROGRESS_ADDRESS, gameProgressAbi, HAS_GAME_PROGRESS_ADDRESS } from '@/config/contracts'
import { CURRENT_SEASON_ID } from '@/config/season'
import { BASE_CHAIN_ID } from '@/config/web3'

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

function compareEntries(left: Pick<LeaderboardEntry, 'address' | 'bestScore'>, right: Pick<LeaderboardEntry, 'address' | 'bestScore'>) {
  if (left.bestScore !== right.bestScore) {
    return right.bestScore - left.bestScore
  }

  return left.address.localeCompare(right.address)
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
    queryKey: ['leaderboard', CURRENT_SEASON_ID, normalizedLimit ?? 'all', normalizedCurrentAddress],
    enabled: true,
    staleTime: 15_000,
    queryFn: async (): Promise<LeaderboardSnapshot> => {
      if (!publicClient || !HAS_GAME_PROGRESS_ADDRESS) {
        return emptyOnchainSnapshot()
      }

      try {
        const playersCount = (await publicClient.readContract({
          address: GAME_PROGRESS_ADDRESS,
          abi: gameProgressAbi,
          functionName: 'getSeasonPlayersCount',
          args: [BigInt(CURRENT_SEASON_ID)],
        })) as bigint

        const total = Number(playersCount)

        if (total === 0) {
          return emptyOnchainSnapshot()
        }

        const slice = (await publicClient.readContract({
          address: GAME_PROGRESS_ADDRESS,
          abi: gameProgressAbi,
          functionName: 'getSeasonPlayersSlice',
          args: [BigInt(CURRENT_SEASON_ID), BigInt(0), BigInt(total)],
        })) as readonly Address[]

        const uniquePlayers = Array.from(
          new Map(slice.map((address) => [address.toLowerCase(), address])).values(),
        )

        const rankedEntries = (
          await Promise.all(
            uniquePlayers.map(async (address) => {
              const bestScore = (await publicClient.readContract({
                address: GAME_PROGRESS_ADDRESS,
                abi: gameProgressAbi,
                functionName: 'getSeasonBestScore',
                args: [BigInt(CURRENT_SEASON_ID), address],
              })) as bigint

              return {
                address,
                bestScore: Number(bestScore),
              }
            }),
          )
        )
          .sort(compareEntries)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }))

        return {
          entries: normalizedLimit === null ? rankedEntries : rankedEntries.slice(0, normalizedLimit),
          currentPlayerEntry:
            rankedEntries.find((entry) => entry.address.toLowerCase() === normalizedCurrentAddress) ?? null,
          totalPlayers: rankedEntries.length,
        }
      } catch (error) {
        console.warn('Season leaderboard is unavailable for the configured contract.', error)
        return emptyOnchainSnapshot()
      }
    },
  })
}
