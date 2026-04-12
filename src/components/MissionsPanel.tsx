'use client'

const MISSIONS = [
  {
    title: 'Submit an onchain score',
    description: 'Finish a run, open the Game Over screen, and send your result to the Base leaderboard through a wallet transaction.',
    status: 'Core quest',
  },
  {
    title: 'Claim a loadout item',
    description: 'Open inventory, claim a free onchain item, then equip it for the next survival run.',
    status: 'Core quest',
  },
  {
    title: 'Add your social quest links',
    description: 'This tab is ready for X, Telegram, Discord, or other community quests. Replace these cards with your real project links.',
    status: 'Editable slot',
  },
] as const

export function MissionsPanel() {
  return (
    <section className="panel w-full rounded-[28px] p-4 sm:p-5 lg:p-6">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="mb-5">
          <p className="panel-title">Missions</p>
          <h3 className="mt-1 text-2xl font-black text-stone-50">Quest Board</h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            This tab is for permanent extra tasks: social follow quests, wallet actions, community tasks, and future campaign objectives.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {MISSIONS.map((mission) => (
            <article
              key={mission.title}
              className="rounded-[24px] border border-white/10 bg-black/20 p-5 shadow-[0_16px_32px_rgba(0,0,0,0.18)]"
            >
              <span className="inline-flex rounded-full border border-orange-300/20 bg-orange-500/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-orange-100">
                {mission.status}
              </span>
              <h4 className="mt-4 text-lg font-black text-stone-50">{mission.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-300">{mission.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-[24px] border border-cyan-300/14 bg-cyan-500/8 p-5 text-sm text-cyan-50">
          Replace quest content in <code className="rounded bg-black/25 px-2 py-1">src/components/MissionsPanel.tsx</code> or move it into a dedicated config once the real social links and reward flow are ready.
        </div>
      </div>
    </section>
  )
}
