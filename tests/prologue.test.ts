import test from 'node:test'
import assert from 'node:assert/strict'
import { advancePrologue, caseClues, discoveredDreamNotes, dreamStations, echoDirections, initialPrologue, inspectCase, inspectDream, isValidPrologue, knockAtWell, prologueHintIds, recordPrologueEvent, startWellEncounter, travelPrologue, unlockPrologueBox } from '../src/game/prologue'
import { advanceWellEncounter, performWellAction, wellLessons } from '../src/game/prologue-battle'
import { prologueMap } from '../src/game/prologue-world'
import { dreamBlocked, dreamPath, moveInDream } from '../src/game/dream-navigation'
import { advance, choose, isValidState, startGame } from '../src/game/engine'
import { findPath, TILE } from '../src/game/world'

test('新版序章按查案、茶楼、入梦、枯井、片尾推进', () => {
  const state = startGame(true), p = state.prologue!
  const valid = () => assert.ok(isValidState(JSON.parse(JSON.stringify(state))), p.phase + '/' + p.world.map)
  assert.equal(advance(state), false)
  assert.equal(choose(state, 'wear'), false)
  valid()
  assert.equal(advancePrologue(p), true)
  assert.equal(recordPrologueEvent(p, 'owner'), false)
  assert.equal(travelPrologue(p, 'street'), false)
  for (const clue of caseClues) {
    assert.equal(inspectCase(p, clue.id), true)
    assert.equal(inspectCase(p, clue.id), false)
  }
  assert.deepEqual(prologueHintIds(p), ['owner'])
  assert.equal(recordPrologueEvent(p, 'owner'), true)
  assert.equal(travelPrologue(p, 'inn_well'), false)
  assert.equal(travelPrologue(p, 'street'), true)
  assert.equal(recordPrologueEvent(p, 'appeal'), true)
  assert.equal(travelPrologue(p, 'theatre'), true)
  assert.equal(travelPrologue(p, 'theatre_upper'), true)
  assert.equal(unlockPrologueBox(p, '红褪墨残'), false)
  assert.equal(recordPrologueEvent(p, 'wall'), false)
  for(const id of ['verse_rain','verse_snow','verse_moon']) assert.ok(recordPrologueEvent(p,'read_'+id))
  assert.ok(recordPrologueEvent(p,'enter_verse_moon'))
  assert.equal(recordPrologueEvent(p, 'wall'), true)
  assert.equal(unlockPrologueBox(p, '旧楹联'), false)
  assert.equal(unlockPrologueBox(p, ' 红褪墨残。'), true)
  valid()
  assert.equal(advancePrologue(p), true)
  assert.equal(inspectDream(p, 'mirror'), false)
  assert.equal(advancePrologue(p), false)
  for (const station of dreamStations) assert.equal(inspectDream(p, station.id), true)
  assert.equal(advancePrologue(p), true)
  valid()
  assert.equal(p.world.map, 'theatre_upper')
  assert.equal(travelPrologue(p, 'theatre'), false)
  assert.equal(recordPrologueEvent(p, 'briefing'), true)
  for (const next of ['theatre', 'street', 'inn', 'inn_well'] as const) assert.equal(travelPrologue(p, next), true)
  valid()
  assert.equal(prologueMap(p).spots.filter(spot => spot.id.startsWith('echo_')).length, 0)
  assert.equal(startWellEncounter(p, 'left'), false)
  for (let i = 0; i < 3; i++) assert.equal(knockAtWell(p), true)
  valid()
  const door = p.echo!
  assert.ok(door in echoDirections)
  assert.equal(knockAtWell(p), false)
  assert.equal(p.echo, door)
  const map = prologueMap(p)
  const doors = map.spots.filter(spot => spot.id.startsWith('echo_'))
  assert.equal(doors.length, 3)
  for (const spot of doors) assert.ok(findPath(map, p.world, { x: spot.x * TILE, y: spot.y * TILE }).length, spot.id)
  assert.equal(startWellEncounter(p, door === 'left' ? 'right' : 'left'), false)
  assert.equal(startWellEncounter(p, door), true)
  assert.equal(startWellEncounter(p, door), false)
  assert.equal(p.wellEncounter!.stage, 'cinematic')
  advanceWellEncounter(p.wellEncounter!)
  advanceWellEncounter(p.wellEncounter!)
  for (const lesson of wellLessons) assert.equal(performWellAction(p.wellEncounter!, lesson.action), true)
  assert.equal(advancePrologue(p), false)
  advanceWellEncounter(p.wellEncounter!)
  assert.equal(advancePrologue(p), true)
  assert.equal(p.phase, 'curtain')
  assert.equal(advancePrologue(p), false)
  assert.equal(state.inventory.includes('face_shen'), false)
  assert.equal(advance(state), false)
  valid()
})

