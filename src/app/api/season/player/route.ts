import { NextResponse } from 'next/server'
import { createPublicClient, http, isAddress, type Address } from 'viem'
import { HAS_GAME_PROGRESS_ADDRESS } from '@/config/contracts'
import { CURRENT_SEASON_START_BLOCK } from '@/config/season'
import { BASE_CHAIN, BASE_RPC_URL } from '@/config/web3'
import { readSeasonPlayerStats, type SeasonPlayerStats } from '@/lib/seasonProgress'

export const dynamic = 'force-dynamic'

const CACHE_TTL_MS = 15_000

const publicClient = createPublicClient({
  chain: BASE_CHAIN,
  transport: http(BASE_RPC_URL),
})

const EMPTY_STATS = {
  bestScore: 0,
  checkInCount: 0,
  lastCheckInAt: 0,
}

const playerStatsCache = new Map<
  string,
  {
    expiresAt: number
    promise?: Promise<SeasonPlayerStats>
    value?: SeasonPlayerStats
  }
>()

async function getCachedPlayerStats(address: Address) {
  const cacheKey = address.toLowerCase()
  const cached = playerStatsCache.get(cacheKey)
  const now = Date.now()

  if (cached?.value && cached.expiresAt > now) {
    return cached.value
  }

  if (cached?.promise) {
    return cached.promise
  }

  const next = {
    expiresAt: 0,
    promise: readSeasonPlayerStats(publicClient, address)
      .then((value) => {
        playerStatsCache.set(cacheKey, {
          expiresAt: Date.now() + CACHE_TTL_MS,
          value,
        })

        return value
      })
      .finally(() => {
        const latest = playerStatsCache.get(cacheKey)

        if (latest?.promise) {
          playerStatsCache.set(cacheKey, {
            expiresAt: latest.expiresAt,
            value: latest.value,
          })
        }
      }),
  }

  playerStatsCache.set(cacheKey, next)
  return next.promise
}

async function refreshCachedPlayerStats(address: Address) {
  const cacheKey = address.toLowerCase()
  const value = await readSeasonPlayerStats(publicClient, address)

  playerStatsCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value,
  })

  return value
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const forceRefresh = searchParams.get('refresh') === '1'

  if (!address || !isAddress(address)) {
    return NextResponse.json(EMPTY_STATS)
  }

  if (!HAS_GAME_PROGRESS_ADDRESS) {
    return NextResponse.json(EMPTY_STATS)
  }

  try {
    const stats = forceRefresh
      ? await refreshCachedPlayerStats(address as Address)
      : await getCachedPlayerStats(address as Address)

    return NextResponse.json(
      {
        ...stats,
        seasonStartBlock: CURRENT_SEASON_START_BLOCK.toString(),
      },
      {
        headers: {
          'Cache-Control': forceRefresh ? 'no-store, max-age=0' : 's-maxage=15, stale-while-revalidate=30',
        },
      },
    )
  } catch (error) {
    console.error('Failed to read season player stats.', error)
    return NextResponse.json(
      {
        ...EMPTY_STATS,
        error: 'player_stats_unavailable',
      },
      { status: 502 },
    )
  }
}
