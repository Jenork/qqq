import { createPublicClient, getAddress, http } from 'viem'
import { base } from 'viem/chains'
import fs from 'node:fs/promises'
import path from 'node:path'

const CONTRACT = '0x287552da4452c7cc008ff7647D0a97D2e208da41'
const DEPLOY_BLOCK = 44_784_636
const OUT_DIR = path.resolve('airdrop_sybil_analysis')
const TOPIC_DAILY_CHECKED_IN =
  '0x30ef1833828a9161870df6592172435a846a706e632c5873c4e700a8d3d1c22f'

const ownerWallets = new Set(
  [
    '0xeb45918a1efc99c84fa337e36a2f84317a9de1b8',
    '0xe256ac110def893a3216826aac03ac565e64cd40',
    '0x64bafaec3be9f2d2d9778e6e30765367d3f4fb51',
    '0x2db903ca511dccef2d05b981cff896785571ccee',
    '0x190063686cc52839e16c54f1789a86ea41ee52f4',
  ],
)

const abi = [
  {
    type: 'function',
    name: 'getPlayersCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getPlayersSlice',
    stateMutability: 'view',
    inputs: [
      { type: 'uint256', name: 'start' },
      { type: 'uint256', name: 'end' },
    ],
    outputs: [{ type: 'address[]' }],
  },
  {
    type: 'function',
    name: 'getBestScore',
    stateMutability: 'view',
    inputs: [{ type: 'address', name: 'player' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getCheckInCount',
    stateMutability: 'view',
    inputs: [{ type: 'address', name: 'player' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getLastCheckIn',
    stateMutability: 'view',
    inputs: [{ type: 'address', name: 'player' }],
    outputs: [{ type: 'uint256' }],
  },
]

function csvEscape(value) {
  const text = value === undefined || value === null ? '' : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

async function writeCsv(filePath, rows, columns) {
  const header = columns.map((column) => csvEscape(column.header)).join(';')
  const body = rows
    .map((row) => columns.map((column) => csvEscape(row[column.key])).join(';'))
    .join('\r\n')
  await fs.writeFile(filePath, `\ufeff${header}\r\n${body}\r\n`, 'utf8')
}

async function fetchJson(url, retries = 4) {
  let lastError

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30_000),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`)
      }

      return response.json()
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 750 + attempt * 1_000))
    }
  }

  throw lastError
}

function addressFromTopic(topic) {
  return getAddress(`0x${topic.slice(-40)}`)
}

function uint256At(data, index) {
  const clean = data.startsWith('0x') ? data.slice(2) : data
  return BigInt(`0x${clean.slice(index * 64, (index + 1) * 64)}`)
}

function formatUnix(seconds) {
  const value = Number(seconds)
  return value > 0 ? new Date(value * 1000).toISOString().replace('T', ' ').slice(0, 19) : ''
}

function formatHexUnix(hex) {
  return formatUnix(BigInt(hex))
}

function rewardForRank(rank) {
  if (rank === 1) return 22
  if (rank === 2) return 17
  if (rank === 3) return 14
  if (rank === 4) return 12
  if (rank === 5) return 10
  if (rank === 6) return 8
  if (rank === 7) return 7
  if (rank === 8) return 6
  if (rank >= 9 && rank <= 12) return 3
  if (rank >= 13 && rank <= 20) return 2
  return 0
}

async function getDailyLogs(latestBlock) {
  const url =
    `https://base.blockscout.com/api?module=logs&action=getLogs` +
    `&fromBlock=${DEPLOY_BLOCK}&toBlock=${latestBlock}` +
    `&address=${CONTRACT.toLowerCase()}&topic0=${TOPIC_DAILY_CHECKED_IN}` +
    `&page=1&offset=1000`
  const payload = await fetchJson(url)
  return Array.isArray(payload.result) ? payload.result : []
}

const client = createPublicClient({
  chain: base,
  transport: http('https://base-rpc.publicnode.com'),
})

await fs.mkdir(OUT_DIR, { recursive: true })

const latestBlock = Number(await client.getBlockNumber())
const playersCount = await client.readContract({
  address: CONTRACT,
  abi,
  functionName: 'getPlayersCount',
})
const players = await client.readContract({
  address: CONTRACT,
  abi,
  functionName: 'getPlayersSlice',
  args: [0n, playersCount],
})

const bestScores = await client.multicall({
  allowFailure: false,
  contracts: players.map((player) => ({
    address: CONTRACT,
    abi,
    functionName: 'getBestScore',
    args: [player],
  })),
})

const checkInCounts = await client.multicall({
  allowFailure: false,
  contracts: players.map((player) => ({
    address: CONTRACT,
    abi,
    functionName: 'getCheckInCount',
    args: [player],
  })),
})

const lastCheckIns = await client.multicall({
  allowFailure: false,
  contracts: players.map((player) => ({
    address: CONTRACT,
    abi,
    functionName: 'getLastCheckIn',
    args: [player],
  })),
})

const dailyLogs = await getDailyLogs(latestBlock)
const dailyEventsByAddress = new Map()

for (const log of dailyLogs) {
  const player = addressFromTopic(log.topics[1])
  const key = player.toLowerCase()
  const current = dailyEventsByAddress.get(key) ?? {
    wallet: player,
    daily_event_count: 0,
    first_daily_event_utc: '',
    last_daily_event_utc: '',
    last_event_total_count: 0,
    daily_event_txs: [],
  }
  current.daily_event_count += 1
  current.first_daily_event_utc ||= formatHexUnix(log.timeStamp)
  current.last_daily_event_utc = formatHexUnix(log.timeStamp)
  current.last_event_total_count = Number(uint256At(log.data, 1))
  current.daily_event_txs.push(log.transactionHash)
  dailyEventsByAddress.set(key, current)
}

const reviewRows = players.map((player, index) => {
  const wallet = getAddress(player)
  const key = wallet.toLowerCase()
  const events = dailyEventsByAddress.get(key)
  const checkInCount = Number(checkInCounts[index])
  const lastCheckIn = Number(lastCheckIns[index])
  const eventCount = events?.daily_event_count ?? 0

  return {
    wallet,
    best_score: Number(bestScores[index]),
    checkins_from_contract_state: checkInCount,
    checkins_from_daily_events: eventCount,
    last_event_total_count: events?.last_event_total_count ?? '',
    checkin_state_matches_events:
      checkInCount === eventCount || checkInCount === (events?.last_event_total_count ?? -1)
        ? 'yes'
        : 'no',
    last_checkin_state_utc: formatUnix(lastCheckIn),
    first_daily_event_utc: events?.first_daily_event_utc ?? '',
    last_daily_event_utc: events?.last_daily_event_utc ?? '',
    is_owner_wallet: ownerWallets.has(key) ? 'yes' : 'no',
    daily_event_txs: events?.daily_event_txs.join(' | ') ?? '',
  }
})

const previousPassedRows = (await fs.readFile(
  path.join(OUT_DIR, 'airdrop_passed_wallets_owner_corrected.csv'),
  'utf8',
))
  .replace(/^\uFEFF/, '')
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => {
    const [wallet, score] = line
      .split(';')
      .map((value) => value.replace(/^"|"$/g, '').replaceAll('""', '"'))
    return getAddress(wallet)
  })

const passedSet = new Set(previousPassedRows.map((wallet) => wallet.toLowerCase()))
const rewardRows = reviewRows
  .filter((row) => passedSet.has(row.wallet.toLowerCase()))
  .map((row) => ({
    wallet: row.wallet,
    base_score: row.best_score,
    daily_checkins: row.checkins_from_contract_state,
    checkin_bonus_points: row.checkins_from_contract_state * 1000,
    final_score: row.best_score + row.checkins_from_contract_state * 1000,
    is_owner_wallet: row.is_owner_wallet,
  }))
  .sort((left, right) => right.final_score - left.final_score || left.wallet.localeCompare(right.wallet))
  .map((row, index) => ({
    rank: index + 1,
    ...row,
    reward_usd: rewardForRank(index + 1),
  }))

await writeCsv(path.join(OUT_DIR, 'checkins_deep_verification_all_players.csv'), reviewRows, [
  { key: 'wallet', header: 'wallet' },
  { key: 'best_score', header: 'best_score' },
  { key: 'checkins_from_contract_state', header: 'checkins_from_contract_state' },
  { key: 'checkins_from_daily_events', header: 'checkins_from_daily_events' },
  { key: 'last_event_total_count', header: 'last_event_total_count' },
  { key: 'checkin_state_matches_events', header: 'checkin_state_matches_events' },
  { key: 'last_checkin_state_utc', header: 'last_checkin_state_utc' },
  { key: 'first_daily_event_utc', header: 'first_daily_event_utc' },
  { key: 'last_daily_event_utc', header: 'last_daily_event_utc' },
  { key: 'is_owner_wallet', header: 'is_owner_wallet' },
  { key: 'daily_event_txs', header: 'daily_event_txs' },
])

await writeCsv(path.join(OUT_DIR, 'season1_rewards_checkins_verified.csv'), rewardRows, [
  { key: 'rank', header: 'rank' },
  { key: 'wallet', header: 'wallet' },
  { key: 'base_score', header: 'base_score' },
  { key: 'daily_checkins', header: 'daily_checkins' },
  { key: 'checkin_bonus_points', header: 'checkin_bonus_points' },
  { key: 'final_score', header: 'final_score' },
  { key: 'reward_usd', header: 'reward_usd' },
  { key: 'is_owner_wallet', header: 'is_owner_wallet' },
])

const mismatches = reviewRows.filter((row) => row.checkin_state_matches_events !== 'yes')

await fs.writeFile(
  path.join(OUT_DIR, 'checkins_deep_verification_summary.json'),
  JSON.stringify(
    {
      contract: CONTRACT,
      latestBlock,
      playersCount: Number(playersCount),
      dailyEventCount: dailyLogs.length,
      totalCheckinsFromContractState: reviewRows.reduce(
        (sum, row) => sum + row.checkins_from_contract_state,
        0,
      ),
      totalDailyEventsForPlayers: reviewRows.reduce(
        (sum, row) => sum + row.checkins_from_daily_events,
        0,
      ),
      mismatches: mismatches.map((row) => ({
        wallet: row.wallet,
        state: row.checkins_from_contract_state,
        events: row.checkins_from_daily_events,
        lastEventTotal: row.last_event_total_count,
      })),
      rewardRows: rewardRows.length,
      rewardTotalUsd: rewardRows.reduce((sum, row) => sum + row.reward_usd, 0),
      generatedAtUtc: new Date().toISOString(),
    },
    null,
    2,
  ),
)

console.log(
  JSON.stringify(
    {
      latestBlock,
      playersCount: Number(playersCount),
      dailyEventCount: dailyLogs.length,
      totalCheckinsFromContractState: reviewRows.reduce(
        (sum, row) => sum + row.checkins_from_contract_state,
        0,
      ),
      totalDailyEventsForPlayers: reviewRows.reduce(
        (sum, row) => sum + row.checkins_from_daily_events,
        0,
      ),
      mismatchCount: mismatches.length,
      rewardRows: rewardRows.length,
      rewardTotalUsd: rewardRows.reduce((sum, row) => sum + row.reward_usd, 0),
    },
    null,
    2,
  ),
)
