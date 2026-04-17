import * as Phaser from 'phaser'
import { PLAYER_CONFIG, SPRITE_TUNING } from '@/config/game'
import { getPlayerTextureKey } from '@/game/assets/spriteCatalog'

export class Player extends Phaser.Physics.Arcade.Sprite {
  hp: number = PLAYER_CONFIG.maxHp
  maxHp: number = PLAYER_CONFIG.maxHp
  armor: number = 0
  maxArmor: number = 0
  facing: number = 1
  lastShotAt: number = 0
  lastGrenadeAt: number = -PLAYER_CONFIG.grenadeCooldownMs
  lastAbilityAt: number = -PLAYER_CONFIG.abilityCooldownMs
  lastHealAt: number = -PLAYER_CONFIG.healCooldownMs
  healCharges: number = PLAYER_CONFIG.healCharges
  shieldUntil: number = 0
  rageUntil: number = 0
  slowFieldUntil: number = 0
  invulnerableUntil: number = 0
  damageFlashUntil: number = 0

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, getPlayerTextureKey('idle'))

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setOrigin(0.5, 1)
    this.setCollideWorldBounds(true)
    this.setDragX(1300)
    this.setBounce(0)
    this.setSize(SPRITE_TUNING.player.bodyWidth, SPRITE_TUNING.player.bodyHeight)
    this.setOffset(SPRITE_TUNING.player.bodyOffsetX, SPRITE_TUNING.player.bodyOffsetY)
  }

  resetState(x: number, y: number, rewards?: { bonusHealCharges?: number; bonusArmorPoints?: number }) {
    const bonusHealCharges = rewards?.bonusHealCharges ?? 0
    const bonusArmorPoints = rewards?.bonusArmorPoints ?? 0

    this.hp = this.maxHp
    this.armor = bonusArmorPoints
    this.maxArmor = bonusArmorPoints
    this.facing = 1
    this.lastShotAt = 0
    this.lastGrenadeAt = -PLAYER_CONFIG.grenadeCooldownMs
    this.lastAbilityAt = -PLAYER_CONFIG.abilityCooldownMs
    this.lastHealAt = -PLAYER_CONFIG.healCooldownMs
    this.healCharges = PLAYER_CONFIG.healCharges + bonusHealCharges
    this.shieldUntil = 0
    this.rageUntil = 0
    this.slowFieldUntil = 0
    this.invulnerableUntil = 0
    this.damageFlashUntil = 0
    this.clearTint()
    this.setAngle(0)
    this.setFlipX(false)
    this.setTexture(getPlayerTextureKey('idle', bonusArmorPoints > 0 ? 'armored' : 'base'))
    this.enableBody(true, x, y, true, true)
    this.setVelocity(0, 0)
  }

  syncArmorBonus(bonusArmorPoints: number) {
    if (this.maxArmor === bonusArmorPoints) {
      return false
    }

    const armorDelta = bonusArmorPoints - this.maxArmor
    this.maxArmor = bonusArmorPoints
    this.armor = Math.max(0, this.armor + armorDelta)
    this.setTexture(getPlayerTextureKey('idle', bonusArmorPoints > 0 ? 'armored' : 'base'))
    return true
  }

  takeDamage(time: number, damage: number) {
    if (time < this.invulnerableUntil) {
      return { hp: this.hp, armor: this.armor }
    }

    if (time < this.shieldUntil) {
      return { hp: this.hp, armor: this.armor }
    }

    let remainingDamage = Math.max(0, damage)

    if (this.armor > 0 && remainingDamage > 0) {
      const absorbed = Math.min(this.armor, remainingDamage)
      this.armor -= absorbed
      remainingDamage -= absorbed
    }

    if (remainingDamage > 0) {
      this.hp = Math.max(0, this.hp - remainingDamage)
    }

    this.invulnerableUntil = time + PLAYER_CONFIG.postHitInvulnerabilityMs
    this.damageFlashUntil = time + 260
    return { hp: this.hp, armor: this.armor }
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
