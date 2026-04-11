'use client'

import { useAccount } from 'wagmi'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useGameStore } from '@/hooks/useGameStore'
import { cn } from '@/lib/cn'
import { shortenAddress } from '@/lib/score'

export function LeaderboardPanel() {
  const { address } = useAccount()
  const leaderboardOpen = useGameStore((state) => state.leaderboardOpen)
  const toggleLeaderboard = useGameStore((state) => state.toggleLeaderboard)
  const { data, isLoading, isError } = useLeaderboard(10)

  if (!leaderboardOpen) {
    return null
  }

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-slate-950/65 p-2 sm:items-center sm:p-3">
      <div className="panel w-full max-w-[440px] rounded-[1.5rem] p-4 sm:max-w-2xl sm:rounded-[2rem] sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="panel-title">Leaderboard</p>
            <h3 className="mt-1 text-2xl font-black">Top Survivors</h3>
          </div>
          <button
            type="button"
            className="action-button rounded-2xl px-4 py-3 text-sm font-bold"
            onClick={() => toggleLeaderboard(false)}
          >
            Close
          </button>
        </div>

        <div className="grid gap-2">
          <div className="grid grid-cols-[44px_1fr_86px] rounded-2xl bg-white/5 px-3 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-300 sm:grid-cols-[56px_1fr_100px] sm:px-4">
            <span>Rank</span>
            <span>Wallet</span>
            <span className="text-right">Best Score</span>
          </div>

          {isLoading ? <p className="rounded-2xl bg-white/5 px-4 py-5 text-sm text-slate-300">Loading leaderboard...</p> : null}
          {isError ? <p className="rounded-2xl bg-rose-400/10 px-4 py-5 text-sm text-rose-100">Failed to load leaderboard.</p> : null}

          {data?.map((entry, index) => {
            const isCurrentPlayer = address?.toLowerCase() === entry.address.toLowerCase()

            return (
              <div
                key={entry.address}
                className={cn(
                  'grid grid-cols-[44px_1fr_86px] items-center rounded-2xl border px-3 py-4 text-sm sm:grid-cols-[56px_1fr_100px] sm:px-4',
                  isCurrentPlayer
                    ? 'border-amber-300/40 bg-amber-400/10 text-amber-50'
                    : 'border-white/8 bg-white/5 text-slate-100',
                )}
              >
                <span className="font-black">#{index + 1}</span>
                <span>{shortenAddress(entry.address)}</span>
                <span className="text-right font-black">{entry.bestScore}</span>
              </div>
            )
          })}

          {!isLoading && !isError && !data?.length ? (
            <p className="rounded-2xl bg-white/5 px-4 py-5 text-sm text-slate-300">No scores submitted yet.</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
