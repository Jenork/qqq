'use client'

import type { Address } from 'viem'
import { usePublicClient } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { HAS_GAME_PROGRESS_ADDRESS } from '@/config/contracts'
import { CURRENT_SEASON_START_BLOCK } from '@/config/season'
import { BASE_CHAIN_ID } from '@/config/web3'
import { readSeasonPlayerStats } from '@/lib/seasonProgress'

export function useSeasonPlayerStats(address?: string | null) {
  const publicClient = usePublicClient({ chainId: BASE_CHAIN_ID })

  return useQuery({
    queryKey: ['season-player-stats', CURRENT_SEASON_START_BLOCK.toString(), address?.toLowerCase() ?? 'guest'],
    enabled: Boolean(publicClient) && Boolean(address) && HAS_GAME_PROGRESS_ADDRESS,
    staleTime: 15_000,
    queryFn: async () => {
      if (!publicClient || !address) {
        return {
          bestScore: 0,
          checkInCount: 0,
          lastCheckInAt: 0,
        }
      }

      return readSeasonPlayerStats(publicClient, address as Address)
    },
  })
}
