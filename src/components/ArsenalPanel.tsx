'use client'

export function ArsenalPanel() {
  return (
    <section className="panel w-full rounded-[28px] p-4 sm:p-5 lg:p-6">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="mb-5">
          <p className="panel-title">Arsenal</p>
          <h3 className="mt-1 text-2xl font-black text-stone-50">Loadout Bay</h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            This tab is reserved for the upcoming loadout and equipment screen.
          </p>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 shadow-[0_16px_32px_rgba(0,0,0,0.18)]">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-orange-200">Coming Next</p>
          <h4 className="mt-3 text-lg font-black text-stone-50">Arsenal UI placeholder</h4>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            Weapon selection is currently handled by hotkeys in-game:
            {' '}
            <span className="font-black text-stone-100">1</span>
            {' / '}
            <span className="font-black text-stone-100">2</span>
            {' / '}
            <span className="font-black text-stone-100">3</span>
            . A full loadout screen will replace this placeholder later.
          </p>
        </div>
      </div>
    </section>
  )
}
