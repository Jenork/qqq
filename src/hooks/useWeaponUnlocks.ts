'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { decodeEventLog, isAddressEqual, type Hex } from 'viem'
import { useAccount, usePublicClient, useReadContract } from 'wagmi'
import { GAME_PROGRESS_ADDRESS, gameProgressAbi, HAS_GAME_PROGRESS_ADDRESS } from '@/config/contracts'
import { SHOTGUN_ITEM_ID } from '@/config/missions'
import { BASE_CHAIN_ID } from '@/config/web3'
import {
  erc20Abi,
  HAS_USDC_RECIPIENT,
  HAS_USDC_TOKEN_ADDRESS,
  USDC_PAYMENT_AMOUNT_UNITS,
  USDC_RECIPIENT,
  USDC_TOKEN_ADDRESS,
} from '@/config/tokens'
import { readUsdcMissionState, USDC_MISSION_EVENT_NAME } from '@/lib/usdcMission'

export function useWeaponUnlocks() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient({ chainId: BASE_CHAIN_ID })
  const [localMission, setLocalMission] = useState(() => readUsdcMissionState(address))

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
      setLocalMission(readUsdcMissionState(address))
    }

    sync()
    window.addEventListener('storage', sync)
    window.addEventListener(USDC_MISSION_EVENT_NAME, sync as EventListener)

    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(USDC_MISSION_EVENT_NAME, sync as EventListener)
    }
  }, [address])

  const verifiedPayment = useQuery({
    queryKey: ['weapon-unlocks', 'verify-usdc-payment', address, localMission?.txHash ?? null],
    enabled:
      Boolean(address) &&
      Boolean(localMission?.txHash) &&
      Boolean(publicClient) &&
      HAS_USDC_TOKEN_ADDRESS &&
      HAS_USDC_RECIPIENT,
    staleTime: 60_000,
    queryFn: async () => {
      if (!address || !localMission?.txHash || !publicClient) {
        return false
      }

      const receipt = await publicClient.getTransactionReceipt({
        hash: localMission.txHash as Hex,
      })

      if (receipt.status !== 'success') {
        return false
      }

      return receipt.logs.some((log) => {
        if (!isAddressEqual(log.address, USDC_TOKEN_ADDRESS)) {
          return false
        }

        try {
          const decoded = decodeEventLog({
            abi: erc20Abi,
            data: log.data,
            topics: log.topics,
          })

          if (decoded.eventName !== 'Transfer') {
            return false
          }

          return (
            isAddressEqual(decoded.args.from, address) &&
            isAddressEqual(decoded.args.to, USDC_RECIPIENT) &&
            decoded.args.value === USDC_PAYMENT_AMOUNT_UNITS
          )
        } catch {
          return false
        }
      })
    },
  })

  const shotgunUnlocked = Boolean(query.data) || Boolean(verifiedPayment.data)

  return useMemo(
    () => ({
      shotgunUnlocked,
      unlockedItemIds: shotgunUnlocked ? (['shotgun'] as const) : ([] as const),
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isError: query.isError,
      isPaymentVerified: Boolean(verifiedPayment.data),
      refetch: query.refetch,
    }),
    [
      query.isError,
      query.isFetching,
      query.isLoading,
      query.refetch,
      shotgunUnlocked,
      verifiedPayment.data,
    ],
  )
}
