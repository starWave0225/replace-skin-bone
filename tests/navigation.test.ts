import test from 'node:test'
import assert from 'node:assert/strict'
import { startGame } from '../src/game/engine'
import { navigationItems, navigationLock } from '../src/game/navigation'
import { advancePrologue, caseClues, inspectCase, prologueHintIds } from '../src/game/prologue'

test('底栏入口始终齐全，片头仅开放存档，调查后开放基础菜单', () => {
  const state = startGame(true)
  assert.deepEqual(navigationItems.map(item => item.id), ['tasks', 'map', 'bag', 'faces', 'people', 'journal', 'rest', 'save'])
  for (const item of navigationItems) assert.equal(!navigationLock(state, item.id), item.id === 'save')
  advancePrologue(state.prologue!)
  for (const id of ['tasks', 'map', 'bag', 'people', 'journal', 'save'] as const) assert.equal(navigationLock(state, id), '')
  assert.ok(navigationLock(state, 'faces'))
  assert.ok(navigationLock(state, 'rest'))
})
test('序章不能借面，第一章休息仅在自由寻访开放', () => {
  const state = startGame(true)
  state.flags.wearing_first_face = true
  assert.ok(navigationLock(state, 'faces'))
  state.prologue = undefined
  assert.equal(navigationLock(state, 'faces'), '')
  assert.ok(navigationLock(state, 'rest'))
  state.mode = 'hub'; assert.equal(navigationLock(state, 'rest'), '')
  assert.ok(navigationLock(null, 'save'))
})
test('序章光圈跟随物证进度，集齐后提示询问掌柜，回到客舍时提示后井', () => {
  const p = startGame(true).prologue!
  assert.deepEqual(prologueHintIds(p), [])
  advancePrologue(p)
  assert.deepEqual(prologueHintIds(p), ['letter', 'ledger', 'tracks'])
  inspectCase(p, 'letter')
  assert.ok(!prologueHintIds(p).includes('letter'))
  assert.ok(prologueHintIds(p).includes('ledger'))
  for (const clue of caseClues) inspectCase(p, clue.id)
  assert.deepEqual(prologueHintIds(p), ['owner'])
  p.phase = 'morning'
  assert.deepEqual(prologueHintIds(p), ['backyard'])
})
