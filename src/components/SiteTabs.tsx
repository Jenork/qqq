'use client'

import { useEffect, useMemo, useState } from 'react'
import { AudioToggleButton } from '@/components/AudioToggleButton'
import { GameShell } from '@/components/GameShell'
import { LeaderboardPanel } from '@/components/LeaderboardPanel'
import { MissionsPanel } from '@/components/MissionsPanel'
import { cn } from '@/lib/cn'
import { useGameStore } from '@/hooks/useGameStore'

type SiteTab = 'game' | 'leaderboard' | 'missions'

const TAB_ORDER: Array<{ id: SiteTab; label: string; description: string }> = [
  { id: 'game', label: 'Game', description: 'Play the survival run' },
  { id: 'leaderboard', label: 'Leaderboard', description: 'View all saved onchain scores' },
  { id: 'missions', label: 'Missions', description: 'Extra tasks and community quests' },
]

function readHashTab(): SiteTab {
  if (typeof window === 'undefined') {
    return 'game'
  }

  const raw = window.location.hash.replace('#', '')
  if (raw === 'leaderboard' || raw === 'missions' || raw === 'game') {
    return raw
  }

  return 'game'
}

export function SiteTabs() {
  const [activeTab, setActiveTab] = useState<SiteTab>('game')
  const status = useGameStore((state) => state.status)
  const pauseRun = useGameStore((state) => state.pauseRun)
  const toggleLeaderboard = useGameStore((state) => state.toggleLeaderboard)

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

    toggleLeaderboard(false)

    if (status === 'playing') {
      pauseRun()
    }
  }, [activeTab, pauseRun, status, toggleLeaderboard])

  const activeLabel = useMemo(() => TAB_ORDER.find((tab) => tab.id === activeTab)?.description ?? '', [activeTab])

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-4">
      <header className="panel rounded-[28px] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="panel-title">BaseUp Survival</p>
            <h1 className="mt-1 text-2xl font-black text-stone-50 sm:text-3xl">Inferno Command Console</h1>
            <p className="mt-2 text-sm text-slate-300">{activeLabel}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
            <nav className="grid grid-cols-3 gap-2 rounded-[22px] border border-white/8 bg-black/20 p-1.5">
              {TAB_ORDER.map((tab) => {
                const active = tab.id === activeTab

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      window.location.hash = tab.id
                      setActiveTab(tab.id)
                    }}
                    className={cn(
                      'rounded-[18px] px-4 py-3 text-sm font-black uppercase tracking-[0.14em] transition-colors',
                      active
                        ? 'bg-orange-500/18 text-orange-100 shadow-[inset_0_0_0_1px_rgba(255,178,123,0.24)]'
                        : 'bg-transparent text-stone-300 hover:bg-white/5 hover:text-stone-100',
                    )}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </nav>

            <AudioToggleButton className="self-start sm:self-auto" />
          </div>
        </div>
      </header>

      <div className="relative">
        <section
          aria-hidden={activeTab !== 'game'}
          className={cn(
            activeTab === 'game' ? 'relative z-10' : 'pointer-events-none absolute inset-0 opacity-0',
          )}
        >
          <GameShell />
        </section>

        <section className={cn(activeTab === 'leaderboard' ? 'block' : 'hidden')}>
          <LeaderboardPanel />
        </section>

        <section className={cn(activeTab === 'missions' ? 'block' : 'hidden')}>
          <MissionsPanel />
        </section>
      </div>
    </div>
  )
}
