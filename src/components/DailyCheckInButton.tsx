'use client'

import { useEffect, useState } from 'react'
import { RewardStatusBadge } from '@/components/RewardStatusBadge'
import type { useDailyCheckIn } from '@/hooks/useDailyCheckIn'
import { cn } from '@/lib/cn'
import { formatRelativeUnlockTime } from '@/lib/missions'

type DailyCheckInMission = ReturnType<typeof useDailyCheckIn>

function resolveAvailabilityText(canCheckInNow: boolean, nextAvailableAt: number, now: number) {
  if (canCheckInNow || nextAvailableAt <= now) {
    return 'Available'
  }

  return `Available in ${formatRelativeUnlockTime(nextAvailableAt)}`
}

export function DailyCheckInButton({ mission }: { mission: DailyCheckInMission }) {
  const [now, setNow] = useState(() => Date.now())
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 30000)

    return () => window.clearInterval(intervalId)
  }, [])

  const checkedInToday = Boolean(mission.lastCheckInAt) && !mission.canCheckInNow && mission.nextAvailableAt > now
  const disabled = mission.isPending || mission.isConfirming || checkedInToday
  const availabilityText = resolveAvailabilityText(mission.canCheckInNow, mission.nextAvailableAt, now)
  const displayStatus = checkedInToday ? 'success' : mission.status
  const buttonLabel = checkedInToday ? 'Success' : mission.actionLabel
  const completedCard = checkedInToday

  return (
    <article className={cn('inferno-frame mission-card rounded-[28px] p-5', completedCard ? 'mission-card-complete' : '')}>
      <div className="relative z-[1] flex items-start justify-between gap-3">
        <div>
          <p className="panel-title text-[#ffb78a]">Onchain</p>
          <h4 className="mt-2 text-[1.7rem] font-black uppercase tracking-[0.04em] text-[#ff5d2a]">Armor</h4>
          <p className="micro-copy mt-2">Daily check-in once every 24 hours</p>
        </div>
        <RewardStatusBadge status={displayStatus} />
      </div>

      <div className={cn('mission-poster mission-poster-glow-orange rounded-[24px]', completedCard ? 'mission-poster-complete' : '')}>
        {imageFailed ? (
          <span className="mission-poster-label">Armor Reward</span>
        ) : (
          <img
            src="/rewards/reward-armor.png"
            alt="Armor reward"
            className={cn('h-full w-full object-contain p-4 [image-rendering:pixelated]')}
            onError={() => setImageFailed(true)}
          />
        )}
      </div>

      <div className={cn('stats-strip relative z-[1]', completedCard ? 'stats-strip-complete' : '')}>
        <p className="stats-row"><span className="stats-row-label">Reward</span><span className="stats-row-value">Bonus Armor</span></p>
        <p className="stats-row"><span className="stats-row-label">Status</span><span className="stats-row-value">{checkedInToday ? 'Already checked in today' : 'Available'}</span></p>
        <p className="stats-row"><span className="stats-row-label">Next</span><span className="stats-row-value">{availabilityText}</span></p>
        <p className="stats-row"><span className="stats-row-label">Total</span><span className="stats-row-value">{mission.totalCount}</span></p>
      </div>

      {mission.error ? (
        <p className="relative z-[1] mt-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {mission.error}
        </p>
      ) : null}

      <button
        type="button"
        className="action-button relative z-[1] mt-5 w-full rounded-2xl px-4 py-3 text-sm font-bold uppercase tracking-[0.14em]"
        disabled={disabled}
        onClick={() => void mission.dailyCheckIn()}
      >
        {buttonLabel}
      </button>
    </article>
  )
}
