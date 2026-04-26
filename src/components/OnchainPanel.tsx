'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAccount, useChainId, useDisconnect, useReadContract, useSwitchChain } from 'wagmi'
import { ConnectWallet } from '@/components/ConnectWallet'
import { GAME_PROGRESS_ADDRESS, gameProgressAbi, HAS_GAME_PROGRESS_ADDRESS } from '@/config/contracts'
import { BASE_CHAIN_ID, BASE_CHAIN_NAME, BASE_EXPLORER_URL } from '@/config/web3'
import { useMobileViewport } from '@/hooks/useMobileViewport'
import { cn } from '@/lib/cn'
import { shortenAddress } from '@/lib/score'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
const SHOW_WALLET_DEBUG = process.env.NEXT_PUBLIC_WALLET_DEBUG === 'true'

type BrowserWalletProvider = {
  isCoinbaseWallet?: boolean
  isMetaMask?: boolean
  isBraveWallet?: boolean
  providers?: BrowserWalletProvider[]
}

type BrowserWalletWindow = Window & {
  ethereum?: BrowserWalletProvider
}

function getProviderNames() {
  if (typeof window === 'undefined') {
    return []
  }

  const ethereum = (window as BrowserWalletWindow).ethereum

  if (!ethereum) {
    return []
  }

  const providers = ethereum.providers?.length ? ethereum.providers : [ethereum]

  return providers.map((provider: BrowserWalletProvider) => {
    if (provider.isMetaMask && !provider.isCoinbaseWallet) {
      return 'MetaMask'
    }

    if (provider.isCoinbaseWallet) {
      return 'Coinbase Wallet'
    }

    if (provider.isBraveWallet) {
      return 'Brave Wallet'
    }

    return 'Unknown Injected'
  })
}

