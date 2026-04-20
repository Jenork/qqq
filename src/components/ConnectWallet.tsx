'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { shortenAddress } from '@/lib/score'

function getConnectorLabel(id: string, name: string) {
  if (id === 'metaMask') {
    return 'MetaMask'
  }

  if (id === 'coinbaseWallet') {
    return 'Coinbase Wallet'
  }

  if (id === 'otherInjected') {
    return 'Other Browser Wallet'
  }

  return name === 'Injected' ? 'Browser Wallet' : name
}

export function ConnectWallet() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const availableConnectors = connectors.filter(
    (connector, index, list) =>
      index ===
      list.findIndex(
        (candidate) =>
          getConnectorLabel(candidate.id, candidate.name) ===
          getConnectorLabel(connector.id, connector.name),
      ),
  )

  if (isReconnecting) {
    return (
      <div className="panel-state panel-state-muted text-sm">
        Reconnecting wallet...
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="rounded-[22px] border border-[#482018] bg-[linear-gradient(180deg,rgba(19,9,9,0.94),rgba(10,7,8,0.98))] p-4 shadow-[0_18px_32px_rgba(0,0,0,0.26)]">
        <p className="panel-title text-[#ffb78a]">Connect Wallet</p>
        <p className="mt-2 text-sm text-stone-300">Choose a browser wallet to save score and use onchain actions.</p>
        <div className="mt-4 flex flex-col gap-2">
        {availableConnectors.map((connector) => {
          const label = getConnectorLabel(connector.id, connector.name)

          return (
            <button
              key={connector.uid}
              type="button"
              className="action-button retro-button px-4 py-3 text-left text-sm font-semibold"
              onClick={() => connect({ connector })}
              disabled={isConnecting}
            >
              {isConnecting ? `Confirm ${label}...` : label}
            </button>
          )
        })}
        </div>
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
