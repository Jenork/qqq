'use client'

type UsdcMissionRecord = {
  paidAt: number
  txHash: string
}

type UsdcMissionStore = Record<string, UsdcMissionRecord>

export const USDC_MISSION_STORAGE_KEY = 'baseup-usdc-mission-v1'
export const USDC_MISSION_EVENT_NAME = 'baseup-usdc-mission-updated'

function normalizeAddress(address?: string | null) {
  return address?.trim().toLowerCase() ?? ''
}

function readStore(): UsdcMissionStore {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(USDC_MISSION_STORAGE_KEY)

    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw) as Record<string, Partial<UsdcMissionRecord>>
    const entries = Object.entries(parsed).filter((entry): entry is [string, Partial<UsdcMissionRecord>] => Boolean(entry[0]))

    return Object.fromEntries(
      entries.flatMap(([address, record]) => {
        if (typeof record?.paidAt !== 'number' || typeof record?.txHash !== 'string' || record.txHash.length === 0) {
          return []
        }

        return [[address.toLowerCase(), { paidAt: record.paidAt, txHash: record.txHash }]]
      }),
    )
  } catch {
    return {}
  }
}

function writeStore(next: UsdcMissionStore) {
  window.localStorage.setItem(USDC_MISSION_STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(USDC_MISSION_EVENT_NAME))
}

export function readUsdcMissionState(address?: string | null) {
  const normalizedAddress = normalizeAddress(address)

  if (!normalizedAddress) {
    return null
  }

  return readStore()[normalizedAddress] ?? null
}

export function readAnyUsdcMissionState() {
  const records = Object.values(readStore())
  return records[0] ?? null
}

export function markUsdcMissionSuccess(address: string, txHash: string) {
  const normalizedAddress = normalizeAddress(address)

  if (!normalizedAddress) {
    return
  }

  const next = readStore()
  next[normalizedAddress] = {
    paidAt: Date.now(),
    txHash,
  }

  writeStore(next)
}
