'use client'

import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/hooks/useGameStore'

const MENU_TRACK = '/audio/menu-theme.mp3'
const GAMEPLAY_TRACK = '/audio/gameplay-theme.mp3'

export function GameMusic() {
  const status = useGameStore((state) => state.status)
  const audioMuted = useGameStore((state) => state.audioMuted)
  const setAudioMuted = useGameStore((state) => state.setAudioMuted)
  const menuAudioRef = useRef<HTMLAudioElement | null>(null)
  const gameplayAudioRef = useRef<HTMLAudioElement | null>(null)
  const [audioUnlocked, setAudioUnlocked] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const savedPreference = window.localStorage.getItem('baseup-audio-muted')

    if (savedPreference === '1') {
      setAudioMuted(true)
    }
  }, [setAudioMuted])

  useEffect(() => {
    const menuAudio = new Audio(MENU_TRACK)
    const gameplayAudio = new Audio(GAMEPLAY_TRACK)

    menuAudio.loop = true
    gameplayAudio.loop = true
    menuAudio.preload = 'auto'
    gameplayAudio.preload = 'auto'
    menuAudio.volume = 0.4
    gameplayAudio.volume = 0.28

    menuAudioRef.current = menuAudio
    gameplayAudioRef.current = gameplayAudio

    return () => {
      menuAudio.pause()
      gameplayAudio.pause()
      menuAudioRef.current = null
      gameplayAudioRef.current = null
    }
  }, [])

  useEffect(() => {
    const unlockAudio = () => setAudioUnlocked(true)

    window.addEventListener('pointerdown', unlockAudio, { once: true })
    window.addEventListener('keydown', unlockAudio, { once: true })

    return () => {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem('baseup-audio-muted', audioMuted ? '1' : '0')
  }, [audioMuted])

  useEffect(() => {
    const menuAudio = menuAudioRef.current
    const gameplayAudio = gameplayAudioRef.current

    if (!menuAudio || !gameplayAudio) {
      return
    }

    const syncPlayback = async () => {
      if (audioMuted || !audioUnlocked) {
        menuAudio.pause()
        gameplayAudio.pause()
        return
      }

      const isGameplay = status === 'playing'
      const activeTrack = isGameplay ? gameplayAudio : menuAudio
      const idleTrack = isGameplay ? menuAudio : gameplayAudio

      idleTrack.pause()
      idleTrack.currentTime = 0

      if (document.hidden) {
        activeTrack.pause()
        return
      }

      if (activeTrack.paused) {
        try {
          await activeTrack.play()
        } catch {
          return
        }
      }
    }

    void syncPlayback()
  }, [audioMuted, audioUnlocked, status])

  useEffect(() => {
    const handleVisibility = () => {
      const menuAudio = menuAudioRef.current
      const gameplayAudio = gameplayAudioRef.current

      if (!menuAudio || !gameplayAudio) {
        return
      }

      if (document.hidden || audioMuted || !audioUnlocked) {
        menuAudio.pause()
        gameplayAudio.pause()
        return
      }

      const activeTrack = status === 'playing' ? gameplayAudio : menuAudio

      void activeTrack.play().catch(() => undefined)
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [audioMuted, audioUnlocked, status])

  return null
}