test('三维梦境所有查验点可步行接近，撞到陈设会停下', () => {
  let start = { x: 0, z: 8.3 }
  for (const station of dreamStations) {
    const target = { x: station.approach[0], z: station.approach[1] }
    const path = dreamPath(start, target)
    assert.ok(path.length > 0, station.id)
    assert.ok(path.every(p => !dreamBlocked(p.x, p.z)), station.id)
    assert.ok(Math.hypot(target.x - station.position[0], target.z - station.position[1]) < 2.65)
    start = target
  }
  assert.ok(moveInDream({ x: 1, z: 2.5 }, 0, -5).z > 1)
  assert.ok(moveInDream({ x: 0, z: 8 }, 40, 0).x <= 6.9)
})

test('梦中案记按已查验顺序出现，拒绝非法位置和乱序节点', () => {
  const p = initialPrologue()
  assert.deepEqual(discoveredDreamNotes([]), [])
  assert.deepEqual(discoveredDreamNotes(['hall', 'courtyard']).map(n => n.id), ['hall', 'courtyard'])
  assert.deepEqual(discoveredDreamNotes(['hall', 'mirror']).map(n => n.id), ['hall'])
  assert.equal(isValidPrologue({ ...p, dreamSeen: ['mirror'] }), false)
  assert.equal(isValidPrologue({ ...p, dreamPose: { x: 100, z: 1, yaw: 0, pitch: 0 } }), false)
  assert.equal(isValidPrologue({ ...p, world: { ...p.world, map: 'well' } }), false)
})


test('门联直接呈现，无须逐门读过即可辨韵选门，错误房门不能开暗墙',()=>{
 const p=initialPrologue();advancePrologue(p);caseClues.forEach(c=>inspectCase(p,c.id));recordPrologueEvent(p,'owner');travelPrologue(p,'street');travelPrologue(p,'theatre');travelPrologue(p,'theatre_upper')
 const map=prologueMap(p)
 const doors=map.spots.filter(s=>s.id.startsWith('verse_'))
 assert.equal(doors.length,3)
 for(const door of doors)assert.ok(findPath(map,p.world,{x:door.x*TILE,y:door.y*TILE}).length,door.id)
 assert.equal(map.objects.filter(o=>o.couplet?.length===2).length,3)
 assert.ok(map.objects.some(o=>o.kind==='stairs'&&o.direction==='down'))
 recordPrologueEvent(p,'read_verse_rain');recordPrologueEvent(p,'read_verse_snow')
 const restored=JSON.parse(JSON.stringify(p));assert.ok(isValidPrologue(restored))
 assert.equal(recordPrologueEvent(restored,'wall'),false)
 assert.ok(recordPrologueEvent({...restored,verseDoorsSeen:[]},'enter_verse_moon'),'不再要求按 E 阅读三扇门')
 assert.equal(recordPrologueEvent(restored,'enter_verse_rain'),false)
 assert.equal(recordPrologueEvent(restored,'enter_verse_snow'),false)
 assert.equal(recordPrologueEvent(restored,'enter_verse_moon'),true)
 assert.ok(prologueMap(restored).spots.some(s=>s.id==='hidden_wall'))
 const roomMap=prologueMap(restored),seam=roomMap.spots.find(s=>s.id==='hidden_wall')!
 assert.ok(findPath(roomMap,restored.world,{x:seam.x*TILE,y:seam.y*TILE}).length,'选对门后可进入房间摸到暗墙')
 assert.ok(recordPrologueEvent(restored,'wall'));assert.ok(unlockPrologueBox(restored,'红褪墨残'))
})
