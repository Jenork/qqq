import * as Phaser from 'phaser'
import {
  ARENA_BOUNDS,
  ENEMY_CONFIG,
  SCORE_CONFIG,
  SPRITE_TUNING,
  type EnemyType,
  type WaveTemplate,
} from '@/config/game'
import { Enemy } from '@/game/entities/Enemy'

export function createArenaEnemy(options: {
  scene: Phaser.Scene
  type: EnemyType
  wave: number
  template: WaveTemplate
}) {
  const { scene, type, wave, template } = options
  const base = ENEMY_CONFIG[type]
  const x = Phaser.Math.Between(ARENA_BOUNDS.enemySpawnMinX, ARENA_BOUNDS.enemySpawnMaxX)
  const y =
    type === 'ranged'
      ? ARENA_BOUNDS.floorY - SPRITE_TUNING.enemies.ranged.hoverBaseOffset
      : type === 'boss'
        ? ARENA_BOUNDS.floorY + SPRITE_TUNING.enemies.boss.floorOffset
        : type === 'heavy'
        ? ARENA_BOUNDS.floorY + SPRITE_TUNING.enemies.heavy.floorOffset
        : ARENA_BOUNDS.floorY + SPRITE_TUNING.enemies.melee.floorOffset

  const enemy = new Enemy(scene, x, y, type, {
    hp: Math.round(base.hp * template.hpScale),
    damage: Math.round(base.damage * template.damageScale),
    speed: Math.round(base.speed * template.speedScale),
    rangedCooldownMs: base.rangedCooldownMs,
    preferredDistance: base.preferredDistance,
    projectileDamage: base.projectileDamage,
    projectileSpeed: base.projectileSpeed,
    scoreValue:
      type === 'melee'
        ? SCORE_CONFIG.meleeKill
        : type === 'ranged'
          ? SCORE_CONFIG.rangedKill
          : type === 'heavy'
            ? SCORE_CONFIG.heavyKill
            : SCORE_CONFIG.bossKill,
  })

  enemy.setDepth(1)

  if (type === 'boss') {
    enemy.setScale(SPRITE_TUNING.enemies.boss.scale)
    enemy.setDepth(2)
  } else if (type === 'heavy') {
    enemy.setScale(SPRITE_TUNING.enemies.heavy.scale)
  } else if (type === 'ranged') {
    enemy.setScale(SPRITE_TUNING.enemies.ranged.scale)
  } else {
    enemy.setScale(SPRITE_TUNING.enemies.melee.scale)
  }

  enemy.setBaseTint(type === 'boss' ? 0x8fefff : wave >= 4 ? (type === 'heavy' ? 0xc289ff : 0xffb28f) : null)

  return enemy
}
