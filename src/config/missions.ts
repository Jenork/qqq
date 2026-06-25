import { PLAYER_CONFIG } from '@/config/game'
import type { ItemId } from '@/config/items'

export const SHOTGUN_ITEM_ID = 2
export const DAILY_CHECK_IN_INTERVAL_MS = 24 * 60 * 60 * 1000
export const DAILY_CHECK_IN_SHOTGUN_REWARD_ITEM_ID = 'shotgun' satisfies ItemId
export const SOCIAL_ARMOR_REWARD_POINTS = PLAYER_CONFIG.maxHp
export const USDC_GRENADE_REWARD_ITEM_ID = 'fire-grenade' satisfies ItemId

export const SOCIAL_TWITTER_URL =
  process.env.NEXT_PUBLIC_SOCIAL_TWITTER_URL?.trim() || 'https://x.com/super_jenork'

export const SOCIAL_TELEGRAM_URL =
  process.env.NEXT_PUBLIC_SOCIAL_TELEGRAM_URL?.trim() || 'https://t.me/monstrohunt'

export type MissionStatus =
  | 'available'
  | 'pending'
  | 'confirm-in-wallet'
  | 'confirming'
  | 'completed'
  | 'success'
  | 'already-claimed'
  | 'error'
  | 'wallet-disconnected'
  | 'wrong-network'
  | 'not-started'
  | 'links-opened'
  | 'confirmed'
  | 'reward-active'
  | 'insufficient-balance'
  | 'approval-required'
