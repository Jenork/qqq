'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { GAME_PROGRESS_ADDRESS, gameProgressAbi, HAS_GAME_PROGRESS_ADDRESS } from '@/config/contracts'
import { SHOTGUN_ITEM_ID } from '@/config/missions'
import { BASE_CHAIN_ID } from '@/config/web3'
import { readAnyUsdcMissionState, readUsdcMissionState, USDC_MISSION_EVENT_NAME } from '@/lib/usdcMission'

export function useWeaponUnlocks() {
  const { address, isConnected } = useAccount()
  const [localUnlock, setLocalUnlock] = useState(() =>
    Boolean(address ? readUsdcMissionState(address) : readAnyUsdcMissionState()),
  )

  const query = useReadContract({
    address: GAME_PROGRESS_ADDRESS,
    abi: gameProgressAbi,
    functionName: 'isItemUnlocked',
    args: address ? [address, BigInt(SHOTGUN_ITEM_ID)] : undefined,
    chainId: BASE_CHAIN_ID,
    query: {
      enabled: Boolean(address) && isConnected && HAS_GAME_PROGRESS_ADDRESS,
      staleTime: 15_000,
    },
  })

  useEffect(() => {
    const sync = () => {
      setLocalUnlock(Boolean(address ? readUsdcMissionState(address) : readAnyUsdcMissionState()))
    }

    sync()
    window.addEventListener('storage', sync)
    window.addEventListener(USDC_MISSION_EVENT_NAME, sync as EventListener)

    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(USDC_MISSION_EVENT_NAME, sync as EventListener)
    }
  }, [address])

  const shotgunUnlocked = Boolean(query.data) || localUnlock

  return useMemo(
    () => ({
      shotgunUnlocked,
      unlockedItemIds: shotgunUnlocked ? (['shotgun'] as const) : ([] as const),
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isError: query.isError,
      refetch: query.refetch,
    }),
    [query.isError, query.isFetching, query.isLoading, query.refetch, shotgunUnlocked],
  )
}
