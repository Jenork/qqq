import type { Address } from 'viem'
import {
  DAILY_CHECKIN_CONTRACT_ADDRESS,
  GAME_PROGRESS_ADDRESS,
  gameProgressAbi,
  HAS_DAILY_CHECKIN_CONTRACT_ADDRESS,
} from '@/config/contracts'
import { CURRENT_SEASON_START_BLOCK } from '@/config/season'

export type SeasonPlayerStats = {
  bestScore: number
  checkInCount: number
  lastCheckInAt: number
}

export type SeasonLeaderboardEntry = {
  address: string
  bestScore: number
  rank: number
}

type EventLog = {
  args?: {
    player?: Address
    submittedScore?: bigint
    timestamp?: bigint
    totalCount?: bigint
  }
}

type SeasonEventClient = {
  getBlockNumber(): Promise<bigint>
  readContract?(args: {
    address: Address
    abi: typeof gameProgressAbi
    functionName: 'getCheckInCount' | 'getLastCheckIn'
    args: [Address]
  }): Promise<unknown>
  getContractEvents(args: {
    address: Address
    abi: typeof gameProgressAbi
    eventName: 'ScoreSubmitted' | 'DailyCheckedIn'
    args?: {
      player?: Address
    }
    fromBlock: bigint
    toBlock: bigint
  }): Promise<unknown[]>
}

const LOG_CHUNK_SIZE = 10_000n

function normalizeAddress(address?: string | null) {
  return address?.toLowerCase() ?? ''
}

function compareLeaderboardEntries(
  left: Pick<SeasonLeaderboardEntry, 'address' | 'bestScore'>,
  right: Pick<SeasonLeaderboardEntry, 'address' | 'bestScore'>,
) {
  if (left.bestScore !== right.bestScore) {
    return right.bestScore - left.bestScore
  }

  return left.address.localeCompare(right.address)
}

async function readEventLogs(
  client: SeasonEventClient,
  contractAddress: Address,
  eventName: 'ScoreSubmitted' | 'DailyCheckedIn',
  eventArgs?: { player?: Address },
) {
  const latestBlock = await client.getBlockNumber()

  if (CURRENT_SEASON_START_BLOCK > latestBlock) {
    return []
  }

  const logs: EventLog[] = []

  for (
    let fromBlock = CURRENT_SEASON_START_BLOCK;
    fromBlock <= latestBlock;
    fromBlock += LOG_CHUNK_SIZE
  ) {
    const toBlock = fromBlock + LOG_CHUNK_SIZE - 1n
    const chunk = (await client.getContractEvents({
      address: contractAddress,
      abi: gameProgressAbi,
      eventName,
      args: eventArgs,
      fromBlock,
      toBlock: toBlock > latestBlock ? latestBlock : toBlock,
    })) as EventLog[]

    logs.push(...chunk)
  }

  return logs
}

async function readDailyCheckInStorage(client: SeasonEventClient, playerAddress: Address) {
  if (!HAS_DAILY_CHECKIN_CONTRACT_ADDRESS || !client.readContract) {
    return null
  }

  try {
    const [checkInCount, lastCheckInAt] = await Promise.all([
      client.readContract({
        address: DAILY_CHECKIN_CONTRACT_ADDRESS,
        abi: gameProgressAbi,
        functionName: 'getCheckInCount',
        args: [playerAddress],
      }),
      client.readContract({
        address: DAILY_CHECKIN_CONTRACT_ADDRESS,
        abi: gameProgressAbi,
        functionName: 'getLastCheckIn',
        args: [playerAddress],
      }),
    ])

    return {
      checkInCount: Number(checkInCount ?? 0n),
      lastCheckInAt: Number(lastCheckInAt ?? 0n),
    }
  } catch (error) {
    console.warn('Daily check-in storage is unavailable; falling back to event logs.', error)
    return null
  }
}

async function readEventLogsOrEmpty(
  client: SeasonEventClient,
  contractAddress: Address,
  eventName: 'ScoreSubmitted' | 'DailyCheckedIn',
  eventArgs?: { player?: Address },
) {
  try {
    return await readEventLogs(client, contractAddress, eventName, eventArgs)
  } catch (error) {
    console.warn(`Unable to read ${eventName} logs for player stats.`, error)
    return []
  }
}

export async function readSeasonLeaderboard(client: SeasonEventClient) {
  const logs = await readEventLogs(client, GAME_PROGRESS_ADDRESS, 'ScoreSubmitted')
  const bestByPlayer = new Map<string, { address: string; bestScore: number }>()

  for (const log of logs) {
    const player = log.args?.player
    const submittedScore = log.args?.submittedScore

    if (!player || submittedScore === undefined) {
      continue
    }

    const key = normalizeAddress(player)
    const score = Number(submittedScore)
    const existing = bestByPlayer.get(key)

    if (!existing || score > existing.bestScore) {
      bestByPlayer.set(key, {
        address: player,
        bestScore: score,
      })
    }
  }

  return Array.from(bestByPlayer.values())
    .sort(compareLeaderboardEntries)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))
}

export async function readSeasonPlayerStats(client: SeasonEventClient, playerAddress: Address) {
  const normalizedPlayer = normalizeAddress(playerAddress)
  const [scoreLogs, checkInLogs, checkInStorage] = await Promise.all([
    readEventLogsOrEmpty(client, GAME_PROGRESS_ADDRESS, 'ScoreSubmitted', { player: playerAddress }),
    HAS_DAILY_CHECKIN_CONTRACT_ADDRESS
      ? readEventLogsOrEmpty(client, DAILY_CHECKIN_CONTRACT_ADDRESS, 'DailyCheckedIn', { player: playerAddress })
      : Promise.resolve([]),
    readDailyCheckInStorage(client, playerAddress),
  ])

  let bestScore = 0
  let checkInCount = 0
  let lastCheckInAt = 0

  for (const log of scoreLogs) {
    if (normalizeAddress(log.args?.player) !== normalizedPlayer) {
      continue
    }

    const score = Number(log.args?.submittedScore ?? 0n)
    bestScore = Math.max(bestScore, score)
  }

  for (const log of checkInLogs) {
    if (normalizeAddress(log.args?.player) !== normalizedPlayer) {
      continue
    }

    checkInCount = Math.max(checkInCount + 1, Number(log.args?.totalCount ?? 0n))
    lastCheckInAt = Math.max(lastCheckInAt, Number(log.args?.timestamp ?? 0n))
  }

  if (checkInStorage) {
    checkInCount = Math.max(checkInCount, checkInStorage.checkInCount)
    lastCheckInAt = Math.max(lastCheckInAt, checkInStorage.lastCheckInAt)
  }

  return {
    bestScore,
    checkInCount,
    lastCheckInAt,
  } satisfies SeasonPlayerStats
}
