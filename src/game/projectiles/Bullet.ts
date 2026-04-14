import * as Phaser from 'phaser'

export class Bullet extends Phaser.Physics.Arcade.Image {
  damage = 0
  owner: 'player' | 'enemy' = 'player'
  launchedAt = 0
  lastTrailAt = 0
  originX = 0
  originY = 0
  maxDistance = Number.POSITIVE_INFINITY

  constructor(scene: Phaser.Scene, x: number, y: number, texture = 'bullet') {
    super(scene, x, y, texture)

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setActive(false)
    this.setVisible(false)
    this.setDepth(2)
    const body = this.body as Phaser.Physics.Arcade.Body | null
    body?.setAllowGravity(false)
  }

  fire(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    damage: number,
    owner: 'player' | 'enemy',
    maxDistance = Number.POSITIVE_INFINITY,
  ) {
    this.damage = damage
    this.owner = owner
    this.launchedAt = this.scene.time.now
    this.lastTrailAt = 0
    this.originX = x
    this.originY = y
    this.maxDistance = maxDistance
    this.enableBody(true, x, y, true, true)
    this.setVisible(true)
    this.setScale(1)
    this.setAlpha(1)
    this.clearTint()
    const body = this.body as Phaser.Physics.Arcade.Body | null
    body?.setAllowGravity(false)
    body?.setAcceleration(0, 0)
    this.setAngularVelocity(0)
    this.setVelocity(velocityX, velocityY)
    this.setAngle(Phaser.Math.RadToDeg(Math.atan2(velocityY, velocityX)))
  }

  shutdown() {
    this.launchedAt = 0
    this.lastTrailAt = 0
    this.originX = 0
    this.originY = 0
    this.maxDistance = Number.POSITIVE_INFINITY
    this.disableBody(true, true)
    this.setVelocity(0, 0)
    this.setAngularVelocity(0)
  }
}
