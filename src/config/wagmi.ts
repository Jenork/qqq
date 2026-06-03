import { cookieStorage, createConfig, createStorage, http } from 'wagmi'
import { coinbaseWallet, injected, metaMask, walletConnect } from 'wagmi/connectors'
import { BASE_BUILDER_DATA_SUFFIX } from '@/config/builderCode'
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

function findOtherInjectedProvider(window?: Window) {
  return (
    getInjectedProviders(window).find(
      (provider: BrowserWalletProvider) => !provider.isMetaMask && !provider.isCoinbaseWallet,
    ) ??
    (window as BrowserWalletWindow | undefined)?.ethereum
  )
}

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim()
const appName = 'BaseUp Survival'

const connectors = [
  metaMask({
    dappMetadata: {
      name: appName,
    },
  }),
  coinbaseWallet({
    appName,
    preference: 'all',
  }),
  ...(walletConnectProjectId
    ? [
        walletConnect({
          projectId: walletConnectProjectId,
          showQrModal: true,
          metadata: {
            name: appName,
            description: 'BaseUp Survival on Base',
            url: typeof window !== 'undefined' ? window.location.origin : 'https://baseup-survival.app',
            icons: [],
          },
        }),
      ]
    : []),
  injected({
    shimDisconnect: false,
    target: {
      id: 'otherInjected',
      name: 'Other Browser Wallet',
      provider: (window?: unknown) => findOtherInjectedProvider(window as Window | undefined),
    },
    unstable_shimAsyncInject: 2_000,
  }),
] as const

export const config = createConfig({
  chains: [BASE_CHAIN],
  multiInjectedProviderDiscovery: false,
  connectors,
  dataSuffix: BASE_BUILDER_DATA_SUFFIX,
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
