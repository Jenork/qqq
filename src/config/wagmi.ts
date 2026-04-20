import { cookieStorage, createConfig, createStorage, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { BASE_CHAIN, BASE_RPC_URL } from '@/config/web3'

type BrowserWalletProvider = {
  isCoinbaseWallet?: boolean
  isMetaMask?: boolean
  providers?: BrowserWalletProvider[]
}

type BrowserWalletWindow = Window & {
  ethereum?: BrowserWalletProvider
}

function getInjectedProviders(window?: Window) {
  const walletWindow = window as BrowserWalletWindow | undefined
  const ethereum = walletWindow?.ethereum

  if (!ethereum) {
    return []
  }

  if (ethereum.providers?.length) {
    return ethereum.providers
  }

  return [ethereum]
}

function findMetaMaskProvider(window?: Window) {
  return getInjectedProviders(window).find(
    (provider: BrowserWalletProvider) => provider.isMetaMask && !provider.isCoinbaseWallet,
  )
}

function findCoinbaseWalletProvider(window?: Window) {
  return getInjectedProviders(window).find(
    (provider: BrowserWalletProvider) => provider.isCoinbaseWallet,
  )
}

function findOtherInjectedProvider(window?: Window) {
  return (
    getInjectedProviders(window).find(
      (provider: BrowserWalletProvider) => !provider.isMetaMask && !provider.isCoinbaseWallet,
    ) ??
    (window as BrowserWalletWindow | undefined)?.ethereum
  )
}

export const config = createConfig({
  chains: [BASE_CHAIN],
  multiInjectedProviderDiscovery: false,
  connectors: [
    injected({
      target: {
        id: 'metaMask',
        name: 'MetaMask',
        provider: (window?: unknown) => findMetaMaskProvider(window as Window | undefined),
      },
      unstable_shimAsyncInject: 2_000,
    }),
    injected({
      target: {
        id: 'coinbaseWallet',
        name: 'Coinbase Wallet',
        provider: (window?: unknown) => findCoinbaseWalletProvider(window as Window | undefined),
      },
      unstable_shimAsyncInject: 2_000,
    }),
    injected({
      target: {
        id: 'otherInjected',
        name: 'Other Browser Wallet',
        provider: (window?: unknown) => findOtherInjectedProvider(window as Window | undefined),
      },
      unstable_shimAsyncInject: 2_000,
    }),
  ],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [BASE_CHAIN.id]: http(BASE_RPC_URL),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
