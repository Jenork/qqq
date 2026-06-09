import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.0.24', '10.6.7.1', 'localhost', '*.ngrok-free.app', '*.trycloudflare.com'],
  webpack: (config) => {
    config.resolve = config.resolve ?? {}
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@react-native-async-storage/async-storage': false,
      '@coinbase/wallet-sdk': false,
      '@metamask/connect-evm': false,
      '@metamask/sdk': false,
      '@safe-global/safe-apps-provider': false,
      '@safe-global/safe-apps-sdk': false,
      '@walletconnect/ethereum-provider': false,
      'pino-pretty': false,
      'porto': false,
      'porto/internal': false,
    }

    return config
  },
}

export default nextConfig
