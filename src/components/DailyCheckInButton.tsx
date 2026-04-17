'use client'

import { useEffect, useState } from 'react'
import { RewardStatusBadge } from '@/components/RewardStatusBadge'
import type { useDailyCheckIn } from '@/hooks/useDailyCheckIn'
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

  return (
    <article className="inferno-frame rounded-[28px] p-5">
      <div className="relative z-[1] flex items-start justify-between gap-3">
        <div>
          <p className="panel-title text-[#ffb78a]">Onchain</p>
          <h4 className="mt-2 text-[1.7rem] font-black uppercase tracking-[0.04em] text-[#ff5d2a]">Daily Check-in</h4>
        </div>
        <RewardStatusBadge status={displayStatus} />
      </div>

      <div className="relative z-[1] mt-5 grid gap-3 text-sm text-stone-200">
        <p>
          <span className="text-stone-400">Reward</span>{' '}
          <span className="font-black text-stone-50">Armor</span>
        </p>
        <p>
          <span className="text-stone-400">Status</span>{' '}
          <span className="font-black text-stone-50">
            {checkedInToday ? 'Already checked in today' : 'Available'}
          </span>
        </p>
        <p>
          <span className="text-stone-400">Next</span>{' '}
          <span className="font-black text-stone-50">{availabilityText}</span>
        </p>
        <p>
          <span className="text-stone-400">Total</span>{' '}
          <span className="font-black text-stone-50">{mission.totalCount}</span>
        </p>
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
