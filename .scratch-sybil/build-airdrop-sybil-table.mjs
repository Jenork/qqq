import { createPublicClient, getAddress, http } from 'viem'
import { base } from 'viem/chains'
import fs from 'node:fs/promises'
import path from 'node:path'

const CONTRACT = '0x287552da4452c7cc008ff7647D0a97D2e208da41'
const DEPLOY_BLOCK = 44_784_636
const OUT_DIR = path.resolve('airdrop_sybil_analysis')

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
]

const topicScoreSubmitted =
  '0xb7f20d0949b6a8bc59d005af4a52f7ff5d0cfcde9056fa556adb0e4b24dcb6d2'
const topicDailyCheckedIn =
  '0x30ef1833828a9161870df6592172435a846a706e632c5873c4e700a8d3d1c22f'

const highConfidenceSybilWallets = new Set(
  [
    '0x7b8a60b83f8a03c972b05291af0fb10ef61b0600',
    '0x34072c93e013a4d7de0f0ec6555215130a0a1f1f',
    '0x1c87c9b1a1776b60cd1ada594901ad86e69a225d',
    '0x8ff986a12c978f02ec620a5b783d9ccc71eab6d9',
    '0x203e47aacce98a0dc2cd1aa78227002f89fc72b9',
    '0xc55438dccf35087bb3ec0049ce232ff086b66da9',
    '0x9ede732e4f1040f08e73caecc2e3ed8a5c38f958',
    '0x8da7212f71c1b5bfbe1bb8647b324086e7d7d0d7',
    '0x24cd1c145c7f944a4e3ad71c2f8917071b45a63f',
    '0x7b21ef7d4bdba6bb2b3931d1dafd74594df337e3',
    '0x82c1efce41f6dcb6ac2a3afa5f36bcd1aa375a0f',
  ].map((address) => address.toLowerCase()),
)

const linkedToAdminOrMainWallets = new Set(
  [
    '0x2db903ca511dccef2d05b981cff896785571ccee',
  ].map((address) => address.toLowerCase()),
)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchJson(url, retries = 2) {
  let lastError

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 25_000)
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      lastError = error
      await sleep(500 + attempt * 750)
    }
  }

  throw lastError
}

function fromUnixHex(hex) {
  return new Date(Number.parseInt(hex, 16) * 1000).toISOString().replace('T', ' ').slice(0, 19)
}

function fromUnixSeconds(value) {
  return new Date(Number(value) * 1000).toISOString().replace('T', ' ').slice(0, 19)
}

function addressFromTopic(topic) {
  return getAddress(`0x${topic.slice(-40)}`)
}

function uint256At(data, index) {
  const clean = data.startsWith('0x') ? data.slice(2) : data
  return Number.parseInt(clean.slice(index * 64, (index + 1) * 64), 16)
}

function normalizeAddress(address) {
  if (!address) {
    return ''
  }

  try {
    return getAddress(address)
  } catch {
    return String(address).toLowerCase()
  }
}

function toEth(wei) {
  if (!wei) {
    return 0
  }

  return Number(wei) / 1e18
}

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

async function getLogs(topic0, latestBlock) {
  const url =
    `https://base.blockscout.com/api?module=logs&action=getLogs` +
    `&fromBlock=${DEPLOY_BLOCK}&toBlock=${latestBlock}` +
    `&address=${CONTRACT.toLowerCase()}&topic0=${topic0}&page=1&offset=1000`
  const payload = await fetchJson(url)
  return Array.isArray(payload.result) ? payload.result : []
}

async function getAddressTransactions(address) {
  const url =
    `https://base.blockscout.com/api?module=account&action=txlist` +
    `&address=${address}&page=1&offset=200&sort=asc`
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
  contracts: players.map((player) => ({
    address: CONTRACT,
    abi,
    functionName: 'getBestScore',
    args: [player],
  })),
  allowFailure: false,
})

const scoreLogs = await getLogs(topicScoreSubmitted, latestBlock)
const dailyLogs = await getLogs(topicDailyCheckedIn, latestBlock)

