import test from 'node:test'
import assert from 'node:assert/strict'
import { activities } from '../src/game/catalog'
import { allNodes, story } from '../src/game/story'
import { activityReason, advance, applyEffects, beginActivity, changeFace, choose, enterNode, initialState, isValidState, refreshDerived, rest, startGame, validateStory, visibleChoices } from '../src/game/engine'
import type { GameState } from '../src/game/types'

function until(s: GameState, id: string) {
  let budget = 100
  while (s.nodeId !== id && budget-- > 0) assert.equal(advance(s), true, `无法从 ${s.nodeId} 前往 ${id}`)
  assert.equal(s.nodeId, id)
}
function intro(answer: 'accept' | 'deny' | 'question' = 'accept') {
  const s = startGame(); until(s, 'dressing'); choose(s, 'wear'); until(s, 'recognition'); choose(s, answer); until(s, 'arrival_end'); advance(s); return s
}
function finishActivity(s: GameState, options: Record<string, string> = {}) {
  let budget = 100
  while (s.mode === 'story' && !s.nodeId.startsWith('deadline') && budget-- > 0) {
    const available = visibleChoices(s).filter(c => c.available)
    if (story[s.nodeId].choices) assert.equal(choose(s, options[s.nodeId] ?? available[0].id), true)
    else assert.equal(advance(s), true)
  }
  assert.ok(budget > 0)
}

