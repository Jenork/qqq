import * as Phaser from 'phaser'
import { SPRITE_TUNING, type EnemyType } from '@/config/game'
import { getEnemyTextureKey } from '@/game/assets/spriteCatalog'

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly enemyType: EnemyType
  hp: number
  maxHp: number
  damage: number
  moveSpeed: number
  rangedCooldownMs: number
  preferredDistance: number
  projectileDamage: number
  projectileSpeed: number
  attackReadyAt = 0
  lastAttackAt = -1000
  scoreValue: number
  activeSlowMultiplier = 1
  damageFlashUntil = 0
  baseTintColor: number | null = null

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: EnemyType,
    tuning: {
      hp: number
      damage: number
      speed: number
      rangedCooldownMs?: number
      preferredDistance?: number
      projectileDamage?: number
      projectileSpeed?: number
      scoreValue: number
    },
  ) {
    super(scene, x, y, getEnemyTextureKey(type, 'idle'))

    this.enemyType = type
    this.hp = tuning.hp
    this.maxHp = tuning.hp
    this.damage = tuning.damage
    this.moveSpeed = tuning.speed
    this.rangedCooldownMs = tuning.rangedCooldownMs ?? 0
    this.preferredDistance = tuning.preferredDistance ?? 0
    this.projectileDamage = tuning.projectileDamage ?? 1
    this.projectileSpeed = tuning.projectileSpeed ?? 300
    this.scoreValue = tuning.scoreValue

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setOrigin(0.5, 1)
    this.setCollideWorldBounds(true)
    this.setBounce(0)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.setImmovable(true)

    if (type === 'melee') {
      this.setSize(SPRITE_TUNING.enemies.melee.bodyWidth, SPRITE_TUNING.enemies.melee.bodyHeight)
      this.setOffset(SPRITE_TUNING.enemies.melee.bodyOffsetX, SPRITE_TUNING.enemies.melee.bodyOffsetY)
    } else if (type === 'ranged') {
      this.setSize(SPRITE_TUNING.enemies.ranged.bodyWidth, SPRITE_TUNING.enemies.ranged.bodyHeight)
      this.setOffset(SPRITE_TUNING.enemies.ranged.bodyOffsetX, SPRITE_TUNING.enemies.ranged.bodyOffsetY)
    } else {
      this.setSize(SPRITE_TUNING.enemies.heavy.bodyWidth, SPRITE_TUNING.enemies.heavy.bodyHeight)
      this.setOffset(SPRITE_TUNING.enemies.heavy.bodyOffsetX, SPRITE_TUNING.enemies.heavy.bodyOffsetY)
    }
  }

  takeDamage(time: number, amount: number) {
    this.hp = Math.max(0, this.hp - amount)
    this.damageFlashUntil = time + 220
    return this.hp
  }

  getEffectiveSpeed() {
    return this.moveSpeed * this.activeSlowMultiplier
  }

  setBaseTint(color: number | null) {
    this.baseTintColor = color

    if (color === null) {
      this.clearTint()
      return
    }

    this.setTint(color)
  }

  refreshVisualState(time: number) {
    if (time < this.damageFlashUntil) {
      this.setTintFill(0xff3b30)
      return
    }

    if (this.baseTintColor !== null) {
      this.setTint(this.baseTintColor)
      return
    }

    this.clearTint()
  }
}