const scoreByAddress = new Map()
for (const log of scoreLogs) {
  const address = addressFromTopic(log.topics[1]).toLowerCase()
  const submittedScore = uint256At(log.data, 0)
  const storedBestScore = uint256At(log.data, 1)
  const entry = scoreByAddress.get(address) ?? {
    scoreSubmitCount: 0,
    firstScoreSubmitUtc: '',
    lastScoreSubmitUtc: '',
    scoreTxHashes: [],
    maxEventBestScore: 0,
  }
  entry.scoreSubmitCount += 1
  entry.firstScoreSubmitUtc ||= fromUnixHex(log.timeStamp)
  entry.lastScoreSubmitUtc = fromUnixHex(log.timeStamp)
  entry.maxEventBestScore = Math.max(entry.maxEventBestScore, storedBestScore)
  entry.scoreTxHashes.push(log.transactionHash)
  scoreByAddress.set(address, entry)
}

const dailyByAddress = new Map()
for (const log of dailyLogs) {
  const address = addressFromTopic(log.topics[1]).toLowerCase()
  const entry = dailyByAddress.get(address) ?? {
    dailyCount: 0,
    firstDailyUtc: '',
    lastDailyUtc: '',
  }
  entry.dailyCount += 1
  entry.firstDailyUtc ||= fromUnixHex(log.timeStamp)
  entry.lastDailyUtc = fromUnixHex(log.timeStamp)
  dailyByAddress.set(address, entry)
}

const playerSet = new Set(players.map((address) => address.toLowerCase()))
const txHistoryByAddress = new Map()

for (const player of players) {
  const normalized = player.toLowerCase()
  try {
    txHistoryByAddress.set(normalized, await getAddressTransactions(normalized))
  } catch {
    txHistoryByAddress.set(normalized, [])
  }
  await sleep(120)
}

const rows = players.map((player, index) => {
  const normalized = player.toLowerCase()
  const scoreInfo = scoreByAddress.get(normalized) ?? {}
  const dailyInfo = dailyByAddress.get(normalized) ?? {}
  const txs = txHistoryByAddress.get(normalized) ?? []
  const firstIncoming = txs.find(
    (tx) => tx.to?.toLowerCase() === normalized && BigInt(tx.value ?? '0') > 0n,
  )
  const firstContractTx = txs.find(
    (tx) => tx.to?.toLowerCase() === CONTRACT.toLowerCase(),
  )
  const fundedBy = firstIncoming?.from ? normalizeAddress(firstIncoming.from) : ''
  const fundedByLower = fundedBy.toLowerCase()
  const firstIncomingEth = firstIncoming ? toEth(firstIncoming.value).toFixed(12) : ''
  const firstIncomingUtc = firstIncoming ? fromUnixSeconds(firstIncoming.timeStamp) : ''
  const firstContractUtc =
    firstContractTx ? fromUnixSeconds(firstContractTx.timeStamp) : (scoreInfo.firstScoreSubmitUtc ?? '')
  const firstContractMethod = firstContractTx?.methodId ?? ''
  const firstContractNonce = firstContractTx?.nonce ?? ''
  const isHighSybil = highConfidenceSybilWallets.has(normalized)
  const isLinkedReview = linkedToAdminOrMainWallets.has(normalized)
  const fundedByLeaderboard = playerSet.has(fundedByLower)
  const fundedBySybil = highConfidenceSybilWallets.has(fundedByLower)

  let recommendation = 'KEEP'
  let confidence = 'low'
  let cluster = ''
  let reason = 'No strong sybil evidence found in current checks.'

  if (isHighSybil) {
    recommendation = 'DROP'
    confidence = 'high'
    cluster = 'SYBIL_CHAIN_MAY_15_30'
    reason = 'Linked funding chain, small gas transfers, fresh/low-nonce wallets, repeated score farming pattern.'
  } else if (isLinkedReview) {
    recommendation = 'REVIEW'
    confidence = 'medium'
    cluster = 'ADMIN_OR_MAIN_WALLET_LINK'
    reason = 'Funded by main/deployer-active wallet shortly before gameplay; not part of the main sybil chain.'
  } else if (fundedBySybil) {
    recommendation = 'REVIEW'
    confidence = 'medium'
    cluster = 'FUNDED_BY_SYBIL_CHAIN'
    reason = 'Funded by a high-confidence sybil wallet, but not preselected for automatic drop.'
  } else if (fundedByLeaderboard && Number(firstIncomingEth) > 0 && Number(firstIncomingEth) < 0.001) {
    recommendation = 'REVIEW'
    confidence = 'medium'
    cluster = 'LEADERBOARD_FUNDED'
    reason = 'Received a small gas funding transfer from another leaderboard wallet.'
  }

  return {
    rank: 0,
    wallet: normalizeAddress(player),
    recommendation,
    confidence,
    cluster,
    best_score: Number(bestScores[index]),
    score_submit_count: scoreInfo.scoreSubmitCount ?? 0,
    first_score_submit_utc: scoreInfo.firstScoreSubmitUtc ?? '',
    last_score_submit_utc: scoreInfo.lastScoreSubmitUtc ?? '',
    daily_checkin_count: dailyInfo.dailyCount ?? 0,
    first_daily_utc: dailyInfo.firstDailyUtc ?? '',
    last_daily_utc: dailyInfo.lastDailyUtc ?? '',
    funded_by: fundedBy,
    funded_by_is_leaderboard_wallet: fundedByLeaderboard ? 'yes' : 'no',
    first_incoming_eth: firstIncomingEth,
    first_incoming_utc: firstIncomingUtc,
    first_contract_method: firstContractMethod,
    first_contract_nonce: firstContractNonce,
    first_contract_utc: firstContractUtc,
    evidence_reason: reason,
    score_event_tx_hashes: (scoreInfo.scoreTxHashes ?? []).join(' | '),
  }
})

