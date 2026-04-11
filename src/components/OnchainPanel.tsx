'use client'

import { useEffect, useState } from 'react'
import { useAccount, useChainId, useReadContract, useSwitchChain } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { ConnectWallet } from '@/components/ConnectWallet'
import { GAME_PROGRESS_ADDRESS, gameProgressAbi, HAS_GAME_PROGRESS_ADDRESS } from '@/config/contracts'
import { useGameStore } from '@/hooks/useGameStore'
import { useWalletCapabilities } from '@/hooks/useWalletCapabilities'
import { shortenAddress } from '@/lib/score'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

export function OnchainPanel() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const setOnchainUnlocked = useGameStore((state) => state.setOnchainUnlocked)
  const { supportsBatching, supportsPaymaster } = useWalletCapabilities()
  const [expanded, setExpanded] = useState(false)

  const { data: bestScore } = useReadContract({
    address: GAME_PROGRESS_ADDRESS,
    abi: gameProgressAbi,
    functionName: 'getBestScore',
    args: [address ?? ZERO_ADDRESS],
    chainId: baseSepolia.id,
    query: {
      enabled: Boolean(address) && HAS_GAME_PROGRESS_ADDRESS,
    },
  })

  useEffect(() => {
    if (!address) {
      setOnchainUnlocked([])
    }
  }, [address, setOnchainUnlocked])

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

      <div className="fixed bottom-[calc(12px+var(--safe-bottom))] right-[calc(12px+var(--safe-right))] z-50 left-[calc(12px+var(--safe-left))] sm:left-auto sm:w-[360px]">
        {expanded ? (
          <section className="rounded-[24px] border border-white/10 bg-[#160b0a]/92 p-4 shadow-[0_20px_44px_rgba(0,0,0,0.45)] backdrop-blur">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-orange-200">Wallet & Save</p>
                <p className="mt-1 text-sm text-stone-200">
                  {isConnected ? `${shortenAddress(address)} / best ${bestScore ? Number(bestScore) : 0}` : 'Optional onchain progress'}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-stone-100"
                onClick={() => setExpanded(false)}
              >
                Close
              </button>
            </div>

            <div className="grid gap-3">
              <ConnectWallet />

              {isConnected ? (
                <>
                  <div className="rounded-[18px] border border-white/10 bg-black/24 p-4 text-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-orange-200">Player</p>
                    <p className="mt-2 font-semibold text-stone-100">{shortenAddress(address)}</p>
                    <p className="mt-2 text-stone-300">
                      Network: {chainId === baseSepolia.id ? 'Base Sepolia' : `Chain ${chainId}`}
                    </p>
                  </div>

                  {chainId !== baseSepolia.id ? (
                    <button
                      type="button"
                      className="action-button w-full rounded-full border-white/10 bg-white/6 px-4 py-3 text-sm font-bold"
                      onClick={() => switchChain({ chainId: baseSepolia.id })}
                    >
                      {isSwitching ? 'Switching...' : 'Switch to Base Sepolia'}
                    </button>
                  ) : null}

                  <div className="rounded-[18px] border border-white/10 bg-black/24 p-4 text-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-orange-200">Progress</p>
                    <p className="mt-2 text-stone-200">
                      Onchain best score: <span className="font-black text-amber-200">{bestScore ? Number(bestScore) : 0}</span>
                    </p>
                    {!HAS_GAME_PROGRESS_ADDRESS ? (
                      <p className="mt-2 text-amber-100">Contract address is not configured yet.</p>
                    ) : null}
                  </div>

                  <div className="rounded-[18px] border border-white/10 bg-black/24 p-4 text-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-orange-200">Capabilities</p>
                    <div className="mt-2 grid gap-2">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-stone-200">
                        Batching: {supportsBatching ? 'Supported' : 'Single tx'}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-stone-200">
                        Paymaster: {supportsPaymaster ? 'Supported' : 'Not detected'}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-[18px] border border-white/10 bg-black/24 px-4 py-3 text-sm text-stone-300">
                  Connect only when you want to claim items or submit best score onchain.
                </div>
              )}
            </div>
          </section>
        ) : (
          <button
            type="button"
            className="ml-auto flex items-center gap-3 rounded-full border border-white/10 bg-[#160b0a]/88 px-4 py-3 text-left shadow-[0_14px_34px_rgba(0,0,0,0.4)] backdrop-blur"
            onClick={() => setExpanded(true)}
          >
            <span className="text-[11px] font-black uppercase tracking-[0.14em] text-orange-200">Wallet</span>
            <span className="text-sm text-stone-200">
              {isConnected ? shortenAddress(address) : 'Optional'}
            </span>
          </button>
        )}
      </div>
    </>
  )
}
