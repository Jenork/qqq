'use client'

import { useEffect, useState } from 'react'
import { AudioToggleButton } from '@/components/AudioToggleButton'
import { AirdropPanel } from '@/components/AirdropPanel'
import { ArsenalMissionsPanel } from '@/components/ArsenalMissionsPanel'
import { GameShell } from '@/components/GameShell'
import { LeaderboardPanel } from '@/components/LeaderboardPanel'
import { ProfilePanel } from '@/components/ProfilePanel'
import { cn } from '@/lib/cn'
import { useGameStore } from '@/hooks/useGameStore'
import { useMobileViewport } from '@/hooks/useMobileViewport'

type SiteTab = 'game' | 'leaderboard' | 'arsenal' | 'profile' | 'airdrop'

const TAB_ORDER: Array<{ id: SiteTab; label: string }> = [
  { id: 'game', label: 'Game' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'arsenal', label: 'Arsenal' },
  { id: 'profile', label: 'Profile' },
  { id: 'airdrop', label: 'Airdrop' },
]

const TAB_IDS = {
  game: {
    tab: 'site-tab-game',
    panel: 'site-panel-game',
  },
  leaderboard: {
    tab: 'site-tab-leaderboard',
    panel: 'site-panel-leaderboard',
  },
  arsenal: {
    tab: 'site-tab-arsenal',
    panel: 'site-panel-arsenal',
  },
  profile: {
    tab: 'site-tab-profile',
    panel: 'site-panel-profile',
  },
  airdrop: {
    tab: 'site-tab-airdrop',
    panel: 'site-panel-airdrop',
  },
} satisfies Record<SiteTab, { tab: string; panel: string }>

function readHashTab(): SiteTab {
  if (typeof window === 'undefined') {
    return 'game'
  }

  const raw = window.location.hash.replace('#', '')
  if (raw === 'missions') {
    return 'arsenal'
  }

  if (
    raw === 'leaderboard' ||
    raw === 'arsenal' ||
    raw === 'profile' ||
    raw === 'airdrop' ||
    raw === 'game'
  ) {
    return raw
  }

  return 'game'
}

export function SiteTabs() {
  const [activeTab, setActiveTab] = useState<SiteTab>('game')
  const status = useGameStore((state) => state.status)
  const pauseRun = useGameStore((state) => state.pauseRun)
  const { showTouchControls } = useMobileViewport()

  const selectTab = (tab: SiteTab) => {
    window.location.hash = tab
    setActiveTab(tab)
  }

  useEffect(() => {
    const syncFromHash = () => setActiveTab(readHashTab())

    syncFromHash()
    window.addEventListener('hashchange', syncFromHash)

    return () => window.removeEventListener('hashchange', syncFromHash)
  }, [])

  useEffect(() => {
    if (activeTab === 'game') {
      return
    }

    if (status === 'playing') {
      pauseRun()
    }
  }, [activeTab, pauseRun, status])

  const hideMobileChrome =
    showTouchControls && (status === 'playing' || status === 'paused')

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-4">
      {!hideMobileChrome ? (
        <header className="chrome-shell rounded-[26px] px-3 py-3 sm:px-5">
          <div className="relative z-[1] flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="doom-logo">
                <span className="doom-logo-wordmark">BaseUp</span>
                <span className="doom-logo-sub">Season 2</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end lg:pr-[360px]">
              <nav aria-label="Primary" className="chrome-shell rounded-[22px] p-1.5">
                <div role="tablist" aria-label="Game sections" className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                  {TAB_ORDER.map((tab) => {
                    const active = tab.id === activeTab
                    const tabId = TAB_IDS[tab.id].tab
                    const panelId = TAB_IDS[tab.id].panel

                    return (
                      <button
                        key={tab.id}
                        id={tabId}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-controls={panelId}
                        tabIndex={active ? 0 : -1}
                        onClick={() => selectTab(tab.id)}
                        onKeyDown={(event) => {
                          const currentIndex = TAB_ORDER.findIndex((entry) => entry.id === tab.id)

                          if (event.key === 'ArrowRight') {
                            event.preventDefault()
                            selectTab(TAB_ORDER[(currentIndex + 1) % TAB_ORDER.length].id)
                          }

                          if (event.key === 'ArrowLeft') {
                            event.preventDefault()
                            selectTab(TAB_ORDER[(currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length].id)
                          }
                        }}
                        className={cn(
                          'inferno-tab min-w-0 px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] transition-all sm:min-w-[104px] sm:px-3 sm:text-xs xl:min-w-[124px]',
                          active
                            ? 'inferno-tab-active'
                            : 'text-slate-300 hover:border-cyan-300/25 hover:text-slate-100',
                        )}
                      >
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              </nav>

              <AudioToggleButton className="wallet-trigger inline-flex items-center justify-center rounded-[18px] px-4 py-3 text-sm font-black" />
            </div>
          </div>
        </header>
      ) : null}

      <div className="relative">
        <section
          id={TAB_IDS.game.panel}
          role="tabpanel"
          aria-labelledby={TAB_IDS.game.tab}
          hidden={activeTab !== 'game'}
          className={cn(
            activeTab === 'game' ? 'relative z-10' : 'pointer-events-none absolute inset-0 opacity-0',
          )}
        >
          <GameShell />
        </section>

        <section
          id={TAB_IDS.leaderboard.panel}
          role="tabpanel"
          aria-labelledby={TAB_IDS.leaderboard.tab}
          hidden={activeTab !== 'leaderboard'}
          className={cn(activeTab === 'leaderboard' ? 'block' : 'hidden')}
        >
          <LeaderboardPanel />
        </section>

        <section
          id={TAB_IDS.arsenal.panel}
          role="tabpanel"
          aria-labelledby={TAB_IDS.arsenal.tab}
          hidden={activeTab !== 'arsenal'}
          className={cn(activeTab === 'arsenal' ? 'block' : 'hidden')}
        >
          <ArsenalMissionsPanel />
        </section>

        <section
          id={TAB_IDS.profile.panel}
          role="tabpanel"
          aria-labelledby={TAB_IDS.profile.tab}
          hidden={activeTab !== 'profile'}
          className={cn(activeTab === 'profile' ? 'block' : 'hidden')}
        >
          <ProfilePanel />
        </section>

        <section
          id={TAB_IDS.airdrop.panel}
          role="tabpanel"
          aria-labelledby={TAB_IDS.airdrop.tab}
          hidden={activeTab !== 'airdrop'}
          className={cn(activeTab === 'airdrop' ? 'block' : 'hidden')}
        >
          <AirdropPanel />
        </section>
      </div>
    </div>
  )
}
