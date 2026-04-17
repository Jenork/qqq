'use client'

import { ArsenalPanel } from '@/components/ArsenalPanel'
import { DailyCheckInButton } from '@/components/DailyCheckInButton'
import { FollowSocialsMission } from '@/components/FollowSocialsMission'
import { PayUsdcButton } from '@/components/PayUsdcButton'
import { useArsenalMissions } from '@/hooks/useArsenalMissions'

export function ArsenalMissionsPanel() {
  const missions = useArsenalMissions()

  return (
    <ArsenalPanel>
      <div className="grid gap-5 lg:grid-cols-3">
        <DailyCheckInButton mission={missions.dailyCheckIn} />
        <FollowSocialsMission mission={missions.followSocials} />
        <PayUsdcButton mission={missions.payUsdc} />
      </div>
    </ArsenalPanel>
  )
}
