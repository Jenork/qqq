'use client'

import { useAccount } from 'wagmi'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useGameStore } from '@/hooks/useGameStore'
import { cn } from '@/lib/cn'
import { shortenAddress } from '@/lib/score'

export function LeaderboardPanel() {
  const { address } = useAccount()
  const { data, isLoading, isError, isFetching, refetch } = useLeaderboard(undefined, address)

  return (
    <section className="panel inferno-subtle-grid w-full rounded-[30px] p-4 sm:p-5 lg:p-6">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="panel-title text-[#ffb78a]">Leaderboard</p>
            <h3 className="inferno-heading mt-1 text-[2.2rem] font-black">Top Survivors</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="action-button rounded-2xl px-4 py-3 text-sm font-bold uppercase tracking-[0.14em]"
              onClick={() => void refetch()}
            >
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="inferno-frame grid grid-cols-[44px_1fr_86px] rounded-[22px] px-3 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#ffbc91] sm:grid-cols-[56px_1fr_100px] sm:px-4">
            <span>Rank</span>
            <span>Wallet</span>
            <span className="text-right">Best Score</span>
          </div>

          {isLoading ? <p className="rounded-2xl bg-white/5 px-4 py-5 text-sm text-slate-300">Loading leaderboard...</p> : null}
          {isError ? <p className="rounded-2xl bg-rose-400/10 px-4 py-5 text-sm text-rose-100">Failed to load leaderboard.</p> : null}

          {data?.entries.map((entry) => {
            const isCurrentPlayer = address?.toLowerCase() === entry.address.toLowerCase()

            return (
              <div
                key={entry.address}
                className={cn(
                  'grid grid-cols-[44px_1fr_86px] items-center rounded-[22px] border px-3 py-4 text-sm shadow-[0_14px_28px_rgba(0,0,0,0.18)] sm:grid-cols-[56px_1fr_100px] sm:px-4',
                  isCurrentPlayer
                    ? 'border-[#2ca74c]/50 bg-[linear-gradient(180deg,rgba(12,32,14,0.96),rgba(10,21,13,0.96))] text-[#d5ffd5]'
                    : 'border-[#3f1714] bg-[linear-gradient(180deg,rgba(25,10,10,0.92),rgba(14,8,9,0.96))] text-slate-100',
                )}
              >
                <span className={cn('font-black', isCurrentPlayer ? 'text-[#86ff76]' : 'text-[#ffb772]')}>#{entry.rank}</span>
                <span className="flex items-center gap-2">
                  <span>{shortenAddress(entry.address)}</span>
                  {isCurrentPlayer ? (
                    <span className="rounded-full border border-[#4de06c]/35 bg-black/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#b5ffb7]">
                      You
                    </span>
                  ) : null}
                </span>
                <span className={cn('text-right font-black', isCurrentPlayer ? 'text-[#9eff84]' : 'text-[#ffbe6e]')}>{entry.bestScore}</span>
              </div>
            )
          })}

          {!isLoading && !isError && !data?.entries.length ? (
            <p className="rounded-2xl bg-white/5 px-4 py-5 text-sm text-slate-300">No scores submitted yet.</p>
          ) : null}

          {data?.currentPlayerEntry && data.currentPlayerEntry.rank > data.entries.length ? (
            <div className="mt-2 rounded-2xl border border-amber-300/35 bg-amber-400/10 px-4 py-4 text-sm text-amber-50">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-200">Your Rank</span>
                <span className="rounded-full border border-amber-300/25 bg-black/20 px-3 py-1 text-[11px] font-black">
                  #{data.currentPlayerEntry.rank}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                <span className="flex items-center gap-2">
                  <span>{shortenAddress(data.currentPlayerEntry.address)}</span>
                  <span className="rounded-full border border-amber-300/30 bg-black/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-amber-100">
                    You
                  </span>
                </span>
                <span className="font-black">{data.currentPlayerEntry.bestScore}</span>
              </div>
            </div>
          ) : null}

        </div>
      </div>
    </section>
  )
}
