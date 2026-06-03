export const ARENA_SIZE = {
  width: 1120,
  height: 540,
} as const

export const ARENA_BOUNDS = {
  floorY: 392,
  playerSpawnX: 168,
  enemySpawnMinX: 760,
  enemySpawnMaxX: 1080,
} as const

export const PLAYER_CONFIG = {
  maxHp: 5,
  moveSpeed: 270,
  jumpForce: 470,
  airMoveSpeedMultiplier: 1.22,
  jumpForwardBoost: 72,
  meleeTelegraphMs: 260,
  meleeWhiffRecoveryMs: 260,
  rangedTelegraphMs: 280,
  heavyTelegraphMs: 520,
  fireRateMs: 210,
  bulletSpeed: 720,
  bulletDamage: 1,
  grenadeDamage: 50,
  grenadeCooldownMs: 4200,
  grenadeSpeedX: 250,
  grenadeSpeedY: -300,
  grenadeRadius: 168,
  healAmount: 1,
  healCharges: 3,
  healCooldownMs: 10000,
  abilityCooldownMs: 9000,
  dashDistance: 196,
  shieldDurationMs: 3400,
  rageDurationMs: 4000,
  slowDurationMs: 3600,
  shootKnockback: 6,
  damagePerHit: 1,
  postHitInvulnerabilityMs: 1250,
  contactDamageCooldownMs: 2200,
  contactDamageMultiplier: 0.12,
  contactDamageFlat: 4,
  contactKnockback: 230,
} as const

export const SPRITE_TUNING = {
  player: {
    scale: 0.34,
    bobScaleX: 0.006,
    bobScaleY: 0.002,
    floorOffset: 10,
    bodyWidth: 178,
    bodyHeight: 226,
    bodyOffsetX: 104,
    bodyOffsetY: 126,
    muzzleOffsetX: 36,
    muzzleOffsetY: 74,
    grenadeOffsetX: 22,
    grenadeOffsetY: 58,
  },
  enemies: {
    melee: {
      scale: 0.35,
      floorOffset: 1,
      bodyWidth: 138,
      bodyHeight: 186,
      bodyOffsetX: 74,
      bodyOffsetY: 112,
    },
    ranged: {
      scale: 0.29,
      hoverBaseOffset: 92,
      hoverAmplitude: 5,
      bodyWidth: 182,
      bodyHeight: 118,
      bodyOffsetX: 92,
      bodyOffsetY: 92,
      projectileOffsetY: 58,
    },
    heavy: {
      scale: 0.32,
      floorOffset: 18,
      bodyWidth: 190,
      bodyHeight: 188,
      bodyOffsetX: 112,
      bodyOffsetY: 132,
    },
    boss: {
      scale: 0.52,
      floorOffset: 20,
      bodyWidth: 210,
      bodyHeight: 204,
      bodyOffsetX: 104,
      bodyOffsetY: 118,
    },
  },
} as const

export const SCORE_CONFIG = {
  survivalTickMs: 6000,
  survivalScore: 8,
  waveClearBonus: 70,
  meleeKill: 20,
  rangedKill: 30,
  heavyKill: 55,
  bossKill: 320,
} as const

export const UI_COOLDOWNS = {
  messageFadeMs: 1200,
} as const

export const BOSS_WAVE_INTERVAL = 10

export const BOSS_CONFIG = {
  summonCount: 2,
  summonPhasePercents: [0.6, 0.3],
  projectileTelegraphMs: 640,
  shockwaveTelegraphMs: 760,
  shockwaveCooldownMs: 4800,
  shockwaveRange: 430,
  shockwaveDamage: 1,
  shockwaveAirEvadeHeight: 86,
} as const

export function isBossWave(wave: number) {
  return wave > 0 && wave % BOSS_WAVE_INTERVAL === 0
}

export type EnemyType = 'melee' | 'ranged' | 'heavy' | 'boss'
export type WeaponId = 'pistol' | 'shotgun' | 'burst-rifle'
export type GrenadeId = 'frag-grenade' | 'fire-grenade'
export type AbilityId = 'shield' | 'dash' | 'rage' | 'slow-field'
export type HealId = 'medkit' | 'instant-heal' | 'regen-pack'

export type EnemyTuning = {
  hp: number
  damage: number
  speed: number
  rangedCooldownMs?: number
  preferredDistance?: number
  projectileDamage?: number
  projectileSpeed?: number
}

