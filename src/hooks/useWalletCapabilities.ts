'use client'

import { useMemo } from 'react'
import { useCapabilities } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'

export function useWalletCapabilities() {
  const { data: capabilities } = useCapabilities()

  const supportsBatching = useMemo(() => {
    const atomic = capabilities?.[baseSepolia.id]?.atomic
    return atomic?.status === 'ready' || atomic?.status === 'supported'
  }, [capabilities])

  const supportsPaymaster = useMemo(() => {
    return capabilities?.[baseSepolia.id]?.paymasterService?.supported === true
  }, [capabilities])

  return {
    supportsBatching,
    supportsPaymaster,
  }
}
