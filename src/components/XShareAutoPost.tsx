'use client'

import { useEffect, useRef, useState } from 'react'
import {
  clearPendingXShare,
  postScoreToX,
  readPendingXShare,
} from '@/lib/xShareClient'

export function XShareAutoPost() {
  const hasAttemptedRef = useRef(false)
  const [status, setStatus] = useState<string | null>(null)
  const [postUrl, setPostUrl] = useState<string | null>(null)

  useEffect(() => {
    if (hasAttemptedRef.current) {
      return
    }

    const url = new URL(window.location.href)
    const xResult = url.searchParams.get('x')

    if (!xResult) {
      return
    }

    url.searchParams.delete('x')
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)

    if (xResult !== 'connected') {
      setStatus('X connection failed. Try again from Game Over.')
      return
    }

    const pendingShare = readPendingXShare()

    if (!pendingShare) {
      setStatus('X connected. Play a run and share from Game Over.')
      return
    }

    hasAttemptedRef.current = true
    setStatus('Posting score to X...')

    void postScoreToX(pendingShare.score, pendingShare.savedOnchain)
      .then(({ response, result }) => {
        if (!response.ok) {
          setStatus('X connected, but posting failed. Try Share again from Game Over.')
          return
        }

        clearPendingXShare()
        setPostUrl(result.url ?? null)
        setStatus('Posted to X.')
      })
      .catch(() => {
        setStatus('X connected, but posting failed. Try Share again from Game Over.')
      })
  }, [])

  if (!status) {
    return null
  }

  return (
    <div className="fixed left-1/2 top-[calc(14px+var(--safe-top))] z-[80] w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl border border-sky-300/25 bg-slate-950/92 px-4 py-3 text-center text-sm font-bold text-sky-100 shadow-[0_18px_48px_rgba(0,0,0,0.36)] backdrop-blur">
      <p>{status}</p>
      {postUrl ? (
        <a href={postUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs uppercase tracking-[0.16em] text-amber-200">
          Open post
        </a>
      ) : null}
    </div>
  )
}
