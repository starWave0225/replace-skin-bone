import test from 'node:test'
import assert from 'node:assert/strict'
import { advanceWellEncounter, isValidWellEncounter, newWellEncounter, performWellAction, wellCombat, wellLessons } from '../src/game/prologue-battle'
import { advancePrologue, initialPrologue, isValidPrologue, prologueHintIds, startWellEncounter, travelPrologue, caseClues, dreamStations } from '../src/game/prologue'
import { combatActionReason } from '../src/game/combat'
import { isValidState, startGame } from '../src/game/engine'
import { findPath, worldMaps } from '../src/game/world'

function morning() {
  const p = initialPrologue()
  p.phase = 'morning'; p.clues = caseClues.map(c => c.id); p.dreamSeen = dreamStations.map(s => s.id)
  return p
}
test('梦醒后沿光圈步行到客舍后井，教学前不能提前离开序章', () => {
  const p = morning()
  assert.deepEqual(prologueHintIds(p), ['backyard'])
  assert.equal(advancePrologue(p), false)
  assert.equal(startWellEncounter(p), false)
  assert.equal(travelPrologue(p, 'well'), false)
  assert.equal(travelPrologue(p, 'inn_well'), true)
  assert.deepEqual(prologueHintIds(p), ['well_spirit'])
  const map = worldMaps.inn_well, target = map.spots.find(s => s.id === 'well_spirit')!
  const path = findPath(map, p.world, { x: target.x * 32, y: (target.y + 1) * 32 })
  assert.ok(path.length > 0)
  assert.equal(startWellEncounter(p), true)
  assert.equal(startWellEncounter(p), false)
  assert.equal(travelPrologue(p, 'inn'), false)
  assert.equal(isValidPrologue(p), true)
})
test('五步教学使用真实回合结算，包含敌意、破相取消、两次显形、回墨减伤和获胜', () => {
  const e = newWellEncounter()
  assert.equal(performWellAction(e, 'attack'), false)
  assert.equal(advanceWellEncounter(e), true)
  assert.equal(performWellAction(e, 'reveal'), false)
  performWellAction(e, 'attack')
  let s = wellCombat(e)
  assert.deepEqual([s.turn, s.hp, s.ink, s.enemy.skin, s.enemy.hp], [2, 92, 4, 18, 24])
  performWellAction(e, 'observe'); s = wellCombat(e)
  assert.equal(s.intentKnown, true); assert.equal(s.mark, 3)
  performWellAction(e, 'outline'); s = wellCombat(e)
  assert.deepEqual([s.enemy.skin, s.enemy.hp, s.exposure, s.breaks, s.hp], [0, 24, 2, 1, 82])
  assert.ok(s.log.some(l => l.text === '水缚蓄势未能施展。'))
  const ink = s.ink
  performWellAction(e, 'breathe'); s = wellCombat(e)
  assert.deepEqual([s.ink, s.hp, s.exposure], [ink + 2, 70, 1])
  assert.equal(performWellAction(e, 'reveal'), true); s = wellCombat(e)
  assert.deepEqual([s.status, s.enemy.hp, s.turn, e.stage], ['won', 0, 5, 'aftermath'])
  assert.equal(performWellAction(e, 'attack'), false)
  assert.ok(s.log.at(-1)!.text.includes('且听她诉说'))
})
test('每一步存档可确定性恢复，战后只结算一次，不会提前取得面谱', () => {
  const state = startGame(true); state.prologue = morning()
  const p = state.prologue
  travelPrologue(p, 'inn_well'); startWellEncounter(p)
  const e = p.wellEncounter!; advanceWellEncounter(e)
  for (const lesson of wellLessons) {
    assert.ok(combatActionReason(wellCombat(e), 'swap'))
    performWellAction(e, lesson.action)
    const saved = JSON.parse(JSON.stringify(state))
    assert.equal(isValidState(saved), true)
    assert.deepEqual(wellCombat(saved.prologue.wellEncounter), wellCombat(e))
  }
  assert.equal(advanceWellEncounter(e), true)
  assert.equal(advanceWellEncounter(e), false)
  assert.deepEqual(prologueHintIds(p), ['inn_door'])
  assert.equal(travelPrologue(p, 'inn'), true)
  assert.deepEqual(prologueHintIds(p), ['teahouse'])
  assert.equal(advancePrologue(p), true)
  assert.equal(state.flags.wearing_first_face, undefined)
  assert.equal(state.inventory.includes('face_shen'), false)
  assert.equal(startWellEncounter(p), false)
})
test('拒绝伪造或跳过的教学存档，兼容未包含教学数据的旧存档', () => {
  for (const value of [null, { stage: 'fight', actions: ['reveal'] }, { stage: 'complete', actions: [] }, { stage: 'intro', actions: ['attack'] }, { stage: 'other', actions: [] }]) assert.equal(isValidWellEncounter(value), false)
  const p = morning()
  assert.equal(isValidPrologue(p), true)
  p.phase = 'completed'
  assert.equal(isValidPrologue(p), true)
  p.phase = 'morning'; travelPrologue(p, 'inn_well'); startWellEncounter(p)
  p.world.map = 'inn'
  assert.equal(isValidPrologue(p), false)
  p.world.map = 'inn_well'; p.world.x = 99999
  assert.equal(isValidPrologue(p), false)
})
