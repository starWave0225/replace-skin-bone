import test from 'node:test'
import assert from 'node:assert/strict'
import {chapterOneCommand as command,createChapterOne,isValidChapterOne,startChapterOne,type ChapterOneState,type ChapterOneCommand} from '../src/game/chapter-one'
import {chapterOneMap} from '../src/game/chapter-one-world'
import {collides,findPath,TILE,worldSpawn} from '../src/game/world'
import {createCombat,currentCombatIntent,performCombatAction} from '../src/game/combat'
import {initialState,isValidState,startGame,advance,choose,rest,changeFace} from '../src/game/engine'
import {newWellEncounter,advanceWellEncounter,performWellAction,wellLessons} from '../src/game/prologue-battle'
import {caseClues,dreamStations} from '../src/game/prologue'
import type {Location} from '../src/game/types'

function act(s:ChapterOneState,c:ChapterOneCommand){assert.equal(command(s,c),true,JSON.stringify(c));assert.ok(isValidChapterOne(JSON.parse(JSON.stringify(s))),`invalid after ${c.type}/${s.stage}`)}
function finish(s:ChapterOneState){let guard=0;while(s.dialogue&&!s.dialogue.lines[s.dialogue.index].choices){assert.ok(guard++<12);act(s,{type:'next'})}}
function approach(s:ChapterOneState,id:string){
  const map=chapterOneMap(s),spot=map.spots.find(p=>p.id===id);assert.ok(spot,`${map.id}/${id}`)
  const candidates=[]
  for(let x=1;x<map.width-1;x++)for(let y=1;y<map.height-1;y++){
    const p={x:(x+.5)*TILE,y:(y+.5)*TILE}
    if(Math.hypot(p.x-spot.x*TILE,p.y-spot.y*TILE)<60&&!collides(map,p.x,p.y)){
      const path=findPath(map,s.world,p);if(path.length||Math.hypot(s.world.x-p.x,s.world.y-p.y)<33)candidates.push({p,len:path.length})
    }
  }
  assert.ok(candidates.length,`unreachable ${map.id}/${id}`);candidates.sort((a,b)=>a.len-b.len)
  act(s,{type:'position',world:{...s.world,...candidates[0].p}})
}
function touch(s:ChapterOneState,id:string){approach(s,id);act(s,{type:'interact',id})}
function look(s:ChapterOneState,id:string){touch(s,id);finish(s)}
function face(s:ChapterOneState,value:'self'|'shen'){touch(s,'mirror');act(s,{type:'face',face:value});act(s,{type:'close'})}
function borrow(s:ChapterOneState,choice='truth',seat:'east'|'west'='west'){
  finish(s);touch(s,'exit');touch(s,'home');look(s,'mother');assert.equal(s.stage,'borrow')
  touch(s,'exit');touch(s,'theatre');look(s,'faceless');assert.equal(s.face,'shen')
  touch(s,'exit');touch(s,'home');touch(s,'mother');act(s,{type:'choice',id:choice});finish(s)
  look(s,'table');touch(s,'mother');act(s,{type:'seat',seat});finish(s)
  touch(s,'exit');touch(s,'studio')
}
function painting(s:ChapterOneState){
  for(const id of ['fragment-bridge','fragment-tree','fragment-well','frame'])look(s,id)
  touch(s,'painting')
  act(s,{type:'assemble'});assert.equal(s.flags.paintingAligned,undefined)
  act(s,{type:'swap',a:0,b:1});act(s,{type:'swap',a:1,b:2})
  for(let i=0;i<3;i++)while(s.pieces[i].turns)act(s,{type:'rotate',index:i})
  act(s,{type:'assemble'});assert.equal(s.flags.paintingAligned,true)
  act(s,{type:'overlay'});finish(s);assert.equal(s.stage,'lamps')
  look(s,'playbill');touch(s,'lamps');act(s,{type:'lamp',id:'eaves'});assert.equal(s.lampOrder.length,0)
  for(const id of ['gate','bridge','eaves'])act(s,{type:'lamp',id});finish(s);assert.equal(s.stage,'hang')
}
function child(s:ChapterOneState,id='truth'){
  touch(s,'exit');touch(s,'inn');touch(s,'well');touch(s,'well');finish(s)
  assert.equal(s.flags.lanternHung,true);act(s,{type:'choice',id});finish(s);assert.equal(s.stage,'cache')
  touch(s,'exit');touch(s,'exit');touch(s,'studio')
  look(s,'cache');assert.equal(s.stage,'cache');assert.equal(s.face,'shen')
  face(s,'self');look(s,'cache');assert.equal(s.stage,'battle')
}
function win(s:ChapterOneState){
  let turns=0
  while(s.battle?.status==='active'){
    assert.ok(turns++<40)
    const b=s.battle,action=b.enemy.skin===0?(b.ink>=3?'reveal':'attack'):b.ink<2?'breathe':'outline'
    act(s,{type:'combat',action})
  }
  assert.equal(s.battle?.status,'won');act(s,{type:'collect'});finish(s)
}

