import { NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { HAS_GAME_PROGRESS_ADDRESS } from '@/config/contracts'
import { CURRENT_SEASON_START_BLOCK } from '@/config/season'
import { BASE_CHAIN, BASE_RPC_URL } from '@/config/web3'
import { readSeasonLeaderboard } from '@/lib/seasonProgress'

export const dynamic = 'force-dynamic'

const publicClient = createPublicClient({
  chain: BASE_CHAIN,
  transport: http(BASE_RPC_URL),
})

export async function GET(request: Request) {
  if (!HAS_GAME_PROGRESS_ADDRESS) {
    return NextResponse.json({
      entries: [],
      currentPlayerEntry: null,
      totalPlayers: 0,
    })
  }

  const { searchParams } = new URL(request.url)
  const rawLimit = Number(searchParams.get('limit') ?? 0)
  const normalizedLimit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : null
  const normalizedCurrentAddress = searchParams.get('currentAddress')?.toLowerCase() ?? null

  try {
    const rankedEntries = await readSeasonLeaderboard(publicClient)
    const entries = normalizedLimit === null ? rankedEntries : rankedEntries.slice(0, normalizedLimit)

    return NextResponse.json(
      {
        entries,
        currentPlayerEntry:
          rankedEntries.find((entry) => entry.address.toLowerCase() === normalizedCurrentAddress) ?? null,
        totalPlayers: rankedEntries.length,
        seasonStartBlock: CURRENT_SEASON_START_BLOCK.toString(),
      },
      {
        headers: {
          'Cache-Control': 's-maxage=15, stale-while-revalidate=45',
        },
      },
    )
  } catch (error) {
    console.error('Failed to read season leaderboard.', error)
    return NextResponse.json(
      {
        entries: [],
        currentPlayerEntry: null,
        totalPlayers: 0,
        error: 'leaderboard_unavailable',
      },
      { status: 502 },
    )
  }
}
