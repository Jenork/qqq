'use client'

import { useDailyCheckIn } from '@/hooks/useDailyCheckIn'
import { useSocialMission } from '@/hooks/useSocialMission'
import { useUsdcPayment } from '@/hooks/useUsdcPayment'

export function useArsenalMissions() {
  const dailyCheckIn = useDailyCheckIn()
  const followSocials = useSocialMission()
  const payUsdc = useUsdcPayment()

  return {
    dailyCheckIn,
    followSocials,
    payUsdc,
  }
}

