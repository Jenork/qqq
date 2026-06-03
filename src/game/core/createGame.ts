import * as Phaser from 'phaser'
import { ARENA_SIZE } from '@/config/game'
import { BootScene } from '@/game/scenes/BootScene'
import { ArenaScene } from '@/game/scenes/ArenaScene'

export function createGame(parent: string | HTMLElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: ARENA_SIZE.width,
    height: ARENA_SIZE.height,
    backgroundColor: '#08101f',
    pixelArt: false,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 980 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: ARENA_SIZE.width,
      height: ARENA_SIZE.height,
    },
    scene: [BootScene, ArenaScene],
  })
}
