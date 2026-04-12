import * as Phaser from 'phaser'
import {
  ARENA_BOUNDS,
  ARENA_SIZE,
  ENEMY_CONFIG,
  PLAYER_CONFIG,
  SCORE_CONFIG,
  SPRITE_TUNING,
  WEAPON_TUNING,
  type EnemyType,
} from '@/config/game'
import { useGameStore } from '@/hooks/useGameStore'
import { Enemy } from '@/game/entities/Enemy'
import { Player } from '@/game/entities/Player'
import { Bullet } from '@/game/projectiles/Bullet'
import { Grenade } from '@/game/projectiles/Grenade'
import {
  buildEnemyProjectile,
  buildPlayerVolley,
  resolveHeavyEnemyStep,
  resolveHealAmount,
  resolveMeleeEnemyStep,
  resolveRangedEnemyStep,
  shouldApplyContactHit,
} from '@/game/systems/combatSystem'
import { WaveDirector } from '@/game/systems/WaveDirector'

export class ArenaScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private player!: Player
  private ground!: Phaser.GameObjects.Rectangle
  private enemies!: Phaser.Physics.Arcade.Group
  private playerBullets!: Phaser.Physics.Arcade.Group
  private enemyBullets!: Phaser.Physics.Arcade.Group
  private grenades!: Phaser.Physics.Arcade.Group
  private waveDirector = new WaveDirector()
  private ambientFlames: Phaser.GameObjects.Rectangle[] = []
  private playerBaseY = ARENA_BOUNDS.floorY + SPRITE_TUNING.player.floorOffset
  private running = false
  private paused = false
  private gameOver = false
  private jumpLatch = false
  private shootLatch = false
  private survivalTickAt = 0
  private nextContactHitAt = 0

  constructor() {
    super('arena')
  }

  create() {
    this.buildArena()
    this.buildActors()
    this.buildPhysics()
    this.buildInput()
    this.registerApi()
    this.resetRun(false)
  }

  private buildArena() {
    this.cameras.main.setBackgroundColor('#180502')
    this.cameras.main.setRoundPixels(true)
    this.physics.world.setBounds(0, 0, ARENA_SIZE.width, ARENA_SIZE.height)

    const background = this.add.image(ARENA_SIZE.width / 2, ARENA_SIZE.height / 2, 'arena-background')
    background.setDisplaySize(ARENA_SIZE.width * 1.08, ARENA_SIZE.height)
    background.setDepth(-10)
    background.setScrollFactor(0)

    const floor = this.add.rectangle(
      ARENA_SIZE.width / 2,
      ARENA_BOUNDS.floorY + 24,
      ARENA_SIZE.width,
      48,
      0x25110d,
    )
    this.physics.add.existing(floor, true)
    floor.setAlpha(0)
    this.ground = floor
  }

  private drawInfernoSky() {
    const sky = this.add.graphics()

    for (let y = 0; y < 300; y += 6) {
      const ratio = y / 300
      const rowColor = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0x240503),
        Phaser.Display.Color.ValueToColor(ratio > 0.6 ? 0xffb14e : 0xee5c0b),
        1,
        ratio,
      )

      for (let x = 0; x < ARENA_SIZE.width; x += 6) {
        const noise = Phaser.Math.Between(-18, 22)
        sky.fillStyle(
          Phaser.Display.Color.GetColor(
            Phaser.Math.Clamp(rowColor.r + noise, 10, 255),
            Phaser.Math.Clamp(rowColor.g + Math.floor(noise * 0.55), 3, 190),
            Phaser.Math.Clamp(rowColor.b + Math.floor(noise * 0.22), 0, 80),
          ),
          0.86,
        )
        sky.fillRect(x, y, 6, 6)
      }
    }

    for (let index = 0; index < 8; index += 1) {
      sky.fillStyle(0xffd06a, 0.12)
      sky.fillRect(
        Phaser.Math.Between(20, ARENA_SIZE.width - 60),
        Phaser.Math.Between(34, 180),
        Phaser.Math.Between(18, 36),
        Phaser.Math.Between(100, 180),
      )
    }
  }

  private drawHellCity() {
    const city = this.add.graphics()

    for (let index = 0; index < 16; index += 1) {
      const x = index * 64 + Phaser.Math.Between(-10, 10)
      const width = Phaser.Math.Between(24, 56)
      const height = Phaser.Math.Between(90, 220)
      city.fillStyle(0x120605, 1)
      city.fillRect(x, 300 - height, width, height)

      if (Phaser.Math.Between(0, 10) > 5) {
        city.fillStyle(0xff9a2f, 0.35)
        city.fillRect(x + Phaser.Math.Between(4, 10), 300 - height + Phaser.Math.Between(12, 30), 6, 18)
      }
    }

    for (let x = 0; x < ARENA_SIZE.width; x += 84) {
      city.fillStyle(0xff6d1a, 0.28)
      city.fillTriangle(
        x + 10,
        ARENA_BOUNDS.floorY - 20,
        x + Phaser.Math.Between(20, 38),
        ARENA_BOUNDS.floorY - Phaser.Math.Between(80, 140),
        x + 56,
        ARENA_BOUNDS.floorY - 18,
      )
    }
  }

  private drawCatwalk() {
    const floor = this.add.graphics()

    floor.fillStyle(0x67442c, 1)
    floor.fillPoints(
      [
        new Phaser.Geom.Point(0, 402),
        new Phaser.Geom.Point(ARENA_SIZE.width, 372),
        new Phaser.Geom.Point(ARENA_SIZE.width, ARENA_SIZE.height),
        new Phaser.Geom.Point(0, ARENA_SIZE.height),
      ],
      true,
    )

    floor.fillStyle(0x372019, 1)
    floor.fillPoints(
      [
        new Phaser.Geom.Point(0, 468),
        new Phaser.Geom.Point(ARENA_SIZE.width, 432),
        new Phaser.Geom.Point(ARENA_SIZE.width, ARENA_SIZE.height),
        new Phaser.Geom.Point(0, ARENA_SIZE.height),
      ],
      true,
    )

    for (let x = -40; x < ARENA_SIZE.width + 40; x += 54) {
      floor.fillStyle(0x886148, 1)
      floor.fillRect(x, 400 + Math.floor(x * 0.04), 28, 6)
      floor.fillStyle(0x341713, 0.7)
      floor.fillRect(x + 4, 430 + Math.floor(x * 0.02), 16, 4)
    }

    for (let x = 60; x < ARENA_SIZE.width; x += 96) {
      floor.fillStyle(0x741706, 0.55)
      floor.fillEllipse(x, Phaser.Math.Between(420, 500), Phaser.Math.Between(24, 52), Phaser.Math.Between(8, 16))
    }

    floor.fillStyle(0x24100f, 1)
    floor.fillRect(0, ARENA_BOUNDS.floorY + 18, ARENA_SIZE.width, 10)
  }

  private createAmbientFlames() {
    const flameAnchors = [
      { x: 140, y: 356 },
      { x: 248, y: 334 },
      { x: 604, y: 302 },
      { x: 774, y: 286 },
      { x: 882, y: 260 },
    ]

    this.ambientFlames = flameAnchors.map((anchor, index) => {
      const flame = this.add.rectangle(
        anchor.x,
        anchor.y,
        18 + index * 2,
        48 + index * 6,
        Phaser.Math.RND.pick([0xffc84f, 0xff7a22, 0xff5010]),
        0.42,
      )
      flame.setBlendMode(Phaser.BlendModes.ADD)
      return flame
    })
  }

  private buildActors() {
    this.player = new Player(this, ARENA_BOUNDS.playerSpawnX, this.playerBaseY)
    this.player.setScale(SPRITE_TUNING.player.scale)
    this.player.setDepth(3)

    this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: false })
    this.playerBullets = this.physics.add.group({
      classType: Bullet,
      maxSize: 40,
      runChildUpdate: false,
    })
    this.enemyBullets = this.physics.add.group({
      classType: Bullet,
      maxSize: 30,
      runChildUpdate: false,
    })
    this.grenades = this.physics.add.group({
      classType: Grenade,
      maxSize: 6,
      runChildUpdate: false,
    })
  }

  private buildPhysics() {
    this.physics.add.collider(this.player, this.ground)
    this.physics.add.collider(this.enemies, this.ground)
    this.physics.add.collider(this.grenades, this.ground)

    this.physics.add.overlap(this.playerBullets, this.enemies, (firstObj, secondObj) => {
      const bulletObj = this.playerBullets.contains(firstObj as Phaser.GameObjects.GameObject) ? firstObj : secondObj
      const enemyObj = bulletObj === firstObj ? secondObj : firstObj
      const bullet = bulletObj as Bullet & { damage?: number }
      const enemy = enemyObj as Enemy

      this.hitEnemy(enemy, bullet.damage ?? PLAYER_CONFIG.bulletDamage)
      this.recycleArcadeSprite(bulletObj as Phaser.Physics.Arcade.Image)
    })

    this.physics.add.overlap(this.enemyBullets, this.player, (firstObj, secondObj) => {
      const bulletObj = this.enemyBullets.contains(firstObj as Phaser.GameObjects.GameObject) ? firstObj : secondObj
      const bullet = bulletObj as Bullet

      this.damagePlayer(bullet.damage || PLAYER_CONFIG.damagePerHit, bullet.x)
      this.recycleArcadeSprite(bullet)
    })

    this.physics.add.overlap(this.enemies, this.player, (_enemyObj, playerObj) => {
      const enemy = _enemyObj as Enemy
      const player = playerObj as Player
      const time = this.time.now

      if (
        !shouldApplyContactHit({
          time,
          nextContactHitAt: this.nextContactHitAt,
          enemyAttackReadyAt: enemy.attackReadyAt,
          gameOver: this.gameOver,
        })
      ) {
        return
      }

      const pushDirection = enemy.x > player.x ? -1 : 1
      const contactDamage = PLAYER_CONFIG.damagePerHit

      enemy.attackReadyAt = time + PLAYER_CONFIG.contactDamageCooldownMs
      this.nextContactHitAt = time + PLAYER_CONFIG.contactDamageCooldownMs
      this.damagePlayer(contactDamage, enemy.x)
      player.setVelocityX(pushDirection * PLAYER_CONFIG.contactKnockback)
      enemy.setX(enemy.x - pushDirection * 16)
    })
  }

  private buildInput() {
    const keyboard = this.input.keyboard

    if (!keyboard) {
      throw new Error('Keyboard plugin is required for ArenaScene input setup.')
    }

    this.cursors = keyboard.createCursorKeys()
    this.keys = keyboard.addKeys({
      left: 'A',
      right: 'D',
      jump: 'W',
      jumpAlt: 'SPACE',
      pause: 'ESC',
      pauseAlt: 'P',
      grenade: 'Q',
      ability: 'E',
      heal: 'R',
    }) as Record<string, Phaser.Input.Keyboard.Key>
  }

  private registerApi() {
    useGameStore.getState().registerGameApi({
      startRun: () => {
        if (!this.running || this.gameOver) {
          this.resetRun(true)
        }
      },
      restartRun: () => this.resetRun(true),
      pauseRun: () => this.pauseRun(),
      resumeRun: () => this.resumeRun(),
    })
  }

  private resetRun(startImmediately: boolean) {
    this.clearGroups()
    this.running = startImmediately
    this.paused = false
    this.gameOver = false
    this.playerBaseY = ARENA_BOUNDS.floorY + SPRITE_TUNING.player.floorOffset
    this.nextContactHitAt = 0
    this.shootLatch = false
    this.player.resetState(ARENA_BOUNDS.playerSpawnX, this.playerBaseY)
    this.survivalTickAt = this.time.now + SCORE_CONFIG.survivalTickMs

    useGameStore.setState({
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
    })

    if (startImmediately) {
      this.waveDirector.restart(this.time.now)
    }
  }

  private clearGroups() {
    this.enemies.clear(true, true)
    this.playerBullets.clear(true, true)
    this.enemyBullets.clear(true, true)
    this.grenades.clear(true, true)
  }

  update(time: number) {
    if (!this.running || this.gameOver) {
      return
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.pause) || Phaser.Input.Keyboard.JustDown(this.keys.pauseAlt)) {
      if (this.paused) {
        this.resumeRun()
      } else {
        this.pauseRun()
      }
      return
    }

    if (this.paused) {
      return
    }

    this.updateAmbientAnimation(time)

    this.handleMovement()
    this.handleCombatInputs(time)
    this.updateEnemies(time)
    this.updateProjectiles(time)
    this.updateWaveDirector(time)
    this.updateSurvivalScore(time)
    this.syncHudCooldowns(time)
  }

  private pauseRun() {
    if (!this.running || this.gameOver || this.paused) {
      return
    }

    this.paused = true
    this.physics.world.pause()
    this.tweens.pauseAll()
    this.time.timeScale = 0
    useGameStore.setState({ status: 'paused', activeMessage: 'Run paused.' })
  }

  private resumeRun() {
    if (!this.running || this.gameOver || !this.paused) {
      return
    }

    this.paused = false
    this.jumpLatch = false
    this.shootLatch = false
    this.time.timeScale = 1
    this.physics.world.resume()
    this.tweens.resumeAll()
    useGameStore.setState({ status: 'playing', activeMessage: `Wave ${this.waveDirector.wave} active.` })
  }

  private syncHudCooldowns(time: number) {
    useGameStore.getState().setHudState({
      hp: this.player.hp,
      grenadeCooldownRemaining: Math.max(0, this.player.lastGrenadeAt + PLAYER_CONFIG.grenadeCooldownMs - time),
      abilityCooldownRemaining: Math.max(0, this.player.lastAbilityAt + PLAYER_CONFIG.abilityCooldownMs - time),
      healCooldownRemaining: Math.max(0, this.player.lastHealAt + PLAYER_CONFIG.healCooldownMs - time),
      shieldRemaining: Math.max(0, this.player.shieldUntil - time),
      healCharges: this.player.healCharges,
    })
  }

  private updateAmbientAnimation(time: number) {
    const bob = Math.sin(time / 180) * 0.45
    this.player.setScale(
      SPRITE_TUNING.player.scale + bob * SPRITE_TUNING.player.bobScaleX,
      SPRITE_TUNING.player.scale + bob * SPRITE_TUNING.player.bobScaleY,
    )
    this.player.refreshVisualState(time)

    this.ambientFlames.forEach((flame, index) => {
      const phase = time / (120 + index * 20)
      flame.setScale(1 + Math.sin(phase) * 0.18, 1 + Math.cos(phase * 1.4) * 0.22)
      flame.setAlpha(0.28 + (Math.sin(phase * 1.8) + 1) * 0.12)
    })
  }

  private handleMovement() {
    const controls = useGameStore.getState().mobileControls
    const moveLeft = this.keys.left.isDown || this.cursors.left.isDown || controls.left
    const moveRight = this.keys.right.isDown || this.cursors.right.isDown || controls.right

    if (moveLeft === moveRight) {
      this.player.setAccelerationX(0)
      this.player.setVelocityX(this.player.body?.velocity.x ?? 0)
    } else if (moveLeft) {
      this.player.facing = -1
      this.player.setFlipX(true)
      this.player.setVelocityX(-PLAYER_CONFIG.moveSpeed)
    } else {
      this.player.facing = 1
      this.player.setFlipX(false)
      this.player.setVelocityX(PLAYER_CONFIG.moveSpeed)
    }

    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.keys.jump) ||
      Phaser.Input.Keyboard.JustDown(this.keys.jumpAlt) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      controls.jump

    if (jumpPressed && !this.jumpLatch && this.player.body?.blocked.down) {
      this.player.setVelocityY(-PLAYER_CONFIG.jumpForce)
      this.jumpLatch = true
    }

    if (!controls.jump) {
      this.jumpLatch = false
    }
  }

  private handleCombatInputs(time: number) {
    const store = useGameStore.getState()
    const tuning = WEAPON_TUNING[store.equippedWeapon as keyof typeof WEAPON_TUNING]
    const triggerHeld = this.input.activePointer.leftButtonDown() || store.mobileControls.shoot
    const triggerJustPressed = triggerHeld && !this.shootLatch
    const shouldShoot =
      tuning.triggerMode === 'tap'
        ? triggerJustPressed
        : triggerHeld

    if (shouldShoot) {
      this.fireWeapon(time)
    }

    this.shootLatch = triggerHeld

    if (Phaser.Input.Keyboard.JustDown(this.keys.grenade)) {
      store.pulseAction('grenade')
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.ability)) {
      store.pulseAction('ability')
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.heal)) {
      store.pulseAction('heal')
    }

    if (store.consumeAction('grenade') > 0) {
      this.throwGrenade(time)
    }

    if (store.consumeAction('ability') > 0) {
      this.useAbility(time)
    }

    if (store.consumeAction('heal') > 0) {
      this.useHeal(time)
    }
  }

  private fireWeapon(time: number) {
    const store = useGameStore.getState()
    const shots = buildPlayerVolley({
      player: this.player,
      weaponId: store.equippedWeapon as keyof typeof WEAPON_TUNING,
      time,
    })

    if (!shots.length) {
      return
    }

    const direction = this.player.facing

    shots.forEach((shot) => {
      const bullet = this.playerBullets.get(shot.x, shot.y, 'bullet') as Bullet | null

      if (!bullet) {
        return
      }

      bullet.fire(shot.x, shot.y, shot.velocityX, shot.velocityY, shot.damage, 'player')
      bullet.setAngle(shot.angle)
    })

    this.addImpact(
      this.player.x + direction * (SPRITE_TUNING.player.muzzleOffsetX + 2),
      this.player.y - SPRITE_TUNING.player.muzzleOffsetY + 2,
      0xffea79,
      10,
    )
    this.cameras.main.shake(45, 0.0012)
    this.tweens.killTweensOf(this.player)
    this.player.setAngle(0)
    this.tweens.add({
      targets: this.player,
      angle: -direction * PLAYER_CONFIG.shootKnockback,
      duration: 28,
      ease: 'Quad.out',
      onComplete: () => {
        this.tweens.add({
          targets: this.player,
          angle: 0,
          duration: 120,
          ease: 'Cubic.out',
        })
      },
    })
  }

  private throwGrenade(time: number) {
    if (time < this.player.lastGrenadeAt + PLAYER_CONFIG.grenadeCooldownMs) {
      useGameStore.getState().setMessage('Grenade cooling down.')
      return
    }

    this.player.lastGrenadeAt = time
    const store = useGameStore.getState()
    const grenade = this.grenades.get(this.player.x, this.player.y - SPRITE_TUNING.player.grenadeOffsetY, 'grenade') as Grenade | null

    if (!grenade) {
      return
    }

    const fireVariant = store.equippedGrenade === 'fire-grenade'
    grenade.launch(
      this.player.x + this.player.facing * SPRITE_TUNING.player.grenadeOffsetX,
      this.player.y - SPRITE_TUNING.player.grenadeOffsetY + 2,
      this.player.facing * PLAYER_CONFIG.grenadeSpeedX,
      PLAYER_CONFIG.grenadeSpeedY,
      fireVariant ? PLAYER_CONFIG.grenadeDamage * 0.85 : PLAYER_CONFIG.grenadeDamage,
      fireVariant ? PLAYER_CONFIG.grenadeRadius + 36 : PLAYER_CONFIG.grenadeRadius,
      fireVariant ? 'fire' : 'frag',
    )
  }

  private useAbility(time: number) {
    if (time < this.player.lastAbilityAt + PLAYER_CONFIG.abilityCooldownMs) {
      useGameStore.getState().setMessage('Ability recharging.')
      return
    }

    this.player.lastAbilityAt = time
    const ability = useGameStore.getState().equippedAbility

    if (ability === 'shield') {
      this.player.shieldUntil = time + PLAYER_CONFIG.shieldDurationMs
      this.player.refreshVisualState(time)
      useGameStore.getState().setMessage('Shield pulse active.')
      return
    }

    if (ability === 'dash') {
      this.player.setVelocityX(this.player.facing * (PLAYER_CONFIG.moveSpeed + PLAYER_CONFIG.dashDistance))
      useGameStore.getState().setMessage('Dash triggered.')
      return
    }

    if (ability === 'rage') {
      this.player.rageUntil = time + PLAYER_CONFIG.rageDurationMs
      this.player.refreshVisualState(time)
      useGameStore.getState().setMessage('Rage mode active.')
      return
    }

    this.player.slowFieldUntil = time + PLAYER_CONFIG.slowDurationMs
    this.cameras.main.flash(120, 136, 198, 255)
    useGameStore.getState().setMessage('Enemies slowed.')
  }

  private useHeal(time: number) {
    if (this.player.healCharges <= 0) {
      useGameStore.getState().setMessage('No healing charges left.')
      return
    }

    if (time < this.player.lastHealAt + PLAYER_CONFIG.healCooldownMs) {
      useGameStore.getState().setMessage('Healing item recharging.')
      return
    }

    this.player.lastHealAt = time
    this.player.healCharges -= 1

    const healType = useGameStore.getState().equippedHeal
    const amount = resolveHealAmount(healType)

    this.player.heal(amount)
    this.cameras.main.flash(80, 140, 255, 102)
    useGameStore.setState({ hp: this.player.hp })
  }

  private updateEnemies(time: number) {
    const playerX = this.player.x
    const slowMultiplier = this.player.isSlowing(time) ? 0.62 : 1

    this.enemies.children.each((child) => {
      const enemy = child as Enemy

      if (!enemy.active) {
        return true
      }

      enemy.activeSlowMultiplier = slowMultiplier
      enemy.setVelocityY(0)
      enemy.refreshVisualState(time)

      if (enemy.enemyType === 'ranged') {
        const step = resolveRangedEnemyStep(enemy, playerX, time)
        enemy.setY(step.y ?? enemy.y)
        enemy.setVelocityX(step.xVelocity)

        if (step.shouldFire) {
          enemy.attackReadyAt = time + enemy.rangedCooldownMs
          this.fireEnemyProjectile(enemy)
        }
      } else if (enemy.enemyType === 'heavy') {
        const step = resolveHeavyEnemyStep(enemy, playerX, time)
        enemy.setY(step.y ?? enemy.y)
        enemy.setVelocityX(step.xVelocity)

        if (step.shouldFire) {
          enemy.attackReadyAt = time + enemy.rangedCooldownMs
          this.fireEnemyProjectile(enemy)
        }
      } else {
        const step = resolveMeleeEnemyStep(enemy, playerX)
        enemy.setY(ARENA_BOUNDS.floorY + SPRITE_TUNING.enemies.melee.floorOffset)
        enemy.setVelocityX(step.xVelocity)
      }

      enemy.setFlipX(enemy.x < playerX)
      return true
    })
  }

  private fireEnemyProjectile(enemy: Enemy) {
    const shot = buildEnemyProjectile({
      enemy,
      player: this.player,
    })
    const heavyShot = enemy.enemyType === 'heavy'
    const bullet = this.enemyBullets.get(shot.x, shot.y, 'enemy-bullet') as Bullet | null

    if (!bullet) {
      return
    }

    const body = bullet.body as Phaser.Physics.Arcade.Body | null

    if (heavyShot) {
      bullet.setTexture('heavy-bullet')
    } else {
      bullet.setTexture('enemy-bullet')
    }

    bullet.fire(shot.x, shot.y, shot.velocityX, shot.velocityY, shot.damage, 'enemy')
    bullet.setAngle(shot.angle)

    if (heavyShot) {
      bullet.setScale(1.05)
      body?.setSize(24, 24, true)
    } else {
      bullet.setScale(1)
      body?.setSize(14, 14, true)
    }
  }

  private updateProjectiles(time: number) {
    const boundsWidth = ARENA_SIZE.width
    const boundsHeight = ARENA_SIZE.height

    const recycleBulletIfOut = (child: Phaser.GameObjects.GameObject) => {
      const projectile = child as Bullet

      if (!projectile.active) {
        return true
      }

      if (
        projectile.x < -40 ||
        projectile.x > boundsWidth + 40 ||
        projectile.y < -60 ||
        projectile.y > boundsHeight + 60
      ) {
        this.recycleArcadeSprite(projectile)
      }

      return true
    }

    const updateGrenade = (child: Phaser.GameObjects.GameObject) => {
      const grenade = child as Grenade

      if (!grenade.active || grenade.exploded) {
        return true
      }

      if (
        grenade.x < -40 ||
        grenade.x > boundsWidth + 40 ||
        grenade.y < -60 ||
        grenade.y > boundsHeight + 60
      ) {
        this.recycleArcadeSprite(grenade)
        return true
      }

      const body = grenade.body as Phaser.Physics.Arcade.Body | undefined
      const touchedFloor = Boolean(body?.blocked.down) || grenade.y >= ARENA_BOUNDS.floorY - 8

      if (touchedFloor || time >= grenade.detonateAt) {
        this.explodeGrenade(grenade)
      }

      return true
    }

    this.playerBullets.children.each(recycleBulletIfOut)
    this.enemyBullets.children.each(recycleBulletIfOut)
    this.grenades.children.each(updateGrenade)
  }

  private updateWaveDirector(time: number) {
    const aliveEnemies = this.enemies.countActive(true)
    const event = this.waveDirector.update(time, aliveEnemies)

    if (event.spawnType) {
      this.spawnEnemy(event.spawnType)
    }

    if (event.waveCleared) {
      const nextScore = useGameStore.getState().score + SCORE_CONFIG.waveClearBonus
      useGameStore.setState({
        score: nextScore,
        activeMessage: `Wave ${event.waveCleared} cleared.`,
      })
    }

    if (event.waveStarted) {
      useGameStore.setState({
        wave: event.waveStarted,
        activeMessage: `Wave ${event.waveStarted} inbound.`,
      })
    }
  }

  private updateSurvivalScore(time: number) {
    if (time < this.survivalTickAt) {
      return
    }

    this.survivalTickAt = time + SCORE_CONFIG.survivalTickMs
    useGameStore.setState((state) => ({
      score: state.score + SCORE_CONFIG.survivalScore,
    }))
  }

  private spawnEnemy(type: EnemyType) {
    const wave = this.waveDirector.wave
    const scaling = this.waveDirector.template
    const base = ENEMY_CONFIG[type]
    const x = Phaser.Math.Between(ARENA_BOUNDS.enemySpawnMinX, ARENA_BOUNDS.enemySpawnMaxX)
    const spawnY =
      type === 'ranged'
        ? ARENA_BOUNDS.floorY - SPRITE_TUNING.enemies.ranged.hoverBaseOffset
        : type === 'heavy'
        ? ARENA_BOUNDS.floorY + SPRITE_TUNING.enemies.heavy.floorOffset
        : ARENA_BOUNDS.floorY + SPRITE_TUNING.enemies.melee.floorOffset
    const enemy = new Enemy(this, x, spawnY, type, {
      hp: Math.round(base.hp * scaling.hpScale),
      damage: Math.round(base.damage * scaling.damageScale),
      speed: Math.round(base.speed * scaling.speedScale),
      rangedCooldownMs: base.rangedCooldownMs,
      preferredDistance: base.preferredDistance,
      scoreValue:
        type === 'melee'
          ? SCORE_CONFIG.meleeKill
          : type === 'ranged'
          ? SCORE_CONFIG.rangedKill
          : SCORE_CONFIG.heavyKill,
    })

    enemy.setDepth(1)

    if (type === 'heavy') {
      enemy.setScale(SPRITE_TUNING.enemies.heavy.scale)
    }

    if (type === 'ranged') {
      enemy.setScale(SPRITE_TUNING.enemies.ranged.scale)
    }

    if (type === 'melee') {
      enemy.setScale(SPRITE_TUNING.enemies.melee.scale)
    }

      enemy.setBaseTint(wave >= 4 ? (type === 'heavy' ? 0xc289ff : 0xffb28f) : null)

      this.enemies.add(enemy)
    }
  
    private hitEnemy(enemy: Enemy, damage: number) {
      const hp = enemy.takeDamage(this.time.now, damage)

    if (hp > 0) {
      enemy.setVelocityX(enemy.body?.velocity.x ? enemy.body.velocity.x * 0.72 : 0)
      return
    }

    this.addImpact(enemy.x, enemy.y, 0xffd48a)
    enemy.destroy()
    const store = useGameStore.getState()
    useGameStore.setState({
      score: store.score + enemy.scoreValue,
      kills: store.kills + 1,
    })
  }

  private explodeGrenade(grenade: Grenade) {
    if (!grenade.active || grenade.exploded) {
      return
    }

    grenade.exploded = true
    this.addImpact(grenade.x, grenade.y, grenade.variant === 'fire' ? 0xff7a3d : 0xf3f7ff, grenade.radius)

    const affectedEnemies: Enemy[] = []

    this.enemies.children.each((child) => {
      const enemy = child as Enemy

      if (!enemy.active) {
        return true
      }

      const distance = Phaser.Math.Distance.Between(grenade.x, grenade.y, enemy.x, enemy.y)
      if (distance <= grenade.radius) {
        affectedEnemies.push(enemy)
      }

      return true
    })

    affectedEnemies.forEach((enemy) => {
      if (enemy.active) {
        this.hitEnemy(enemy, enemy.hp)
      }
    })

    this.cameras.main.shake(120, 0.004)
    this.recycleArcadeSprite(grenade)
  }

  private recycleArcadeSprite(sprite: Phaser.Physics.Arcade.Image) {
    const maybeShutdown = sprite as Phaser.Physics.Arcade.Image & {
      shutdown?: () => void
      exploded?: boolean
    }

    if (typeof maybeShutdown.shutdown === 'function') {
      maybeShutdown.shutdown()
      return
    }

    maybeShutdown.disableBody(true, true)
    maybeShutdown.setVelocity(0, 0)
    maybeShutdown.setAngularVelocity(0)
    maybeShutdown.clearTint()

    if (typeof maybeShutdown.exploded === 'boolean') {
      maybeShutdown.exploded = false
    }
  }

  private damagePlayer(damage: number, sourceX: number) {
    if (this.gameOver) {
      return
    }

    if (this.player.isShielded(this.time.now)) {
      useGameStore.getState().setHudState({ shieldRemaining: Math.max(0, this.player.shieldUntil - this.time.now) })
      return
    }

    const hp = this.player.takeDamage(this.time.now, Math.max(1, Math.round(damage)))
    this.player.setVelocityX((sourceX > this.player.x ? -1 : 1) * 132)
    this.cameras.main.shake(110, 0.003)
    useGameStore.setState({ hp })

    if (hp > 0) {
      return
    }

    this.endRun()
  }

  private endRun() {
    this.running = false
    this.paused = false
    this.time.timeScale = 1
    this.physics.world.resume()
    this.tweens.resumeAll()
    this.gameOver = true
    this.player.setTint(0x5a6377)
    this.player.setVelocity(0, 0)
    const finalScore = useGameStore.getState().score
    useGameStore.getState().finishRun(finalScore)
  }

  private addImpact(x: number, y: number, color: number, size = 26) {
    const circle = this.add.circle(x, y, size, color, 0.5)
    this.tweens.add({
      targets: circle,
      alpha: 0,
      scale: 1.6,
      duration: 180,
      onComplete: () => circle.destroy(),
    })
  }
}
