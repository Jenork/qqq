'use client'

import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { usePublicClient } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { GAME_PROGRESS_ADDRESS, gameProgressAbi, HAS_GAME_PROGRESS_ADDRESS } from '@/config/contracts'

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

export function useLeaderboard(limit = 10, currentAddress?: string) {
  const publicClient = usePublicClient({ chainId: baseSepolia.id })
  const normalizedCurrentAddress = currentAddress?.toLowerCase()

  return useQuery({
    queryKey: ['leaderboard', limit, normalizedCurrentAddress],
    enabled: Boolean(publicClient) && HAS_GAME_PROGRESS_ADDRESS,
    staleTime: 15_000,
    queryFn: async (): Promise<LeaderboardSnapshot> => {
      if (!publicClient || !HAS_GAME_PROGRESS_ADDRESS) {
        return {
          entries: [],
          currentPlayerEntry: null,
          totalPlayers: 0,
        }
      }

      const playersCount = (await publicClient.readContract({
        address: GAME_PROGRESS_ADDRESS,
        abi: gameProgressAbi,
        functionName: 'getPlayersCount',
      })) as bigint

      const total = Number(playersCount)

      if (total === 0) {
        return {
          entries: [],
          currentPlayerEntry: null,
          totalPlayers: 0,
        }
      }

      const slice = (await publicClient.readContract({
        address: GAME_PROGRESS_ADDRESS,
        abi: gameProgressAbi,
        functionName: 'getPlayersSlice',
        args: [BigInt(0), BigInt(total)],
      })) as readonly Address[]

      const rankedEntries = (
        await Promise.all(
          slice.map(async (address) => {
            const bestScore = (await publicClient.readContract({
              address: GAME_PROGRESS_ADDRESS,
              abi: gameProgressAbi,
              functionName: 'getBestScore',
              args: [address],
            })) as bigint

            return {
              address,
              bestScore: Number(bestScore),
            }
          }),
        )
      )
        .sort((left, right) => right.bestScore - left.bestScore)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }))

      return {
        entries: rankedEntries.slice(0, limit),
        currentPlayerEntry:
          rankedEntries.find((entry) => entry.address.toLowerCase() === normalizedCurrentAddress) ?? null,
        totalPlayers: rankedEntries.length,
      }
    },
  })
}
