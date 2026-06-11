'use client'

import { useAccount, useChainId } from 'wagmi'
import { ConnectWallet } from '@/components/ConnectWallet'
import { HAS_GAME_PROGRESS_ADDRESS } from '@/config/contracts'
import { CURRENT_SEASON_LABEL } from '@/config/season'
import { BASE_CHAIN_ID, BASE_CHAIN_NAME } from '@/config/web3'
import { useSeasonPlayerStats } from '@/hooks/useSeasonPlayerStats'
import { formatScore, shortenAddress } from '@/lib/score'

export function ProfilePanel() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const seasonStats = useSeasonPlayerStats(address)
  const bestScoreValue = seasonStats.data?.bestScore ?? 0
  const checkInValue = seasonStats.data?.checkInCount ?? 0

  return (
    <section className="panel inferno-subtle-grid w-full rounded-[26px] p-4 sm:p-5 lg:p-6">
      <div className="mx-auto grid w-full max-w-[1100px] gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="dashboard-heading">
          <p className="panel-title">Profile</p>
        </div>

        <div className="grid gap-4">
          {!isConnected ? (
            <div className="inferno-frame rounded-[24px] p-5">
              <p className="panel-title">Wallet</p>
              <div className="mt-4">
                <ConnectWallet />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="season-stat-card">
                <span className="stats-row-label">Wallet</span>
                <strong className="stats-row-value mt-2 block text-xl">
                  {address ? shortenAddress(address) : 'Not connected'}
                </strong>
              </div>

              <div className="season-stat-card">
                <span className="stats-row-label">Network</span>
                <strong className="stats-row-value mt-2 block text-xl">
                  {chainId === BASE_CHAIN_ID ? BASE_CHAIN_NAME : 'Wrong network'}
                </strong>
              </div>

              <div className="season-stat-card">
                <span className="stats-row-label">{CURRENT_SEASON_LABEL} Best</span>
                <strong className="stats-row-value mt-2 block text-3xl">
                  {formatScore(bestScoreValue)}
                </strong>
              </div>

              <div className="season-stat-card">
                <span className="stats-row-label">{CURRENT_SEASON_LABEL} Check-ins</span>
                <strong className="stats-row-value mt-2 block text-3xl">
                  {formatScore(checkInValue)}
                </strong>
              </div>
            </div>
          )}

          {!HAS_GAME_PROGRESS_ADDRESS ? (
            <div className="panel-state panel-state-warning text-sm">
              GameProgress contract is not configured.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
