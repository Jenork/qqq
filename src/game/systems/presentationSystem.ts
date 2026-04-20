import * as Phaser from 'phaser'
import { PLAYER_CONFIG, SPRITE_TUNING, type EnemyType } from '@/config/game'
import {
  getEnemyTextureKey,
  getPlayerTextureKey,
  type EnemySpriteState,
  type PlayerSpriteState,
} from '@/game/assets/spriteCatalog'
import type { Enemy } from '@/game/entities/Enemy'
import type { Player } from '@/game/entities/Player'

function getEnemyBaseScale(type: EnemyType) {
  if (type === 'ranged') {
    return SPRITE_TUNING.enemies.ranged.scale
  }

  if (type === 'heavy') {
    return SPRITE_TUNING.enemies.heavy.scale
  }

  return SPRITE_TUNING.enemies.melee.scale
}

function getRecentPower(time: number, startedAt: number, durationMs: number) {
  if (durationMs <= 0) {
    return 0
  }

  return Phaser.Math.Clamp(1 - (time - startedAt) / durationMs, 0, 1)
}

function getEnemyFacingSign(enemy: Enemy) {
  return enemy.flipX ? 1 : -1
}

export function resolvePlayerSpriteState(player: Player, time: number) {
  if (player.hp <= 0) {
    return 'dead' satisfies PlayerSpriteState
  }

  if (time < player.damageFlashUntil) {
    return 'hit' satisfies PlayerSpriteState
  }

  if (time < player.lastShotAt + 95) {
    return 'shoot' satisfies PlayerSpriteState
  }

  const body = player.body as Phaser.Physics.Arcade.Body | null
  const grounded = Boolean(body?.blocked.down)

  if (!grounded) {
    return 'jump' satisfies PlayerSpriteState
  }

  if (Math.abs(body?.velocity.x ?? 0) > 32) {
    return 'run' satisfies PlayerSpriteState
  }

  return 'idle' satisfies PlayerSpriteState
}

export function applyPlayerPresentation(player: Player, time: number) {
  const state = resolvePlayerSpriteState(player, time)
  const variant = player.maxArmor > 0 ? 'armored' : 'base'
  const body = player.body as Phaser.Physics.Arcade.Body | null
  const baseScale = SPRITE_TUNING.player.scale
  const facing = player.facing >= 0 ? 1 : -1
  const horizontalSpeed = Math.abs(body?.velocity.x ?? 0)
  const moveIntensity = Phaser.Math.Clamp(horizontalSpeed / PLAYER_CONFIG.moveSpeed, 0, 1)
  const shotPower = getRecentPower(time, player.lastShotAt, 110)
  const hitPower = getRecentPower(time, player.damageFlashUntil - 220, 220)
  const runCycle = Math.sin(time / 72 + player.x * 0.024)
  const breath = Math.sin(time / 210)
  let scaleX = baseScale
  let scaleY = baseScale
  let angle = 0

  if (state === 'idle') {
    scaleX += breath * 0.004
    scaleY += Math.cos(time / 260) * 0.002
    angle = breath * 0.6
  } else if (state === 'run') {
    const stride = Math.abs(runCycle)
    scaleX += stride * (0.007 + moveIntensity * 0.006)
    scaleY -= stride * (0.005 + moveIntensity * 0.004)
    angle = facing * (0.8 + moveIntensity * 0.9 + runCycle * 1.6)
  } else if (state === 'jump') {
    const verticalSpeed = body?.velocity.y ?? 0
    const rising = verticalSpeed < -24
    scaleX += rising ? -0.008 : 0.003
    scaleY += rising ? 0.013 : 0.008
    angle = rising ? -facing * 2.6 : facing * 1.8
  } else if (state === 'shoot') {
    scaleX += shotPower * 0.008
    scaleY -= shotPower * 0.005
    angle = -facing * (PLAYER_CONFIG.shootKnockback * 0.35 + shotPower * 1.2)
  } else if (state === 'hit') {
    const shake = Math.sin(time / 20) * hitPower * 1
    scaleX += hitPower * 0.012
    scaleY -= hitPower * 0.01
    angle = -facing * (3.6 * hitPower) + shake
  } else {
    scaleX += 0.026
    scaleY -= 0.044
    angle = -facing * 76
  }

  player.setTexture(getPlayerTextureKey(state, variant))
  const scaleLerp = state === 'shoot' || state === 'hit' ? 0.22 : 0.16
  const angleLerp = state === 'shoot' || state === 'hit' ? 0.24 : 0.14
  player.setScale(
    Phaser.Math.Linear(player.scaleX, scaleX, scaleLerp),
    Phaser.Math.Linear(player.scaleY, scaleY, scaleLerp),
  )
  player.setAngle(Phaser.Math.Linear(player.angle, angle, angleLerp))

  return state
}

