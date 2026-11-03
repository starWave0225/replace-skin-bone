<script setup lang="ts">
import { assetUrl } from '../game/asset-url'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import BattlePaperMask from './BattlePaperMask.vue'
import MusicControls from './MusicControls.vue'
import { useSceneMusic } from '../game/music'
import { combatFaces, combatMoves } from '../game/combat-data'
import type { CombatAction, CombatFace } from '../game/combat-data'
import { combatActionPreview, combatActionReason, createCombat, currentCombatIntent, performCombatAction } from '../game/combat'
import { classics } from '../game/classics'
import '../combat.css'

const startingFace=ref<CombatFace>('shen'),battle=ref(createCombat()),busy=ref(false),pulse=ref(''),notice=ref('')
const selected=ref<CombatAction>('attack'),lastAction=ref<CombatAction>(),enemyImpact=ref(0),heroImpact=ref(0),inkGain=ref(0)
let animation:ReturnType<typeof setTimeout>|undefined
useSceneMusic(computed(() => battle.value.status === 'active' ? 'battle' : battle.value.status === 'won' ? 'victory' : 'defeat'))
const face=computed(()=>combatFaces[battle.value.face]),intent=computed(()=>currentCombatIntent(battle.value))
const hiddenIntent=computed(()=>intent.value.concealed&&!battle.value.intentKnown)
const moves=computed(()=>face.value.moves.map((id,index)=>({id,key:index+1,...combatMoves[id],name:id==='attack'?(battle.value.face==='shen'?'点墨':'横刀'):combatMoves[id].name,reason:combatActionReason(battle.value,id),preview:combatActionPreview(battle.value,id)})))
const latest=computed(()=>[...battle.value.log].reverse())
const sprite=computed(()=>assetUrl(`/assets/combat/${battle.value.face==='shen'?'shen-back-v1':'guard-back-v1'}.webp`))
const selection=computed(()=>moves.value.find(m=>m.id===selected.value)??moves.value[0])
const lastReport=computed(()=>{
  const turn=battle.value.log.at(-1)?.turn
  const round=battle.value.log.filter(l=>l.turn===turn)
  const own=round.filter(l=>l.side==='player').at(-1)?.text
  const enemy=round.filter(l=>l.side==='enemy').at(-1)?.text
  return [own,enemy].filter(Boolean).join(' ')
})
const attacks=['attack','outline','reveal','bind','verdict'] as CombatAction[]
function moveType(id:CombatAction){return ({attack:'普攻',observe:'辨相',outline:'破相',reveal:'伤形',parry:'反击',bind:'截招',verdict:'伤形',breathe:'调息',swap:'借面'})[id]}
function briefReason(reason:string){
  if(reason.includes('须先破尽皮相'))return '须先破相'
  if(reason.includes('墨息不足'))return reason.replace('墨息不足，尚需 ','墨还差 ').replace(' 点。',' 点')
  if(reason.includes('调息中'))return '下回合可用'
  if(reason.includes('此阵已结束'))return '本局已结束'
  return reason
}

