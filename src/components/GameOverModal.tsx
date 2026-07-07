'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { GAME_PROGRESS_ADDRESS, gameProgressAbi, HAS_GAME_PROGRESS_ADDRESS } from '@/config/contracts'
import { BASE_CHAIN_ID, BASE_CHAIN_NAME } from '@/config/web3'
import { useGameStore } from '@/hooks/useGameStore'
import { useMobileViewport } from '@/hooks/useMobileViewport'
import { useSeasonPlayerStats } from '@/hooks/useSeasonPlayerStats'
import { cn } from '@/lib/cn'
import { getDisplayErrorMessage } from '@/lib/missions'
import { formatScore, isNewBestScore } from '@/lib/score'

const PRODUCTION_GAME_URL = 'https://based-doom.vercel.app/#game'

type XStatus = {
  configured: boolean
  connected: boolean
}

type XShareResponse = {
  url?: string
  error?: string
}

function getGameShareUrl() {
  if (typeof window === 'undefined') {
    return PRODUCTION_GAME_URL
  }

  const { origin } = window.location

  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return PRODUCTION_GAME_URL
  }

  return `${origin}/#game`
}

function getScoreShareText(score: number, savedOnchain: boolean) {
  const savedText = savedOnchain ? ' My best run is saved onchain on Base.' : ''

  return `I scored ${formatScore(score)} in Based DOOM Season 2.${savedText} Can you beat me?\n\n${getGameShareUrl()}`
}

function loadShareImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load ${src}`))
    image.src = src
  })
}

async function createScoreShareCard(score: number, savedOnchain: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 630

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas is unavailable.')
  }

  const background = context.createLinearGradient(0, 0, 1200, 630)
  background.addColorStop(0, '#030712')
  background.addColorStop(0.45, '#071322')
  background.addColorStop(1, '#1a0707')
  context.fillStyle = background
  context.fillRect(0, 0, 1200, 630)

  const glow = context.createRadialGradient(780, 250, 40, 780, 250, 420)
  glow.addColorStop(0, 'rgba(255, 83, 41, 0.38)')
  glow.addColorStop(0.5, 'rgba(56, 189, 248, 0.1)')
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  context.fillStyle = glow
  context.fillRect(0, 0, 1200, 630)

  context.strokeStyle = 'rgba(56, 189, 248, 0.18)'
  context.lineWidth = 2
  for (let x = 60; x < 1200; x += 96) {
    context.beginPath()
    context.moveTo(x, 70)
    context.lineTo(x, 570)
    context.stroke()
  }

  for (let y = 70; y < 630; y += 84) {
    context.beginPath()
    context.moveTo(60, y)
    context.lineTo(1140, y)
    context.stroke()
  }

  context.strokeStyle = 'rgba(125, 211, 252, 0.42)'
  context.lineWidth = 4
  context.strokeRect(42, 42, 1116, 546)

  context.fillStyle = 'rgba(3, 7, 18, 0.72)'
  context.fillRect(70, 72, 1060, 486)

  const marine = await loadShareImage('/sprites/player-marine-dead.png')
  context.drawImage(marine, 725, 130, 325, 325)

  context.fillStyle = '#9af3ff'
  context.font = '900 54px Arial, sans-serif'
  context.fillText('BASED DOOM', 116, 150)

  context.fillStyle = '#fbbf24'
  context.font = '900 28px Arial, sans-serif'
  context.fillText('SEASON 2 RUN RESULT', 120, 198)

  context.fillStyle = '#ffffff'
  context.font = '900 42px Arial, sans-serif'
  context.fillText('SCORE', 120, 300)

  context.fillStyle = '#ffcf66'
  context.font = '900 126px Arial, sans-serif'
  context.fillText(formatScore(score), 116, 424)

  context.fillStyle = savedOnchain ? '#a7f3d0' : '#e5e7eb'
  context.font = '800 28px Arial, sans-serif'
  context.fillText(savedOnchain ? 'SAVED ONCHAIN ON BASE' : 'READY TO SAVE ONCHAIN', 122, 484)

  context.fillStyle = '#dbeafe'
  context.font = '800 26px Arial, sans-serif'
  context.fillText('based-doom.vercel.app', 122, 532)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) {
        resolve(value)
        return
      }

      reject(new Error('Failed to create share card.'))
    }, 'image/png')
  })

  return new File([blob], `based-doom-score-${score}.png`, { type: 'image/png' })
}

export function GameOverModal() {
  const queryClient = useQueryClient()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const status = useGameStore((state) => state.status)
  const pendingScore = useGameStore((state) => state.pendingScore)
  const restartRun = useGameStore((state) => state.restartRun)
  const { showTouchControls, isMobileLandscape } = useMobileViewport()
  const seasonStats = useSeasonPlayerStats(address)
  const refetchSeasonStats = seasonStats.refetch

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [shareStatus, setShareStatus] = useState<string | null>(null)
  const [xStatus, setXStatus] = useState<XStatus | null>(null)
  const [isPostingToX, setIsPostingToX] = useState(false)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const { data: hash, error, isPending, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (!isSuccess) {
      return
    }

    setSubmitError(null)
    const refreshSubmittedScore = async () => {
      const refreshes = [fetch('/api/season/leaderboard?refresh=1', { cache: 'no-store' })]

      if (address) {
        const searchParams = new URLSearchParams({ address, refresh: '1' })
        refreshes.push(fetch(`/api/season/player?${searchParams.toString()}`, { cache: 'no-store' }))
      }

      await Promise.allSettled(refreshes)
      await Promise.allSettled([
        refetchSeasonStats(),
        queryClient.invalidateQueries({ queryKey: ['season-player-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] }),
        queryClient.refetchQueries({ queryKey: ['season-player-stats'], type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['leaderboard'], type: 'active' }),
      ])
    }

    void refreshSubmittedScore()
  }, [address, isSuccess, queryClient, refetchSeasonStats])

  useEffect(() => {
    if (error) {
      setSubmitError(getDisplayErrorMessage(error))
    }
  }, [error])

  const storedBestScore = seasonStats.data?.bestScore ?? 0
  const canSubmitScore = isNewBestScore(pendingScore, storedBestScore)

  const refreshXStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/x/status', { cache: 'no-store' })

      if (!response.ok) {
        setXStatus({ configured: false, connected: false })
        return
      }

      setXStatus((await response.json()) as XStatus)
    } catch {
      setXStatus({ configured: false, connected: false })
    }
  }, [])

  const handleShareScore = useCallback(async () => {
    setShareStatus(null)

    if (xStatus && !xStatus.configured) {
      setShareStatus('X API is not configured yet.')
      return
    }

    if (xStatus && !xStatus.connected) {
      window.open('/api/x/connect', '_blank', 'noopener,noreferrer')
      setShareStatus('Connect X in the opened tab, then return and press Post to X.')
      return
    }

    setIsPostingToX(true)
    setShareStatus('Posting to X...')

    try {
      const card = await createScoreShareCard(pendingScore, isSuccess)
      const formData = new FormData()
      formData.set('text', getScoreShareText(pendingScore, isSuccess))
      formData.set('image', card)

      const response = await fetch('/api/x/share', {
        method: 'POST',
        body: formData,
      })
      const result = (await response.json().catch(() => ({}))) as XShareResponse

      if (response.status === 401) {
        setXStatus((current) => ({ configured: current?.configured ?? true, connected: false }))
        window.open('/api/x/connect', '_blank', 'noopener,noreferrer')
        setShareStatus('Connect X in the opened tab, then return and press Post to X.')
        return
      }

      if (!response.ok) {
        setShareStatus(result.error === 'x_oauth_not_configured' ? 'X API is not configured yet.' : 'Failed to post to X.')
        return
      }

      setShareStatus('Posted to X.')

      if (result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer')
      }
    } catch {
      setShareStatus('Failed to post to X.')
    } finally {
      setIsPostingToX(false)
      void refreshXStatus()
    }
  }, [isSuccess, pendingScore, refreshXStatus, xStatus])

  useEffect(() => {
    if (status !== 'gameover') {
      return
    }

    void refreshXStatus()
  }, [refreshXStatus, status])

  useEffect(() => {
    if (status !== 'gameover') {
      return
    }

    const handleFocus = () => {
      void refreshXStatus()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refreshXStatus, status])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const url = new URL(window.location.href)
    const xResult = url.searchParams.get('x')

    if (!xResult) {
      return
    }

    if (xResult === 'connected') {
      setShareStatus('X connected. Press Share on X to post your run.')
      void refreshXStatus()
    } else if (xResult === 'error') {
      setShareStatus('X connection failed. Try again.')
    }

    url.searchParams.delete('x')
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }, [refreshXStatus])

  useEffect(() => {
    if (status !== 'gameover') {
      return
    }

    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    )

    focusable[0]?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || focusable.length === 0) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    dialog.addEventListener('keydown', handleKeyDown)

    return () => dialog.removeEventListener('keydown', handleKeyDown)
  }, [status, canSubmitScore])

  if (status !== 'gameover') {
    return null
  }

  const txState = isPending
    ? 'Confirm in wallet'
    : isConfirming
    ? 'Confirming'
    : isSuccess
    ? 'Success'
    : submitError
    ? 'Error'
    : 'Idle'
  const hasTxState = txState !== 'Idle'

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-slate-950/80 p-2 sm:items-center sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-over-title"
        aria-describedby="game-over-summary"
        className={cn(
          'inferno-frame game-over-sheet w-full rounded-[1.8rem] p-5 sm:max-w-[760px] sm:rounded-[2rem] sm:p-6',
          showTouchControls
            ? isMobileLandscape
              ? 'max-w-[640px] max-h-[90svh] overflow-y-auto p-4'
              : 'max-h-[92svh] overflow-y-auto rounded-[1.6rem] p-4'
            : 'max-w-[440px]',
        )}
      >
        <div className={cn('grid gap-5', showTouchControls ? 'grid-cols-1' : 'sm:grid-cols-[240px_1fr] sm:items-stretch')}>
          <div className={cn('inferno-frame flex items-end justify-center rounded-[24px] bg-[radial-gradient(circle_at_50%_18%,rgba(255,102,34,0.24),transparent_44%),linear-gradient(180deg,rgba(22,8,8,0.96),rgba(10,6,8,0.98))] p-4', showTouchControls ? 'min-h-[132px]' : 'min-h-[220px]')}>
            <Image
              src="/sprites/player-marine-dead.png"
              alt=""
              width={512}
              height={512}
              className={cn(
                'h-full w-auto object-contain [image-rendering:pixelated] drop-shadow-[0_0_30px_rgba(255,102,34,0.18)]',
                showTouchControls ? 'max-h-[108px]' : 'max-h-[190px]',
              )}
            />
          </div>

          <div>
            <div className={cn('mt-2', showTouchControls ? 'text-center' : 'text-center sm:text-left')}>
              <h2 id="game-over-title" className="doom-game-over text-center sm:text-left">GAME OVER</h2>
              <div id="game-over-summary" className={cn('mt-3 flex flex-wrap items-center gap-2', showTouchControls ? 'justify-center' : 'justify-center sm:justify-start')}>
                <span className="inferno-chip rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#ffbf7b]">
                  Final {formatScore(pendingScore)}
                </span>
                <span className="inferno-chip rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-stone-100">
                  Best {formatScore(storedBestScore)}
                </span>
                {canSubmitScore ? (
                  <span className="rounded-full border border-[#4de06c]/35 bg-[#16301a] px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#b5ffb7]">
                    New Best
                  </span>
                ) : null}
                {isSuccess ? (
                  <span className="rounded-full border border-[#4de06c]/35 bg-[#16301a] px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#b5ffb7]">
                    Saved
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {submitError ? (
          <div className="panel-state panel-state-error mt-4 text-sm text-rose-100">
            {submitError}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3">
          {!HAS_GAME_PROGRESS_ADDRESS ? (
            <div className="panel-state panel-state-warning text-sm text-amber-100">
              Score contract not configured.
            </div>
          ) : null}

          {isConnected && chainId !== BASE_CHAIN_ID ? (
            <button
              type="button"
              className="action-button rounded-2xl px-4 py-3 text-sm font-bold uppercase tracking-[0.14em]"
              onClick={() => switchChain({ chainId: BASE_CHAIN_ID })}
            >
              {isSwitching ? 'Switching...' : `Switch to ${BASE_CHAIN_NAME}`}
            </button>
          ) : null}

          <div className={cn('grid gap-3', showTouchControls ? 'grid-cols-1' : 'sm:grid-cols-[1.3fr_1fr]')}>
            <button
              type="button"
              className="action-button rounded-2xl px-4 py-4 text-sm font-bold uppercase tracking-[0.14em]"
              disabled={!HAS_GAME_PROGRESS_ADDRESS || !isConnected || isPending || isConfirming || !canSubmitScore}
              onClick={() => {
                if (!isConnected) {
                  setSubmitError('Connect a wallet before submitting score onchain.')
                  return
                }

                if (chainId !== BASE_CHAIN_ID) {
                  setSubmitError(`Switch to ${BASE_CHAIN_NAME} before submitting.`)
                  return
                }

                if (!HAS_GAME_PROGRESS_ADDRESS) {
                  setSubmitError('GameProgress contract address is not configured.')
                  return
                }

                if (!canSubmitScore) {
                  setSubmitError('Only a higher score can update your onchain best.')
                  return
                }

                setSubmitError(null)
                writeContract({
                  address: GAME_PROGRESS_ADDRESS,
                  abi: gameProgressAbi,
                  functionName: 'submitScore',
                  args: [BigInt(pendingScore)],
                })
              }}
            >
              {isSuccess ? 'Score Saved Onchain' : canSubmitScore ? 'Submit Score Onchain' : 'Score Not Higher'}
            </button>

            <button
              type="button"
              className="action-button rounded-2xl px-4 py-4 text-sm font-bold uppercase tracking-[0.14em]"
              onClick={() => restartRun()}
            >
              Restart Run
            </button>
          </div>

          <button
            type="button"
            className="action-button rounded-2xl px-4 py-4 text-sm font-bold uppercase tracking-[0.14em]"
            disabled={isPostingToX}
            onClick={() => void handleShareScore()}
          >
            {isPostingToX ? 'Posting to X...' : xStatus?.connected ? 'Post to X' : 'Connect X to Share'}
          </button>

          {hasTxState ? (
            <div className="panel-state panel-state-muted text-sm text-slate-200">
              {txState}
            </div>
          ) : null}

          {shareStatus ? (
            <div className="panel-state panel-state-muted text-sm text-slate-200">
              {shareStatus}
            </div>
          ) : null}

        </div>
      </div>
    </div>
  )
}
