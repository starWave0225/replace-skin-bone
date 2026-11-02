import test from 'node:test'
import assert from 'node:assert/strict'
import { combatActionReason, createCombat, performCombatAction } from '../src/game/combat'
import type { CombatState } from '../src/game/combat'
import type { CombatAction } from '../src/game/combat-data'

function act(s:CombatState,id:CombatAction){const result=performCombatAction(s,id);assert.equal(result.ok,true,result.reason);return result.state}
function route(actions:CombatAction[],start=createCombat()){return actions.reduce(act,start)}

test('两面配合：辨相、换面、横刀、拘影、守息、断案六回合获胜',()=>{
  let s=createCombat()
  s=act(s,'observe');assert.deepEqual([s.hp,s.ink,s.mark],[92,2,3])
  s=act(s,'swap');assert.deepEqual([s.face,s.hp,s.ink,s.mark],['guard',87,2,2])
  s=act(s,'attack');assert.deepEqual([s.enemy.skin,s.enemy.hp,s.ink],[6,24,3])
  s=act(s,'bind');assert.deepEqual([s.enemy.skin,s.exposure,s.hp,s.ink],[0,2,87,1])
  s=act(s,'breathe');assert.deepEqual([s.exposure,s.hp,s.ink,s.counter],[1,81,3,true])
  s=act(s,'verdict');assert.deepEqual([s.status,s.turn,s.hp,s.ink,s.enemy.hp],['won',6,81,0,0])
})
test('破相伤害不溢入形；窗口从后续两次行动计数，守息与换面也消耗窗口',()=>{
  let s=createCombat();s.enemy.skin=2
  s=act(s,'outline');assert.deepEqual([s.enemy.hp,s.exposure,s.hp,s.ink],[24,2,100,3])
  s=act(s,'swap');assert.equal(s.exposure,1)
  s=act(s,'breathe');assert.deepEqual([s.enemy.skin,s.exposure,s.enemy.hp],[24,0,24])
})
test('两张面可各自通关：沈砚以勾线破相，周平以架刀反击后断案',()=>{
  const shen=route(['outline','attack','attack','breathe','reveal'])
  assert.equal(shen.status,'won')
  const guard=route(['parry','attack','verdict'],createCombat('guard'))
  assert.equal(guard.status,'won')
})
test('换面承接墨息、识破与反击势，冷却不能用连换绕过',()=>{
  let s=createCombat('guard');s.counter=true;s.mark=3;s.hp=50;s.ink=2
  s=act(s,'swap');assert.deepEqual([s.face,s.hp,s.ink,s.mark,s.counter],['shen',46,2,2,true])
  const rejected=performCombatAction(s,'swap');assert.equal(rejected.ok,false);assert.equal(rejected.state,s)
  s=act(s,'breathe');assert.equal(combatActionReason(s,'swap'),'')
})
test('拘影只截断当前可截断意图并进入冷却，换面不刷新冷却',()=>{
  let s=createCombat('guard');s.intentIndex=3
  s=act(s,'bind');assert.equal(s.hp,100);assert.ok(combatActionReason(s,'bind'))
  s=act(s,'swap');assert.equal(s.bindReadyAt,3)
  s=act(s,'breathe');s=act(s,'swap');assert.equal(combatActionReason(s,'bind'),'')
})
test('架刀不反击术法；实际减伤仍获得一次反击势',()=>{
  const initial=createCombat('guard');initial.intentIndex=1
  const s=act(initial,'parry')
  assert.deepEqual([s.hp,s.enemy.skin,s.counter],[97,24,true])
  assert.equal(s.log.filter(l=>l.text.includes('架刀反击')).length,0)
})
test('连击架刀只反击一次；反击破相后取消尚未到来的余段',()=>{
  const initial=createCombat('guard');initial.intentIndex=4;initial.enemy.skin=10
  const s=act(initial,'parry')
  assert.deepEqual([s.hp,s.enemy.skin,s.enemy.hp,s.exposure,s.counter],[98,0,24,2,false])
  assert.equal(s.log.filter(l=>l.text.includes('架刀反击')).length,1)
  const full=createCombat('guard');full.intentIndex=4
  const both=act(full,'parry');assert.equal(both.hp,96);assert.equal(both.enemy.skin,8);assert.equal(both.counter,false)
})
test('致命一击先判败，不会死后反击；胜利后也不再执行敌意',()=>{
  const fragile=createCombat('guard');fragile.hp=1
  const lost=act(fragile,'parry');assert.equal(lost.status,'lost');assert.equal(lost.enemy.skin,24)
  const finisher=createCombat('guard');finisher.enemy.skin=0;finisher.exposure=2;finisher.intentIndex=3
  const won=act(finisher,'verdict');assert.equal(won.status,'won');assert.equal(won.hp,100)
  assert.equal(performCombatAction(won,'attack').ok,false)
})
test('非法、缺墨和旧回合请求不修改状态；正常结算也不突变调用方数据',()=>{
  const s=createCombat();const snapshot=JSON.stringify(s)
  assert.equal(performCombatAction(s,'parry').ok,false)
  assert.equal(performCombatAction(s,'attack',0).ok,false)
  act(s,'outline');assert.equal(JSON.stringify(s),snapshot)
  s.ink=0;assert.equal(performCombatAction(s,'observe').ok,false)
  s.face='guard';assert.equal(performCombatAction(s,'verdict').ok,false)
})
test('识破只保留后续三次行动，反击可在最后一次行动消费',()=>{
  let s=act(createCombat(),'observe')
  s=act(s,'breathe');s=act(s,'breathe');assert.equal(s.mark,1)
  s=act(s,'breathe');assert.equal(s.mark,0)
  const g=createCombat('guard');g.mark=1
  const counter=act(g,'parry');assert.equal(counter.enemy.skin,0);assert.equal(counter.mark,0)
})
test('守息不会越过墨息上限，不发动攻击终会败退，重试恢复干净起点',()=>{
  let s=createCombat();s.ink=6;s=act(s,'breathe');assert.equal(s.ink,6)
  for(let i=0;i<50&&s.status==='active';i++)s=act(s,'breathe')
  assert.equal(s.status,'lost');assert.equal(s.hp,0)
  const retry=createCombat('guard');assert.deepEqual([retry.hp,retry.ink,retry.turn,retry.log.length,retry.status],[100,3,1,0,'active'])
})
