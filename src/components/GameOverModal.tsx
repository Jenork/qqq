'use client'

import { useEffect, useRef, useState } from 'react'
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

          {hasTxState ? (
            <div className="panel-state panel-state-muted text-sm text-slate-200">
              {txState}
            </div>
          ) : null}

        </div>
      </div>
    </div>
  )
}
