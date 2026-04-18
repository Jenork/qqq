'use client'

import type { MissionStatus } from '@/config/missions'
import { cn } from '@/lib/cn'

const STATUS_STYLES: Record<MissionStatus, string> = {
  available: 'border-emerald-300/28 bg-emerald-500/14 text-emerald-100 shadow-[0_0_16px_rgba(84,255,134,0.08)]',
  pending: 'border-amber-300/28 bg-amber-500/14 text-amber-100 shadow-[0_0_14px_rgba(255,180,52,0.08)]',
  'confirm-in-wallet': 'border-amber-300/28 bg-amber-500/14 text-amber-100 shadow-[0_0_14px_rgba(255,180,52,0.08)]',
  confirming: 'border-orange-300/28 bg-orange-500/14 text-orange-100 shadow-[0_0_16px_rgba(255,116,40,0.1)]',
  completed: 'border-sky-300/24 bg-sky-500/12 text-sky-100',
  success: 'border-emerald-300/28 bg-emerald-500/16 text-emerald-100 shadow-[0_0_18px_rgba(84,255,134,0.12)]',
  'already-claimed': 'border-cyan-300/24 bg-cyan-500/12 text-cyan-100',
  error: 'border-rose-300/28 bg-rose-500/14 text-rose-100',
  'wallet-disconnected': 'border-white/10 bg-white/6 text-stone-200',
  'wrong-network': 'border-orange-300/28 bg-orange-500/14 text-orange-100',
  'not-started': 'border-white/10 bg-white/6 text-stone-200',
  'links-opened': 'border-orange-300/28 bg-orange-500/14 text-orange-100',
  confirmed: 'border-cyan-300/24 bg-cyan-500/12 text-cyan-100',
  'reward-active': 'border-emerald-300/28 bg-emerald-500/16 text-emerald-100 shadow-[0_0_18px_rgba(84,255,134,0.12)]',
  'insufficient-balance': 'border-rose-300/28 bg-rose-500/14 text-rose-100',
  'approval-required': 'border-orange-300/28 bg-orange-500/14 text-orange-100',
}

function formatLabel(status: MissionStatus) {
  switch (status) {
    case 'already-claimed':
      return 'Already Claimed'
    case 'wallet-disconnected':
      return 'Wallet Disconnected'
    case 'wrong-network':
      return 'Wrong Network'
    case 'confirm-in-wallet':
      return 'Confirm in Wallet'
    case 'confirming':
      return 'Confirming'
    case 'not-started':
      return 'Not Started'
    case 'links-opened':
      return 'Links Opened'
    case 'reward-active':
      return 'Reward Active'
    case 'insufficient-balance':
      return 'Insufficient Balance'
    case 'approval-required':
      return 'Approval Required'
    case 'success':
      return 'Success'
    default:
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

export function RewardStatusBadge({ status }: { status: MissionStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] backdrop-blur',
        STATUS_STYLES[status],
      )}
    >
      {formatLabel(status)}
    </span>
  )
}
