import { AudioToggleButton } from '@/components/AudioToggleButton'
import { GameMusic } from '@/components/GameMusic'
import { GameShell } from '@/components/GameShell'
import { OnchainPanel } from '@/components/OnchainPanel'

export default function Home() {
  return (
    <main className="safe-shell min-h-screen bg-doom-grid">
      <GameMusic />
      <AudioToggleButton />
      <div className="mx-auto flex min-h-[calc(100vh-16px-var(--safe-top)-var(--safe-bottom))] w-full max-w-[1480px] items-center justify-center">
        <GameShell />
      </div>
      <OnchainPanel />
    </main>
  )
}
