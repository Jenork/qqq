'use client'

import type { ReactNode } from 'react'

export function ArsenalPanel({ children }: { children?: ReactNode }) {
  return (
    <section className="panel inferno-subtle-grid w-full rounded-[30px] p-4 sm:p-5 lg:p-6">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="mb-5">
          <p className="panel-title text-[#ffb78a]">Arsenal</p>
          <h3 className="inferno-heading mt-1 text-[2.1rem] font-black">Mission Actions</h3>
        </div>

        {children}
      </div>
    </section>
  )
}
