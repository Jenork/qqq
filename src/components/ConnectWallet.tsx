'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useMobileViewport } from '@/hooks/useMobileViewport'
import { shortenAddress } from '@/lib/score'

function getConnectorLabel(id: string, name: string) {
  if (id === 'metaMaskSDK') {
    return 'MetaMask'
  }

  if (id === 'coinbaseWalletSDK') {
    return 'Coinbase Wallet'
  }

  if (id === 'walletConnect') {
    return 'WalletConnect'
  }

  if (id === 'otherInjected') {
    return 'Other Browser Wallet'
  }

  return name === 'Injected' ? 'Browser Wallet' : name
}

const MOBILE_CONNECTOR_IDS = new Set([
  'metaMaskSDK',
  'coinbaseWalletSDK',
  'walletConnect',
])

function getConnectorPriority(id: string) {
  if (id === 'metaMaskSDK') {
    return 0
  }

  if (id === 'coinbaseWalletSDK') {
    return 1
  }

  if (id === 'walletConnect') {
    return 2
  }

  if (id === 'otherInjected') {
    return 3
  }

  return 10
}

function getConnectorHint(id: string, mobile: boolean) {
  if (id === 'metaMaskSDK') {
    return mobile ? 'Opens the MetaMask app' : 'MetaMask extension or app'
  }

  if (id === 'coinbaseWalletSDK') {
    return mobile ? 'Opens Coinbase Wallet' : 'Coinbase extension or app'
  }

  if (id === 'walletConnect') {
    return mobile ? 'Connects external mobile wallets' : 'QR or mobile wallet handoff'
  }

  if (id === 'otherInjected') {
    return 'Fallback for browser wallets'
  }

  return 'Wallet connection'
}

function getConnectorBadge(id: string, mobile: boolean) {
  if (!mobile) {
    return null
  }

  if (id === 'metaMaskSDK' || id === 'coinbaseWalletSDK') {
    return 'Best for mobile'
  }

  if (id === 'walletConnect') {
    return 'External wallet'
  }

  return null
}

export function ConnectWallet() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { showTouchControls } = useMobileViewport()
  const availableConnectors = connectors
    .filter(
      (connector, index, list) =>
        index ===
        list.findIndex(
          (candidate) =>
            getConnectorLabel(candidate.id, candidate.name) ===
            getConnectorLabel(connector.id, connector.name),
        ),
    )
    .filter((connector) =>
      showTouchControls ? MOBILE_CONNECTOR_IDS.has(connector.id) : true,
    )
    .sort((left, right) => getConnectorPriority(left.id) - getConnectorPriority(right.id))
  const hasMobileWalletConnector = availableConnectors.some(
    (connector) =>
      connector.id === 'walletConnect' ||
      connector.id === 'metaMaskSDK' ||
      connector.id === 'coinbaseWalletSDK',
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
        <p className="mt-2 text-sm text-stone-300">
          {hasMobileWalletConnector
            ? showTouchControls
              ? 'Use MetaMask, Coinbase Wallet, or WalletConnect for other mobile wallets.'
              : 'Choose MetaMask, Coinbase Wallet, or WalletConnect for onchain actions.'
            : 'Choose a browser wallet to save score and use onchain actions.'}
        </p>
        <div className="mt-4 flex flex-col gap-2">
        {availableConnectors.map((connector) => {
          const label = getConnectorLabel(connector.id, connector.name)
          const hint = getConnectorHint(connector.id, showTouchControls)
          const badge = getConnectorBadge(connector.id, showTouchControls)

          return (
            <button
              key={connector.uid}
              type="button"
              className="action-button retro-button px-4 py-3 text-left"
              onClick={() => connect({ connector })}
              disabled={isConnecting}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-stone-100">
                    {isConnecting ? `Confirm ${label}...` : label}
                  </span>
                  <span className="mt-1 block text-xs text-stone-400">
                    {hint}
                  </span>
                </span>
                {badge ? (
                  <span className="inferno-chip shrink-0 rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#b5ffb7]">
                    {badge}
                  </span>
                ) : null}
              </span>
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
