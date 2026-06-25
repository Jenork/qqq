'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { useUsdcPayment } from '@/hooks/useUsdcPayment'
import { RewardStatusBadge } from '@/components/RewardStatusBadge'
import { USDC_PAYMENT_AMOUNT_USDC } from '@/config/tokens'
import { cn } from '@/lib/cn'
import { shortenAddress } from '@/lib/score'

type UsdcMission = ReturnType<typeof useUsdcPayment>

export function PayUsdcButton({ mission }: { mission: UsdcMission }) {
  const [imageFailed, setImageFailed] = useState(false)
  const completedCard = mission.isSuccess
  const showBadge = mission.status !== 'available'

  return (
    <article className={cn('inferno-frame mission-card rounded-[28px] p-5', completedCard ? 'mission-card-complete' : '')}>
      <div className="mission-card-head">
        <div className="mission-card-copy">
          <p className="panel-title text-[#ffb78a]">Onchain</p>
          <h4 className="mission-card-title">Grenade</h4>
          <p className="micro-copy">Pay {USDC_PAYMENT_AMOUNT_USDC} USDC</p>
        </div>
        {showBadge ? <RewardStatusBadge status={mission.status} /> : null}
      </div>

      <div className={cn('mission-poster mission-poster-glow-green rounded-[24px]', completedCard ? 'mission-poster-complete' : '')}>
        {imageFailed ? (
          <span className="mission-poster-label">Grenade Reward</span>
        ) : (
          <Image
            src="/rewards/reward-grenade.png"
            alt="Grenade reward"
            width={646}
            height={629}
            sizes="(min-width: 1024px) 280px, (min-width: 640px) 42vw, 88vw"
            className="mission-poster-art px-3 pt-2 pb-1 [image-rendering:auto]"
            onError={() => setImageFailed(true)}
          />
        )}
      </div>

      <div className={cn('stats-strip relative z-[1]', completedCard ? 'stats-strip-complete' : '')}>
        <p className="stats-row"><span className="stats-row-label">Reward</span><span className="stats-row-value">Grenade Unlock</span></p>
        <p className="stats-row"><span className="stats-row-label">Amount</span><span className="stats-row-value">{USDC_PAYMENT_AMOUNT_USDC} USDC</span></p>
        <p className="stats-row"><span className="stats-row-label">Grenade</span><span className="stats-row-value">{mission.grenadeUnlocked ? 'Unlocked' : 'Locked'}</span></p>
      </div>

      <div className="mission-actions">
        {mission.error ? (
          <p className="relative z-[1] rounded-2xl border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {mission.error}
          </p>
        ) : null}

        {mission.txHash ? (
          <p className="relative z-[1] rounded-2xl border border-white/10 bg-black/24 px-3 py-2 text-xs text-stone-300">
            Tx: <span className="font-black">{shortenAddress(mission.txHash)}</span>
          </p>
        ) : null}

        <button
          type="button"
          className="action-button relative z-[1] w-full rounded-2xl px-4 py-3 text-sm font-bold uppercase tracking-[0.14em]"
          disabled={mission.isPending || mission.isConfirming || mission.isSuccess}
          onClick={() => void mission.pay()}
        >
          {mission.isSuccess ? 'Success' : mission.actionLabel}
        </button>
      </div>
    </article>
  )
}
