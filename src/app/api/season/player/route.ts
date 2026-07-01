import { NextResponse } from 'next/server'
import { createPublicClient, http, isAddress, type Address } from 'viem'
import { HAS_GAME_PROGRESS_ADDRESS } from '@/config/contracts'
import { CURRENT_SEASON_START_BLOCK } from '@/config/season'
import { BASE_CHAIN, BASE_RPC_URL } from '@/config/web3'
import { readSeasonPlayerStats } from '@/lib/seasonProgress'

export const dynamic = 'force-dynamic'

const publicClient = createPublicClient({
  chain: BASE_CHAIN,
  transport: http(BASE_RPC_URL),
})

const EMPTY_STATS = {
  bestScore: 0,
  checkInCount: 0,
  lastCheckInAt: 0,
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address || !isAddress(address)) {
    return NextResponse.json(EMPTY_STATS)
  }

  if (!HAS_GAME_PROGRESS_ADDRESS) {
    return NextResponse.json(EMPTY_STATS)
  }

  try {
    const stats = await readSeasonPlayerStats(publicClient, address as Address)

    return NextResponse.json(
      {
        ...stats,
        seasonStartBlock: CURRENT_SEASON_START_BLOCK.toString(),
      },
      {
        headers: {
          'Cache-Control': 's-maxage=15, stale-while-revalidate=45',
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
