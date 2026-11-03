import test from 'node:test'
import assert from 'node:assert/strict'
import { startGame } from '../src/game/engine'
import { navigationItems, navigationLock } from '../src/game/navigation'
import { advancePrologue, caseClues, inspectCase, prologueHintIds } from '../src/game/prologue'

test('底栏入口始终齐全，片头仅开放存档，调查后开放基础菜单', () => {
  const state = startGame(true)
  assert.deepEqual(navigationItems.map(item => item.id), ['map', 'bag', 'faces', 'people', 'journal', 'rest', 'save'])
  for (const item of navigationItems) assert.equal(!navigationLock(state, item.id), item.id === 'save')
  advancePrologue(state.prologue!)
  for (const id of ['map', 'bag', 'people', 'journal', 'save'] as const) assert.equal(navigationLock(state, id), '')
  assert.ok(navigationLock(state, 'faces'))
  assert.ok(navigationLock(state, 'rest'))
})
test('序章尚未结束不能借面，休息仅在自由寻访开放，旧存档不受影响', () => {
  const state = startGame(true)
  state.flags.wearing_first_face = true
  assert.ok(navigationLock(state, 'faces'))
  state.prologue!.phase = 'completed'
  assert.equal(navigationLock(state, 'faces'), '')
  assert.ok(navigationLock(state, 'rest'))
  state.mode = 'hub'; assert.equal(navigationLock(state, 'rest'), '')
  const oldSave = startGame(); oldSave.flags.wearing_first_face = true
  assert.equal(navigationLock(oldSave, 'faces'), '')
  assert.ok(navigationLock(null, 'save'))
})
test('序章光圈跟随物证进度，未调查项持续提示，梦醒先引向后井，战后引向出口', () => {
  const p = startGame(true).prologue!
  assert.deepEqual(prologueHintIds(p), [])
  advancePrologue(p)
  assert.deepEqual(prologueHintIds(p), ['letter', 'ledger', 'tracks', 'owner'])
  inspectCase(p, 'letter')
  assert.ok(!prologueHintIds(p).includes('letter'))
  assert.ok(prologueHintIds(p).includes('ledger'))
  for (const clue of caseClues) inspectCase(p, clue.id)
  assert.deepEqual(prologueHintIds(p), ['owner'])
  p.phase = 'morning'
  assert.deepEqual(prologueHintIds(p), ['backyard'])
})
