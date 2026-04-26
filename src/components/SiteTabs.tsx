'use client'

import { useEffect, useState } from 'react'
import { AudioToggleButton } from '@/components/AudioToggleButton'
import { ArsenalMissionsPanel } from '@/components/ArsenalMissionsPanel'
import { GameShell } from '@/components/GameShell'
import { LeaderboardPanel } from '@/components/LeaderboardPanel'
import { cn } from '@/lib/cn'
import { useGameStore } from '@/hooks/useGameStore'

type SiteTab = 'game' | 'leaderboard' | 'arsenal'

const TAB_ORDER: Array<{ id: SiteTab; label: string }> = [
  { id: 'game', label: 'Game' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'arsenal', label: 'Arsenal' },
]

function readHashTab(): SiteTab {
  if (typeof window === 'undefined') {
    return 'game'
  }

  const raw = window.location.hash.replace('#', '')
  if (raw === 'missions') {
    return 'arsenal'
  }

  if (raw === 'leaderboard' || raw === 'arsenal' || raw === 'game') {
    return raw
  }

  return 'game'
}

export function SiteTabs() {
  const [activeTab, setActiveTab] = useState<SiteTab>('game')
  const status = useGameStore((state) => state.status)
  const pauseRun = useGameStore((state) => state.pauseRun)
  const gameTabId = 'site-tab-game'
  const leaderboardTabId = 'site-tab-leaderboard'
  const arsenalTabId = 'site-tab-arsenal'
  const gamePanelId = 'site-panel-game'
  const leaderboardPanelId = 'site-panel-leaderboard'
  const arsenalPanelId = 'site-panel-arsenal'

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

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-4">
      <header className="chrome-shell rounded-[30px] px-4 py-4 sm:px-5">
        <div className="relative z-[1] flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="doom-logo">
              <span className="doom-logo-wordmark">Based</span>
              <span className="doom-logo-sub">DOOM</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end lg:pr-[372px]">
            <nav aria-label="Primary" className="chrome-shell rounded-[24px] p-1.5">
              <div role="tablist" aria-label="Game sections" className="grid grid-cols-3 gap-2">
                {TAB_ORDER.map((tab) => {
                  const active = tab.id === activeTab
                  const tabId =
                    tab.id === 'game'
                      ? gameTabId
                      : tab.id === 'leaderboard'
                        ? leaderboardTabId
                        : arsenalTabId
                  const panelId =
                    tab.id === 'game'
                      ? gamePanelId
                      : tab.id === 'leaderboard'
                        ? leaderboardPanelId
                        : arsenalPanelId

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
                        'inferno-tab min-w-0 px-3 py-3 text-[11px] font-black uppercase tracking-[0.14em] transition-all sm:min-w-[128px] sm:px-4 sm:text-sm',
                        active
                          ? 'inferno-tab-active'
                          : 'text-stone-300 hover:border-[#6d3121] hover:text-stone-100',
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

      <div className="relative">
        <section
          id={gamePanelId}
          role="tabpanel"
          aria-labelledby={gameTabId}
          hidden={activeTab !== 'game'}
          className={cn(
            activeTab === 'game' ? 'relative z-10' : 'pointer-events-none absolute inset-0 opacity-0',
          )}
        >
          <GameShell />
        </section>

        <section
          id={leaderboardPanelId}
          role="tabpanel"
          aria-labelledby={leaderboardTabId}
          hidden={activeTab !== 'leaderboard'}
          className={cn(activeTab === 'leaderboard' ? 'block' : 'hidden')}
        >
          <LeaderboardPanel />
        </section>

        <section
          id={arsenalPanelId}
          role="tabpanel"
          aria-labelledby={arsenalTabId}
          hidden={activeTab !== 'arsenal'}
          className={cn(activeTab === 'arsenal' ? 'block' : 'hidden')}
        >
          <ArsenalMissionsPanel />
        </section>
      </div>
    </div>
  )
}
