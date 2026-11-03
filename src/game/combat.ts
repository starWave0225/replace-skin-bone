import { combatFaces, combatIntents, combatMoves } from './combat-data'
import type { CombatAction, CombatFace } from './combat-data'
export interface CombatLog {turn:number;side:'player'|'enemy'|'system';text:string}
export interface CombatState {
  context?: 'prologue';
  turn:number;face:CombatFace;hp:number;ink:number;
  enemy:{hp:number;skin:number;maxHp:number;maxSkin:number};
  intentIndex:number;exposure:number;mark:number;counter:boolean;intentKnown:boolean;
  swapReadyAt:number;bindReadyAt:number;status:'active'|'won'|'lost';
  breaks:number;damageTaken:number;log:CombatLog[];
}
export function createCombat(face:CombatFace='shen', context?:'prologue'):CombatState{
  return {context,turn:1,face,hp:100,ink:3,enemy:{hp:24,skin:24,maxHp:24,maxSkin:24},intentIndex:0,exposure:0,mark:0,counter:false,intentKnown:false,swapReadyAt:1,bindReadyAt:1,status:'active',breaks:0,damageTaken:0,log:[]}
}
export function currentCombatIntent(s:CombatState){return combatIntents[s.intentIndex%combatIntents.length]}
export function combatActionReason(s:CombatState,id:CombatAction):string{
  if(s.status!=='active')return '此阵已结束，重新试法即可再战。'
  if(id==='swap'&&s.context==='prologue')return '尚未学会借面，须到无面茶楼问法。'
  const move=combatMoves[id]
  if(!move)return '没有这门招式。'
  if(move.face&&move.face!==s.face)return '须先换上此招所属的面。'
  if(s.ink<move.cost)return `墨息不足，尚需 ${move.cost-s.ink} 点。`
  if(id==='verdict'&&s.enemy.skin>0)return '须先破尽皮相，使敌人显形。'
  if(id==='swap'&&s.turn<s.swapReadyAt)return '换面调息中，下回合恢复。'
  if(id==='bind'&&s.turn<s.bindReadyAt)return '拘影调息中，下回合恢复。'
  return ''
}
function attackValues(s:CombatState,id:CombatAction){
  const move=combatMoves[id]
  if(id==='attack')return s.face==='shen'?{skin:6,body:8}:{skin:10,body:10}
  return {skin:move.skin,body:move.body}
}
export function combatActionPreview(s:CombatState,id:CombatAction):string{
  if(id==='observe')return '识破 · 下一次攻击 +8'
  if(id==='breathe')return `墨息 +${Math.min(2,6-s.ink)} · 受伤减半`
  if(id==='swap')return `换作${combatFaces[s.face==='shen'?'guard':'shen'].name} · 受伤减半`
  if(id==='verdict'&&s.enemy.skin>0)return '显形后可用 · 伤形 28'
  const values=attackValues(s,id),base=s.enemy.skin>0?values.skin:values.body
  const bonus=(s.mark>0?8:0)+(s.counter?4:0)
  if(id==='parry'){
    const intent=currentCombatIntent(s)
    return intent.kind==='attack'?`减伤 75% · 反击${s.enemy.skin>0?'破相':'伤形'} ${Math.min(s.enemy.skin>0?s.enemy.skin:s.enemy.hp,base+(s.mark>0?8:0)+4)}`:'减伤 75% · 此意图不触发反击'
  }
  return `${s.enemy.skin>0?'破相':'伤形'} ${base>0?Math.min(s.enemy.skin>0?s.enemy.skin:s.enemy.hp,base+bonus):0}${id==='attack'?' · 墨息 +1':''}${id==='bind'&&currentCombatIntent(s).interruptible?' · 截断敌意':''}`
}

