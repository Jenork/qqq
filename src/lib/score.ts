export function shortenAddress(value?: string | null) {
  if (!value) {
    return 'Guest'
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

export function isNewBestScore(candidate: number, previousBest?: number) {
  if (previousBest === undefined) {
    return candidate > 0
  }

  return candidate > previousBest
}

export function bigintToNumber(value?: bigint) {
  return value ? Number(value) : 0
}
