import { cookieStorage, createConfig, createStorage, http } from 'wagmi'
import { injected } from '@wagmi/core'
import { BASE_BUILDER_DATA_SUFFIX } from '@/config/builderCode'
import { BASE_CHAIN, BASE_RPC_URL } from '@/config/web3'
import { baseAccount } from '@/lib/baseAccountConnector'

const appName = 'Based DooM'

const connectors = [
  baseAccount({
    appName,
  }),
  injected({
    shimDisconnect: false,
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
