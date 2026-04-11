import { isAddress, type Address } from 'viem'

const rawAddress = process.env.NEXT_PUBLIC_GAME_PROGRESS_ADDRESS?.trim()

export const GAME_PROGRESS_ADDRESS =
  rawAddress && isAddress(rawAddress)
    ? (rawAddress as Address)
    : ('0x0000000000000000000000000000000000000000' as Address)

export const HAS_GAME_PROGRESS_ADDRESS =
  GAME_PROGRESS_ADDRESS !== '0x0000000000000000000000000000000000000000'

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
    name: 'getBestScore',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
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
    name: 'getPlayersSlice',
    stateMutability: 'view',
    inputs: [
      { name: 'start', type: 'uint256' },
      { name: 'end', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address[]' }],
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
] as const
