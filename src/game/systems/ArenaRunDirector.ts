import { PLAYER_CONFIG, SCORE_CONFIG } from '@/config/game'
import { WaveDirector } from '@/game/systems/WaveDirector'

type RunStatePatch = {
  status: 'ready' | 'playing'
  hp: number
  maxHp: number
  score: number
  wave: number
  kills: number
  grenadeCooldownRemaining: number
  abilityCooldownRemaining: number
  healCooldownRemaining: number
  shieldRemaining: number
  healCharges: number
  pendingScore: number
  activeMessage: string | null
}

type RunDirectorUpdate = {
  spawnType?: ReturnType<WaveDirector['update']>['spawnType']
  storePatch?: Partial<RunStatePatch>
}

export class ArenaRunDirector {
  private waveDirector = new WaveDirector()

  get wave() {
    return this.waveDirector.wave
  }

  get template() {
    return this.waveDirector.template
  }

  reset(time: number, startImmediately: boolean): RunStatePatch {
    if (startImmediately) {
      this.waveDirector.restart(time)
    } else {
      this.waveDirector.stop()
    }

    return {
      status: startImmediately ? 'playing' : 'ready',
      hp: PLAYER_CONFIG.maxHp,
      maxHp: PLAYER_CONFIG.maxHp,
      score: 0,
      wave: 1,
      kills: 0,
      grenadeCooldownRemaining: 0,
      abilityCooldownRemaining: 0,
      healCooldownRemaining: 0,
      shieldRemaining: 0,
      healCharges: PLAYER_CONFIG.healCharges,
      pendingScore: 0,
      activeMessage: startImmediately ? 'Wave 1 incoming.' : null,
    }
  }

  update(time: number, aliveEnemies: number, currentScore: number): RunDirectorUpdate {
    const event = this.waveDirector.update(time, aliveEnemies)

    if (event.spawnType) {
      return { spawnType: event.spawnType }
    }

    if (event.waveCleared) {
      return {
        storePatch: {
          score: currentScore + SCORE_CONFIG.waveClearBonus,
          activeMessage: `Wave ${event.waveCleared} cleared.`,
        },
      }
    }

    if (event.waveStarted) {
      return {
        storePatch: {
          wave: event.waveStarted,
          activeMessage: `Wave ${event.waveStarted} inbound.`,
        },
      }
    }

    return {}
  }
}

