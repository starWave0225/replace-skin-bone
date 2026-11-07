import test from 'node:test'
import assert from 'node:assert/strict'
import { startGame } from '../src/game/engine'
import { worldGuidance } from '../src/game/world-guidance'
import { worldMaps } from '../src/game/world'
import type { GameState, Location } from '../src/game/types'

function hub(): GameState {
  const state = startGame(); state.flags.wearing_first_face = true; state.mode = 'hub'
  return state
}
test('首次借面前只引向无面娘，不亮起尚不能离开的出口', () => {
  const state = startGame()
  assert.deepEqual(worldGuidance(state, 'theatre').primary, ['faceless'])
  assert.ok(!worldGuidance(state, 'theatre').hints.includes('exit'))
  state.nodeId = 'dressing'
  assert.deepEqual(worldGuidance(state, 'theatre').primary, ['faceless', 'skin'])
})
test('主线跨地图逐段引导，抵达后从出口切换到正确人物', () => {
  const state = hub(); state.mode = 'story'; state.nodeId = 'street_1'
  assert.deepEqual(worldGuidance(state, 'theatre').primary, ['exit'])
  assert.deepEqual(worldGuidance(state, 'street').primary, ['mother_street'])
  state.nodeId = 'deadline_1'
  assert.deepEqual(worldGuidance(state, 'yamen').primary, ['exit'])
  assert.deepEqual(worldGuidance(state, 'street').primary, ['han_street'])
  state.nodeId = 'well_1'
  assert.deepEqual(worldGuidance(state, 'street').primary, ['home_door'])
  assert.deepEqual(worldGuidance(state, 'home').primary, ['well_door'])
  assert.deepEqual(worldGuidance(state, 'well').primary, ['well', 'child'])
  state.nodeId = 'farewell_1'
  assert.deepEqual(worldGuidance(state, 'well').primary, ['exit'])
  assert.deepEqual(worldGuidance(state, 'home').primary, ['mother'])
})
test('封存卷宗与王宅残影有明确目标，结束后清除任务引导', () => {
  const state = hub(); state.mode = 'story'; state.nodeId = 'case_archive'
  assert.deepEqual(worldGuidance(state, 'yamen').primary, ['archive'])
  state.nodeId = 'coda_1'
  assert.deepEqual(worldGuidance(state, 'mansion').primary, ['echo'])
  state.mode = 'ending'
  assert.deepEqual(worldGuidance(state, 'mansion'), { hints: [], primary: [] })
})
test('自由调查随时段、完成情况和身份变化，不把已完成事件当任务', () => {
  const state = hub()
  assert.deepEqual(worldGuidance(state, 'home').primary, ['mother', 'relic'])
  state.completed.push('relic')
  assert.ok(!worldGuidance(state, 'home').hints.includes('relic'))
  state.completed.push('meal')
  assert.ok(!worldGuidance(state, 'home').primary.includes('mother'))
  state.face = 'guard'; state.completed = []
  assert.ok(!worldGuidance(state, 'home').primary.includes('relic'))
  state.time = 'night'
  assert.deepEqual(worldGuidance(state, 'street').primary, ['theatre_door', 'home_door'])
  assert.deepEqual(worldGuidance(state, 'well').primary, ['well', 'child'])
  state.completed.push('watch')
  assert.ok(!worldGuidance(state, 'well').hints.includes('child'))
})
test('玩家选中的调查跨场景追踪，失效后回到当前可做事项', () => {
  const state = hub()
  assert.deepEqual(worldGuidance(state, 'home', 'case').primary, ['street_door'])
  assert.deepEqual(worldGuidance(state, 'street', 'case').primary, ['yamen_door'])
  assert.deepEqual(worldGuidance(state, 'yamen', 'case').primary, ['han'])
  state.completed.push('case')
  assert.ok(!worldGuidance(state, 'yamen', 'case').primary.includes('han'))
  state.completed = ['meal', 'relic', 'tea', 'case', 'ritual', 'watch']
  assert.deepEqual(worldGuidance(state, 'street').primary, ['rest'])
})
test('所有引导均指向本地图真实交互点，序章沿用逐条查验规则', () => {
  const state = hub()
  for (const mode of ['hub', 'story'] as const) for (const time of ['day', 'dusk', 'night'] as const) {
    state.mode = mode; state.time = time
    for (const map of Object.keys(worldMaps) as Location[]) {
      const result = worldGuidance(state, map)
      assert.equal(new Set(result.hints).size, result.hints.length)
      assert.ok(result.primary.every(id => result.hints.includes(id)))
      assert.ok(result.hints.every(id => worldMaps[map].spots.some(spot => spot.id === id)))
    }
  }
  const intro = startGame(true); intro.prologue!.phase = 'investigation'; intro.prologue!.clues = ['letter']
  assert.deepEqual(worldGuidance(intro, 'inn').primary, ['ledger', 'tracks'])
  assert.deepEqual(worldGuidance(intro, 'street').hints, [])
})