test('所有剧情节点唯一，跳转目标存在，终点有出口', () => {
  assert.equal(new Set(allNodes.map(n => n.id)).size, allNodes.length)
  assert.deepEqual(validateStory(), [])
  assert.ok(allNodes.length >= 100)
})
test('三种认亲回应均可进入自由寻访，开场准确占用两次行动', () => {
  for (const answer of ['accept','deny','question'] as const) {
    const s = intro(answer)
    assert.equal(s.mode, 'hub'); assert.equal(s.day, 1); assert.equal(s.time, 'night'); assert.equal(s.actionPoints, 1)
    assert.ok(s.inventory.includes('face_shen')); assert.ok(s.flags.home_invited)
  }
})
test('镜子检查可返回，但重复触发不能重复加属性或发物品', () => {
  const s = startGame(); until(s, 'dressing'); assert.ok(choose(s,'mirror')); until(s,'dressing'); assert.ok(choose(s,'mirror')); until(s,'dressing')
  const before = s.stats.selfhood
  applyEffects(s,[{ stat:'selfhood',add:10 },{ item:'mirror' }],'same-effect')
  applyEffects(s,[{ stat:'selfhood',add:10 },{ item:'mirror' }],'same-effect')
  assert.equal(s.stats.selfhood,before+10); assert.equal(s.inventory.filter(i=>i==='mirror').length,1)
  assert.ok(choose(s,'wear')); until(s,'recognition')
})
test('一次抉择只能结算一次，双击不会重复扣除本心', () => {
  const s=startGame(); until(s,'dressing'); choose(s,'wear'); until(s,'recognition')
  assert.equal(choose(s,'accept'),true); assert.equal(choose(s,'accept'),false); assert.equal(s.stats.selfhood,45)
})
test('数值约束保留羁绊的负值，但本心与业债不越界', () => {
  const s=initialState(); applyEffects(s,[{stat:'selfhood',add:200},{stat:'karma',add:-10},{stat:'han',add:-300},{stat:'mother',add:300}],'ranges')
  assert.deepEqual([s.stats.selfhood,s.stats.karma,s.stats.han,s.stats.mother],[100,0,-100,100])
})
test('活动受时段约束，完成后不能再刷奖励', () => {
  const s=intro(); assert.equal(beginActivity(s,'meal'),false); assert.equal(beginActivity(s,'watch'),true)
  finishActivity(s); assert.equal(s.day,2); assert.equal(s.time,'day'); assert.equal(s.actionPoints,3)
  assert.equal(beginActivity(s,'watch'),false); assert.ok(s.completed.includes('watch'))
})
test('六个调查事件最多做五个，第三日黄昏自动进入高潮', () => {
  const s=intro()
  for (const id of ['ritual','meal','relic','watch','tea']) {
    assert.equal(beginActivity(s,id),true,`${id}应当可访`); finishActivity(s)
  }
  assert.equal(s.completed.length,5); assert.equal(s.day,3); assert.equal(s.time,'dusk'); assert.equal(s.nodeId,'deadline_1')
})
test('跳过全部调查也能得到保底线索并通关', () => {
  const s=intro('deny'); let steps=0
  while(s.mode==='hub'&&steps++<10)rest(s)
  assert.equal(s.nodeId,'deadline_1'); until(s,'well_choice'); assert.ok(s.flags.death_known)
  assert.equal(choose(s,'deceive'),true); until(s,'final_choice'); assert.equal(choose(s,'leave'),true)
  until(s,'chapter_end'); advance(s); assert.equal(s.mode,'ending'); assert.equal(s.ending,'leave')
})
test('以情动人要求两条童影记忆，未满足时不可选择', () => {
  const s=intro(); enterNode(s,'well_choice'); assert.equal(choose(s,'peace'),false)
  s.clues.push('child_name','home_tree'); refreshDerived(s); assert.equal(choose(s,'peace'),true); assert.equal(s.flags.child_at_peace,true)
})
test('安魂术与冒认路线分别留下义务和依附', () => {
  for (const route of ['ritual','deceive']) {
    const s=intro(); s.flags.knows_ritual=true; enterNode(s,'well_choice'); assert.equal(choose(s,route),true)
    assert.equal(s.stats.karma,route==='ritual'?5:15); assert.equal(s.flags[route==='ritual'?'child_bound':'child_attached'],true)
  }
})
test('故捕快之面来自旧案遗物，切换后打开真实的卷宗选项', () => {
  const s=intro(); rest(s); assert.equal(beginActivity(s,'case'),true)
  until(s,'case_question'); choose(s,'truth'); until(s,'case_archive')
  assert.ok(s.inventory.includes('face_guard')); assert.equal(choose(s,'guard'),false)
  assert.equal(changeFace(s,'guard'),true); assert.equal(choose(s,'guard'),true); assert.ok(s.flags.sealed_file)
})
test('换面会限制身份入口，井边换回沈砚之面可避免无选项', () => {
  const s=intro(); s.flags.guard_unlocked=true; assert.equal(changeFace(s,'guard'),true)
  rest(s); assert.ok(activityReason(s,activities.find(a=>a.id==='meal')!).includes('沈砚'))
  enterNode(s,'well_choice'); assert.equal(visibleChoices(s).filter(c=>c.available).length,0)
  assert.equal(changeFace(s,'shen'),true); assert.ok(visibleChoices(s).some(c=>c.available))
})
test('知道真相和接受玩家独立记录，单纯高羁绊不能代替信任事件', () => {
  const s=initialState(); s.stats.mother=90; s.flags.mother_knows_truth=true; refreshDerived(s)
  assert.equal(s.flags.mother_can_accept,false); assert.equal(s.flags.mother_accepts_player,undefined)
  s.flags.trust_meal=true; refreshDerived(s); assert.equal(s.flags.mother_can_accept,true)
})
test('坦诚后留下增加自主意愿，继续冒认留下有另一种后果', () => {
  for(const truth of [false,true]) {
    const s=intro(); s.flags.mother_knows_truth=truth; if(truth){s.flags.trust_meal=true;s.stats.mother=25;refreshDerived(s)} enterNode(s,'final_choice'); const before=s.stats.selfhood
    choose(s,truth?'stay_honest':'stay_mask'); assert.equal(s.stats.selfhood,before+(truth?5:-5)); assert.equal(s.ending,'stay')
  }
})
test('保存状态往返后不重放节点效果，无效存档会被拒绝', () => {
  const s=intro('question'); const loaded=JSON.parse(JSON.stringify(s)); assert.equal(isValidState(loaded),true)
  const before=loaded.stats.shen; enterNode(loaded,'arrival_end'); assert.equal(loaded.stats.shen,before)
  assert.equal(isValidState({...loaded,day:4}),false); assert.equal(isValidState({...loaded,nodeId:'missing'}),false)
  assert.equal(isValidState({...loaded,stats:{...loaded.stats,karma:Infinity}}),false)
})
test('三种井边处理与三种章末选择能组合成九种可通关状态', () => {
  for (const well of ['peace','ritual','deceive']) for (const final of ['stay_mask','truth_accept','leave']) {
    const s=intro(); s.clues.push('child_name','home_tree'); s.flags.knows_ritual=true; s.flags.trust_meal=true; s.stats.mother=35; refreshDerived(s)
    enterNode(s,'well_choice'); choose(s,well); until(s,'final_choice'); choose(s,final); until(s,'chapter_end'); advance(s)
    assert.equal(s.mode,'ending'); assert.equal(s.flags.seen_mansion_echo,true); assert.ok(isValidState(s))
  }
})
test('300 条确定性随机路线包含休息、换面和全部分支，均能结束且存档有效', () => {
  const endings=new Set<string>(); const resolutions=new Set<string>(); let randomSeed=8573
  function random(n:number) { randomSeed=(randomSeed*1664525+1013904223)>>>0;return Math.floor(randomSeed/4294967296*n) }
  for(let run=0;run<300;run++) {
    const s=startGame(); let budget=400
    while(s.mode!=='ending'&&budget-->0) {
      if(s.mode==='hub') {
        if(s.flags.guard_unlocked&&random(3)===0)changeFace(s,s.face==='guard'?'shen':'guard')
        const available=activities.filter(a=>!activityReason(s,a))
        if(!available.length||random(5)===0)rest(s);else beginActivity(s,available[random(available.length)].id)
      } else if(story[s.nodeId].choices) {
        let available=visibleChoices(s).filter(c=>c.available)
        if(!available.length&&s.nodeId==='well_choice'){changeFace(s,'shen');available=visibleChoices(s).filter(c=>c.available)}
        assert.ok(available.length,`路线 ${run} 卡在 ${s.nodeId}`)
        choose(s,available[random(available.length)].id)
      } else advance(s)
    }
    assert.ok(budget>0,`路线 ${run} 未能结束`); assert.ok(isValidState(s)); assert.ok(s.completed.length<=5)
    endings.add(s.ending!); resolutions.add(s.flags.child_at_peace?'peace':s.flags.child_bound?'bind':'deceive')
  }
  assert.equal(endings.size,3); assert.equal(resolutions.size,3)
})
