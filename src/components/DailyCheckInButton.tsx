'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
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
  const showBadge = displayStatus !== 'available'

  return (
    <article className={cn('inferno-frame mission-card rounded-[28px] p-5', completedCard ? 'mission-card-complete' : '')}>
      <div className="mission-card-head">
        <div className="mission-card-copy">
          <p className="panel-title text-[#ffb78a]">Onchain</p>
          <h4 className="mission-card-title">Shotgun</h4>
          <p className="micro-copy">Daily check-in once every 24 hours</p>
        </div>
        {showBadge ? <RewardStatusBadge status={displayStatus} /> : null}
      </div>

      <div className={cn('mission-poster mission-poster-glow-orange rounded-[24px]', completedCard ? 'mission-poster-complete' : '')}>
        {imageFailed ? (
          <span className="mission-poster-label">Shotgun Reward</span>
        ) : (
          <Image
            src="/rewards/reward-shotgun.png"
            alt="Shotgun reward"
            width={610}
            height={629}
            sizes="(min-width: 1024px) 280px, (min-width: 640px) 42vw, 88vw"
            className={cn('mission-poster-art px-4 pt-2 pb-1 [image-rendering:auto]')}
            onError={() => setImageFailed(true)}
          />
        )}
      </div>

      <div className={cn('stats-strip relative z-[1]', completedCard ? 'stats-strip-complete' : '')}>
        <p className="stats-row"><span className="stats-row-label">Reward</span><span className="stats-row-value">{mission.rewardActive ? 'Shotgun Unlocked' : 'Shotgun Locked'}</span></p>
        <p className="stats-row"><span className="stats-row-label">Next</span><span className="stats-row-value">{availabilityText}</span></p>
        <p className="stats-row"><span className="stats-row-label">Total</span><span className="stats-row-value">{mission.totalCount}</span></p>
      </div>

      <div className="mission-actions">
        {mission.error ? (
          <p className="relative z-[1] rounded-2xl border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {mission.error}
          </p>
        ) : null}

        <button
          type="button"
          className="action-button relative z-[1] w-full rounded-2xl px-4 py-3 text-sm font-bold uppercase tracking-[0.14em]"
          disabled={disabled}
          onClick={() => void mission.dailyCheckIn()}
        >
          {buttonLabel}
        </button>
      </div>
    </article>
  )
}
