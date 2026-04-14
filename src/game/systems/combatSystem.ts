import * as Phaser from 'phaser'
import {
  ARENA_BOUNDS,
  ARENA_SIZE,
  PLAYER_CONFIG,
  SPRITE_TUNING,
  WEAPON_TUNING,
  type WeaponId,
} from '@/config/game'
import type { Enemy } from '@/game/entities/Enemy'
import type { Player } from '@/game/entities/Player'

export type ProjectileSpec = {
  x: number
  y: number
  velocityX: number
  velocityY: number
  damage: number
  angle: number
  maxDistance: number
}

export type EnemyStep = {
  xVelocity: number
  y?: number
  shouldFire: boolean
}

export function buildPlayerVolley(options: {
  player: Player
  weaponId: WeaponId
  time: number
}): ProjectileSpec[] {
  const { player, weaponId, time } = options
  const tuning = WEAPON_TUNING[weaponId]

  if (time < player.lastShotAt + tuning.fireRateMs) {
    return []
  }

  player.lastShotAt = time

  const damage = tuning.damage * (player.isRaging(time) ? 2 : 1)
  const direction = player.facing
  const x = player.x + direction * SPRITE_TUNING.player.muzzleOffsetX
  const y = player.y - SPRITE_TUNING.player.muzzleOffsetY
  const baseAngle = direction > 0 ? 0 : Math.PI
  const projectileCount = tuning.projectileCount

  return Array.from({ length: projectileCount }, (_, index) => {
    const progress = projectileCount === 1 ? 0.5 : index / (projectileCount - 1)
    const spreadOffset = (progress - 0.5) * tuning.spread
    const shotAngle = baseAngle + spreadOffset

    return {
      x,
      y,
      velocityX: Math.cos(shotAngle) * PLAYER_CONFIG.bulletSpeed,
      velocityY: Math.sin(shotAngle) * PLAYER_CONFIG.bulletSpeed,
      damage,
      angle: Phaser.Math.RadToDeg(shotAngle),
      maxDistance: tuning.maxDistance,
    }
  })
}

export function resolveHealAmount(healId: string) {
  if (healId === 'instant-heal' || healId === 'regen-pack') {
    return 2
  }

  return PLAYER_CONFIG.healAmount
}

export function shouldApplyContactHit(options: {
  time: number
  nextContactHitAt: number
  enemyAttackReadyAt: number
  gameOver: boolean
}) {
  const { time, nextContactHitAt, enemyAttackReadyAt, gameOver } = options
  return !(gameOver || enemyAttackReadyAt > time || time < nextContactHitAt)
}

export function buildEnemyProjectile(options: {
  enemy: Enemy
  player: Player
}): ProjectileSpec {
  const { enemy, player } = options
  const direction = player.x >= enemy.x ? 1 : -1
  const heavyShot = enemy.enemyType === 'heavy'
  const x = enemy.x + direction * (heavyShot ? 26 : 22)
  const y =
    enemy.enemyType === 'ranged'
      ? enemy.y - SPRITE_TUNING.enemies.ranged.projectileOffsetY
      : enemy.y - 76
  const vector = new Phaser.Math.Vector2(player.x - enemy.x, player.y - enemy.y)
    .normalize()
    .scale(enemy.projectileSpeed)

  return {
    x,
    y,
    velocityX: vector.x,
    velocityY: vector.y,
    damage: enemy.projectileDamage,
    angle: Phaser.Math.RadToDeg(Math.atan2(vector.y, vector.x)),
    maxDistance: ARENA_SIZE.width + 180,
  }
}

export function resolveMeleeEnemyStep(enemy: Enemy, playerX: number): EnemyStep {
  const delta = playerX - enemy.x
  const distance = Math.abs(delta)

  if (distance < 68) {
    return { xVelocity: 0, shouldFire: false }
  }

  return { xVelocity: Math.sign(delta) * enemy.getEffectiveSpeed(), shouldFire: false }
}

export function resolveRangedEnemyStep(enemy: Enemy, playerX: number, time: number): EnemyStep {
  const hoverY =
    ARENA_BOUNDS.floorY -
    SPRITE_TUNING.enemies.ranged.hoverBaseOffset +
    Math.sin(time / 220 + enemy.x * 0.02) * SPRITE_TUNING.enemies.ranged.hoverAmplitude
  const delta = playerX - enemy.x
  const distance = Math.abs(delta)
  const preferredDistance = enemy.preferredDistance

  if (distance > preferredDistance + 18) {
    return {
      xVelocity: Math.sign(delta) * enemy.getEffectiveSpeed(),
      y: hoverY,
      shouldFire: false,
    }
  }

  if (distance < preferredDistance - 44) {
    return {
      xVelocity: -Math.sign(delta) * enemy.getEffectiveSpeed(),
      y: hoverY,
      shouldFire: false,
    }
  }

  return {
    xVelocity: 0,
    y: hoverY,
    shouldFire: time >= enemy.attackReadyAt,
  }
}

export function resolveHeavyEnemyStep(enemy: Enemy, playerX: number, time: number): EnemyStep {
  const delta = playerX - enemy.x
  const distance = Math.abs(delta)
  const xVelocity = distance < 86 ? 0 : Math.sign(delta) * enemy.getEffectiveSpeed()

  return {
    xVelocity,
    y: ARENA_BOUNDS.floorY + SPRITE_TUNING.enemies.heavy.floorOffset,
    shouldFire: distance <= enemy.preferredDistance && time >= enemy.attackReadyAt,
  }
}
