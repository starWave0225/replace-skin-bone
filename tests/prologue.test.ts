import test from 'node:test'
import assert from 'node:assert/strict'
import { advancePrologue, caseClues, discoveredDreamNotes, dreamStations, initialPrologue, inspectCase, inspectDream, isValidPrologue } from '../src/game/prologue'
import { dreamBlocked, dreamPath, moveInDream } from '../src/game/dream-navigation'
import { advance, choose, isValidState, startGame } from '../src/game/engine'

test('新序章先以自己的身份查命案，完成调查前不能入梦或执行旧开场',()=>{
  const state=startGame(true),p=state.prologue!
  assert.equal(isValidState(state),true)
  assert.equal(state.flags.wearing_first_face,undefined)
  assert.equal(state.inventory.includes('face_shen'),false)
  assert.equal(advance(state),false);assert.equal(choose(state,'wear'),false)
  assert.equal(advancePrologue(p),true)
  assert.equal(advancePrologue(p),false)
  for(const clue of caseClues){assert.equal(inspectCase(p,clue.id),true);assert.equal(inspectCase(p,clue.id),false)}
  assert.equal(advancePrologue(p),true);assert.equal(p.phase,'deduction')
  assert.equal(advancePrologue(p,'unknown'),false)
  assert.equal(advancePrologue(p,'familiar'),true);assert.equal(p.phase,'night')
  assert.equal(advancePrologue(p),true);assert.equal(p.phase,'dream')
  assert.equal(inspectDream(p,'mirror'),false)
  for(const station of dreamStations)assert.equal(inspectDream(p,station.id),true)
  assert.equal(advancePrologue(p),true);assert.equal(p.phase,'morning')
  assert.equal(advancePrologue(p),true);assert.equal(p.phase,'completed')
  assert.equal(isValidState(state),true)
})
test('序章与梦境中途存档可恢复，乱序或越界存档被拒绝，旧版存档仍有效',()=>{
  assert.equal(isValidState(startGame()),true)
  const p=initialPrologue();advancePrologue(p);caseClues.forEach(c=>inspectCase(p,c.id));advancePrologue(p);advancePrologue(p,'window');advancePrologue(p)
  inspectDream(p,'lantern');p.dreamPose={x:0,z:6,yaw:.2,pitch:-.1}
  assert.equal(isValidPrologue(JSON.parse(JSON.stringify(p))),true)
  assert.equal(isValidPrologue({...p,dreamSeen:['scroll']}),false)
  assert.equal(isValidPrologue({...p,dreamPose:{...p.dreamPose,x:100}}),false)
  assert.equal(isValidPrologue({...p,clues:[]}),false)
  assert.equal(isValidPrologue({...p,dreamPose:null}),false)
  assert.equal(isValidPrologue({...p,dreamPose:{...p.dreamPose,pitch:9}}),false)
  assert.equal(isValidPrologue({...p,deduction:'invalid'}),false)
})
test('三维梦境所有查验点可步行接近，大步移动不能穿过灯座或房间边界',()=>{
  let start={x:0,z:8.3}
  for(const station of dreamStations){
    const target={x:station.approach[0],z:station.approach[1]},path=dreamPath(start,target)
    assert.ok(path.length>0,station.id)
    assert.ok(path.every(p=>!dreamBlocked(p.x,p.z)),station.id)
    assert.ok(Math.hypot(target.x-station.position[0],target.z-station.position[1])<2.65)
    start=target
  }
  assert.ok(moveInDream({x:0,z:8},0,-5).z>4.9)
  assert.ok(moveInDream({x:0,z:8},40,0).x<=6.9)
})

test('女魂案记只收录依序亲自查验过的疑点，中途读档不会泄露后续证词',()=>{
  const p=initialPrologue();advancePrologue(p);caseClues.forEach(c=>inspectCase(p,c.id));advancePrologue(p);advancePrologue(p,'uncertain');advancePrologue(p)
  assert.deepEqual(discoveredDreamNotes(p.dreamSeen),[])
  assert.equal(inspectDream(p,'mirror'),false)
  inspectDream(p,'lantern');inspectDream(p,'brush')
  const saved=JSON.parse(JSON.stringify(p))
  assert.deepEqual(discoveredDreamNotes(saved.dreamSeen).map(n=>n.id),['lantern','brush'])
  assert.ok(discoveredDreamNotes(saved.dreamSeen).every(n=>n.whisper&&n.clueTitle&&n.clueNote))
  assert.deepEqual(discoveredDreamNotes(['lantern','mirror']).map(n=>n.id),['lantern'])
  assert.equal(isValidPrologue(saved),true)
})
