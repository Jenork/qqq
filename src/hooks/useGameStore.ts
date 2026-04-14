'use client'

import { create } from 'zustand'
import { DEFAULT_UNLOCKED_ITEM_IDS, type ItemId } from '@/config/items'
import { INVENTORY_DEFAULTS, PLAYER_CONFIG } from '@/config/game'

type ButtonState = {
  left: boolean
  right: boolean
  jump: boolean
  shoot: boolean
}

type ActionTokens = {
  grenade: number
  ability: number
  heal: number
}

type GameApi = {
  startRun: () => void
  restartRun: () => void
  pauseRun: () => void
  resumeRun: () => void
}

type GameStore = {
  status: 'ready' | 'playing' | 'paused' | 'gameover'
  audioMuted: boolean
  hp: number
  maxHp: number
  score: number
  wave: number
  kills: number
  grenadeCooldownRemaining: number
  abilityCooldownRemaining: number
  healCooldownRemaining: number
  shieldRemaining: number
  healCharges: number
  activeMessage: string | null
  equippedWeapon: ItemId
  equippedGrenade: ItemId
  equippedAbility: ItemId
  equippedHeal: ItemId
  unlockedItemIds: ItemId[]
  onchainUnlockedItemIds: ItemId[]
  mobileControls: ButtonState
  actionTokens: ActionTokens
  pendingScore: number
  gameApi: GameApi | null
  startRun: () => void
  finishRun: (score: number) => void
  restartRun: () => void
  pauseRun: () => void
  resumeRun: () => void
  togglePause: () => void
  setAudioMuted: (muted: boolean) => void
  toggleAudioMuted: () => void
  setHudState: (
    next: Partial<
      Pick<
        GameStore,
        | 'hp'
        | 'score'
        | 'wave'
        | 'kills'
        | 'grenadeCooldownRemaining'
        | 'abilityCooldownRemaining'
        | 'healCooldownRemaining'
        | 'shieldRemaining'
        | 'healCharges'
      >
    >,
  ) => void
  setMessage: (message: string | null) => void
  setMobileControl: (key: keyof ButtonState, value: boolean) => void
  pulseAction: (key: keyof ActionTokens) => void
  consumeAction: (key: keyof ActionTokens) => number
  equipItem: (itemId: ItemId) => void
  setOnchainUnlocked: (itemIds: ItemId[]) => void
  registerGameApi: (api: GameApi | null) => void
  resetRunState: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  status: 'ready',
  audioMuted: false,
  hp: PLAYER_CONFIG.maxHp,
  maxHp: PLAYER_CONFIG.maxHp,
  score: 0,
  wave: 1,
  kills: 0,
  grenadeCooldownRemaining: 0,
  abilityCooldownRemaining: 0,
  healCooldownRemaining: 0,
  shieldRemaining: 0,
  healCharges: PLAYER_CONFIG.healCharges,
  activeMessage: null,
  equippedWeapon: INVENTORY_DEFAULTS.weapon,
  equippedGrenade: INVENTORY_DEFAULTS.grenade,
  equippedAbility: INVENTORY_DEFAULTS.ability,
  equippedHeal: INVENTORY_DEFAULTS.heal,
  unlockedItemIds: DEFAULT_UNLOCKED_ITEM_IDS,
  onchainUnlockedItemIds: [],
  mobileControls: {
    left: false,
    right: false,
    jump: false,
    shoot: false,
  },
  actionTokens: {
    grenade: 0,
    ability: 0,
    heal: 0,
  },
  pendingScore: 0,
  gameApi: null,
  startRun: () => {
    get().gameApi?.startRun()
  },
  pauseRun: () => {
    get().gameApi?.pauseRun()
  },
  resumeRun: () => {
    get().gameApi?.resumeRun()
  },
  togglePause: () => {
    const status = get().status

    if (status === 'playing') {
      get().gameApi?.pauseRun()
      return
    }

    if (status === 'paused') {
      get().gameApi?.resumeRun()
    }
  },
  finishRun: (score) =>
    set({
      status: 'gameover',
      pendingScore: score,
      activeMessage: null,
    }),
  restartRun: () => {
    get().gameApi?.restartRun()
  },
  setAudioMuted: (muted) => set({ audioMuted: muted }),
  toggleAudioMuted: () => set((state) => ({ audioMuted: !state.audioMuted })),
  setHudState: (next) => set(next),
  setMessage: (message) => set({ activeMessage: message }),
  setMobileControl: (key, value) =>
    set((state) => ({
      mobileControls: {
        ...state.mobileControls,
        [key]: value,
      },
    })),
  pulseAction: (key) =>
    set((state) => ({
      actionTokens: {
        ...state.actionTokens,
        [key]: state.actionTokens[key] + 1,
      },
    })),
  consumeAction: (key) => {
    const next = get().actionTokens[key]

    if (next > 0) {
      set((state) => ({
        actionTokens: {
          ...state.actionTokens,
          [key]: Math.max(0, state.actionTokens[key] - 1),
        },
      }))
    }

    return next
  },
  equipItem: (itemId) =>
    set((state) => {
      if (!state.unlockedItemIds.includes(itemId)) {
        return state
      }

      if (itemId === 'pistol' || itemId === 'shotgun' || itemId === 'burst-rifle') {
        return { equippedWeapon: itemId }
      }

      if (itemId === 'frag-grenade' || itemId === 'fire-grenade') {
        return { equippedGrenade: itemId }
      }

      if (itemId === 'shield' || itemId === 'dash' || itemId === 'rage' || itemId === 'slow-field') {
        return { equippedAbility: itemId }
      }

      return { equippedHeal: itemId }
    }),
  setOnchainUnlocked: (itemIds) =>
    set({
      onchainUnlockedItemIds: itemIds,
      unlockedItemIds: Array.from(new Set([...DEFAULT_UNLOCKED_ITEM_IDS, ...itemIds])),
    }),
  registerGameApi: (api) => set({ gameApi: api }),
  resetRunState: () =>
    set({
      status: 'ready',
      hp: PLAYER_CONFIG.maxHp,
      score: 0,
      wave: 1,
      kills: 0,
      grenadeCooldownRemaining: 0,
      abilityCooldownRemaining: 0,
      healCooldownRemaining: 0,
      shieldRemaining: 0,
      healCharges: PLAYER_CONFIG.healCharges,
      pendingScore: 0,
      activeMessage: null,
    }),
}))
