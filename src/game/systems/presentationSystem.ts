import * as Phaser from 'phaser'
import { SPRITE_TUNING, type EnemyType } from '@/config/game'
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

export function resolvePlayerSpriteState(player: Player, time: number) {
  if (player.hp <= 0) {
    return 'dead' satisfies PlayerSpriteState
  }

  if (time < player.damageFlashUntil) {
    return 'hit' satisfies PlayerSpriteState
  }

  if (time < player.lastShotAt + 150) {
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
  const baseScale = SPRITE_TUNING.player.scale
  const pulse = Math.sin(time / 150)
  let scaleX = baseScale
  let scaleY = baseScale

  if (state === 'idle') {
    scaleX += Math.sin(time / 220) * 0.004
    scaleY += Math.cos(time / 260) * 0.002
  } else if (state === 'run') {
    scaleX += pulse * 0.012
    scaleY -= pulse * 0.006
  } else if (state === 'jump') {
    scaleX -= 0.008
    scaleY += 0.012
  } else if (state === 'shoot') {
    scaleX -= 0.004
    scaleY += 0.006
  } else if (state === 'hit') {
    scaleX += 0.012
    scaleY -= 0.01
  } else {
    scaleX += 0.016
    scaleY -= 0.024
  }

  player.setTexture(getPlayerTextureKey(state))
  player.setScale(scaleX, scaleY)

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
  let scaleX = baseScale
  let scaleY = baseScale

  if (state === 'advance') {
    scaleX += pulse * 0.014
    scaleY -= pulse * 0.008
  } else if (state === 'attack') {
    scaleX += 0.014
    scaleY -= 0.01
  } else if (state === 'hit') {
    scaleX += 0.016
    scaleY -= 0.014
  } else if (state === 'idle') {
    scaleX += Math.sin(time / 240 + enemy.x * 0.01) * 0.003
    scaleY += Math.cos(time / 280 + enemy.x * 0.01) * 0.002
  } else {
    scaleX += 0.02
    scaleY -= 0.024
  }

  enemy.setTexture(getEnemyTextureKey(enemy.enemyType, state))
  enemy.setScale(scaleX, scaleY)

  return state
}

