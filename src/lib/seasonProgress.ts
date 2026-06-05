import type { Address } from 'viem'
import { GAME_PROGRESS_ADDRESS, gameProgressAbi } from '@/config/contracts'
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
  }
}

type SeasonEventClient = {
  getBlockNumber(): Promise<bigint>
  getContractEvents(args: {
    address: Address
    abi: typeof gameProgressAbi
    eventName: 'ScoreSubmitted' | 'DailyCheckedIn'
    fromBlock: bigint
    toBlock: bigint
  }): Promise<unknown[]>
}

const LOG_CHUNK_SIZE = 50_000n

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

async function readEventLogs(client: SeasonEventClient, eventName: 'ScoreSubmitted' | 'DailyCheckedIn') {
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
      address: GAME_PROGRESS_ADDRESS,
      abi: gameProgressAbi,
      eventName,
      fromBlock,
      toBlock: toBlock > latestBlock ? latestBlock : toBlock,
    })) as EventLog[]

    logs.push(...chunk)
  }

  return logs
}

export async function readSeasonLeaderboard(client: SeasonEventClient) {
  const logs = await readEventLogs(client, 'ScoreSubmitted')
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
  const [scoreLogs, checkInLogs] = await Promise.all([
    readEventLogs(client, 'ScoreSubmitted'),
    readEventLogs(client, 'DailyCheckedIn'),
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

    checkInCount += 1
    lastCheckInAt = Math.max(lastCheckInAt, Number(log.args?.timestamp ?? 0n))
  }

  return {
    bestScore,
    checkInCount,
    lastCheckInAt,
  } satisfies SeasonPlayerStats
}
