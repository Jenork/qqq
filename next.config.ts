import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.0.24', '10.6.7.1', 'localhost', '*.ngrok-free.app', '*.trycloudflare.com'],
  webpack: (config) => {
    config.resolve = config.resolve ?? {}
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    }

    return config
  },
}

export default nextConfig
