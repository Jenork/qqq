'use client'

import type { useSocialMission } from '@/hooks/useSocialMission'
import { RewardStatusBadge } from '@/components/RewardStatusBadge'

type SocialMission = ReturnType<typeof useSocialMission>

export function FollowSocialsMission({ mission }: { mission: SocialMission }) {
  const confirmDisabled = mission.rewardActive
  const confirmLabel =
    mission.status === 'reward-active' || mission.status === 'confirmed'
      ? 'Success'
        : 'Confirm Mission'
  const displayStatus =
    mission.status === 'reward-active' || mission.status === 'confirmed'
      ? 'success'
      : mission.status

  return (
    <article className="inferno-frame rounded-[28px] p-5">
      <div className="relative z-[1] flex items-start justify-between gap-3">
        <div>
          <p className="panel-title text-[#ffb78a]">Offchain</p>
          <h4 className="mt-2 text-[1.7rem] font-black uppercase tracking-[0.04em] text-[#ff5d2a]">Follow Socials</h4>
        </div>
        <RewardStatusBadge status={displayStatus} />
      </div>

      <div className="relative z-[1] mt-5 grid gap-3 text-sm text-stone-200">
        <p><span className="text-stone-400">Reward</span> <span className="font-black text-stone-50">{mission.grenadeRewardActive ? 'Fire Grenade' : 'Grenade Locked'}</span></p>
        <p><span className="text-stone-400">Twitter</span> <span className="font-black text-stone-50">{mission.twitterOpened ? 'Opened' : 'Pending'}</span></p>
        <p><span className="text-stone-400">Telegram</span> <span className="font-black text-stone-50">{mission.telegramOpened ? 'Opened' : 'Pending'}</span></p>
      </div>

      {mission.error ? (
        <p className="relative z-[1] mt-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {mission.error}
        </p>
      ) : null}

      <div className="relative z-[1] mt-5 grid gap-2 sm:grid-cols-2">
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
        className="action-button relative z-[1] mt-3 w-full rounded-2xl px-4 py-3 text-sm font-bold uppercase tracking-[0.14em]"
        disabled={confirmDisabled}
        onClick={mission.confirmMission}
      >
        {confirmLabel}
      </button>
    </article>
  )
}
