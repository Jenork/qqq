'use client'

import { useEffect } from 'react'
import {
  DAILY_CHECK_IN_SHOTGUN_REWARD_ITEM_ID,
  SOCIAL_ARMOR_REWARD_POINTS,
  USDC_GRENADE_REWARD_ITEM_ID,
} from '@/config/missions'
import type { ItemId } from '@/config/items'
import { useDailyCheckIn } from '@/hooks/useDailyCheckIn'
import { useGameStore } from '@/hooks/useGameStore'
import { useSocialMission } from '@/hooks/useSocialMission'
import { useUsdcPayment } from '@/hooks/useUsdcPayment'

export function MissionRewardSync() {
  const setOffchainUnlocked = useGameStore((state) => state.setOffchainUnlocked)
  const setOnchainUnlocked = useGameStore((state) => state.setOnchainUnlocked)
  const setRewardBonuses = useGameStore((state) => state.setRewardBonuses)
  const socialMission = useSocialMission()
  const dailyCheckIn = useDailyCheckIn()
  const payUsdc = useUsdcPayment()

  useEffect(() => {
    setOnchainUnlocked([])
  }, [setOnchainUnlocked])

  useEffect(() => {
    const unlockedRewards: ItemId[] = []

    if (dailyCheckIn.rewardActive) {
      unlockedRewards.push(DAILY_CHECK_IN_SHOTGUN_REWARD_ITEM_ID)
    }

    if (payUsdc.grenadeUnlocked) {
      unlockedRewards.push(USDC_GRENADE_REWARD_ITEM_ID)
    }

    setOffchainUnlocked(unlockedRewards)
  }, [dailyCheckIn.rewardActive, payUsdc.grenadeUnlocked, setOffchainUnlocked])

  useEffect(() => {
    setRewardBonuses({
      bonusHealCharges: 0,
      bonusArmorPoints: socialMission.rewardActive ? SOCIAL_ARMOR_REWARD_POINTS : 0,
    })
  }, [setRewardBonuses, socialMission.rewardActive])

  return null
}
