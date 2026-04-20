import * as Phaser from 'phaser'
import {
  ARENA_BOUNDS,
  ARENA_SIZE,
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
import { applyEnemyPresentation, applyPlayerPresentation } from '@/game/systems/presentationSystem'
import { ArenaRunDirector } from '@/game/systems/ArenaRunDirector'
import { createArenaEnemy } from '@/game/systems/enemyFactory'

export class ArenaScene extends Phaser.Scene {
  private static readonly BACKGROUND_FLOOR_SOURCE_Y = 604
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private player!: Player
  private ground!: Phaser.GameObjects.Rectangle
  private enemies!: Phaser.Physics.Arcade.Group
  private playerBullets!: Phaser.Physics.Arcade.Group
  private enemyBullets!: Phaser.Physics.Arcade.Group
  private grenades!: Phaser.Physics.Arcade.Group
  private runDirector = new ArenaRunDirector()
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
    const source = this.textures.get('arena-background').getSourceImage() as { width: number; height: number }
    const coverScale = Math.max(ARENA_SIZE.width / source.width, ARENA_SIZE.height / source.height)
    const displayWidth = source.width * coverScale
    const displayHeight = source.height * coverScale
    const floorAnchorY = ArenaScene.BACKGROUND_FLOOR_SOURCE_Y * coverScale

    background.setDisplaySize(displayWidth, displayHeight)
    background.setPosition(ARENA_SIZE.width / 2, ARENA_BOUNDS.floorY - floorAnchorY + displayHeight / 2)
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

      if (enemy.enemyType === 'melee') {
        return
      }

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

      enemy.attackWindupUntil = 0
      enemy.lastAttackAt = time
      enemy.attackReadyAt = time + PLAYER_CONFIG.contactDamageCooldownMs
      this.nextContactHitAt = time + PLAYER_CONFIG.contactDamageCooldownMs
      this.damagePlayer(contactDamage, enemy.x)
      player.setVelocityX(pushDirection * PLAYER_CONFIG.contactKnockback)
      enemy.setX(enemy.x - pushDirection * 26)
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
      weapon1: 'ONE',
      weapon2: 'TWO',
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
    const store = useGameStore.getState()
    const rewards = {
      bonusHealCharges: store.bonusHealCharges,
      bonusArmorPoints: store.bonusArmorPoints,
    }

    this.clearGroups()
    this.running = startImmediately
    this.paused = false
    this.gameOver = false
    this.playerBaseY = ARENA_BOUNDS.floorY + SPRITE_TUNING.player.floorOffset
    this.nextContactHitAt = 0
    this.shootLatch = false
    this.player.resetState(ARENA_BOUNDS.playerSpawnX, this.playerBaseY, rewards)
    this.survivalTickAt = this.time.now + SCORE_CONFIG.survivalTickMs

    useGameStore.setState(this.runDirector.reset(this.time.now, startImmediately, rewards))
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
    useGameStore.setState({ status: 'playing', activeMessage: `Wave ${this.runDirector.wave} active.` })
  }

  private syncHudCooldowns(time: number) {
    this.syncRewardArmorBonus()

    useGameStore.getState().setHudState({
      hp: this.player.hp,
      armor: this.player.armor,
      maxArmor: this.player.maxArmor,
      grenadeCooldownRemaining: Math.max(0, this.player.lastGrenadeAt + PLAYER_CONFIG.grenadeCooldownMs - time),
      abilityCooldownRemaining: Math.max(0, this.player.lastAbilityAt + PLAYER_CONFIG.abilityCooldownMs - time),
      healCooldownRemaining: Math.max(0, this.player.lastHealAt + PLAYER_CONFIG.healCooldownMs - time),
      shieldRemaining: Math.max(0, this.player.shieldUntil - time),
      healCharges: this.player.healCharges,
    })
  }

  private syncRewardArmorBonus() {
    const store = useGameStore.getState()

    if (!this.player.syncArmorBonus(store.bonusArmorPoints)) {
      return
    }

    store.setHudState({
      armor: this.player.armor,
      maxArmor: this.player.maxArmor,
    })
  }

  private updateAmbientAnimation(time: number) {
    applyPlayerPresentation(this.player, time)
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
    const grounded = Boolean(this.player.body?.blocked.down)
    const horizontalSpeed = grounded
      ? PLAYER_CONFIG.moveSpeed
      : Math.round(PLAYER_CONFIG.moveSpeed * PLAYER_CONFIG.airMoveSpeedMultiplier)

    if (moveLeft === moveRight) {
      this.player.setVelocityX(0)
    } else if (moveLeft) {
      this.player.facing = -1
      this.player.setFlipX(true)
      this.player.setVelocityX(-horizontalSpeed)
    } else {
      this.player.facing = 1
      this.player.setFlipX(false)
      this.player.setVelocityX(horizontalSpeed)
    }

    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.keys.jump) ||
      Phaser.Input.Keyboard.JustDown(this.keys.jumpAlt) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      controls.jump

    if (jumpPressed && !this.jumpLatch && grounded) {
      this.player.setVelocityY(-PLAYER_CONFIG.jumpForce)

      if (moveLeft !== moveRight) {
        const jumpDirection = moveLeft ? -1 : 1
        this.player.setVelocityX(jumpDirection * (horizontalSpeed + PLAYER_CONFIG.jumpForwardBoost))
      }

      this.jumpLatch = true
    }

    if (!controls.jump) {
      this.jumpLatch = false
    }
  }

  private handleCombatInputs(time: number) {
    const store = useGameStore.getState()
    const grenadeUnlocked =
      store.unlockedItemIds.includes('frag-grenade') || store.unlockedItemIds.includes('fire-grenade')
    this.handleWeaponHotkeys()
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
      if (!grenadeUnlocked) {
        store.setMessage('Grenade is locked.')
      } else {
        this.throwGrenade(time)
      }
    }

    if (store.consumeAction('ability') > 0) {
      this.useAbility(time)
    }

    if (store.consumeAction('heal') > 0) {
      this.useHeal(time)
    }
  }

  private handleWeaponHotkeys() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.weapon1)) {
      this.equipWeaponFromHotkey('pistol', 'Pistol ready.')
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.weapon2)) {
      this.equipWeaponFromHotkey('shotgun', 'Shotgun ready.')
    }

  }
  private equipWeaponFromHotkey(weaponId: 'pistol' | 'shotgun', successMessage: string) {
    const store = useGameStore.getState()

    if (!store.unlockedItemIds.includes(weaponId)) {
      store.setMessage('Weapon is locked.')
      return
    }

    if (store.equippedWeapon === weaponId) {
      return
    }

    store.equipItem(weaponId)
    store.setMessage(successMessage)
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

      bullet.fire(shot.x, shot.y, shot.velocityX, shot.velocityY, shot.damage, 'player', shot.maxDistance)
      bullet.setAngle(shot.angle)
    })

    this.playSfx(store.equippedWeapon === 'shotgun' ? 'shotgun-shot' : 'player-shot')
    this.addImpact(
      this.player.x + direction * (SPRITE_TUNING.player.muzzleOffsetX + 2),
      this.player.y - SPRITE_TUNING.player.muzzleOffsetY + 2,
      0xffea79,
      store.equippedWeapon === 'shotgun' ? 16 : 10,
    )
    this.cameras.main.shake(
      store.equippedWeapon === 'shotgun' ? 42 : 26,
      store.equippedWeapon === 'shotgun' ? 0.00085 : 0.00045,
    )
  }

  private throwGrenade(time: number) {
    const store = useGameStore.getState()

    if (
      !store.unlockedItemIds.includes('frag-grenade') &&
      !store.unlockedItemIds.includes('fire-grenade')
    ) {
      store.setMessage('Grenade is locked.')
      return
    }

    if (time < this.player.lastGrenadeAt + PLAYER_CONFIG.grenadeCooldownMs) {
      store.setMessage('Grenade cooling down.')
      return
    }

    this.player.lastGrenadeAt = time
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
    this.playSfx('grenade-throw')
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
        let velocityX = step.xVelocity

        if (!step.shouldFire && enemy.attackWindupUntil > 0) {
          enemy.attackWindupUntil = 0
        }

        if (enemy.attackWindupUntil > time) {
          velocityX = 0
        } else if (enemy.attackWindupUntil > 0 && time >= enemy.attackWindupUntil) {
          enemy.attackWindupUntil = 0
          enemy.attackReadyAt = time + enemy.rangedCooldownMs
          velocityX = 0
          this.fireEnemyProjectile(enemy)
        } else if (step.shouldFire) {
          velocityX = 0
          this.startEnemyWindup(enemy, time, PLAYER_CONFIG.rangedTelegraphMs)
        }

        enemy.setVelocityX(velocityX)
      } else if (enemy.enemyType === 'heavy') {
        const step = resolveHeavyEnemyStep(enemy, playerX, time)
        enemy.setY(step.y ?? enemy.y)
        let velocityX = step.xVelocity

        if (!step.shouldFire && enemy.attackWindupUntil > 0) {
          enemy.attackWindupUntil = 0
        }

        if (enemy.attackWindupUntil > time) {
          velocityX = 0
        } else if (enemy.attackWindupUntil > 0 && time >= enemy.attackWindupUntil) {
          enemy.attackWindupUntil = 0
          enemy.attackReadyAt = time + enemy.rangedCooldownMs
          velocityX = 0
          this.fireEnemyProjectile(enemy)
        } else if (step.shouldFire) {
          velocityX = 0
          this.startEnemyWindup(enemy, time, PLAYER_CONFIG.heavyTelegraphMs)
        }

        enemy.setVelocityX(velocityX)
      } else {
        const distance = Math.abs(playerX - enemy.x)
        const step = resolveMeleeEnemyStep(enemy, playerX)
        enemy.setY(ARENA_BOUNDS.floorY + SPRITE_TUNING.enemies.melee.floorOffset)
        let velocityX = step.xVelocity
        const withinStrikeRange = distance <= 82

        if (distance > 96 && enemy.attackWindupUntil > 0) {
          enemy.attackWindupUntil = 0
        }

        if (enemy.attackWindupUntil > time) {
          velocityX = 0
        } else if (enemy.attackWindupUntil > 0 && time >= enemy.attackWindupUntil) {
          velocityX = 0

          if (withinStrikeRange) {
            this.applyMeleeContactHit(enemy, time)
          } else {
            enemy.attackWindupUntil = 0
            enemy.attackReadyAt = time + PLAYER_CONFIG.meleeWhiffRecoveryMs
          }
        } else if (withinStrikeRange && time >= enemy.attackReadyAt && enemy.attackWindupUntil === 0) {
          velocityX = 0
          this.startEnemyWindup(enemy, time, PLAYER_CONFIG.meleeTelegraphMs)
        }

        enemy.setVelocityX(velocityX)
      }

      enemy.setFlipX(enemy.x < playerX)
      applyEnemyPresentation(enemy, time)
      return true
    })
  }

  private fireEnemyProjectile(enemy: Enemy) {
    enemy.lastAttackAt = this.time.now
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

    bullet.fire(shot.x, shot.y, shot.velocityX, shot.velocityY, shot.damage, 'enemy', shot.maxDistance)
    bullet.setAngle(shot.angle)

    if (heavyShot) {
      bullet.setScale(1.05)
      body?.setSize(24, 24, true)
    } else {
      bullet.setScale(1)
      body?.setSize(18, 14, true)
    }

    this.playSfx(heavyShot ? 'heavy-shot' : 'enemy-shot')
  }

  private updateProjectiles(time: number) {
    const boundsWidth = ARENA_SIZE.width
    const boundsHeight = ARENA_SIZE.height

    const recycleBulletIfOut = (child: Phaser.GameObjects.GameObject) => {
      const projectile = child as Bullet

      if (!projectile.active) {
        return true
      }

      this.emitProjectileTrail(projectile, time)

      if (
        projectile.x < -40 ||
        projectile.x > boundsWidth + 40 ||
        projectile.y < -60 ||
        projectile.y > boundsHeight + 60 ||
        Phaser.Math.Distance.Between(projectile.originX, projectile.originY, projectile.x, projectile.y) >
          projectile.maxDistance
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
    const store = useGameStore.getState()
    const runtimeUpdate = this.runDirector.update(time, this.enemies.countActive(true), store.score)

    if (runtimeUpdate.spawnType) {
      this.spawnEnemy(runtimeUpdate.spawnType)
    }

    if (runtimeUpdate.storePatch) {
      if (runtimeUpdate.storePatch.activeMessage) {
        if (/cleared/i.test(runtimeUpdate.storePatch.activeMessage)) {
          this.cameras.main.flash(100, 255, 187, 71)
          this.playSfx('wave-clear')
        } else if (/inbound|incoming/i.test(runtimeUpdate.storePatch.activeMessage)) {
          this.cameras.main.flash(90, 255, 132, 44)
          this.playSfx('wave-start')
        }
      }

      useGameStore.setState(runtimeUpdate.storePatch)
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
    const enemy = createArenaEnemy({
      scene: this,
      type,
      wave: this.runDirector.wave,
      template: this.runDirector.template,
    })
    this.enemies.add(enemy)
  }

  private hitEnemy(enemy: Enemy, damage: number) {
    const hp = enemy.takeDamage(this.time.now, damage)
    this.playSfx(hp > 0 ? 'enemy-hit' : 'enemy-death')
    this.addImpact(enemy.x, enemy.y - 32, hp > 0 ? 0xffa366 : 0xffd48a, hp > 0 ? 12 : 20)

    if (hp > 0) {
      this.cameras.main.shake(40, 0.0009)
      enemy.setVelocityX(enemy.body?.velocity.x ? enemy.body.velocity.x * 0.72 : 0)
      return
    }

    this.addImpact(enemy.x, enemy.y, 0xffd48a)
    this.cameras.main.shake(75, 0.0016)
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

    this.playSfx('grenade-explode')
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
      this.playSfx('shield-block')
      useGameStore.getState().setHudState({ shieldRemaining: Math.max(0, this.player.shieldUntil - this.time.now) })
      return
    }

    const result = this.player.takeDamage(this.time.now, Math.max(1, Math.round(damage)))
    this.playSfx(result.hp > 0 ? 'player-hit' : 'player-death')
    this.addImpact(this.player.x, this.player.y - 72, 0xff6273, 18)
    this.player.setVelocityX((sourceX > this.player.x ? -1 : 1) * 132)
    this.cameras.main.shake(110, 0.003)
    useGameStore.setState({ hp: result.hp, armor: result.armor, maxArmor: this.player.maxArmor })

    if (result.hp > 0) {
      return
    }

    this.endRun()
  }

  private applyMeleeContactHit(enemy: Enemy, time: number) {
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

    const pushDirection = enemy.x > this.player.x ? -1 : 1

    enemy.attackWindupUntil = 0
    enemy.lastAttackAt = time
    enemy.attackReadyAt = time + PLAYER_CONFIG.contactDamageCooldownMs
    this.nextContactHitAt = time + PLAYER_CONFIG.contactDamageCooldownMs
    this.damagePlayer(PLAYER_CONFIG.damagePerHit, enemy.x)
    this.player.setVelocityX(pushDirection * PLAYER_CONFIG.contactKnockback)
    enemy.setX(enemy.x - pushDirection * 26)
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

  private startEnemyWindup(enemy: Enemy, time: number, durationMs: number) {
    if (time < enemy.attackReadyAt || enemy.attackWindupUntil > time) {
      return
    }

    enemy.lastAttackAt = time
    enemy.attackWindupUntil = time + durationMs
    this.addImpact(
      enemy.x,
      enemy.enemyType === 'ranged' ? enemy.y - 54 : enemy.y - 44,
      enemy.enemyType === 'heavy' ? 0xff7d4d : 0xffb066,
      enemy.enemyType === 'heavy' ? 16 : 10,
    )
    this.playSfx(enemy.enemyType === 'heavy' ? 'heavy-charge' : 'enemy-charge')
  }

  private emitProjectileTrail(projectile: Bullet, time: number) {
    if (time < projectile.lastTrailAt + 36) {
      return
    }

    projectile.lastTrailAt = time
    const color =
      projectile.owner === 'player'
        ? 0xffd88a
        : projectile.texture.key === 'heavy-bullet'
          ? 0xff6b42
          : 0xff9a52
    const radius = projectile.texture.key === 'heavy-bullet' ? 5 : 3
    const alpha = projectile.texture.key === 'heavy-bullet' ? 0.28 : 0.22
    const trail = this.add.circle(projectile.x, projectile.y, radius, color, alpha)

    this.tweens.add({
      targets: trail,
      alpha: 0,
      scale: 0.35,
      duration: projectile.texture.key === 'heavy-bullet' ? 170 : 110,
      onComplete: () => trail.destroy(),
    })
  }

  private playSfx(
    kind:
      | 'player-shot'
      | 'shotgun-shot'
      | 'enemy-shot'
      | 'heavy-shot'
      | 'enemy-charge'
      | 'heavy-charge'
      | 'enemy-hit'
      | 'enemy-death'
      | 'player-hit'
      | 'player-death'
      | 'shield-block'
      | 'grenade-throw'
      | 'grenade-explode'
      | 'wave-start'
      | 'wave-clear',
  ) {
    if (useGameStore.getState().audioMuted) {
      return
    }

    const manager = this.sound as Phaser.Sound.WebAudioSoundManager & {
      context?: AudioContext
    }
    const context = manager.context

    if (!context) {
      return
    }

    void context.resume().catch(() => undefined)

    const pulse = (frequency: number, durationMs: number, options?: {
      type?: OscillatorType
      volume?: number
      endFrequency?: number
      detune?: number
    }) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const now = context.currentTime
      const duration = durationMs / 1000

      oscillator.type = options?.type ?? 'square'
      oscillator.frequency.setValueAtTime(frequency, now)

      if (options?.endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(25, options.endFrequency),
          now + duration,
        )
      }

      if (options?.detune) {
        oscillator.detune.setValueAtTime(options.detune, now)
      }

      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(options?.volume ?? 0.028, now + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(now)
      oscillator.stop(now + duration)
    }

    switch (kind) {
      case 'player-shot':
      case 'shotgun-shot':
      case 'enemy-shot':
        pulse(250, 85, { type: 'sawtooth', endFrequency: 120, volume: 0.022 })
        break
      case 'heavy-shot':
        pulse(140, 180, { type: 'sawtooth', endFrequency: 58, volume: 0.034 })
        break
      case 'enemy-charge':
        pulse(180, 120, { type: 'triangle', endFrequency: 260, volume: 0.018 })
        break
      case 'heavy-charge':
        pulse(90, 220, { type: 'sawtooth', endFrequency: 150, volume: 0.026 })
        break
      case 'enemy-hit':
        pulse(320, 70, { endFrequency: 180, volume: 0.018 })
        break
      case 'enemy-death':
        pulse(240, 160, { type: 'sawtooth', endFrequency: 62, volume: 0.026 })
        break
      case 'player-hit':
        pulse(170, 120, { type: 'sawtooth', endFrequency: 80, volume: 0.03 })
        break
      case 'player-death':
        pulse(110, 260, { type: 'sawtooth', endFrequency: 34, volume: 0.04 })
        break
      case 'shield-block':
        pulse(720, 90, { type: 'triangle', endFrequency: 420, volume: 0.02 })
        break
      case 'grenade-throw':
      case 'grenade-explode':
        break
      case 'wave-start':
        pulse(420, 150, { type: 'triangle', endFrequency: 720, volume: 0.022 })
        break
      case 'wave-clear':
        pulse(620, 180, { type: 'triangle', endFrequency: 980, volume: 0.024 })
        break
    }
  }
}
