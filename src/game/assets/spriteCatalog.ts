import type Phaser from 'phaser'
import type { EnemyType } from '@/config/game'

export type PlayerSpriteState = 'idle' | 'run' | 'jump' | 'shoot' | 'hit' | 'dead'
export type EnemySpriteState = 'idle' | 'advance' | 'attack' | 'hit' | 'dead'
export type PlayerSpriteVariant = 'base' | 'armored'

type SpriteAsset = {
  key: string
  path: string
}

const PLAYER_BASE_TEXTURE: SpriteAsset = {
  key: 'player-marine-base',
  path: '/sprites/player-marine.png',
}

const PLAYER_ARMORED_TEXTURE: SpriteAsset = {
  key: 'player-marine-armored',
  path: '/sprites/player-marine-armored.png',
}

const ENEMY_BASE_TEXTURES: Record<EnemyType, SpriteAsset> = {
  melee: {
    key: 'enemy-melee-base',
    path: '/sprites/enemy-melee.png',
  },
  ranged: {
    key: 'enemy-ranged-base',
    path: '/sprites/enemy-ranged.png',
  },
  heavy: {
    key: 'enemy-heavy-base',
    path: '/sprites/enemy-heavy.png',
  },
}

export const SPRITE_ASSET_MANIFEST: SpriteAsset[] = [
  PLAYER_BASE_TEXTURE,
  PLAYER_ARMORED_TEXTURE,
  ...Object.values(ENEMY_BASE_TEXTURES),
]

export function preloadSpriteManifest(loader: Phaser.Loader.LoaderPlugin) {
  SPRITE_ASSET_MANIFEST.forEach((entry) => {
    loader.image(entry.key, entry.path)
  })
}

export function getPlayerTextureKey(state: PlayerSpriteState, variant: PlayerSpriteVariant = 'base') {
  void state
  return variant === 'armored' ? PLAYER_ARMORED_TEXTURE.key : PLAYER_BASE_TEXTURE.key
}

export function getEnemyTextureKey(type: EnemyType, state: EnemySpriteState) {
  void state
  return ENEMY_BASE_TEXTURES[type].key
}

