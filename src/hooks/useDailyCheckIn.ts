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
import { CURRENT_SEASON_ID } from '@/config/season'
import { BASE_CHAIN_ID } from '@/config/web3'
import { getDisplayErrorMessage } from '@/lib/missions'

export function useDailyCheckIn() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain()
  const [error, setError] = useState<string | null>(null)

  const query = useReadContracts({
    allowFailure: false,
    contracts:
      address && isConnected && HAS_DAILY_CHECKIN_CONTRACT_ADDRESS
        ? [
            {
              address: DAILY_CHECKIN_CONTRACT_ADDRESS,
              abi: gameProgressAbi,
              functionName: 'canSeasonCheckIn',
              args: [BigInt(CURRENT_SEASON_ID), address],
            },
            {
              address: DAILY_CHECKIN_CONTRACT_ADDRESS,
              abi: gameProgressAbi,
              functionName: 'getSeasonLastCheckIn',
              args: [BigInt(CURRENT_SEASON_ID), address],
            },
            {
              address: DAILY_CHECKIN_CONTRACT_ADDRESS,
              abi: gameProgressAbi,
              functionName: 'getSeasonCheckInCount',
              args: [BigInt(CURRENT_SEASON_ID), address],
            },
          ]
        : [],
    query: {
      enabled: Boolean(address) && HAS_DAILY_CHECKIN_CONTRACT_ADDRESS,
      staleTime: 15_000,
    },
  })

  const canCheckInNow = Boolean(query.data?.[0])
  const lastCheckInAt = Number(query.data?.[1] ?? 0)
  const totalCount = Number(query.data?.[2] ?? 0)
  const seasonContractUnavailable = query.isError
  const nextAvailableAt = lastCheckInAt > 0 ? lastCheckInAt * 1000 + DAILY_CHECK_IN_INTERVAL_MS : 0
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

    setError(null)
    void query.refetch()
  }, [isSuccess, query])

  const status = useMemo(() => {
    if (isPending || isConfirming || isSwitching) {
      return 'pending' as const
    }

    if (error) {
      return 'error' as const
    }

    if (seasonContractUnavailable) {
      return 'error' as const
    }

    if (!isConnected) {
      return 'wallet-disconnected' as const
    }

    if (chainId !== BASE_CHAIN_ID) {
      return 'wrong-network' as const
    }

    if (rewardActive) {
      return 'already-claimed' as const
    }

    return 'available' as const
  }, [chainId, error, isConfirming, isConnected, isPending, isSwitching, rewardActive, seasonContractUnavailable])

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

    if (seasonContractUnavailable) {
      return 'Season Contract Required'
    }

    if (rewardActive) {
      return 'Checked In Today'
    }

    return 'Daily Check-in'
  }, [chainId, isConfirming, isConnected, isPending, rewardActive, seasonContractUnavailable])

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

    if (seasonContractUnavailable) {
      setError('Deploy the Season 2 GameProgress contract before daily check-in.')
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
        functionName: 'dailySeasonCheckIn',
        args: [BigInt(CURRENT_SEASON_ID)],
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
