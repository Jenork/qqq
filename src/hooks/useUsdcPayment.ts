'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { decodeEventLog, isAddressEqual, isHex, type Address, type Hex } from 'viem'
import {
  useAccount,
  useChainId,
  usePublicClient,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
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

type ReceiptClient = {
  getTransactionReceipt(args: { hash: Hex }): Promise<{
    status: string
    logs: Array<{
      address: Address
      data: Hex
      topics: readonly Hex[]
    }>
  }>
}

async function verifyUsdcTransferReceipt(
  publicClient: ReceiptClient,
  txHash: Hex,
  playerAddress: Address,
) {
  const receipt = await publicClient.getTransactionReceipt({
    hash: txHash as Hex,
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
        topics: log.topics as [Hex, ...Hex[]],
      })

      if (decoded.eventName !== 'Transfer') {
        return false
      }

      return (
        isAddressEqual(decoded.args.from, playerAddress) &&
        isAddressEqual(decoded.args.to, USDC_RECIPIENT) &&
        decoded.args.value === USDC_PAYMENT_AMOUNT_UNITS
      )
    } catch {
      return false
    }
  })
}

export function useUsdcPayment() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient({ chainId: BASE_CHAIN_ID })
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

  const receiptHash = hash ?? storedSuccess?.txHash ?? null
  const verifiedPayment = useQuery({
    queryKey: ['usdc-payment', 'verify-transfer', address, receiptHash],
    enabled:
      Boolean(address) &&
      Boolean(receiptHash) &&
      Boolean(publicClient) &&
      HAS_USDC_TOKEN_ADDRESS &&
      HAS_USDC_RECIPIENT,
    staleTime: 60_000,
    queryFn: async () => {
      if (!address || !receiptHash || !publicClient) {
        return false
      }

      if (!isHex(receiptHash)) {
        return false
      }

      return verifyUsdcTransferReceipt(publicClient, receiptHash, address)
    },
  })
  const paymentSuccess = verifiedPayment.data === true
  const verificationFailed =
    Boolean(receiptHash) &&
    (verifiedPayment.isError || (verifiedPayment.isSuccess && verifiedPayment.data === false))
  const isVerifyingPayment = Boolean(receiptHash) && verifiedPayment.isFetching
  const displayError = error ?? (verificationFailed ? 'USDC payment was not verified onchain.' : null)

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

    if (isVerifyingPayment) {
      return 'confirming' as const
    }

    if (paymentSuccess) {
      return 'success' as const
    }

    if (displayError) {
      return 'error' as const
    }

    return 'available' as const
  }, [
    chainId,
    displayError,
    isConfirming,
    isConnected,
    isPending,
    isSwitching,
    isVerifyingPayment,
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

    if (isVerifyingPayment) {
      return 'Verifying'
    }

    if (paymentSuccess) {
      return 'Grenade Unlocked'
    }

    return `Pay ${USDC_PAYMENT_AMOUNT_USDC} USDC`
  }, [
    chainId,
    isConfirming,
    isConnected,
    isPending,
    isSwitching,
    isVerifyingPayment,
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
    txHash: receiptHash,
    isPending,
    isConfirming: isConfirming || isVerifyingPayment,
    isSuccess: paymentSuccess,
    error: displayError,
    grenadeUnlocked: paymentSuccess,
    pay,
    run: pay,
  }
}
