'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  useAccount,
  useChainId,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { DAILY_CHECK_IN_INTERVAL_MS } from '@/config/missions'
import {
  DAILY_CHECKIN_CONTRACT_ADDRESS,
  gameProgressAbi,
  HAS_DAILY_CHECKIN_CONTRACT_ADDRESS,
} from '@/config/contracts'
import { BASE_CHAIN_ID } from '@/config/web3'
import { useSeasonPlayerStats } from '@/hooks/useSeasonPlayerStats'
import { getDisplayErrorMessage } from '@/lib/missions'

export function useDailyCheckIn() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain()
  const [error, setError] = useState<string | null>(null)
  const [optimisticLastCheckInAt, setOptimisticLastCheckInAt] = useState(0)
  const [optimisticCheckInCount, setOptimisticCheckInCount] = useState(0)
  const seasonStats = useSeasonPlayerStats(address)

  const query = useReadContracts({
    allowFailure: false,
    contracts:
      address && isConnected && HAS_DAILY_CHECKIN_CONTRACT_ADDRESS
        ? [
            {
              address: DAILY_CHECKIN_CONTRACT_ADDRESS,
              abi: gameProgressAbi,
              functionName: 'canCheckIn',
              args: [address],
            },
            {
              address: DAILY_CHECKIN_CONTRACT_ADDRESS,
              abi: gameProgressAbi,
              functionName: 'getLastCheckIn',
              args: [address],
            },
          ]
        : [],
    query: {
      enabled: Boolean(address) && HAS_DAILY_CHECKIN_CONTRACT_ADDRESS,
      staleTime: 15_000,
    },
  })

  const hasOptimisticCheckIn =
    optimisticLastCheckInAt > 0 && Date.now() < optimisticLastCheckInAt * 1000 + DAILY_CHECK_IN_INTERVAL_MS
  const canCheckInNow = !hasOptimisticCheckIn && Boolean(query.data?.[0])
  const refetchCheckInState = query.refetch
  const refetchSeasonStats = seasonStats.refetch
  const contractLastCheckInAt = Number(query.data?.[1] ?? 0)
  const lastCheckInAt = Math.max(seasonStats.data?.lastCheckInAt ?? 0, contractLastCheckInAt, optimisticLastCheckInAt)
  const totalCount = Math.max(seasonStats.data?.checkInCount ?? 0, optimisticCheckInCount)
  const contractUnavailable = query.isError
  const isCheckingAvailability =
    isConnected && HAS_DAILY_CHECKIN_CONTRACT_ADDRESS && query.isPending
  const nextAvailableAt =
    lastCheckInAt > 0 ? lastCheckInAt * 1000 + DAILY_CHECK_IN_INTERVAL_MS : 0
  const rewardActive = Boolean(lastCheckInAt) && !canCheckInNow

  const { data: hash, error: writeError, isPending, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (writeError) {
      setError(getDisplayErrorMessage(writeError))
    }
  }, [writeError])

  useEffect(() => {
    if (!isSuccess) {
      return
    }

    const submittedAt = Math.floor(Date.now() / 1000)

    setError(null)
    setOptimisticLastCheckInAt(submittedAt)
    setOptimisticCheckInCount((count) => Math.max(count, (seasonStats.data?.checkInCount ?? 0) + 1))

    const refreshCheckInReward = async () => {
      if (address) {
        const searchParams = new URLSearchParams({ address, refresh: '1' })
        await fetch(`/api/season/player?${searchParams.toString()}`, { cache: 'no-store' }).catch(() => null)
      }

      await Promise.allSettled([refetchCheckInState(), refetchSeasonStats()])
    }

    void refreshCheckInReward()
  }, [address, isSuccess, refetchCheckInState, refetchSeasonStats, seasonStats.data?.checkInCount])

  useEffect(() => {
    setOptimisticLastCheckInAt(0)
    setOptimisticCheckInCount(0)
  }, [address])

  const status = useMemo(() => {
    if (isPending || isConfirming || isSwitching || isCheckingAvailability) {
      return 'pending' as const
    }

    if (error) {
      return 'error' as const
    }

    if (contractUnavailable) {
      return 'error' as const
    }

    if (!isConnected) {
      return 'wallet-disconnected' as const
    }

    if (chainId !== BASE_CHAIN_ID) {
      return 'wrong-network' as const
    }

    if (!canCheckInNow) {
      return 'already-claimed' as const
    }

    return 'available' as const
  }, [
    canCheckInNow,
    chainId,
    contractUnavailable,
    error,
    isCheckingAvailability,
    isConfirming,
    isConnected,
    isPending,
    isSwitching,
  ])

  const actionLabel = useMemo(() => {
    if (!isConnected) {
      return 'Wallet Required'
    }

    if (chainId !== BASE_CHAIN_ID) {
      return 'Switch Network'
    }

    if (isPending) {
      return 'Confirm in Wallet'
    }

    if (isConfirming) {
      return 'Confirming'
    }

    if (isCheckingAvailability) {
      return 'Loading'
    }

    if (contractUnavailable) {
      return 'Contract Unavailable'
    }

    if (!canCheckInNow) {
      return 'Checked In Today'
    }

    return 'Daily Check-in'
  }, [canCheckInNow, chainId, contractUnavailable, isCheckingAvailability, isConfirming, isConnected, isPending])

  const run = async () => {
    if (!isConnected) {
      setError('Connect a wallet before sending the daily check-in transaction.')
      return
    }

    if (chainId !== BASE_CHAIN_ID) {
      setError(null)

      try {
        await switchChainAsync({ chainId: BASE_CHAIN_ID })
        return
      } catch (switchError) {
        setError(getDisplayErrorMessage(switchError))
        return
      }
    }

    if (!HAS_DAILY_CHECKIN_CONTRACT_ADDRESS) {
      setError('Daily check-in contract address is not configured.')
      return
    }

    if (contractUnavailable) {
      setError('GameProgress contract is unavailable for daily check-in.')
      return
    }

    if (!canCheckInNow) {
      setError('Daily check-in is already claimed for today.')
      return
    }

    try {
      setError(null)
      writeContract({
        address: DAILY_CHECKIN_CONTRACT_ADDRESS,
        abi: gameProgressAbi,
        functionName: 'dailyCheckIn',
      })
    } catch (switchError) {
      setError(getDisplayErrorMessage(switchError))
    }
  }

  return {
    canCheckIn: canCheckInNow,
    canCheckInNow,
    checkInCount: totalCount,
    totalCount,
    lastCheckInAt,
    nextAvailableAtMs: nextAvailableAt,
    nextAvailableAt,
    rewardActive,
    status,
    actionLabel,
    txHash: hash,
    errorMessage: error,
    error,
    isFetching: query.isFetching,
    isPending,
    isConfirming,
    isSuccess,
    dailyCheckIn: run,
    run,
  }
}
