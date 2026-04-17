'use client'

import type { useUsdcPayment } from '@/hooks/useUsdcPayment'
import { RewardStatusBadge } from '@/components/RewardStatusBadge'
import { USDC_PAYMENT_AMOUNT_USDC, USDC_RECIPIENT } from '@/config/tokens'
import { shortenAddress } from '@/lib/score'

type UsdcMission = ReturnType<typeof useUsdcPayment>

export function PayUsdcButton({ mission }: { mission: UsdcMission }) {
  return (
    <article className="inferno-frame rounded-[28px] p-5">
      <div className="relative z-[1] flex items-start justify-between gap-3">
        <div>
          <p className="panel-title text-[#ffb78a]">Onchain</p>
          <h4 className="mt-2 text-[1.7rem] font-black uppercase tracking-[0.04em] text-[#ff5d2a]">Pay {USDC_PAYMENT_AMOUNT_USDC} USDC</h4>
        </div>
        <RewardStatusBadge status={mission.status} />
      </div>

      <div className="relative z-[1] mt-5 grid gap-3 text-sm text-stone-200">
        <p><span className="text-stone-400">Reward</span> <span className="font-black text-stone-50">Shotgun</span></p>
        <p><span className="text-stone-400">Amount</span> <span className="font-black text-stone-50">{USDC_PAYMENT_AMOUNT_USDC} USDC</span></p>
        <p><span className="text-stone-400">Recipient</span> <span className="font-black text-stone-50">{shortenAddress(USDC_RECIPIENT)}</span></p>
        <p><span className="text-stone-400">Shotgun</span> <span className="font-black text-stone-50">{mission.shotgunUnlocked ? 'Unlocked' : 'Locked'}</span></p>
      </div>

      {mission.error ? (
        <p className="relative z-[1] mt-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {mission.error}
        </p>
      ) : null}

      {mission.txHash ? (
        <p className="relative z-[1] mt-4 rounded-2xl border border-white/10 bg-black/24 px-3 py-2 text-xs text-stone-300">
          Tx: <span className="font-black">{shortenAddress(mission.txHash)}</span>
        </p>
      ) : null}

      <button
        type="button"
        className="action-button relative z-[1] mt-5 w-full rounded-2xl px-4 py-3 text-sm font-bold uppercase tracking-[0.14em]"
        disabled={mission.isPending || mission.isConfirming || mission.isSuccess}
        onClick={() => void mission.pay()}
      >
        {mission.isSuccess ? 'Success' : mission.actionLabel}
      </button>
    </article>
  )
}
