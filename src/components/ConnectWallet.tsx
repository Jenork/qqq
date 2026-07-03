'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { BASE_CHAIN_ID } from '@/config/web3'
import { useMobileViewport } from '@/hooks/useMobileViewport'
import { shortenAddress } from '@/lib/score'

type EthereumProvider = {
  isMetaMask?: boolean
  providers?: EthereumProvider[]
}

type WindowWithEthereum = Window & {
  ethereum?: EthereumProvider
}

type MobileWalletLink = {
  label: string
  href: string
  fallbackHref?: string
  wallet: 'metamask' | 'coinbase'
}

const MOBILE_WALLET_PARAM = 'wallet'
const METAMASK_WALLET_PARAM = 'metamask'

function getConnectorLabel(id: string, name: string) {
  if (id === 'baseAccount') {
    return 'Base Account'
  }

  if (id === 'injected') {
    return 'Browser Wallet'
  }

  return name === 'Injected' ? 'Browser Wallet' : name
}

const MOBILE_CONNECTOR_IDS = new Set([
  'baseAccount',
  'injected',
])

function getConnectorPriority(id: string) {
  if (id === 'baseAccount') {
    return 0
  }

  if (id === 'injected') {
    return 1
  }

  return 10
}

function getConnectorHint(id: string, mobile: boolean) {
  if (id === 'baseAccount') {
    return mobile ? 'Best path inside Base App' : 'Smart wallet path for Base'
  }

  if (id === 'injected') {
    return mobile ? 'Wallet app browser connection' : 'Browser extension or injected wallet'
  }

  return 'Wallet connection'
}

function getConnectorBadge(id: string, mobile: boolean) {
  if (!mobile) {
    return null
  }

  if (id === 'baseAccount') {
    return 'Base App'
  }

  if (id === 'injected') {
    return 'Fallback'
  }

  return null
}

function hasInjectedWalletProvider() {
  if (typeof window === 'undefined') {
    return false
  }

  return Boolean((window as WindowWithEthereum).ethereum)
}

function hasMetaMaskWalletProvider() {
  if (typeof window === 'undefined') {
    return false
  }

  const provider = (window as WindowWithEthereum).ethereum

  return Boolean(provider?.isMetaMask || provider?.providers?.some((item) => item.isMetaMask))
}

function getUrlWithWalletParam(wallet: string) {
  const url = new URL(window.location.href)
  url.searchParams.set(MOBILE_WALLET_PARAM, wallet)
  return url.toString()
}

function getMobileWalletLinks(): MobileWalletLink[] {
  if (typeof window === 'undefined') {
    return []
  }

  const metamaskUrl = getUrlWithWalletParam(METAMASK_WALLET_PARAM)
  const currentUrl = getUrlWithWalletParam('coinbase')
  const metamaskDappUrl = metamaskUrl.replace(/^https?:\/\//, '')

  return [
    {
      label: 'Connect MetaMask',
      href: `metamask://dapp/${metamaskDappUrl}`,
      fallbackHref: `https://metamask.app.link/dapp/${metamaskDappUrl}`,
      wallet: 'metamask',
    },
    {
      label: 'Open Coinbase Wallet',
      href: `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(currentUrl)}`,
      wallet: 'coinbase',
    },
  ]
}

function getConnectErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Wallet connection failed. Open the game inside a wallet browser and try again.'
}

