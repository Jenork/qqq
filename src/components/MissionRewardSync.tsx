'use client'

import { useEffect } from 'react'
import { DAILY_CHECK_IN_ARMOR_POINTS, SOCIAL_GRENADE_REWARD_ITEM_ID } from '@/config/missions'
import { useDailyCheckIn } from '@/hooks/useDailyCheckIn'
import { useGameStore } from '@/hooks/useGameStore'
import { useSocialMission } from '@/hooks/useSocialMission'
import { useWeaponUnlocks } from '@/hooks/useWeaponUnlocks'

export function MissionRewardSync() {
  const setOffchainUnlocked = useGameStore((state) => state.setOffchainUnlocked)
  const setOnchainUnlocked = useGameStore((state) => state.setOnchainUnlocked)
  const setRewardBonuses = useGameStore((state) => state.setRewardBonuses)
  const weaponUnlocks = useWeaponUnlocks()
  const socialMission = useSocialMission()
  const dailyCheckIn = useDailyCheckIn()

  useEffect(() => {
    setOnchainUnlocked([...weaponUnlocks.unlockedItemIds])
  }, [setOnchainUnlocked, weaponUnlocks.unlockedItemIds])

  useEffect(() => {
    setOffchainUnlocked(socialMission.rewardActive ? [SOCIAL_GRENADE_REWARD_ITEM_ID] : [])
  }, [setOffchainUnlocked, socialMission.rewardActive])

  useEffect(() => {
    setRewardBonuses({
      bonusHealCharges: 0,
      bonusArmorPoints: dailyCheckIn.rewardActive ? DAILY_CHECK_IN_ARMOR_POINTS : 0,
    })
  }, [dailyCheckIn.rewardActive, setRewardBonuses])

  return null
}
