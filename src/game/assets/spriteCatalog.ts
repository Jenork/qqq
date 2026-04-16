import type Phaser from 'phaser'
import type { EnemyType } from '@/config/game'

export type PlayerSpriteState = 'idle' | 'run' | 'jump' | 'shoot' | 'hit' | 'dead'
export type EnemySpriteState = 'idle' | 'advance' | 'attack' | 'hit' | 'dead'

type SpriteAsset = {
  key: string
  path: string
}

const PLAYER_BASE_TEXTURE: SpriteAsset = {
  key: 'player-marine-base',
  path: '/sprites/player-marine.png',
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
  ...Object.values(ENEMY_BASE_TEXTURES),
]

export function preloadSpriteManifest(loader: Phaser.Loader.LoaderPlugin) {
  SPRITE_ASSET_MANIFEST.forEach((entry) => {
    loader.image(entry.key, entry.path)
  })
}

export function getPlayerTextureKey(_state: PlayerSpriteState) {
  return PLAYER_BASE_TEXTURE.key
}

export function getEnemyTextureKey(type: EnemyType, _state: EnemySpriteState) {
  return ENEMY_BASE_TEXTURES[type].key
}