export function resolveEnemySpriteState(enemy: Enemy, time: number) {
  if (enemy.hp <= 0) {
    return 'dead' satisfies EnemySpriteState
  }

  if (time < enemy.damageFlashUntil) {
    return 'hit' satisfies EnemySpriteState
  }

  if (time < enemy.lastAttackAt + 180) {
    return 'attack' satisfies EnemySpriteState
  }

  if (Math.abs((enemy.body as Phaser.Physics.Arcade.Body | null)?.velocity.x ?? 0) > 10) {
    return 'advance' satisfies EnemySpriteState
  }

  return 'idle' satisfies EnemySpriteState
}

export function applyEnemyPresentation(enemy: Enemy, time: number) {
  const state = resolveEnemySpriteState(enemy, time)
  const baseScale = getEnemyBaseScale(enemy.enemyType)
  const pulse = Math.sin(time / 140 + enemy.x * 0.015)
  const stomp = Math.sin(time / 110 + enemy.x * 0.02)
  const attackPower = getRecentPower(time, enemy.lastAttackAt, 190)
  const hitPower = getRecentPower(time, enemy.damageFlashUntil - 220, 220)
  const facing = getEnemyFacingSign(enemy)
  let scaleX = baseScale
  let scaleY = baseScale
  let angle = 0

  if (state === 'advance') {
    if (enemy.enemyType === 'heavy') {
      const stompPower = Math.abs(stomp)
      scaleX += stompPower * 0.018
      scaleY -= stompPower * 0.014
      angle = facing * (1.6 + stomp * 2.8)
    } else if (enemy.enemyType === 'ranged') {
      scaleX += pulse * 0.006
      scaleY -= pulse * 0.004
      angle = facing * 1.8 + pulse * 1.6
    } else {
      const stride = Math.abs(stomp)
      scaleX += stride * 0.016
      scaleY -= stride * 0.01
      angle = facing * (2.4 + stomp * 3.6)
    }
  } else if (state === 'attack') {
    if (enemy.enemyType === 'heavy') {
      scaleX += attackPower * 0.03
      scaleY -= attackPower * 0.018
      angle = facing * (9.5 * attackPower)
    } else if (enemy.enemyType === 'ranged') {
      scaleX += attackPower * 0.012
      scaleY -= attackPower * 0.008
      angle = facing * (3.2 * attackPower) + Math.sin(time / 22) * attackPower * 1.4
    } else {
      scaleX += attackPower * 0.02
      scaleY -= attackPower * 0.012
      angle = facing * (7.2 * attackPower)
    }
  } else if (state === 'hit') {
    scaleX += hitPower * 0.022
    scaleY -= hitPower * 0.018
    angle = -facing * (8.5 * hitPower) + Math.sin(time / 18) * hitPower * 2
  } else if (state === 'idle') {
    const idleWave = Math.sin(time / 240 + enemy.x * 0.01)
    scaleX += idleWave * 0.003
    scaleY += Math.cos(time / 280 + enemy.x * 0.01) * 0.002

    if (enemy.enemyType === 'ranged') {
      angle = idleWave * 1.3
    } else if (enemy.enemyType === 'heavy') {
      angle = idleWave * 0.7
    } else {
      angle = idleWave * 0.9
    }
  } else {
    scaleX += 0.024
    scaleY -= 0.034
    angle = -facing * 82
  }

  enemy.setTexture(getEnemyTextureKey(enemy.enemyType, state))
  enemy.setScale(scaleX, scaleY)
  enemy.setAngle(angle)

  return state
}
