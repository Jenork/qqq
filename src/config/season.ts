const DEFAULT_SEASON_START_BLOCK = 46_900_000n

function parseBlockNumber(value: string | undefined, fallback: bigint) {
  const normalized = value?.trim()

  if (!normalized) {
    return fallback
  }

  try {
    const parsed = BigInt(normalized)
    return parsed >= 0n ? parsed : fallback
  } catch {
    return fallback
  }
}

export const CURRENT_SEASON_LABEL =
  process.env.NEXT_PUBLIC_GAME_SEASON_LABEL?.trim() || 'Current Season'

export const CURRENT_SEASON_START_BLOCK = parseBlockNumber(
  process.env.NEXT_PUBLIC_GAME_SEASON_START_BLOCK,
  DEFAULT_SEASON_START_BLOCK,
)