export const ENEMY_CONFIG: Record<EnemyType, EnemyTuning> = {
  melee: {
    hp: 3,
    damage: 1,
    speed: 58,
  },
  ranged: {
    hp: 2,
    damage: 1,
    speed: 44,
    rangedCooldownMs: 1700,
    preferredDistance: 250,
    projectileDamage: 1,
    projectileSpeed: 300,
  },
  heavy: {
    hp: 5,
    damage: 1,
    speed: 32,
    rangedCooldownMs: 3200,
    preferredDistance: 360,
    projectileDamage: 2,
    projectileSpeed: 150,
  },
  boss: {
    hp: 42,
    damage: 1,
    speed: 24,
    rangedCooldownMs: 2800,
    preferredDistance: 410,
    projectileDamage: 2,
    projectileSpeed: 118,
  },
}

export type WaveTemplate = {
  number: number
  pauseBeforeMs: number
  spawnDelayMs: number
  totalSpawns: number
  weights: Array<{ type: EnemyType; weight: number }>
  hpScale: number
  damageScale: number
  speedScale: number
}

export const WAVE_TEMPLATES: WaveTemplate[] = [
  {
    number: 1,
    pauseBeforeMs: 1200,
    spawnDelayMs: 1100,
    totalSpawns: 6,
    weights: [{ type: 'melee', weight: 1 }],
    hpScale: 1,
    damageScale: 1,
    speedScale: 1,
  },
  {
    number: 2,
    pauseBeforeMs: 1400,
    spawnDelayMs: 980,
    totalSpawns: 9,
    weights: [{ type: 'melee', weight: 1 }],
    hpScale: 1.08,
    damageScale: 1.04,
    speedScale: 1.05,
  },
  {
    number: 3,
    pauseBeforeMs: 1600,
    spawnDelayMs: 900,
    totalSpawns: 11,
    weights: [
      { type: 'melee', weight: 4 },
      { type: 'ranged', weight: 2 },
    ],
    hpScale: 1.15,
    damageScale: 1.08,
    speedScale: 1.08,
  },
  {
    number: 4,
    pauseBeforeMs: 1800,
    spawnDelayMs: 830,
    totalSpawns: 14,
    weights: [
      { type: 'melee', weight: 4 },
      { type: 'ranged', weight: 3 },
      { type: 'heavy', weight: 1 },
    ],
    hpScale: 1.24,
    damageScale: 1.12,
    speedScale: 1.1,
  },
  {
    number: 5,
    pauseBeforeMs: 2000,
    spawnDelayMs: 760,
    totalSpawns: 16,
    weights: [
      { type: 'melee', weight: 4 },
      { type: 'ranged', weight: 3 },
      { type: 'heavy', weight: 2 },
    ],
    hpScale: 1.32,
    damageScale: 1.18,
    speedScale: 1.12,
  },
]

export function getWaveTemplate(wave: number): WaveTemplate {
  if (isBossWave(wave)) {
    const bossTier = Math.max(1, wave / BOSS_WAVE_INTERVAL)

    return {
      number: wave,
      pauseBeforeMs: 2600,
      spawnDelayMs: 1000,
      totalSpawns: 1,
      weights: [{ type: 'boss', weight: 1 }],
      hpScale: 1 + (bossTier - 1) * 0.28,
      damageScale: 1 + (bossTier - 1) * 0.08,
      speedScale: 1 + (bossTier - 1) * 0.04,
    }
  }

  const found = WAVE_TEMPLATES.find((entry) => entry.number === wave)

  if (found) {
    return found
  }

  const last = WAVE_TEMPLATES[WAVE_TEMPLATES.length - 1]
  const overflow = wave - last.number

  return {
    ...last,
    number: wave,
    spawnDelayMs: Math.max(420, last.spawnDelayMs - overflow * 28),
    totalSpawns: last.totalSpawns + overflow * 3,
    hpScale: last.hpScale + overflow * 0.12,
    damageScale: last.damageScale + overflow * 0.06,
    speedScale: last.speedScale + overflow * 0.04,
  }
}

export const WEAPON_TUNING = {
  pistol: {
    damage: 1,
    fireRateMs: 210,
    projectileCount: 1,
    spread: 0,
    maxDistance: 920,
    triggerMode: 'tap',
  },
  shotgun: {
    damage: 1,
    fireRateMs: 720,
    projectileCount: 6,
    spread: 0.32,
    maxDistance: 260,
    triggerMode: 'tap',
  },
  'burst-rifle': {
    damage: 1,
    fireRateMs: 360,
    projectileCount: 3,
    spread: 0.08,
    maxDistance: 980,
    triggerMode: 'auto',
  },
} satisfies Record<
  WeaponId,
  {
    damage: number
    fireRateMs: number
    projectileCount: number
    spread: number
    maxDistance: number
    triggerMode: 'tap' | 'auto'
  }
>

export const INVENTORY_DEFAULTS = {
  weapon: 'pistol',
  grenade: 'frag-grenade',
  ability: 'shield',
  heal: 'medkit',
} as const
