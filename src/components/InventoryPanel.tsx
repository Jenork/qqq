'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useAccount,
  useChainId,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { CLAIMABLE_ITEMS, ITEMS_BY_CATEGORY, getItemIconPath, type GameItem } from '@/config/items'
import { GAME_PROGRESS_ADDRESS, gameProgressAbi, HAS_GAME_PROGRESS_ADDRESS } from '@/config/contracts'
import { useGameStore } from '@/hooks/useGameStore'
import { cn } from '@/lib/cn'

function ItemCard({
  item,
  unlocked,
  equipped,
  onEquip,
  onClaim,
  canClaim,
  claimState,
}: {
  item: GameItem
  unlocked: boolean
  equipped: boolean
  onEquip: () => void
  onClaim: () => void
  canClaim: boolean
  claimState: string | null
}) {
  const iconPath = getItemIconPath(item.id)

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {iconPath ? (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/25 p-2">
              <img src={iconPath} alt="" className="h-full w-full object-contain [image-rendering:pixelated]" />
            </div>
          ) : null}
          <div>
            <h4 className="text-base font-bold text-white">{item.label}</h4>
            <p className="mt-1 text-sm text-slate-300">{item.description}</p>
          </div>
        </div>
        <span
          className={cn(
            'rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em]',
            equipped
              ? 'bg-lime-300/15 text-lime-200'
              : unlocked
              ? 'bg-sky-300/10 text-sky-100'
              : 'bg-rose-400/12 text-rose-200',
          )}
        >
          {equipped ? 'Equipped' : unlocked ? 'Unlocked' : 'Locked'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {unlocked ? (
          <button type="button" onClick={onEquip} className="action-button rounded-2xl px-4 py-3 text-sm font-bold">
            {equipped ? 'Equipped' : 'Equip'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onClaim}
            disabled={!canClaim}
            className="action-button rounded-2xl px-4 py-3 text-sm font-bold"
          >
            {claimState ?? (item.claimableOnchain ? 'Claim Onchain' : 'Locked')}
          </button>
        )}

        {item.claimableOnchain ? (
          <span className="rounded-full bg-amber-400/12 px-3 py-2 text-xs font-semibold text-amber-100">
            Onchain unlock
          </span>
        ) : (
          <span className="rounded-full bg-white/8 px-3 py-2 text-xs font-semibold text-slate-200">
            Starter item
          </span>
        )}
      </div>
    </article>
  )
}

