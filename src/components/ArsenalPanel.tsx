'use client'

import type { ReactNode } from 'react'

export function ArsenalPanel({ children }: { children?: ReactNode }) {
  return (
    <section className="panel inferno-subtle-grid w-full rounded-[30px] p-4 sm:p-5 lg:p-6">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="dashboard-header dashboard-header-center mb-6">
          <div className="dashboard-heading arsenal-hero">
            <p className="panel-title text-[#ffb78a]">Arsenal - Missions</p>
            <h3 className="arsenal-hero-title">Arsenal</h3>
            <p className="arsenal-hero-copy">Complete missions. Get rewards. Dominate.</p>
          </div>
        </div>

        {children}
      </div>
    </section>
  )
}
