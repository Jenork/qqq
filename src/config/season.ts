const parsedSeasonId = Number.parseInt(process.env.NEXT_PUBLIC_GAME_SEASON_ID ?? '2', 10)

export const CURRENT_SEASON_ID =
  Number.isFinite(parsedSeasonId) && parsedSeasonId > 0 ? parsedSeasonId : 2

export const CURRENT_SEASON_LABEL = `Season ${CURRENT_SEASON_ID}`
