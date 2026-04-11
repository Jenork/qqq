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
import { baseSepolia } from 'wagmi/chains'
import { GAME_PROGRESS_ADDRESS, gameProgressAbi, HAS_GAME_PROGRESS_ADDRESS } from '@/config/contracts'
import { useGameStore } from '@/hooks/useGameStore'
import { bigintToNumber } from '@/lib/score'

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
    chainId: baseSepolia.id,
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
      setSubmitError(error.message)
    }
  }, [error])

  const storedBestScore = bigintToNumber(bestScore)

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
      <div className="panel w-full max-w-[440px] rounded-[1.5rem] p-4 sm:max-w-lg sm:rounded-[2rem] sm:p-5">
        <div className="mt-2">
          <h2 className="doom-game-over text-center">Game Over</h2>
        </div>
        <p className="mt-3 text-sm text-slate-300">
          Final score: <span className="font-black text-amber-200">{pendingScore}</span>
        </p>
        <p className="mt-1 text-sm text-slate-300">
          Stored best: <span className="font-black">{storedBestScore}</span>
        </p>

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

          {isConnected && chainId !== baseSepolia.id ? (
            <button
              type="button"
              className="action-button rounded-2xl px-4 py-3 text-sm font-bold"
              onClick={() => switchChain({ chainId: baseSepolia.id })}
            >
              {isSwitching ? 'Switching...' : 'Switch to Base Sepolia'}
            </button>
          ) : null}

          <button
            type="button"
            className="action-button rounded-2xl px-4 py-4 text-sm font-bold"
            disabled={!HAS_GAME_PROGRESS_ADDRESS || !isConnected || isPending || isConfirming}
            onClick={() => {
              if (!isConnected) {
                setSubmitError('Connect a wallet before submitting score onchain.')
                return
              }

              if (chainId !== baseSepolia.id) {
                setSubmitError('Switch to Base Sepolia before submitting.')
                return
              }

              if (!HAS_GAME_PROGRESS_ADDRESS) {
                setSubmitError('GameProgress contract address is not configured.')
                return
              }

              setSubmitError(null)
              writeContract({
                address: GAME_PROGRESS_ADDRESS,
                abi: gameProgressAbi,
                functionName: 'submitScore',
                args: [BigInt(pendingScore)],
                chainId: baseSepolia.id,
              })
            }}
          >
            Submit Score Onchain
          </button>

          <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-200">TX state: {txState}</div>

          <button
            type="button"
            className="action-button rounded-2xl px-4 py-4 text-sm font-bold"
            onClick={() => restartRun()}
          >
            Restart Run
          </button>
        </div>
      </div>
    </div>
  )
}