rows.sort((left, right) => right.best_score - left.best_score || left.wallet.localeCompare(right.wallet))
rows.forEach((row, index) => {
  row.rank = index + 1
})

const dropRows = rows.filter((row) => row.recommendation === 'DROP')
const reviewRows = rows.filter((row) => row.recommendation === 'REVIEW')

const columns = [
  { key: 'rank', header: 'rank' },
  { key: 'wallet', header: 'wallet' },
  { key: 'recommendation', header: 'recommendation' },
  { key: 'confidence', header: 'confidence' },
  { key: 'cluster', header: 'cluster' },
  { key: 'best_score', header: 'best_score' },
  { key: 'score_submit_count', header: 'score_submit_count' },
  { key: 'first_score_submit_utc', header: 'first_score_submit_utc' },
  { key: 'last_score_submit_utc', header: 'last_score_submit_utc' },
  { key: 'daily_checkin_count', header: 'daily_checkin_count' },
  { key: 'first_daily_utc', header: 'first_daily_utc' },
  { key: 'last_daily_utc', header: 'last_daily_utc' },
  { key: 'funded_by', header: 'funded_by' },
  { key: 'funded_by_is_leaderboard_wallet', header: 'funded_by_is_leaderboard_wallet' },
  { key: 'first_incoming_eth', header: 'first_incoming_eth' },
  { key: 'first_incoming_utc', header: 'first_incoming_utc' },
  { key: 'first_contract_method', header: 'first_contract_method' },
  { key: 'first_contract_nonce', header: 'first_contract_nonce' },
  { key: 'first_contract_utc', header: 'first_contract_utc' },
  { key: 'evidence_reason', header: 'evidence_reason' },
  { key: 'score_event_tx_hashes', header: 'score_event_tx_hashes' },
]

await writeCsv(path.join(OUT_DIR, 'airdrop_wallet_review_all_27.csv'), rows, columns)
await writeCsv(path.join(OUT_DIR, 'airdrop_drop_list_sybil_high_confidence.csv'), dropRows, columns)
await writeCsv(path.join(OUT_DIR, 'airdrop_review_list_medium_confidence.csv'), reviewRows, columns)

await fs.writeFile(
  path.join(OUT_DIR, 'summary.json'),
  JSON.stringify(
    {
      contract: CONTRACT,
      latestBlock,
      playersCount: Number(playersCount),
      scoreEventCount: scoreLogs.length,
      dailyEventCount: dailyLogs.length,
      highConfidenceDropCount: dropRows.length,
      reviewCount: reviewRows.length,
      keepCount: rows.filter((row) => row.recommendation === 'KEEP').length,
      generatedAtUtc: new Date().toISOString(),
    },
    null,
    2,
  ),
)

console.log(
  JSON.stringify(
    {
      outDir: OUT_DIR,
      playersCount: Number(playersCount),
      highConfidenceDropCount: dropRows.length,
      reviewCount: reviewRows.length,
      keepCount: rows.filter((row) => row.recommendation === 'KEEP').length,
      latestBlock,
    },
    null,
    2,
  ),
)