const original=computed(()=>classics.find(p=>p.id==='wear')!)
const started=computed(()=>battle.value.log.length>0)
const active=computed(()=>battle.value.status==='active')
function reset(next=startingFace.value){if(animation)clearTimeout(animation);startingFace.value=next;battle.value=createCombat(next);busy.value=false;pulse.value='';notice.value='';selected.value='attack';lastAction.value=undefined;enemyImpact.value=0;heroImpact.value=0;inkGain.value=0}
function act(id:CombatAction){
  if(busy.value)return
  const old=battle.value,result=performCombatAction(old,id,old.turn)
  if(!result.ok){notice.value=result.reason??'';return}
  busy.value=true;notice.value='';battle.value=result.state;selected.value='attack';lastAction.value=id
  enemyImpact.value=Math.max(0,old.enemy.skin-result.state.enemy.skin)+Math.max(0,old.enemy.hp-result.state.enemy.hp)
  heroImpact.value=Math.max(0,old.hp-result.state.hp);inkGain.value=Math.max(0,result.state.ink-old.ink)
  pulse.value=result.state.breaks>old.breaks?'break':id==='swap'?'swap':result.state.hp<old.hp?'hit':'cast'
  animation=setTimeout(()=>{busy.value=false;pulse.value='';lastAction.value=undefined;enemyImpact.value=0;heroImpact.value=0;inkGain.value=0},720)
}
function keyboard(e:KeyboardEvent){
  if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||['SELECT','INPUT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName))return
  const index=Number(e.key)-1
  if(index>=0&&index<4&&Number.isInteger(index)){e.preventDefault();act(moves.value[index].id)}
  else if(e.key.toLowerCase()==='q'){e.preventDefault();act('breathe')}
  else if(e.key.toLowerCase()==='f'){e.preventDefault();act('swap')}
}
onMounted(()=>window.addEventListener('keydown',keyboard))
onUnmounted(()=>{window.removeEventListener('keydown',keyboard);if(animation)clearTimeout(animation)})
</script>

<template>
  <main class="combat-preview" aria-label="画皮回合制战斗试玩">
    <div class="combat-inner">
      <header class="combat-header">
        <a class="combat-logo" href="./">画皮 <i>借面</i></a><span class="combat-edition">像素斗法 · 井边练习</span>
        <nav><MusicControls/><a href="./">返回首页</a><button @click="reset()">重开一局 ↻</button></nav>
      </header>
      <section class="combat-heading">
        <div><h1>借张脸，过两招！</h1><p>先破皮相，再让它露出真身。</p></div>
        <div class="combat-starting-face"><label for="combat-start-face">起手之面</label><select id="combat-start-face" v-model="startingFace" :disabled="started" @change="reset(startingFace)"><option value="shen">沈砚 · 画师</option><option value="guard">周平 · 故捕快</option></select></div>
      </section>

      <div class="combat-machine">
        <section class="combat-arena" :class="[pulse,`face-${battle.face}`,{'exposed':battle.enemy.skin===0,'enemy-hit':enemyImpact>0,'hero-hit':heroImpact>0,'hero-attacking':!!lastAction&&attacks.includes(lastAction)}]" aria-label="井边斗法场景">
          <img class="combat-landscape" src="/assets/combat/courtyard-v1.webp" alt=""/><div class="combat-scanlines" aria-hidden="true"></div>
          <span class="combat-scene-tag">槐阴 · 月下小院</span>

          <section class="combat-enemy-hud" aria-label="缠面影状态">
            <header><b>井中缠面影</b><span class="combat-type">怨灵</span></header>
            <div class="combat-stat-row"><span>皮相</span><div class="combat-meter skin" role="progressbar" aria-label="敌人皮相" :aria-valuenow="battle.enemy.skin" aria-valuemin="0" aria-valuemax="24"><i :style="{width:`${battle.enemy.skin/24*100}%`}"></i></div><b>{{battle.enemy.skin}}/24</b></div>
            <div class="combat-stat-row"><span>形</span><div class="combat-meter enemy" role="progressbar" aria-label="敌人的形" :aria-valuenow="battle.enemy.hp" aria-valuemin="0" aria-valuemax="24"><i :style="{width:`${battle.enemy.hp/24*100}%`}"></i></div><b>{{battle.enemy.hp}}/24</b></div>
            <div class="combat-enemy-state"><span v-if="battle.enemy.skin===0">原形露馅！<template v-if="active">余 {{battle.exposure}} 次行动</template></span><span v-else-if="battle.mark">识破 · 余 {{battle.mark}} 次行动</span><span v-else>这张脸，还能撑一会儿…</span></div>
          </section>

          <div class="combat-platform enemy-platform" aria-hidden="true"></div>
          <div class="combat-platform hero-platform" aria-hidden="true"></div>
          <figure class="combat-enemy-art" :class="{'is-down':battle.status==='won'}">
            <img class="combat-spirit" src="/assets/combat/spirit-v1.webp" alt="井中缠面影 · 像素战斗形象"/>
            <div class="combat-mask-cloud" aria-hidden="true"><BattlePaperMask class="combat-false-mask mask-left" expression="smile"/><BattlePaperMask class="combat-false-mask mask-right" expression="cross"/><BattlePaperMask class="combat-false-mask mask-front"/></div>
            <span v-if="enemyImpact" class="combat-number enemy-number" aria-hidden="true">−{{enemyImpact}}</span>
          </figure>
          <figure class="combat-hero" :key="battle.face" :class="{'is-down':battle.status==='lost'}">
            <img :src="sprite" :alt="`${face.name} · 像素战斗背影`"/>
            <span v-if="heroImpact" class="combat-number hero-number" aria-hidden="true">−{{heroImpact}}</span>
            <span v-if="inkGain" class="combat-number ink-number" aria-hidden="true">墨 +{{inkGain}}</span>
          </figure>

          <section class="combat-player-hud" aria-label="借面之人状态">
            <header><b>{{face.name}}</b><span class="combat-type">{{battle.face==='shen'?'画师':'捕快'}}</span></header>
            <div class="combat-stat-row"><span>形</span><div class="combat-meter" role="progressbar" aria-label="玩家的形" :aria-valuenow="battle.hp" aria-valuemin="0" aria-valuemax="100"><i :style="{width:`${battle.hp}%`}"></i></div><b>{{battle.hp}}/100</b></div>
            <div class="combat-ink" :aria-label="`墨息 ${battle.ink} / 6`"><span>墨息</span><div><i v-for="n in 6" :key="n" :class="{filled:n<=battle.ink}"></i></div><b>{{battle.ink}}/6</b></div>
            <span v-if="battle.counter" class="combat-counter">反击势 · 下一击 +4</span>
          </section>
          <div v-if="pulse==='break'" class="combat-break-callout" aria-hidden="true">露馅啦！<small>破相 · 显形两次行动</small></div>

          <section v-if="!active&&!busy" class="combat-result" role="status">
            <span class="combat-result-stamp">{{battle.status==='won'?'破相成功':'再来一回'}}</span>
            <h2>{{battle.status==='won'?'假脸掉了，怨气散了。':'这张面，有点撑不住啦。'}}</h2>
            <p>{{battle.status==='won'?`第 ${battle.turn} 回合胜出，余形 ${battle.hp}。`:'留意下一招，守息攒墨，换张面再试试。'}}<br/>这里只试招，井边归宿留给剧情。</p>
            <div><button @click="reset()">再试一阵 →</button><button @click="reset(startingFace==='shen'?'guard':'shen')">换一面起手</button></div>
          </section>
        </section>

        <section class="combat-command-deck" aria-label="选择本回合招式">
          <div class="combat-message-box">
            <div class="combat-turnline"><b>第 {{battle.turn}} 回合</b><span>{{active?(busy?'招式结算中…':'轮到你啦'):(battle.status==='won'?'这回你赢了！':'暂退重整')}}</span></div>
            <section class="combat-intent" aria-label="敌人本回合意图" :class="{heavy:intent.danger==='重'}"><span>对方下招</span><h2>{{hiddenIntent?'藏了一手？':intent.name}}<i v-if="intent.interruptible">可截断</i></h2><p>{{hiddenIntent?'假脸遮住了术势，试试辨相。':intent.description}}</p></section>
            <p v-if="lastReport" class="combat-last-report" aria-live="polite">{{lastReport}}</p><p v-else class="combat-welcome">井里的家伙，借了不止一张脸。</p>
            <p class="combat-selected-note"><b>{{selection.name}}</b> · {{selection.reason||selection.description}}</p>
          </div>
          <div class="combat-action-panel">
            <div class="combat-moves"><button v-for="move in moves" :key="move.id" :class="[`move-${move.id}`,{selected:selected===move.id}]" :disabled="busy||!!move.reason" :aria-label="`使用${move.name}`" :title="move.reason||move.description" @mouseenter="selected=move.id" @focus="selected=move.id" @click="act(move.id)"><span class="combat-move-top"><kbd>{{move.key}}</kbd><b>{{move.name}}</b><i>{{move.cost?'墨 −'+move.cost:'墨 +1'}}</i></span><span class="combat-move-bottom"><em>{{moveType(move.id)}}</em><strong>{{move.reason?briefReason(move.reason):move.preview}}</strong></span></button></div>
            <div class="combat-common"><button :disabled="busy||!active" @click="act('breathe')"><kbd>Q</kbd><b>守息</b><span>攒墨 +2 · 减伤</span></button><button :disabled="busy||!!combatActionReason(battle,'swap')" @click="act('swap')"><kbd>F</kbd><b>换面</b><span>{{combatActionReason(battle,'swap')?briefReason(combatActionReason(battle,'swap')):`借${battle.face==='shen'?'周平':'沈砚'}之面`}}</span></button></div>
          </div>
          <p v-if="notice" class="combat-notice" role="alert">{{notice}}</p>
        </section>
      </div>

      <details class="combat-notebook"><summary>招式小抄与斗法录 <span>1–4 出招 · Q 守息 · F 换面</span></summary><div class="combat-notebook-grid"><section class="combat-face-note"><h2>{{face.name}} · {{face.passive}}</h2><p>{{face.passiveText}}</p><p><b>沈砚</b>：辨相标记、勾线破相、落笔伤形。<br/><b>周平</b>：架刀反击、拘影截招、断案伤形。</p><details class="combat-guide"><summary>看一条两面配合的走法</summary><p>辨相 → 换周平 → 横刀 → 拘影 → 守息 → 断案。</p><p>有皮相时只破相，伤害不溢出。破相取消当回合敌意，随后两次显形行动仍要接招；守息与换面也占用行动。</p></details></section><section class="combat-log"><h2>斗法录</h2><p v-if="!latest.length">等你落下第一招。</p><ol v-else aria-label="战斗结算记录"><li v-for="(line,index) in latest" :key="`${latest.length}-${index}`" :class="line.side"><span>第 {{line.turn}} 回合 · {{line.side==='player'?'我方':line.side==='enemy'?'敌方':'形势'}}</span><p>{{line.text}}</p></li></ol></section></div></details>
      <footer class="combat-footer"><blockquote>“{{original.text}}”<cite>《聊斋志异 · 画皮》</cite></blockquote><p>两面一身 · 独立练习，不改剧情存档</p></footer>
    </div>
  </main>
</template>

