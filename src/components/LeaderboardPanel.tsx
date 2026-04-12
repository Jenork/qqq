'use client'

import { useAccount } from 'wagmi'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useGameStore } from '@/hooks/useGameStore'
import { cn } from '@/lib/cn'
import { shortenAddress } from '@/lib/score'

export function LeaderboardPanel() {
  const { address } = useAccount()
  const status = useGameStore((state) => state.status)
  const pendingScore = useGameStore((state) => state.pendingScore)
  const { data, isLoading, isError, isFetching, refetch } = useLeaderboard(undefined, address)

  return (
    <section className="panel w-full rounded-[28px] p-4 sm:p-5 lg:p-6">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="panel-title">Onchain Leaderboard</p>
            <h3 className="mt-1 text-2xl font-black">Top Survivors</h3>
            <p className="mt-1 text-sm text-slate-300">
              {data?.totalPlayers ? `${data.totalPlayers} players saved onchain` : 'Scores appear here after a wallet transaction.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="action-button rounded-2xl px-4 py-3 text-sm font-bold"
              onClick={() => void refetch()}
            >
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="grid grid-cols-[44px_1fr_86px] rounded-2xl bg-white/5 px-3 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-300 sm:grid-cols-[56px_1fr_100px] sm:px-4">
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
                  'grid grid-cols-[44px_1fr_86px] items-center rounded-2xl border px-3 py-4 text-sm sm:grid-cols-[56px_1fr_100px] sm:px-4',
                  isCurrentPlayer
                    ? 'border-amber-300/40 bg-amber-400/10 text-amber-50'
                    : 'border-white/8 bg-white/5 text-slate-100',
                )}
              >
                <span className="font-black">#{entry.rank}</span>
                <span>{shortenAddress(entry.address)}</span>
                <span className="text-right font-black">{entry.bestScore}</span>
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
                <span>{shortenAddress(data.currentPlayerEntry.address)}</span>
                <span className="font-black">{data.currentPlayerEntry.bestScore}</span>
              </div>
            </div>
          ) : null}

          {address && !isLoading && !isError && !data?.currentPlayerEntry ? (
            <p className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4 text-sm text-slate-300">
              Your wallet is not ranked yet. Finish a run and submit the score onchain.
            </p>
          ) : null}

          {status === 'gameover' && pendingScore > 0 ? (
            <div className="mt-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-4 text-sm text-cyan-50">
              Current run: <span className="font-black">{pendingScore}</span>. Submit it from the Game Over screen to write it into the onchain leaderboard.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
