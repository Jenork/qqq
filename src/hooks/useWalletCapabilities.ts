'use client'

import { useMemo } from 'react'
import { useCapabilities } from 'wagmi'
import { BASE_CHAIN_ID } from '@/config/web3'

export function useWalletCapabilities() {
  const { data: capabilities } = useCapabilities()

  const supportsBatching = useMemo(() => {
    const atomic = capabilities?.[BASE_CHAIN_ID]?.atomic
    return atomic?.status === 'ready' || atomic?.status === 'supported'
  }, [capabilities])

  const supportsPaymaster = useMemo(() => {
    return capabilities?.[BASE_CHAIN_ID]?.paymasterService?.supported === true
  }, [capabilities])

  return {
    supportsBatching,
    supportsPaymaster,
  }
}
