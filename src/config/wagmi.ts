import { cookieStorage, createConfig, createStorage, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { BASE_CHAIN, BASE_RPC_URL } from '@/config/web3'

export const config = createConfig({
  chains: [BASE_CHAIN],
  connectors: [injected()],
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
