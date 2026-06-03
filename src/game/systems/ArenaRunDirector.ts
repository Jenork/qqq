import { isBossWave, PLAYER_CONFIG, SCORE_CONFIG } from '@/config/game'
import { WaveDirector } from '@/game/systems/WaveDirector'

type RunStatePatch = {
  status: 'ready' | 'playing'
  hp: number
  maxHp: number
  armor: number
  maxArmor: number
  score: number
  wave: number
  kills: number
  grenadeCooldownRemaining: number
  abilityCooldownRemaining: number
  healCooldownRemaining: number
  shieldRemaining: number
  healCharges: number
  bossHp: number
  bossMaxHp: number
  pendingScore: number
  activeMessage: string | null
}

type RunRewardBonuses = {
  bonusHealCharges: number
  bonusArmorPoints: number
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

  reset(time: number, startImmediately: boolean, rewards?: Partial<RunRewardBonuses>): RunStatePatch {
    if (startImmediately) {
      this.waveDirector.restart(time)
    } else {
      this.waveDirector.stop()
    }

    const bonusHealCharges = rewards?.bonusHealCharges ?? 0
    const bonusArmorPoints = rewards?.bonusArmorPoints ?? 0

    return {
      status: startImmediately ? 'playing' : 'ready',
      hp: PLAYER_CONFIG.maxHp,
      maxHp: PLAYER_CONFIG.maxHp,
      armor: bonusArmorPoints,
      maxArmor: bonusArmorPoints,
      score: 0,
      wave: 1,
      kills: 0,
      grenadeCooldownRemaining: 0,
      abilityCooldownRemaining: 0,
      healCooldownRemaining: 0,
      shieldRemaining: 0,
      healCharges: PLAYER_CONFIG.healCharges + bonusHealCharges,
      bossHp: 0,
      bossMaxHp: 0,
      pendingScore: 0,
      activeMessage: startImmediately ? 'WAVE 1 INCOMING' : null,
    }
  }

  update(time: number, aliveEnemies: number, currentScore: number): RunDirectorUpdate {
    const event = this.waveDirector.update(time, aliveEnemies)

    if (event.spawnType) {
      return { spawnType: event.spawnType }
    }

    if (event.waveCleared) {
      const clearBonus = isBossWave(event.waveCleared)
        ? SCORE_CONFIG.waveClearBonus + Math.round(SCORE_CONFIG.bossKill * 0.25)
        : SCORE_CONFIG.waveClearBonus

      return {
        storePatch: {
          score: currentScore + clearBonus,
          activeMessage: `${isBossWave(event.waveCleared) ? 'BOSS' : 'WAVE'} ${event.waveCleared} CLEARED  +${clearBonus}`,
        },
      }
    }

    if (event.waveStarted) {
      return {
        storePatch: {
          wave: event.waveStarted,
          activeMessage: isBossWave(event.waveStarted)
            ? `BOSS WAVE ${event.waveStarted} INBOUND`
            : `WAVE ${event.waveStarted} INBOUND`,
        },
      }
    }

    return {}
  }
}
