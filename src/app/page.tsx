import { GameMusic } from '@/components/GameMusic'
import { OnchainPanel } from '@/components/OnchainPanel'
import { SiteTabs } from '@/components/SiteTabs'

export default function Home() {
  return (
    <main className="safe-shell min-h-screen bg-doom-grid">
      <GameMusic />
      <SiteTabs />
      <OnchainPanel />
    </main>
  )
}
