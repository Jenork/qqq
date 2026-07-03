import { base } from 'wagmi/chains'

const configuredChainId = Number(process.env.NEXT_PUBLIC_BASE_CHAIN_ID ?? base.id)
const rpcUrl =
  process.env.NEXT_PUBLIC_BASE_RPC_URL?.trim() ||
  'https://mainnet.base.org'

export const BASE_CHAIN = base
export const BASE_CHAIN_ID =
  Number.isFinite(configuredChainId) && configuredChainId === base.id
    ? configuredChainId
    : base.id
export const BASE_CHAIN_NAME = 'Base Mainnet'
export const BASE_RPC_URL = rpcUrl
export const BASE_EXPLORER_URL = BASE_CHAIN.blockExplorers?.default.url ?? 'https://basescan.org'
