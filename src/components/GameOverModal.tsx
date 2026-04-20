'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { GAME_PROGRESS_ADDRESS, gameProgressAbi, HAS_GAME_PROGRESS_ADDRESS } from '@/config/contracts'
import { BASE_CHAIN_ID, BASE_CHAIN_NAME } from '@/config/web3'
import { useGameStore } from '@/hooks/useGameStore'
import { getDisplayErrorMessage } from '@/lib/missions'
import { bigintToNumber, isNewBestScore } from '@/lib/score'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

export function GameOverModal() {
  const queryClient = useQueryClient()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const status = useGameStore((state) => state.status)
  const pendingScore = useGameStore((state) => state.pendingScore)
  const restartRun = useGameStore((state) => state.restartRun)

  const { data: bestScore, refetch: refetchBest } = useReadContract({
    address: GAME_PROGRESS_ADDRESS,
    abi: gameProgressAbi,
    functionName: 'getBestScore',
    args: [address ?? ZERO_ADDRESS],
    chainId: BASE_CHAIN_ID,
    query: {
      enabled: Boolean(address) && HAS_GAME_PROGRESS_ADDRESS,
    },
  })

  const [submitError, setSubmitError] = useState<string | null>(null)
  const { data: hash, error, isPending, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (!isSuccess) {
      return
    }

    setSubmitError(null)
    void refetchBest()
    void queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
  }, [isSuccess, queryClient, refetchBest])

  useEffect(() => {
    if (error) {
      setSubmitError(getDisplayErrorMessage(error))
    }
  }, [error])

  const storedBestScore = bigintToNumber(bestScore)
  const canSubmitScore = isNewBestScore(pendingScore, storedBestScore)

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

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-slate-950/80 p-2 sm:items-center sm:p-4">
      <div className="inferno-frame w-full max-w-[440px] rounded-[1.8rem] p-5 sm:max-w-[760px] sm:rounded-[2rem] sm:p-6">
        <div className="grid gap-5 sm:grid-cols-[240px_1fr] sm:items-stretch">
          <div className="inferno-frame flex min-h-[220px] items-end justify-center rounded-[24px] bg-[radial-gradient(circle_at_50%_18%,rgba(255,102,34,0.24),transparent_44%),linear-gradient(180deg,rgba(22,8,8,0.96),rgba(10,6,8,0.98))] p-4">
            <img
              src="/sprites/player-marine-armored.png"
              alt=""
              className="h-full max-h-[190px] w-auto object-contain [image-rendering:pixelated] drop-shadow-[0_0_30px_rgba(255,102,34,0.18)]"
            />
          </div>

          <div>
            <div className="mt-2 text-center sm:text-left">
              <p className="micro-copy">Game Over Modal</p>
              <h2 className="doom-game-over text-center sm:text-left">Run Terminated</h2>
              <p className="micro-copy mt-2 text-[#ffbf7b]">You survived the inferno run</p>
            </div>

            <div className="mt-5 grid gap-2 rounded-[22px] border border-[#3f1714] bg-[linear-gradient(180deg,rgba(18,8,8,0.92),rgba(10,6,8,0.96))] px-4 py-4 text-sm text-stone-200">
              <p className="flex items-center justify-between gap-3"><span className="text-stone-400">Final score</span><span className="font-black text-[#ffbf6c]">{pendingScore}</span></p>
              <p className="flex items-center justify-between gap-3"><span className="text-stone-400">Best score</span><span className="font-black text-stone-50">{storedBestScore}</span></p>
            </div>
          </div>
        </div>

        {submitError ? (
          <div className="mt-4 rounded-3xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">
            {submitError}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3">
          {!HAS_GAME_PROGRESS_ADDRESS ? (
            <div className="rounded-3xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
              Deploy the contract and set `NEXT_PUBLIC_GAME_PROGRESS_ADDRESS` to enable score submission.
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

          <div className="grid gap-3 sm:grid-cols-[1.3fr_1fr]">
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

          <div className="rounded-2xl border border-[#3b1714] bg-black/22 px-4 py-3 text-sm text-slate-200">TX state: {txState}</div>

          {!canSubmitScore ? (
            <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-300">
              This run does not beat your stored best, so leaderboard state will remain unchanged.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
