'use client'

import { formatScore } from '@/lib/score'

export const X_PENDING_SHARE_KEY = 'based_doom_pending_x_share'

const PRODUCTION_GAME_URL = 'https://based-doom.vercel.app/#game'

export type PendingXShare = {
  score: number
  savedOnchain: boolean
  createdAt: number
}

export type XShareResponse = {
  url?: string
  error?: string
  detail?: string
  upstreamStatus?: number
}

export function getXShareErrorMessage(error?: string) {
  switch (error) {
    case 'x_reconnect_required':
      return 'X needs permission refresh. Reconnecting...'
    case 'x_oauth_not_configured':
      return 'X API is not configured yet.'
    case 'x_media_upload_failed':
      return 'X media upload failed. Check that media.write is enabled for the app.'
    case 'x_post_failed':
      return 'X post failed. Check that tweet.write is enabled for the app.'
    case 'x_rate_limited':
      return 'X rate limit hit. Try again later.'
    case 'invalid_share_text':
      return 'Share text is invalid.'
    case 'invalid_share_image':
      return 'Share image is invalid.'
    default:
      return 'Failed to post to X.'
  }
}

export function getGameShareUrl() {
  if (typeof window === 'undefined') {
    return PRODUCTION_GAME_URL
  }

  const { origin } = window.location

  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return PRODUCTION_GAME_URL
  }

  return `${origin}/#game`
}

export function getScoreShareText(score: number, savedOnchain: boolean) {
  const savedText = savedOnchain ? ' My best run is saved onchain on Base.' : ''

  return `I scored ${formatScore(score)} in Based DOOM Season 2.${savedText} Can you beat me?\n\n${getGameShareUrl()}`
}

export function savePendingXShare(score: number, savedOnchain: boolean) {
  localStorage.setItem(
    X_PENDING_SHARE_KEY,
    JSON.stringify({
      score,
      savedOnchain,
      createdAt: Date.now(),
    } satisfies PendingXShare),
  )
}

export function readPendingXShare() {
  const raw = localStorage.getItem(X_PENDING_SHARE_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PendingXShare>

    if (
      typeof parsed.score !== 'number' ||
      !Number.isFinite(parsed.score) ||
      typeof parsed.savedOnchain !== 'boolean' ||
      typeof parsed.createdAt !== 'number' ||
      Date.now() - parsed.createdAt > 10 * 60 * 1000
    ) {
      localStorage.removeItem(X_PENDING_SHARE_KEY)
      return null
    }

    return parsed as PendingXShare
  } catch {
    localStorage.removeItem(X_PENDING_SHARE_KEY)
    return null
  }
}

export function clearPendingXShare() {
  localStorage.removeItem(X_PENDING_SHARE_KEY)
}

export async function createScoreShareCard(score: number, savedOnchain: boolean) {
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

export async function postScoreToX(score: number, savedOnchain: boolean) {
  const card = await createScoreShareCard(score, savedOnchain)
  const formData = new FormData()
  formData.set('text', getScoreShareText(score, savedOnchain))
  formData.set('image', card)

  const response = await fetch('/api/x/share', {
    method: 'POST',
    body: formData,
  })
  const result = (await response.json().catch(() => ({}))) as XShareResponse

  return {
    response,
    result,
  }
}

function loadShareImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load ${src}`))
    image.src = src
  })
}