test('第一章可从青布走到韩七，谜题、借面、挂灯和战斗均存读有效',()=>{
  const s=createChapterOne();borrow(s);painting(s);child(s);win(s)
  touch(s,'exit');look(s,'han');assert.equal(s.stage,'complete')
  assert.ok(s.evidence.includes('record'));assert.ok(s.flags.childTruth);assert.ok(s.flags.toldTruth)
  assert.ok(s.stats.bond>=30);assert.ok(s.stats.selfhood>60)
  const root=initialState();root.chapterOne=s;root.world=s.world;root.mode='hub';assert.ok(isValidState(root))
  assert.equal(advance(root),false);assert.equal(choose(root,'wear'),false);assert.equal(rest(root),false);assert.equal(changeFace(root,'guard'),false)
})
test('认下身份、错坐饭桌和安慰小满仍能通关，失误不锁死主线',()=>{
  const s=createChapterOne();borrow(s,'mask','east');assert.ok(s.stats.trust<6)
  const stats={...s.stats};look(s,'fragment-bridge');look(s,'fragment-bridge');assert.deepEqual(s.stats,stats)
  painting(s);child(s,'promise');win(s);touch(s,'exit');look(s,'han');assert.equal(s.stage,'complete')
  assert.equal(s.flags.toldTruth,false);assert.ok(s.stats.selfhood<60)
})
test('沉默后可以坦白修复信任，修复与奖励不可重复刷取',()=>{
  const s=createChapterOne();borrow(s,'silent','east');touch(s,'exit');touch(s,'home');touch(s,'mother');act(s,{type:'choice',id:'truth'});finish(s)
  const trust=s.stats.trust;look(s,'mother');assert.equal(s.stats.trust,trust);assert.equal(s.flags.truthRepaired,true)
})
test('本相与借面看到不同细节，镜外不能换面，未收齐残画不可解开',()=>{
  const s=createChapterOne();borrow(s);touch(s,'painting');act(s,{type:'assemble'});assert.ok(s.message.includes('缺页'));act(s,{type:'close'})
  face(s,'self');look(s,'pigment');assert.equal(s.flags.pigmentSeen,undefined)
  face(s,'shen');look(s,'pigment');assert.ok(s.flags.pigmentSeen)
  assert.equal(command(s,{type:'face',face:'self'}),false)
  assert.equal(command(s,{type:'interact',id:'han'}),false)
  const old={...s.world};assert.equal(command(s,{type:'position',world:{...old,x:NaN}}),false);assert.deepEqual(old,s.world)
})
test('纸傀补相有预告，颜料只阻断一次补相，显形窗口不被提前关闭',()=>{
  let b=createCombat('shen','chapter-one');assert.equal(currentCombatIntent(b).name,'纸刃扫墨')
  b=performCombatAction(b,'attack').state;assert.equal(currentCombatIntent(b).kind,'repair')
  const noPrep=performCombatAction(b,'breathe').state;assert.equal(noPrep.enemy.skin,30)
  b.repairWeakened=true;const prepared=performCombatAction(b,'breathe').state;assert.equal(prepared.enemy.skin,24);assert.ok(prepared.pigmentSpent)
  assert.equal(performCombatAction(b,'swap').ok,false)
  b.enemy.skin=0;b.exposure=2;const exposed=performCombatAction(b,'breathe').state;assert.equal(exposed.enemy.skin,0);assert.equal(exposed.exposure,1)
})
test('战败可以重整，线索和人物选择保留，战胜前不可领取值夜录',()=>{
  const s=createChapterOne();borrow(s);painting(s);child(s)
  assert.equal(command(s,{type:'collect'}),false)
  while(s.battle!.status==='active')act(s,{type:'combat',action:'breathe'})
  assert.equal(s.battle!.status,'lost');const clues=[...s.evidence],stats={...s.stats};act(s,{type:'retry'});assert.deepEqual(s.evidence,clues);assert.deepEqual(s.stats,stats);assert.equal(s.battle!.turn,1);win(s)
})
test('每个调查物、铜镜与出入口均可从场景出生点寻路抵达',()=>{
  const s=createChapterOne();finish(s);s.unlocked=true;s.face='shen';s.flags.lanternHung=true
  for(const map of ['theatre','street','home','studio','inn','inn_well'] as Location[]){
    s.world=worldSpawn(map)
    for(const spot of chapterOneMap(s).spots){s.world=worldSpawn(map);approach(s,spot.id)}
  }
})
test('损坏的第一章拼图、战斗和位置信息会被拒绝读取',()=>{
  const s=createChapterOne();assert.ok(isValidChapterOne(s))
  assert.equal(isValidChapterOne({...s,pieces:[s.pieces[0],s.pieces[0],s.pieces[0]]}),false)
  assert.equal(isValidChapterOne({...s,lampOrder:['eaves']}),false)
  assert.equal(isValidChapterOne({...s,stage:'battle'}),false)
  assert.equal(isValidChapterOne({...s,world:{...s.world,map:'mansion'}}),false)
  assert.equal(isValidChapterOne({...s,face:'shen'}),false)
})
test('正式序章完成井边教学后可进入第一章，不能提前跳章或重复创建',()=>{
  const root=startGame(true);assert.equal(startChapterOne(root),false)
  const e=newWellEncounter();root.prologue!.wellEncounter=e
  while(e.stage!=='fight')assert.ok(advanceWellEncounter(e))
  for(const lesson of wellLessons)assert.ok(performWellAction(e,lesson.action))
  assert.ok(advanceWellEncounter(e));Object.assign(root.prologue!,{phase:'curtain',heardAppeal:true,clues:caseClues.map(c=>c.id),dreamSeen:dreamStations.map(c=>c.id),wallOpen:true,briefed:true,knocks:3,echo:'up',world:worldSpawn('inn_well')})
  assert.ok(isValidState(root))
  assert.ok(startChapterOne(root));assert.equal(root.prologue,undefined);assert.equal(root.chapterOne!.face,'self');assert.ok(root.chapterOne!.flags.heardAppeal)
  assert.ok(isValidState(root));assert.equal(startChapterOne(root),false)
  assert.ok(root.chapterOne!.evidence.includes('case-letter'))
})
