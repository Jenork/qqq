'use client'

import { encodeFunctionData, type Abi, type Address, type Hex } from 'viem'
import { BASE_CHAIN, BASE_CHAIN_ID, BASE_CHAIN_NAME, BASE_RPC_URL } from '@/config/web3'

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

type WindowWithEthereum = Window & {
  ethereum?: Eip1193Provider
}

function getInjectedProvider() {
  if (typeof window === 'undefined') {
    return null
  }

  return (window as WindowWithEthereum).ethereum ?? null
}

function getChainIdHex(chainId: number) {
  return `0x${chainId.toString(16)}`
}

function parseHexChainId(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  return Number.parseInt(value, 16)
}

function bigintToHexQuantity(value: bigint) {
  return `0x${value.toString(16)}` as Hex
}

export async function ensureBaseMainnetSelected() {
  const provider = getInjectedProvider()

  if (!provider) {
    throw new Error('Injected wallet provider is not available.')
  }

  const targetChainIdHex = getChainIdHex(BASE_CHAIN_ID)
  const currentChainId = parseHexChainId(await provider.request({ method: 'eth_chainId' }))

  if (currentChainId === BASE_CHAIN_ID) {
    return
  }

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainIdHex }],
    })
  } catch (error) {
    const errorCode =
      typeof error === 'object' && error && 'code' in error ? Number(error.code) : undefined

    if (errorCode !== 4902) {
      throw error
    }

    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: targetChainIdHex,
          chainName: BASE_CHAIN_NAME,
          nativeCurrency: BASE_CHAIN.nativeCurrency,
          rpcUrls: [BASE_RPC_URL],
          blockExplorerUrls: [BASE_CHAIN.blockExplorers?.default.url ?? 'https://basescan.org'],
        },
      ],
    })

    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainIdHex }],
    })
  }

  const finalChainId = parseHexChainId(await provider.request({ method: 'eth_chainId' }))

  if (finalChainId !== BASE_CHAIN_ID) {
    throw new Error(
      `Wallet is still connected to chain ${finalChainId ?? 'unknown'}. Switch to ${BASE_CHAIN_NAME} and try again.`,
    )
  }
}

type SendInjectedContractTransactionParams = {
  from: Address
  to: Address
  abi: Abi
  functionName: string
  args?: readonly unknown[]
  value?: bigint
}

export async function sendInjectedContractTransaction({
  from,
  to,
  abi,
  functionName,
  args,
  value,
}: SendInjectedContractTransactionParams) {
  const provider = getInjectedProvider()

  if (!provider) {
    throw new Error('Injected wallet provider is not available.')
  }

  const data = encodeFunctionData({
    abi,
    functionName,
    args,
  })

  const txHash = await provider.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from,
        to,
        data,
        ...(value !== undefined ? { value: bigintToHexQuantity(value) } : {}),
      },
    ],
  })

  if (typeof txHash !== 'string' || !txHash.startsWith('0x')) {
    throw new Error('Wallet did not return a transaction hash.')
  }

  return txHash as Hex
}
