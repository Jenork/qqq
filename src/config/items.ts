import type { AbilityId, GrenadeId, HealId, WeaponId } from '@/config/game'

export type ItemCategory = 'weapon' | 'grenade' | 'ability' | 'healing'

export type ItemId =
  | WeaponId
  | GrenadeId
  | AbilityId
  | HealId

export type GameItem = {
  id: ItemId
  itemId: number
  category: ItemCategory
  label: string
  description: string
  defaultUnlocked: boolean
  claimableOnchain: boolean
}

export const ITEMS: GameItem[] = [
  {
    id: 'pistol',
    itemId: 1,
    category: 'weapon',
    label: 'Pistol',
    description: 'Reliable sidearm with quick shots and no spread.',
    defaultUnlocked: true,
    claimableOnchain: false,
  },
  {
    id: 'shotgun',
    itemId: 2,
    category: 'weapon',
    label: 'Shotgun',
    description: 'Short-range spread blast that deletes clustered demons.',
    defaultUnlocked: true,
    claimableOnchain: true,
  },
  {
    id: 'burst-rifle',
    itemId: 3,
    category: 'weapon',
    label: 'Burst Rifle',
    description: 'Controlled three-round burst for consistent ranged DPS.',
    defaultUnlocked: true,
    claimableOnchain: true,
  },
  {
    id: 'frag-grenade',
    itemId: 11,
    category: 'grenade',
    label: 'Frag Grenade',
    description: 'Classic explosive grenade with strong area burst.',
    defaultUnlocked: true,
    claimableOnchain: false,
  },
  {
    id: 'fire-grenade',
    itemId: 12,
    category: 'grenade',
    label: 'Fire Grenade',
    description: 'Ignites a scorched zone and punishes advancing waves.',
    defaultUnlocked: false,
    claimableOnchain: true,
  },
  {
    id: 'shield',
    itemId: 21,
    category: 'ability',
    label: 'Shield Pulse',
    description: 'Temporary damage reduction for dangerous wave spikes.',
    defaultUnlocked: true,
    claimableOnchain: false,
  },
  {
    id: 'dash',
    itemId: 22,
    category: 'ability',
    label: 'Dash',
    description: 'A fast evasive burst that creates breathing room.',
    defaultUnlocked: false,
    claimableOnchain: true,
  },
  {
    id: 'rage',
    itemId: 23,
    category: 'ability',
    label: 'Rage',
    description: 'Short damage spike for clearing heavy pushes.',
    defaultUnlocked: false,
    claimableOnchain: true,
  },
  {
    id: 'slow-field',
    itemId: 24,
    category: 'ability',
    label: 'Slow Field',
    description: 'Temporarily suppresses enemy speed across the arena.',
    defaultUnlocked: false,
    claimableOnchain: true,
  },
  {
    id: 'medkit',
    itemId: 31,
    category: 'healing',
    label: 'Medkit',
    description: 'Steady combat heal that restores a chunk of HP.',
    defaultUnlocked: true,
    claimableOnchain: false,
  },
  {
    id: 'instant-heal',
    itemId: 32,
    category: 'healing',
    label: 'Stim Shot',
    description: 'Fast emergency heal for last-second recovery.',
    defaultUnlocked: false,
    claimableOnchain: true,
  },
  {
    id: 'regen-pack',
    itemId: 33,
    category: 'healing',
    label: 'Regen Pack',
    description: 'Longer sustain item intended for extended survival.',
    defaultUnlocked: false,
    claimableOnchain: true,
  },
]

export const DEFAULT_UNLOCKED_ITEM_IDS = ITEMS.filter((item) => item.defaultUnlocked).map(
  (item) => item.id,
)

export const CLAIMABLE_ITEMS = ITEMS.filter((item) => item.claimableOnchain)

export const ITEMS_BY_CATEGORY = {
  weapon: ITEMS.filter((item) => item.category === 'weapon'),
  grenade: ITEMS.filter((item) => item.category === 'grenade'),
  ability: ITEMS.filter((item) => item.category === 'ability'),
  healing: ITEMS.filter((item) => item.category === 'healing'),
} satisfies Record<ItemCategory, GameItem[]>

export function getItemById(itemId: ItemId) {
  return ITEMS.find((item) => item.id === itemId)
}

export function getItemByContractId(itemId: number) {
  return ITEMS.find((item) => item.itemId === itemId)
}

export function getItemIconPath(itemId: ItemId) {
  if (itemId === 'frag-grenade' || itemId === 'fire-grenade') {
    return '/icons/grenade.png'
  }

  if (itemId === 'shield' || itemId === 'dash' || itemId === 'rage' || itemId === 'slow-field') {
    return '/icons/shield.png'
  }

  if (itemId === 'medkit' || itemId === 'instant-heal' || itemId === 'regen-pack') {
    return '/icons/heal.png'
  }

  return null
}