/** One complete, deterministic round. The caller's state is never changed. */
export function performCombatAction(previous:CombatState,id:CombatAction,expectedTurn=previous.turn):{ok:boolean;state:CombatState;reason?:string}{
  if(expectedTurn!==previous.turn)return {ok:false,state:previous,reason:'这次行动所属的回合已经结束。'}
  const reason=combatActionReason(previous,id)
  if(reason)return {ok:false,state:previous,reason}
  const s:CombatState={...previous,enemy:{...previous.enemy},log:[...previous.log]}
  const intent=currentCombatIntent(s),alreadyExposed=s.enemy.skin===0&&s.exposure>0,oldMark=s.mark
  let broken=false,cancelled=false,markCreated=false,counterGranted=false
  const say=(side:CombatLog['side'],text:string)=>s.log.push({turn:s.turn,side,text})
  function win(){if(s.enemy.hp<=0){s.status='won';say('system',s.context==='prologue'?'皮相散尽，怨势暂息。井中哭声渐低，且听她诉说。':'皮相散尽，怨势暂息。此处只演练压制，不替任何人决定归宿。');return true}return false}
  function hitEnemy(values:{skin:number;body:number},name:string){
    const skin=s.enemy.skin>0,base=skin?values.skin:values.body
    if(base<=0)return
    const bonus=(s.mark>0?8:0)+(s.counter?4:0),damage=base+bonus
    if(s.mark>0){s.mark=0;say('system','识破生效，此次攻击 +8。')}
    if(s.counter){s.counter=false;say('system','反击势生效，此次攻击 +4。')}
    if(skin){
      const actual=Math.min(s.enemy.skin,damage);s.enemy.skin-=actual;say('player',`${name}，破相 ${actual}。`)
      if(s.enemy.skin===0){
        broken=true;cancelled=true;s.exposure=2;s.breaks++;say('system','破相！取消本回合未执行的敌意，打开后续两次行动的显形窗口。')
        if(s.face==='shen'){s.ink=Math.min(6,s.ink+1);say('system','入微：破相回复 1 墨息。')}
      }
    }else{const actual=Math.min(s.enemy.hp,damage);s.enemy.hp-=actual;say('player',`${name}，伤形 ${actual}。`);win()}
  }
  s.ink-=combatMoves[id].cost
  if(id==='observe'){s.intentKnown=true;s.mark=3;markCreated=true;say('player','辨相：揭示伪装意图，识破留至后续三次行动内。')}
  else if(id==='breathe'){const restored=Math.min(2,6-s.ink);s.ink+=restored;say('player',`守息，回复 ${restored} 墨息，护住此相。`)}
  else if(id==='swap'){s.face=s.face==='shen'?'guard':'shen';s.swapReadyAt=s.turn+2;say('player',`换作${combatFaces[s.face].name}。形与墨息承接不变，本次受伤减半。`)}
  else if(id==='parry')say('player','架刀候敌：减免本次敌方伤害，等待第一段直接扑击。')
  else{
    const name=id==='attack'?(s.face==='shen'?'点墨':'横刀'):combatMoves[id].name
    hitEnemy(attackValues(s,id),name)
    if(id==='attack')s.ink=Math.min(6,s.ink+1)
    if(id==='bind'){s.bindReadyAt=s.turn+2;if(intent.interruptible){cancelled=true;say('system','拘影截断本回合敌意。')}}
  }
  if(s.status==='active'){
    if(cancelled)say('enemy',`${intent.name}未能施展。`)
    else if(!intent.hits.length)say('enemy','水缚蓄势，下一回合将夺相。')
    else{
      let countered=false
      for(const raw of intent.hits){
        const ratio=id==='parry'?.25:id==='breathe'||id==='swap'?.5:1,damage=Math.ceil(raw*ratio)
        s.hp=Math.max(0,s.hp-damage);s.damageTaken+=damage;say('enemy',`${intent.name}，伤形 ${damage}${damage<raw?`（减免 ${raw-damage}）`:''}。`)
        if(s.hp<=0){s.status='lost';say('system','形已难支。暂退重整，此次试法不损剧情存档。');break}
        if(!counterGranted&&s.face==='guard'&&(id==='breathe'||id==='parry')&&damage<raw){counterGranted=true;s.counter=true;say('system','不退：获得反击势，下一次攻击 +4。')}
        if(id==='parry'&&intent.kind==='attack'&&!countered){countered=true;hitEnemy({skin:12,body:12},'架刀反击');if(s.status!=='active'||broken)break}
      }
    }
  }
  if(s.status==='active'){
    if(oldMark>0&&!markCreated&&s.mark>0){s.mark--;if(!s.mark)say('system','识破的余痕散去。')}
    if(alreadyExposed&&!broken)s.exposure--
    s.turn++;s.intentIndex=(s.intentIndex+1)%combatIntents.length
    if(s.enemy.skin===0&&s.exposure===0&&s.enemy.maxSkin>0){s.enemy.skin=s.enemy.maxSkin;say('system','显形窗口已尽，缠面影重新补相。')}
  }
  s.log=s.log.slice(-120)
  return {ok:true,state:s}
}
