import * as Phaser from 'phaser'

export class Grenade extends Phaser.Physics.Arcade.Image {
  damage = 0
  radius = 0
  variant: 'frag' | 'fire' = 'frag'
  exploded = false
  detonateAt = 0

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'grenade')

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setActive(false)
    this.setVisible(false)
    this.setBounce(0.32)
  }

  launch(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    damage: number,
    radius: number,
    variant: 'frag' | 'fire',
  ) {
    this.damage = damage
    this.radius = radius
    this.variant = variant
    this.exploded = false
    this.detonateAt = this.scene.time.now + 900
    this.enableBody(true, x, y, true, true)
    this.setVisible(true)
    this.setVelocity(velocityX, velocityY)
    this.setAngularVelocity(220)
    this.setTint(variant === 'fire' ? 0xff7a3d : 0xf0f5ff)
  }

  shutdown() {
    this.detonateAt = 0
    this.disableBody(true, true)
    this.setVelocity(0, 0)
    this.setAngularVelocity(0)
    this.clearTint()
  }
}
