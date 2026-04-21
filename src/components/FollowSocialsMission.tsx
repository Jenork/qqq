'use client'

import { useState } from 'react'
import type { useSocialMission } from '@/hooks/useSocialMission'
import { RewardStatusBadge } from '@/components/RewardStatusBadge'
import { cn } from '@/lib/cn'

type SocialMission = ReturnType<typeof useSocialMission>

export function FollowSocialsMission({ mission }: { mission: SocialMission }) {
  const [imageFailed, setImageFailed] = useState(false)
  const confirmDisabled = mission.rewardActive
  const confirmLabel =
    mission.status === 'reward-active' || mission.status === 'confirmed'
      ? 'Success'
        : 'Confirm Mission'
  const displayStatus =
    mission.status === 'reward-active' || mission.status === 'confirmed'
      ? 'success'
      : mission.status
  const completedCard = mission.rewardActive || mission.status === 'confirmed'

  return (
    <article className={cn('inferno-frame mission-card rounded-[28px] p-5', completedCard ? 'mission-card-complete' : '')}>
      <div className="mission-card-head">
        <div className="mission-card-copy">
          <p className="panel-title text-[#ffb78a]">Offchain</p>
          <h4 className="mission-card-title">Grenade</h4>
          <p className="micro-copy">Follow Twitter and Telegram</p>
        </div>
        <RewardStatusBadge status={displayStatus} />
      </div>

      <div className={cn('mission-poster mission-poster-glow-blue rounded-[24px]', completedCard ? 'mission-poster-complete' : '')}>
        {imageFailed ? (
          <span className="mission-poster-label">Grenade Reward</span>
        ) : (
          <img
            src="/rewards/reward-grenade.png"
            alt="Grenade reward"
            className="h-full w-full object-contain p-4 [image-rendering:pixelated]"
            onError={() => setImageFailed(true)}
          />
        )}
      </div>

      <div className={cn('stats-strip relative z-[1]', completedCard ? 'stats-strip-complete' : '')}>
        <p className="stats-row"><span className="stats-row-label">Reward</span><span className="stats-row-value">{mission.grenadeRewardActive ? 'Grenade Unlocked' : 'Grenade Locked'}</span></p>
        <p className="stats-row"><span className="stats-row-label">Twitter</span><span className="stats-row-value">{mission.twitterOpened ? 'Opened' : 'Pending'}</span></p>
        <p className="stats-row"><span className="stats-row-label">Telegram</span><span className="stats-row-value">{mission.telegramOpened ? 'Opened' : 'Pending'}</span></p>
      </div>

      <div className="mission-actions">
        {mission.error ? (
          <p className="relative z-[1] rounded-2xl border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {mission.error}
          </p>
        ) : null}

        <div className="relative z-[1] grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            className="action-button rounded-2xl px-4 py-3 text-sm font-bold uppercase tracking-[0.14em]"
            onClick={mission.openTwitter}
          >
            Open Twitter
          </button>
          <button
            type="button"
            className="action-button rounded-2xl px-4 py-3 text-sm font-bold uppercase tracking-[0.14em]"
            onClick={mission.openTelegram}
          >
            Open Telegram
          </button>
        </div>

        <button
          type="button"
          className="action-button relative z-[1] w-full rounded-2xl px-4 py-3 text-sm font-bold uppercase tracking-[0.14em]"
          disabled={confirmDisabled}
          onClick={mission.confirmMission}
        >
          {confirmLabel}
        </button>
      </div>
    </article>
  )
}
