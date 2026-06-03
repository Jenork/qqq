import { isAddress, type Address } from 'viem'
import { SHOTGUN_PRICE_UNITS, USDC_RECIPIENT, USDC_TOKEN_ADDRESS } from '@/config/tokens'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address

const rawGameProgressAddress = process.env.NEXT_PUBLIC_GAME_PROGRESS_ADDRESS?.trim()
const rawDailyCheckInAddress =
  process.env.NEXT_PUBLIC_DAILY_CHECKIN_CONTRACT_ADDRESS?.trim() ||
  rawGameProgressAddress

export const GAME_PROGRESS_ADDRESS =
  rawGameProgressAddress && isAddress(rawGameProgressAddress)
    ? (rawGameProgressAddress as Address)
    : ZERO_ADDRESS

export const HAS_GAME_PROGRESS_ADDRESS = GAME_PROGRESS_ADDRESS !== ZERO_ADDRESS

export const DAILY_CHECKIN_CONTRACT_ADDRESS =
  rawDailyCheckInAddress && isAddress(rawDailyCheckInAddress)
    ? (rawDailyCheckInAddress as Address)
    : ZERO_ADDRESS

export const HAS_DAILY_CHECKIN_CONTRACT_ADDRESS = DAILY_CHECKIN_CONTRACT_ADDRESS !== ZERO_ADDRESS

export const gameProgressAbi = [
  {
    type: 'function',
    name: 'claimItem',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'itemId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'dailyCheckIn',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'canCheckIn',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'getLastCheckIn',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getCheckInCount',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'purchaseShotgun',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'isItemUnlocked',
    stateMutability: 'view',
    inputs: [
      { name: 'player', type: 'address' },
      { name: 'itemId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'submitScore',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'score', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'submitCurrentSeasonScore',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'score', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'submitSeasonScore',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'seasonId', type: 'uint256' },
      { name: 'score', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getBestScore',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getSeasonBestScore',
    stateMutability: 'view',
    inputs: [
      { name: 'seasonId', type: 'uint256' },
      { name: 'player', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getPlayersCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getSeasonPlayersCount',
    stateMutability: 'view',
    inputs: [{ name: 'seasonId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getPlayersSlice',
    stateMutability: 'view',
    inputs: [
      { name: 'start', type: 'uint256' },
      { name: 'end', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address[]' }],
  },
  {
    type: 'function',
    name: 'getSeasonPlayersSlice',
    stateMutability: 'view',
    inputs: [
      { name: 'seasonId', type: 'uint256' },
      { name: 'start', type: 'uint256' },
      { name: 'end', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address[]' }],
  },
  {
    type: 'function',
    name: 'usdcToken',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'usdcRecipient',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'shotgunPrice',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'ItemClaimed',
    inputs: [
      { indexed: true, name: 'player', type: 'address' },
      { indexed: true, name: 'itemId', type: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ScoreSubmitted',
    inputs: [
      { indexed: true, name: 'player', type: 'address' },
      { indexed: false, name: 'submittedScore', type: 'uint256' },
      { indexed: false, name: 'storedBestScore', type: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'SeasonScoreSubmitted',
    inputs: [
      { indexed: true, name: 'player', type: 'address' },
      { indexed: true, name: 'seasonId', type: 'uint256' },
      { indexed: false, name: 'submittedScore', type: 'uint256' },
      { indexed: false, name: 'storedBestScore', type: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'DailyCheckedIn',
    inputs: [
      { indexed: true, name: 'player', type: 'address' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
      { indexed: false, name: 'totalCount', type: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ShotgunPurchased',
    inputs: [
      { indexed: true, name: 'player', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'recipient', type: 'address' },
    ],
    anonymous: false,
  },
] as const

export const CONTRACT_DEFAULTS = {
  usdcToken: USDC_TOKEN_ADDRESS,
  usdcRecipient: USDC_RECIPIENT,
  shotgunPrice: SHOTGUN_PRICE_UNITS,
} as const
