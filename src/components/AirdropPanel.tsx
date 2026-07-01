'use client'

const rewardRows = [
  ['1st', '$35'],
  ['2nd', '$25'],
  ['3rd', '$20'],
  ['4th', '$17'],
  ['5th', '$15'],
  ['6th', '$12'],
  ['7th', '$10'],
  ['8th', '$8'],
  ['9th-12th', '$6 each'],
  ['13th-20th', '$4 each'],
] as const

const qualifySteps = [
  'Reach the leaderboard with your best score',
  'Complete daily check-ins',
  'Finish available missions',
] as const

export function AirdropPanel() {
  return (
    <section className="panel inferno-subtle-grid w-full rounded-[26px] p-4 sm:p-5 lg:p-6">
      <div className="mx-auto grid w-full max-w-[1100px] gap-5">
        <div className="dashboard-header">
          <div className="dashboard-heading">
            <p className="panel-title text-[#ffb78a]">Airdrop</p>
            <h3 className="monitor-title mt-1">Season 2 Airdrop</h3>
          </div>

          <div className="inferno-chip rounded-full px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-cyan-50">
            $200 Prize Pool
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="inferno-frame overflow-hidden rounded-[26px] p-5">
            <div className="relative z-[1]">
              <p className="panel-title text-cyan-100">Qualification</p>
              <h4 className="mt-2 text-2xl font-black uppercase tracking-[0.08em] text-cyan-50 sm:text-3xl">
                Earn Your Drop
              </h4>

              <div className="mt-5 grid gap-3">
                {qualifySteps.map((step, index) => (
                  <div
                    key={step}
                    className="rounded-[18px] border border-cyan-300/14 bg-cyan-300/6 px-4 py-3 shadow-[inset_0_0_0_1px_rgba(144,237,255,0.04)]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-200/25 bg-black/30 text-xs font-black text-cyan-100">
                        {index + 1}
                      </span>
                      <p className="text-sm font-bold leading-relaxed text-slate-100">{step}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[20px] border border-amber-300/18 bg-amber-300/8 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-200">
                  Season 2 NFT
                </p>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-amber-50">
                  Top 100 players will receive an exclusive Season 2 NFT. Collect all seasonal NFTs
                  to unlock future rewards and special events.
                </p>
              </div>
            </div>
          </div>

          <div className="table-shell rounded-[26px] p-3">
            <div className="grid grid-cols-[1fr_auto] rounded-[18px] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(5,18,34,0.96),rgba(2,8,18,0.98))] px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100">
              <span>Season 2 Rewards</span>
              <span>Prize</span>
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {rewardRows.map(([rank, prize], index) => (
                <div
                  key={rank}
                  className="grid grid-cols-[1fr_auto] items-center rounded-[18px] border border-cyan-300/12 bg-[linear-gradient(180deg,rgba(8,24,42,0.74),rgba(3,10,20,0.86))] px-4 py-3"
                >
                  <span className="flex items-center gap-2 text-sm font-black text-slate-100">
                    <span className="rank-medal h-8 w-8 text-[11px]">{index + 1}</span>
                    {rank}
                  </span>
                  <span className="text-sm font-black text-amber-200">{prize}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel-state panel-state-warning rounded-[22px] p-4 text-sm leading-relaxed text-amber-50">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-200">Fair Play</p>
          <p className="mt-2 font-semibold">
            Only legitimate players will qualify for rewards. Wallets that violate the rules, use
            bots, multi-accounting, or other unfair methods may be removed from the leaderboard and
            become ineligible for the airdrop.
          </p>
        </div>
      </div>
    </section>
  )
}