export function InventoryPanel() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const queryClient = useQueryClient()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const inventoryOpen = useGameStore((state) => state.inventoryOpen)
  const toggleInventory = useGameStore((state) => state.toggleInventory)
  const unlockedItemIds = useGameStore((state) => state.unlockedItemIds)
  const equipItem = useGameStore((state) => state.equipItem)
  const setOnchainUnlocked = useGameStore((state) => state.setOnchainUnlocked)
  const equippedWeapon = useGameStore((state) => state.equippedWeapon)
  const equippedGrenade = useGameStore((state) => state.equippedGrenade)
  const equippedAbility = useGameStore((state) => state.equippedAbility)
  const equippedHeal = useGameStore((state) => state.equippedHeal)

  const [claimingItemId, setClaimingItemId] = useState<number | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)

  const { data: unlockedReads, refetch, isFetching } = useReadContracts({
    allowFailure: false,
    contracts:
      address && isConnected && HAS_GAME_PROGRESS_ADDRESS
        ? CLAIMABLE_ITEMS.map((item) => ({
            address: GAME_PROGRESS_ADDRESS,
            abi: gameProgressAbi,
            functionName: 'isItemUnlocked',
            args: [address, BigInt(item.itemId)],
          }))
        : [],
    query: {
      enabled: Boolean(address) && HAS_GAME_PROGRESS_ADDRESS,
    },
  })

  const { data: hash, error, isPending, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (!unlockedReads) {
      return
    }

    const nextUnlocked = CLAIMABLE_ITEMS.filter((_, index) => Boolean(unlockedReads[index])).map((item) => item.id)
    setOnchainUnlocked(nextUnlocked)
  }, [setOnchainUnlocked, unlockedReads])

  useEffect(() => {
    if (address) {
      return
    }

    setOnchainUnlocked([])
  }, [address, setOnchainUnlocked])

  useEffect(() => {
    if (!isSuccess) {
      return
    }

    setClaimingItemId(null)
    setClaimError(null)
    void refetch()
    void queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
  }, [isSuccess, queryClient, refetch])

  useEffect(() => {
    if (error) {
      setClaimError(error.message)
    }
  }, [error])

  const claimState = useMemo(() => {
    if (isPending) {
      return 'Confirm in wallet'
    }

    if (isConfirming) {
      return 'Confirming'
    }

    if (isSuccess) {
      return 'Success'
    }

    if (claimError) {
      return 'Error'
    }

    return null
  }, [claimError, isConfirming, isPending, isSuccess])

  if (!inventoryOpen) {
    return null
  }

  const equippedMap = new Map([
    [equippedWeapon, true],
    [equippedGrenade, true],
    [equippedAbility, true],
    [equippedHeal, true],
  ])

  const canWrite = isConnected && HAS_GAME_PROGRESS_ADDRESS && chainId === baseSepolia.id

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-slate-950/65 p-2 sm:items-center sm:p-3">
      <div className="panel scrollbar-thin max-h-[92svh] w-full max-w-[440px] overflow-y-auto rounded-[1.5rem] p-4 sm:max-h-[86vh] sm:max-w-4xl sm:rounded-[2rem] sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="panel-title">Inventory</p>
            <h3 className="mt-1 text-2xl font-black">Loadout & Unlocks</h3>
            <p className="mt-2 text-sm text-slate-300">
              The game is playable without wallet actions. Claim only unlocks extra loadout options.
            </p>
          </div>
          <button
            type="button"
            className="action-button rounded-2xl px-4 py-3 text-sm font-bold"
            onClick={() => toggleInventory(false)}
          >
            Close
          </button>
        </div>

        {!HAS_GAME_PROGRESS_ADDRESS ? (
          <div className="mb-4 rounded-3xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
            Contract address is not configured yet. Starter items still work, onchain claims are disabled until deployment.
          </div>
        ) : null}

        {isConnected && chainId !== baseSepolia.id ? (
          <button
            type="button"
            onClick={() => switchChain({ chainId: baseSepolia.id })}
            className="action-button mb-4 rounded-2xl px-4 py-3 text-sm font-bold"
          >
            {isSwitching ? 'Switching...' : 'Switch to Base Sepolia'}
          </button>
        ) : null}

        {claimError ? (
          <div className="mb-4 rounded-3xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">
            {claimError}
          </div>
        ) : null}

        <div className="grid gap-5">
          {Object.entries(ITEMS_BY_CATEGORY).map(([category, items]) => (
            <section key={category}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-lg font-black capitalize text-white">{category}</h4>
                {isFetching ? <span className="text-xs text-slate-400">Syncing unlocks...</span> : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {items.map((item) => {
                  const unlocked = unlockedItemIds.includes(item.id)

                  return (
                    <ItemCard
                      key={item.id}
                      item={item}
                      unlocked={unlocked}
                      equipped={equippedMap.has(item.id)}
                      onEquip={() => equipItem(item.id)}
                      onClaim={() => {
                        if (!canWrite) {
                          setClaimError('Connect wallet and switch to Base Sepolia first.')
                          return
                        }

                        setClaimError(null)
                        setClaimingItemId(item.itemId)
                        writeContract({
                          address: GAME_PROGRESS_ADDRESS,
                          abi: gameProgressAbi,
                          functionName: 'claimItem',
                          args: [BigInt(item.itemId)],
                          chainId: baseSepolia.id,
                        })
                      }}
                      canClaim={item.claimableOnchain && canWrite && !isPending && !isConfirming}
                      claimState={claimingItemId === item.itemId ? claimState : null}
                    />
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
