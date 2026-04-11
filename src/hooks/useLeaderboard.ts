'use client'

import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { usePublicClient } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { GAME_PROGRESS_ADDRESS, gameProgressAbi, HAS_GAME_PROGRESS_ADDRESS } from '@/config/contracts'

export type LeaderboardEntry = {
  address: string
  bestScore: number
}

export function useLeaderboard(limit = 10) {
  const publicClient = usePublicClient({ chainId: baseSepolia.id })

  return useQuery({
    queryKey: ['leaderboard', limit],
    enabled: Boolean(publicClient) && HAS_GAME_PROGRESS_ADDRESS,
    staleTime: 15_000,
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      if (!publicClient || !HAS_GAME_PROGRESS_ADDRESS) {
        return []
      }

      const playersCount = (await publicClient.readContract({
        address: GAME_PROGRESS_ADDRESS,
        abi: gameProgressAbi,
        functionName: 'getPlayersCount',
      })) as bigint

      const total = Number(playersCount)

      if (total === 0) {
        return []
      }

      const slice = (await publicClient.readContract({
        address: GAME_PROGRESS_ADDRESS,
        abi: gameProgressAbi,
        functionName: 'getPlayersSlice',
        args: [BigInt(0), BigInt(total)],
      })) as readonly Address[]

      const bestScores = await Promise.all(
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

      return bestScores
        .sort((left, right) => right.bestScore - left.bestScore)
        .slice(0, limit)
    },
  })
}
