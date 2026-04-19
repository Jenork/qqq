'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { shortenAddress } from '@/lib/score'

export function ConnectWallet() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  if (isReconnecting) {
    return <p className="text-sm text-stone-300">Reconnecting wallet...</p>
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col gap-2">
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            type="button"
            className="action-button retro-button px-4 py-3 text-left text-sm font-semibold"
            onClick={() => connect({ connector })}
            disabled={isConnecting}
          >
            {isConnecting ? 'Confirm in wallet...' : 'Browser Wallet'}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-sm font-semibold text-stone-100">
        {shortenAddress(address)}
      </span>
      <button
        type="button"
        onClick={() => disconnect()}
        className="action-button retro-button px-4 py-2 text-sm font-semibold"
      >
        Disconnect
      </button>
    </div>
  )
}
