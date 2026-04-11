import * as Phaser from 'phaser'
import { PLAYER_CONFIG, SPRITE_TUNING } from '@/config/game'

export class Player extends Phaser.Physics.Arcade.Sprite {
  hp: number = PLAYER_CONFIG.maxHp
  maxHp: number = PLAYER_CONFIG.maxHp
  facing = 1
  lastShotAt = 0
  lastGrenadeAt = -PLAYER_CONFIG.grenadeCooldownMs
  lastAbilityAt = -PLAYER_CONFIG.abilityCooldownMs
  lastHealAt = -PLAYER_CONFIG.healCooldownMs
  healCharges = PLAYER_CONFIG.healCharges
  shieldUntil = 0
  rageUntil = 0
  slowFieldUntil = 0
  invulnerableUntil = 0
  damageFlashUntil = 0

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player')

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setOrigin(0.5, 1)
    this.setCollideWorldBounds(true)
    this.setDragX(1300)
    this.setBounce(0)
    this.setSize(SPRITE_TUNING.player.bodyWidth, SPRITE_TUNING.player.bodyHeight)
    this.setOffset(SPRITE_TUNING.player.bodyOffsetX, SPRITE_TUNING.player.bodyOffsetY)
  }

  resetState(x: number, y: number) {
    this.hp = this.maxHp
    this.facing = 1
    this.lastShotAt = 0
    this.lastGrenadeAt = -PLAYER_CONFIG.grenadeCooldownMs
    this.lastAbilityAt = -PLAYER_CONFIG.abilityCooldownMs
    this.lastHealAt = -PLAYER_CONFIG.healCooldownMs
    this.healCharges = PLAYER_CONFIG.healCharges
    this.shieldUntil = 0
    this.rageUntil = 0
    this.slowFieldUntil = 0
    this.invulnerableUntil = 0
    this.damageFlashUntil = 0
    this.clearTint()
    this.setAngle(0)
    this.setFlipX(false)
    this.enableBody(true, x, y, true, true)
    this.setVelocity(0, 0)
  }

  takeDamage(time: number, damage: number) {
    if (time < this.invulnerableUntil) {
      return this.hp
    }

    if (time < this.shieldUntil) {
      return this.hp
    }

    this.hp = Math.max(0, this.hp - damage)
    this.invulnerableUntil = time + PLAYER_CONFIG.postHitInvulnerabilityMs
    this.damageFlashUntil = time + 260
    return this.hp
  }

  heal(amount: number) {
    this.hp = Math.min(this.maxHp, this.hp + amount)
  }

  isShielded(time: number) {
    return time < this.shieldUntil
  }

  isRaging(time: number) {
    return time < this.rageUntil
  }

  isSlowing(time: number) {
    return time < this.slowFieldUntil
  }

  refreshVisualState(time: number) {
    if (time < this.damageFlashUntil) {
      this.setTintFill(0xff3b30)
      return
    }

    if (time < this.shieldUntil) {
      this.setTint(0x73d7ff)
      return
    }

    if (time < this.rageUntil) {
      this.setTint(0xff8f66)
      return
    }

    this.clearTint()
  }
}