export function ConnectWallet() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount()
  const { connectAsync, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { showTouchControls } = useMobileViewport()
  const [connectError, setConnectError] = useState<string | null>(null)
  const [hasInjectedProvider, setHasInjectedProvider] = useState(false)
  const [mobileWalletLinks, setMobileWalletLinks] = useState<MobileWalletLink[]>([])
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
    (connector) => connector.id === 'baseAccount' || connector.id === 'injected',
  )
  const isWalletConnecting = isConnecting || isPending
  const [autoConnectAttempted, setAutoConnectAttempted] = useState(false)

  useEffect(() => {
    const syncInjectedProvider = () => {
      setHasInjectedProvider(hasInjectedWalletProvider())
    }

    syncInjectedProvider()
    const timer = window.setTimeout(syncInjectedProvider, 1_000)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    setMobileWalletLinks(getMobileWalletLinks())
  }, [])

  const handleConnect = useCallback(async (connector: (typeof availableConnectors)[number]) => {
    setConnectError(null)

    try {
      await connectAsync({ connector, chainId: BASE_CHAIN_ID })
    } catch (error) {
      setConnectError(getConnectErrorMessage(error))
    }
  }, [connectAsync])

  useEffect(() => {
    if (
      autoConnectAttempted ||
      isConnected ||
      isWalletConnecting ||
      !hasInjectedProvider ||
      typeof window === 'undefined'
    ) {
      return
    }

    const walletParam = new URL(window.location.href).searchParams.get(MOBILE_WALLET_PARAM)

    if (walletParam !== METAMASK_WALLET_PARAM || !hasMetaMaskWalletProvider()) {
      return
    }

    const injectedConnector = availableConnectors.find((connector) => connector.id === 'injected')

    if (!injectedConnector) {
      return
    }

    setAutoConnectAttempted(true)
    void handleConnect(injectedConnector)
  }, [
    autoConnectAttempted,
    availableConnectors,
    handleConnect,
    hasInjectedProvider,
    isConnected,
    isWalletConnecting,
  ])

  const openMobileWallet = (wallet: MobileWalletLink) => {
    if (wallet.wallet !== 'metamask' || !wallet.fallbackHref) {
      window.location.href = wallet.href
      return
    }

    const openedAt = Date.now()
    window.location.href = wallet.href

    window.setTimeout(() => {
      if (document.visibilityState === 'visible' && Date.now() - openedAt < 2_000) {
        window.location.href = wallet.fallbackHref ?? wallet.href
      }
    }, 800)
  }

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
              ? 'Use Base Account inside Base App, or open the game in a wallet browser.'
              : 'Choose Base Account or a browser wallet for onchain actions.'
            : 'Choose a browser wallet to save score and use onchain actions.'}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {availableConnectors.map((connector) => {
            const label = getConnectorLabel(connector.id, connector.name)
            const hint = getConnectorHint(connector.id, showTouchControls)
            const badge = getConnectorBadge(connector.id, showTouchControls)
            const needsMobileWalletBrowser =
              showTouchControls && connector.id === 'injected' && !hasInjectedProvider

            return needsMobileWalletBrowser ? (
              <div
                key={connector.uid}
                className="rounded-[18px] border border-white/10 bg-black/24 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-stone-100">
                      {label}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-stone-400">
                      Open this game in MetaMask or Coinbase Wallet. MetaMask will request connection automatically.
                    </span>
                  </span>
                  {badge ? (
                    <span className="inferno-chip shrink-0 rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#b5ffb7]">
                      {badge}
                    </span>
                  ) : null}
                </div>
                {mobileWalletLinks.length > 0 ? (
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {mobileWalletLinks.map((wallet) => (
                      <button
                        key={wallet.href}
                        type="button"
                        onClick={() => openMobileWallet(wallet)}
                        className="action-button retro-button px-3 py-2 text-center text-xs font-black uppercase tracking-[0.12em]"
                      >
                        {wallet.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <button
                key={connector.uid}
                type="button"
                className="action-button retro-button px-4 py-3 text-left"
                onClick={() => handleConnect(connector)}
                disabled={isWalletConnecting}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-stone-100">
                      {isWalletConnecting ? `Confirm ${label}...` : label}
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
        {connectError ? (
          <p className="mt-3 rounded-[14px] border border-red-400/20 bg-red-950/30 px-3 py-2 text-xs leading-relaxed text-red-100">
            {connectError}
          </p>
        ) : null}
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
