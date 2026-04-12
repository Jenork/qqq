import * as Phaser from 'phaser'
import { preloadSpriteManifest } from '@/game/assets/spriteCatalog'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot')
  }

  preload() {
    this.load.image('arena-background', '/backgrounds/arena-background.png')
    preloadSpriteManifest(this.load)
  }

  create() {
    const graphics = this.add.graphics()

    graphics.clear()
    graphics.fillStyle(0xfff6b0)
    graphics.fillRect(0, 2, 8, 4)
    graphics.fillRect(2, 0, 4, 8)
    graphics.generateTexture('bullet', 8, 8)

    graphics.clear()
    graphics.fillStyle(0xff6b1c)
    graphics.fillRect(2, 2, 10, 10)
    graphics.fillStyle(0xffec8c)
    graphics.fillRect(4, 4, 6, 6)
    graphics.generateTexture('enemy-bullet', 14, 14)

    graphics.clear()
    graphics.fillStyle(0x5b120b)
    graphics.fillCircle(12, 12, 12)
    graphics.fillStyle(0xcc3d12)
    graphics.fillCircle(12, 12, 9)
    graphics.fillStyle(0xffd17b)
    graphics.fillCircle(12, 12, 4)
    graphics.generateTexture('heavy-bullet', 24, 24)

    graphics.clear()
    graphics.fillStyle(0x677c2c)
    graphics.fillRect(2, 2, 16, 16)
    graphics.fillStyle(0x3e4c17)
    graphics.fillRect(6, 6, 8, 8)
    graphics.generateTexture('grenade', 20, 20)

    graphics.destroy()

    this.scene.start('arena')
  }
}
