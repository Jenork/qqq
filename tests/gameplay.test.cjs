const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const modules = new Map()
function loadSource(relative) {
  const filename = path.resolve(__dirname, '..', relative)
  if (modules.has(filename)) return modules.get(filename).exports
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const module = { exports: {} }
  modules.set(filename, module)
  new Function('require', 'module', 'exports', source)(
    id => id.startsWith('@/') ? loadSource(`src/${id.slice(2)}.ts`) : require(id), module, module.exports,
  )
  return module.exports
}

const { gameplayPoint, joystickVector } = loadSource('src/lib/gameplayInput.ts')
const { useGameStore } = loadSource('src/hooks/useGameStore.ts')

test('joystick directions remain identical with native, rotated and scaled layouts', () => {
  const native = { left: 20, top: 100, right: 100, width: 80, height: 80 }
  const rotated = { left: 100, top: 20, right: 180, width: 80, height: 80 }
  assert.deepEqual(gameplayPoint(85, 140, native, 80, 80, false), { x: 65, y: 40 })
  assert.deepEqual(gameplayPoint(140, 85, rotated, 80, 80, true), { x: 65, y: 40 })
  assert.deepEqual(gameplayPoint(165, 60, rotated, 80, 80, true), { x: 40, y: 15 })
  const scaled = { left: 100, top: 20, right: 260, width: 160, height: 160 }
  assert.deepEqual(gameplayPoint(180, 150, scaled, 80, 80, true), { x: 65, y: 40 })
})

test('dragging beyond joystick bounds retains direction with bounded visual travel', () => {
  assert.deepEqual(joystickVector(0, 0, 24), { x: 0, y: 0 })
  assert.deepEqual(joystickVector(-200, 0, 24), { x: -24, y: 0 })
  const point = joystickVector(300, -400, 25)
  assert.equal(Math.hypot(point.x, point.y), 25)
  assert.equal(point.y / point.x, -4 / 3)
})

test('unchanged HUD snapshots and repeated touch moves do not notify subscribers', () => {
  useGameStore.getState().resetRunState()
  let updates = 0
  const unsubscribe = useGameStore.subscribe(() => updates++)
  const store = useGameStore.getState()
  for (let i = 0; i < 60; i++) {
    store.setHudState({ hp: 5, score: 0, grenadeCooldownRemaining: 0 })
    store.setMobileControl('left', false)
  }
  assert.equal(updates, 0)
  store.setMobileControl('left', true)
  store.setMobileControl('left', true)
  assert.equal(updates, 1)
  unsubscribe()
})

test('shotgun stays locked without a reward, toggles when unlocked, and revokes safely', () => {
  const store = useGameStore.getState()
  store.setOnchainUnlocked([])
  store.setOffchainUnlocked([])
  store.equipItem('shotgun')
  assert.equal(useGameStore.getState().equippedWeapon, 'pistol')
  store.setOnchainUnlocked(['shotgun'])
  store.equipItem('shotgun')
  assert.equal(useGameStore.getState().equippedWeapon, 'shotgun')
  store.equipItem('pistol')
  assert.equal(useGameStore.getState().equippedWeapon, 'pistol')
  store.equipItem('shotgun')
  store.setOnchainUnlocked([])
  assert.equal(useGameStore.getState().equippedWeapon, 'pistol')
})

test('input reset releases simultaneous movement, fire and queued abilities', () => {
  const store = useGameStore.getState()
  store.setMobileControl('right', true)
  store.setMobileControl('shoot', true)
  store.pulseAction('grenade')
  store.resetInputState()
  assert.deepEqual(useGameStore.getState().mobileControls, { left: false, right: false, shoot: false, jump: false })
  assert.equal(store.consumeAction('grenade'), 0)
})
