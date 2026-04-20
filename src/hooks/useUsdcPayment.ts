'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAccount, useChainId, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import {
  erc20Abi,
  HAS_USDC_RECIPIENT,
  HAS_USDC_TOKEN_ADDRESS,
  USDC_PAYMENT_AMOUNT_UNITS,
  USDC_PAYMENT_AMOUNT_USDC,
  USDC_RECIPIENT,
  USDC_TOKEN_ADDRESS,
} from '@/config/tokens'
import { BASE_CHAIN_ID } from '@/config/web3'
import { getDisplayErrorMessage } from '@/lib/missions'
import { markUsdcMissionSuccess, readUsdcMissionState, USDC_MISSION_EVENT_NAME } from '@/lib/usdcMission'

export function useUsdcPayment() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain()
  const [error, setError] = useState<string | null>(null)
  const [storedSuccess, setStoredSuccess] = useState(() => readUsdcMissionState(address))

  const { data: hash, error: writeError, isPending, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    const sync = () => setStoredSuccess(readUsdcMissionState(address))

    sync()
    window.addEventListener('storage', sync)
    window.addEventListener(USDC_MISSION_EVENT_NAME, sync as EventListener)

    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(USDC_MISSION_EVENT_NAME, sync as EventListener)
    }
  }, [address])

  useEffect(() => {
    if (writeError) {
      setError(getDisplayErrorMessage(writeError))
    }
  }, [writeError])

  useEffect(() => {
    if (!isSuccess || !hash || !address) {
      return
    }

    markUsdcMissionSuccess(address, hash)
    setStoredSuccess(readUsdcMissionState(address))
    setError(null)
  }, [address, hash, isSuccess])

  const paymentSuccess = Boolean(storedSuccess)

  const status = useMemo(() => {
    if (!isConnected) {
      return 'wallet-disconnected' as const
    }

    if (chainId !== BASE_CHAIN_ID) {
      return 'wrong-network' as const
    }

    if (isPending || isSwitching) {
      return 'confirm-in-wallet' as const
    }

    if (isConfirming) {
      return 'confirming' as const
    }

    if (paymentSuccess) {
      return 'success' as const
    }

    if (error) {
      return 'error' as const
    }

    return 'available' as const
  }, [
    chainId,
    error,
    isConfirming,
    isConnected,
    isPending,
    isSwitching,
    paymentSuccess,
  ])

  const actionLabel = useMemo(() => {
    if (!isConnected) {
      return 'Wallet Required'
    }

    if (chainId !== BASE_CHAIN_ID) {
      return 'Switch Network'
    }

    if (isPending || isSwitching) {
      return 'Confirm in Wallet'
    }

    if (isConfirming) {
      return 'Confirming'
    }

    if (paymentSuccess) {
      return 'Shotgun Unlocked'
    }

    return `Pay ${USDC_PAYMENT_AMOUNT_USDC} USDC`
  }, [
    chainId,
    isConfirming,
    isConnected,
    isPending,
    isSwitching,
    paymentSuccess,
  ])

  const pay = async () => {
    if (!isConnected) {
      setError('Connect a wallet before sending the USDC transfer.')
      return
    }

    if (chainId !== BASE_CHAIN_ID) {
      setError(null)

      try {
        await switchChainAsync({ chainId: BASE_CHAIN_ID })
      } catch (switchError) {
        setError(getDisplayErrorMessage(switchError))
      }

      return
    }

    if (!HAS_USDC_TOKEN_ADDRESS || !HAS_USDC_RECIPIENT) {
      setError('USDC payment config is incomplete.')
      return
    }

    if (paymentSuccess) {
      setError(null)
      return
    }

    try {
      setError(null)
      writeContract({
        address: USDC_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [USDC_RECIPIENT, USDC_PAYMENT_AMOUNT_UNITS],
      })
    } catch (switchError) {
      setError(getDisplayErrorMessage(switchError))
    }
  }

  return {
    status,
    actionLabel,
    txHash: hash ?? storedSuccess?.txHash,
    isPending,
    isConfirming,
    isSuccess: paymentSuccess,
    error,
    shotgunUnlocked: paymentSuccess,
    pay,
    run: pay,
  }
}
