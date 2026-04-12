import { getWaveTemplate, type EnemyType, type WaveTemplate } from '@/config/game'

type WaveUpdate = {
  spawnType?: EnemyType
  waveStarted?: number
  waveCleared?: number
}

function weightedPick(weights: WaveTemplate['weights']) {
  const total = weights.reduce((sum, entry) => sum + entry.weight, 0)
  const roll = Math.random() * total
  let cursor = 0

  for (const entry of weights) {
    cursor += entry.weight
    if (roll <= cursor) {
      return entry.type
    }
  }

  return weights[weights.length - 1]?.type ?? 'melee'
}

export class WaveDirector {
  wave = 1
  template = getWaveTemplate(1)
  active = false
  spawnsRemaining = 0
  nextSpawnAt = 0
  awaitingAdvance = false
  advanceAt = 0

  start(time: number) {
    this.active = true
    return this.prepareWave(1, time)
  }

  restart(time: number) {
    this.stop()
    return this.start(time)
  }

  stop() {
    this.active = false
    this.spawnsRemaining = 0
    this.nextSpawnAt = 0
    this.awaitingAdvance = false
    this.advanceAt = 0
  }

  prepareWave(wave: number, time: number): WaveUpdate {
    this.wave = wave
    this.template = getWaveTemplate(wave)
    this.spawnsRemaining = this.template.totalSpawns
    this.nextSpawnAt = time + this.template.pauseBeforeMs
    this.awaitingAdvance = false
    this.advanceAt = 0

    return {
      waveStarted: wave,
    }
  }

  update(time: number, aliveEnemies: number): WaveUpdate {
    if (!this.active) {
      return {}
    }

    if (this.spawnsRemaining > 0 && time >= this.nextSpawnAt) {
      this.spawnsRemaining -= 1
      this.nextSpawnAt = time + this.template.spawnDelayMs
      return {
        spawnType: weightedPick(this.template.weights),
      }
    }

    if (this.spawnsRemaining === 0 && aliveEnemies === 0 && !this.awaitingAdvance) {
      this.awaitingAdvance = true
      this.advanceAt = time + 1800
      return {
        waveCleared: this.wave,
      }
    }

    if (this.awaitingAdvance && time >= this.advanceAt) {
      return this.prepareWave(this.wave + 1, time)
    }

    return {}
  }
}