export function OnchainPanel() {
  const { address, connector, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [providerNames, setProviderNames] = useState<string[]>([])
  const dialogRef = useRef<HTMLElement | null>(null)
  const { isMobileLandscape, isMobilePortrait } = useMobileViewport()

  const { data: bestScore } = useReadContract({
    address: GAME_PROGRESS_ADDRESS,
    abi: gameProgressAbi,
    functionName: 'getBestScore',
    args: [address ?? ZERO_ADDRESS],
    chainId: BASE_CHAIN_ID,
    query: {
      enabled: Boolean(address) && HAS_GAME_PROGRESS_ADDRESS,
    },
  })

  useEffect(() => {
    if (!copied) {
      return
    }

    const timeoutId = window.setTimeout(() => setCopied(false), 1400)
    return () => window.clearTimeout(timeoutId)
  }, [copied])

  useEffect(() => {
    if (!SHOW_WALLET_DEBUG) {
      return
    }

    setProviderNames(getProviderNames())
  }, [])

  useEffect(() => {
    if (!expanded) {
      return
    }

    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    )

    focusable[0]?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setExpanded(false)
        return
      }

      if (event.key !== 'Tab' || focusable.length === 0) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    dialog.addEventListener('keydown', handleKeyDown)
    return () => dialog.removeEventListener('keydown', handleKeyDown)
  }, [expanded, isConnected, chainId, isSwitching, copied])

  const explorerHref = useMemo(() => {
    if (!address) {
      return BASE_EXPLORER_URL
    }

    return `${BASE_EXPLORER_URL}/address/${address}`
  }, [address])
  const bestScoreValue = bestScore ? Number(bestScore) : 0
  const isWrongNetwork = isConnected && chainId !== BASE_CHAIN_ID

  const handleCopyAddress = async () => {
    if (!address) {
      return
    }

    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <>
      {expanded ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
          onClick={() => setExpanded(false)}
          aria-label="Close wallet panel"
        />
      ) : null}

      <div
        className={cn(
          'fixed top-[calc(12px+var(--safe-top))] z-50',
          isMobileLandscape
            ? 'right-[calc(12px+var(--safe-right))] w-[min(330px,calc(100vw-var(--safe-left)-var(--safe-right)-24px))]'
            : 'left-[calc(12px+var(--safe-left))] right-[calc(12px+var(--safe-right))] sm:left-auto sm:w-[360px]',
        )}
      >
        {expanded ? (
          <section
            id="wallet-panel-dialog"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-panel-title"
            className={cn(
              'inferno-frame overflow-y-auto rounded-[26px] p-4',
              isMobileLandscape
                ? 'max-h-[calc(100svh-var(--safe-top)-24px)] rounded-[22px] p-3.5'
                : isMobilePortrait
                  ? 'max-h-[calc(100svh-var(--safe-top)-24px)]'
                  : '',
            )}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p id="wallet-panel-title" className="panel-title text-[#ffb78a]">Wallet</p>
                <p className={cn('mt-1 text-stone-300', isMobileLandscape ? 'text-xs' : 'text-sm')}>
                  {isConnected ? 'Connected wallet status' : 'Optional onchain layer'}
                </p>
              </div>
              <button
                type="button"
                className={cn(
                  'inferno-chip rounded-full font-black uppercase tracking-[0.14em] text-stone-100',
                  isMobileLandscape ? 'px-2.5 py-1.5 text-[10px]' : 'px-3 py-2 text-[11px]',
                )}
                onClick={() => setExpanded(false)}
              >
                Close
              </button>
            </div>

            <div className="grid gap-3">
              {!isConnected ? <ConnectWallet /> : null}

              {isConnected && address ? (
                <>
                  <div className="rounded-[22px] border border-[#482018] bg-[linear-gradient(180deg,rgba(19,9,9,0.94),rgba(10,7,8,0.98))] p-4 shadow-[0_18px_32px_rgba(0,0,0,0.26)]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#4de06c]/35 bg-[#16301a] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#b5ffb7]">
                        Connected
                      </span>
                      <span className="inferno-chip rounded-full px-3 py-2 text-sm font-semibold text-stone-100">
                        {shortenAddress(address)}
                      </span>
                      <span
                        className={
                          isWrongNetwork
                            ? 'rounded-full border border-amber-300/20 bg-amber-500/12 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-amber-100'
                            : 'inferno-chip rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-stone-200'
                        }
                      >
                        {isWrongNetwork ? `Wrong Network (${chainId})` : BASE_CHAIN_NAME}
                      </span>
                      <span className="rounded-full border border-amber-300/20 bg-amber-500/12 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-amber-100">
                        Best {bestScoreValue}
                      </span>
                    </div>

                    <div className={cn('mt-3 grid gap-2', isMobileLandscape ? 'grid-cols-2' : 'grid-cols-2')}>
                      <button
                        type="button"
                        className={cn(
                          'action-button rounded-2xl font-bold uppercase tracking-[0.14em]',
                          isMobileLandscape ? 'px-3 py-2.5 text-xs' : 'px-4 py-3 text-sm',
                        )}
                        onClick={() => void handleCopyAddress()}
                      >
                        {copied ? 'Copied' : 'Copy Address'}
                      </button>
                      <a
                        href={explorerHref}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          'action-button flex items-center justify-center rounded-2xl font-bold uppercase tracking-[0.14em]',
                          isMobileLandscape ? 'px-3 py-2.5 text-xs' : 'px-4 py-3 text-sm',
                        )}
                      >
                        Open BaseScan
                      </a>
                      <button
                        type="button"
                        className={cn(
                          'action-button col-span-2 rounded-2xl font-bold uppercase tracking-[0.14em]',
                          isMobileLandscape ? 'px-3 py-2.5 text-xs' : 'px-4 py-3 text-sm',
                        )}
                        onClick={() => disconnect()}
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>

                  {chainId !== BASE_CHAIN_ID ? (
                    <button
                      type="button"
                      className="action-button w-full rounded-full border-white/10 bg-white/6 px-4 py-3 text-sm font-bold uppercase tracking-[0.14em]"
                      onClick={() => switchChain({ chainId: BASE_CHAIN_ID })}
                    >
                      {isSwitching ? 'Switching...' : `Switch to ${BASE_CHAIN_NAME}`}
                    </button>
                  ) : null}

                  {!HAS_GAME_PROGRESS_ADDRESS ? (
                    <div className="panel-state panel-state-warning text-sm">
                      Contract not configured.
                    </div>
                  ) : null}

                  {SHOW_WALLET_DEBUG ? (
                    <div className="rounded-[18px] border border-sky-300/20 bg-sky-500/10 px-4 py-3 text-xs text-sky-100">
                      <p>Connector: {connector?.name ?? 'none'}</p>
                      <p>Connector id: {connector?.id ?? 'none'}</p>
                      <p>Injected providers: {providerNames.length ? providerNames.join(', ') : 'none'}</p>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </section>
        ) : (
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={expanded}
            aria-controls="wallet-panel-dialog"
            className={cn(
              'wallet-trigger ml-auto flex items-center gap-3 text-left backdrop-blur',
              isMobileLandscape ? 'rounded-[16px] px-3 py-2.5' : 'rounded-[18px] px-4 py-3',
            )}
            onClick={() => setExpanded(true)}
          >
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#34ff73] shadow-[0_0_12px_rgba(52,255,115,0.7)]" />
            {isConnected ? (
              <span className={cn('font-black text-stone-100', isMobileLandscape ? 'text-[13px]' : 'text-sm')}>
                {shortenAddress(address)}
              </span>
            ) : (
              <span className={cn('font-black text-stone-100', isMobileLandscape ? 'text-[13px]' : 'text-sm')}>
                Wallet
              </span>
            )}
          </button>
        )}
      </div>
    </>
  )
}
