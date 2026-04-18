'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAccount, useChainId, useDisconnect, useReadContract, useSwitchChain } from 'wagmi'
import { ConnectWallet } from '@/components/ConnectWallet'
import { GAME_PROGRESS_ADDRESS, gameProgressAbi, HAS_GAME_PROGRESS_ADDRESS } from '@/config/contracts'
import { BASE_CHAIN_ID, BASE_CHAIN_NAME, BASE_EXPLORER_URL } from '@/config/web3'
import { shortenAddress } from '@/lib/score'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

export function OnchainPanel() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

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

  const explorerHref = useMemo(() => {
    if (!address) {
      return BASE_EXPLORER_URL
    }

    return `${BASE_EXPLORER_URL}/address/${address}`
  }, [address])

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

      <div className="fixed left-[calc(12px+var(--safe-left))] right-[calc(12px+var(--safe-right))] top-[calc(12px+var(--safe-top))] z-50 sm:left-auto sm:w-[360px]">
        {expanded ? (
          <section className="inferno-frame rounded-[26px] p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="panel-title text-[#ffb78a]">Wallet</p>
                {isConnected ? <p className="mt-1 text-sm font-semibold text-stone-100">{shortenAddress(address)}</p> : null}
              </div>
              <button
                type="button"
                className="inferno-chip rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-stone-100"
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
                      <span className="inferno-chip rounded-full px-3 py-2 text-sm font-semibold text-stone-100">
                        {shortenAddress(address)}
                      </span>
                      <span className="inferno-chip rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-stone-200">
                        {chainId === BASE_CHAIN_ID ? BASE_CHAIN_NAME : `Chain ${chainId}`}
                      </span>
                      <span className="rounded-full border border-amber-300/20 bg-amber-500/12 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-amber-100">
                        Best {bestScore ? Number(bestScore) : 0}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="action-button rounded-2xl px-4 py-3 text-sm font-bold uppercase tracking-[0.14em]"
                        onClick={() => void handleCopyAddress()}
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                      <a
                        href={explorerHref}
                        target="_blank"
                        rel="noreferrer"
                        className="action-button flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold uppercase tracking-[0.14em]"
                      >
                        BaseScan
                      </a>
                      <button
                        type="button"
                        className="action-button col-span-2 rounded-2xl px-4 py-3 text-sm font-bold uppercase tracking-[0.14em]"
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
                    <div className="rounded-[18px] border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                      Contract not configured.
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </section>
        ) : (
          <button
            type="button"
            className="wallet-trigger ml-auto flex items-center gap-3 rounded-[18px] px-4 py-3 text-left backdrop-blur"
            onClick={() => setExpanded(true)}
          >
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#34ff73] shadow-[0_0_12px_rgba(52,255,115,0.7)]" />
            {isConnected ? <span className="text-sm font-black text-stone-100">{shortenAddress(address)}</span> : <span className="text-sm font-black text-stone-100">Wallet</span>}
          </button>
        )}
      </div>
    </>
  )
}
