<script setup lang="ts">
import ScreenPages from './ScreenPages.vue'
import { assetUrl } from '../game/asset-url'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import BattlePaperMask from './BattlePaperMask.vue'
import MusicControls from './MusicControls.vue'
import BattleSelfSprite from './BattleSelfSprite.vue'
import { wellActionReason, wellCombat, wellClue, wellLessons } from '../game/prologue-battle'
import type { WellEncounter } from '../game/prologue-battle'
import { dreamSpirit } from '../game/prologue'
import { useSceneMusic } from '../game/music'
import { combatFaces, combatMoves } from '../game/combat-data'
import type { CombatAction, CombatFace } from '../game/combat-data'
import { combatActionPreview, combatActionReason, createCombat, currentCombatIntent, performCombatAction } from '../game/combat'
import { classics } from '../game/classics'
import '../combat.css'
import '../combat-tutorial.css'

const props=defineProps<{encounter?:WellEncounter;paused?:boolean}>()
const emit=defineEmits<{action:[id:CombatAction];next:[];exit:[]}>()
const tutorial=computed(()=>!!props.encounter)
const startingFace=ref<CombatFace>('shen'),practiceBattle=ref(createCombat()),busy=ref(false),pulse=ref(''),notice=ref('')
const battle=computed(()=>props.encounter?wellCombat(props.encounter):practiceBattle.value)
const helpPanel = ref<'lesson' | 'notebook'>()
const lesson=computed(()=>wellLessons[props.encounter?.actions.length??0])
const previousLesson=computed(()=>wellLessons[(props.encounter?.actions.length??0)-1])
function actionReason(id:CombatAction){return props.encounter ? wellActionReason(props.encounter,id)||combatActionReason(battle.value,id) : combatActionReason(battle.value,id)}

const selected=ref<CombatAction>('attack'),lastAction=ref<CombatAction>(),enemyImpact=ref(0),heroImpact=ref(0),inkGain=ref(0)
let animation:ReturnType<typeof setTimeout>|undefined
useSceneMusic(() => {
  if (tutorial.value) return 'prologue'
  if (battle.value.status === 'active') return 'battle'
  return battle.value.status === 'won' ? 'victory' : 'defeat'
}, 20)
const face=computed(()=>combatFaces[battle.value.face]),intent=computed(()=>currentCombatIntent(battle.value))
const hiddenIntent=computed(()=>intent.value.concealed&&!battle.value.intentKnown)
const moves=computed(()=>face.value.moves.map((id,index)=>({id,key:index+1,...combatMoves[id],name:id==='attack'?(battle.value.face==='shen'?'点墨':'横刀'):combatMoves[id].name,reason:actionReason(id),preview:combatActionPreview(battle.value,id)})))
const latest=computed(()=>[...battle.value.log].reverse())
const combatArt = '/assets/characters/ink/combat'
const sprite = computed(() => assetUrl(`${combatArt}/${battle.value.face}.webp`))
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
  if(reason.includes('本回合先'))return '循案记练习'
  if(reason.includes('先读完'))return '尚未开始'
  if(reason.includes('此阵已结束'))return '本局已结束'
  return reason
}

const original=computed(()=>classics.find(p=>p.id==='wear')!)
const started=computed(()=>battle.value.log.length>0)
const active=computed(()=>battle.value.status==='active')
function reset(next=startingFace.value){if(tutorial.value)return;if(animation)clearTimeout(animation);startingFace.value=next;practiceBattle.value=createCombat(next);busy.value=false;pulse.value='';notice.value='';selected.value='attack';lastAction.value=undefined;enemyImpact.value=0;heroImpact.value=0;inkGain.value=0}
function act(id:CombatAction){
  if(busy.value||props.paused||helpPanel.value)return
  const reason=actionReason(id);if(reason){notice.value=reason;return}
  const old=battle.value,result=performCombatAction(old,id,old.turn)
  if(!result.ok){notice.value=result.reason??'';return}
  busy.value=true;notice.value='';if(tutorial.value)emit('action',id);else practiceBattle.value=result.state;selected.value='attack';lastAction.value=id
  enemyImpact.value=Math.max(0,old.enemy.skin-result.state.enemy.skin)+Math.max(0,old.enemy.hp-result.state.enemy.hp)
  heroImpact.value=Math.max(0,old.hp-result.state.hp);inkGain.value=Math.max(0,result.state.ink-old.ink)
  pulse.value=result.state.breaks>old.breaks?'break':id==='swap'?'swap':result.state.hp<old.hp?'hit':'cast'
  animation=setTimeout(()=>{busy.value=false;pulse.value='';lastAction.value=undefined;enemyImpact.value=0;heroImpact.value=0;inkGain.value=0},720)
}
function keyboard(e:KeyboardEvent){
  if (e.key === 'Escape' && helpPanel.value && !props.paused) { helpPanel.value = undefined; return }
  if(props.paused||helpPanel.value||e.repeat||e.altKey||e.ctrlKey||e.metaKey||['SELECT','INPUT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName))return
  const index=Number(e.key)-1
  if(index>=0&&index<4&&Number.isInteger(index)){e.preventDefault();act(moves.value[index].id)}
  else if(e.key.toLowerCase()==='q'){e.preventDefault();act('breathe')}
  else if(e.key.toLowerCase()==='f'){e.preventDefault();act('swap')}
}
onMounted(()=>window.addEventListener('keydown',keyboard))
onUnmounted(()=>{window.removeEventListener('keydown',keyboard);if(animation)clearTimeout(animation)})
</script>

<template>
  <main class="combat-preview" :class="{'combat-tutorial':tutorial,'battle-paused':paused}" :aria-label="tutorial?'序章井边冤魂教学战':'画皮回合制战斗试玩'">
    <div class="combat-inner">
      <header class="combat-header">
        <button v-if="tutorial" class="combat-logo tutorial-logo" @click="emit('exit')">画皮 <i>借面</i></button><a v-else class="combat-logo" href="./">画皮 <i>借面</i></a><span class="combat-edition">{{tutorial?'序章 · 井畔怨声':'斗法试玩'}}</span>
        <nav><MusicControls/><button v-if="tutorial" @click="emit('exit')">暂别此事 ↗</button><template v-else><a href="./" aria-label="返回首页">首页</a><button aria-label="重开一局" @click="reset()">重开 ↻</button></template></nav>
      </header>
      <section class="combat-heading">
        <div><h1>{{tutorial?'井边冤魂':'斗法'}}</h1></div>
        <div v-if="!tutorial" class="combat-starting-face"><label for="combat-start-face">起手之面</label><select id="combat-start-face" aria-label="起手之面" v-model="startingFace" :disabled="started" @change="reset(startingFace)"><option value="shen">沈砚 · 画师</option><option value="guard">周平 · 故捕快</option></select></div>
        <button v-if="encounter?.stage==='fight'" class="combat-help-button" @click="helpPanel='lesson'">教学 {{encounter.actions.length+1}} / {{wellLessons.length}}</button>
        <button v-if="!encounter||encounter.stage==='fight'" class="combat-help-button" @click="helpPanel='notebook'">斗法录</button>
      </section>

      <section v-if="encounter?.stage==='intro'" class="combat-lesson encounter-intro" aria-label="井边遭遇" role="dialog">
        <img :src="dreamSpirit.portrait" alt="白衣冤魂"/>
        <div class="combat-story-copy"><ScreenPages><span>井畔有声 · 尚未交手</span><h2>「莫认那张脸……」</h2><p>井水映出昨夜的白衣妇人，重重假面裹着她的怨气，忽向你扑来。梦里的笔法犹在指间，你提笔护住本心。</p><p>此战先学一人一招的回合规则，再练辨相、破相、回墨与伤形。换面须日后往无面茶楼求教。</p></ScreenPages><button :disabled="paused" @click="emit('next')">提笔应战 · 开始教学 →</button></div>
      </section>
      <div v-if="!encounter||encounter.stage==='fight'" class="combat-machine" :inert="!!helpPanel">
        <section class="combat-arena" :class="[pulse,`face-${battle.face}`,{'exposed':battle.enemy.skin===0,'enemy-hit':enemyImpact>0,'hero-hit':heroImpact>0,'hero-attacking':!!lastAction&&attacks.includes(lastAction)}]" aria-label="井边斗法场景">
          <img class="combat-landscape" :src="assetUrl(`${combatArt}/courtyard.webp`)" alt=""/>
          <span class="combat-scene-tag">{{tutorial?'栖雨客舍 · 梦醒后井':'未闻县 · 月下小院'}}</span>

          <section class="combat-enemy-hud" :aria-label="tutorial?'冤魂状态':'缠面影状态'">
            <header><b>{{tutorial?'井边冤魂':'井中缠面影'}}</b><span class="combat-type">怨灵</span></header>
            <div class="combat-stat-row"><span>皮相</span><div class="combat-meter skin" role="progressbar" aria-label="敌人皮相" :aria-valuenow="battle.enemy.skin" aria-valuemin="0" aria-valuemax="24"><i :style="{width:`${battle.enemy.skin/24*100}%`}"></i></div><b>{{battle.enemy.skin}}/24</b></div>
            <div class="combat-stat-row"><span>形</span><div class="combat-meter enemy" role="progressbar" aria-label="敌人的形" :aria-valuenow="battle.enemy.hp" aria-valuemin="0" aria-valuemax="24"><i :style="{width:`${battle.enemy.hp/24*100}%`}"></i></div><b>{{battle.enemy.hp}}/24</b></div>
            <div class="combat-enemy-state"><span v-if="battle.enemy.skin===0">已破相<template v-if="active">余 {{battle.exposure}} 次行动</template></span><span v-else-if="battle.mark">识破 · 余 {{battle.mark}} 次行动</span><span v-else>未破相</span></div>
          </section>

          <div class="combat-platform enemy-platform" aria-hidden="true"></div>
          <div class="combat-platform hero-platform" aria-hidden="true"></div>
          <figure class="combat-enemy-art" :class="{'is-down':battle.status==='won'}">
            <img class="combat-spirit" :src="assetUrl(`${combatArt}/wraith.webp`)" :alt="tutorial?'井边冤魂':'井中缠面影'"/>
            <div class="combat-mask-cloud" aria-hidden="true"><BattlePaperMask class="combat-false-mask mask-left" expression="smile"/><BattlePaperMask class="combat-false-mask mask-right" expression="cross"/><BattlePaperMask class="combat-false-mask mask-front"/></div>
            <span v-if="enemyImpact" class="combat-number enemy-number" aria-hidden="true">−{{enemyImpact}}</span>
          </figure>
          <figure class="combat-hero" :key="battle.face" :class="{'is-down':battle.status==='lost'}">
            <BattleSelfSprite v-if="tutorial"/><img v-else :src="sprite" :alt="`${face.name} · 战斗背影`"/>
            <span v-if="heroImpact" class="combat-number hero-number" aria-hidden="true">−{{heroImpact}}</span>
            <span v-if="inkGain" class="combat-number ink-number" aria-hidden="true">墨 +{{inkGain}}</span>
          </figure>

          <section class="combat-player-hud" :aria-label="tutorial?'陆知微状态':'借面之人状态'">
            <header><b>{{tutorial?'陆知微':face.name}}</b><span class="combat-type">{{tutorial?'抄书人':battle.face==='shen'?'画师':'捕快'}}</span></header>
            <div class="combat-stat-row"><span>形</span><div class="combat-meter" role="progressbar" aria-label="玩家的形" :aria-valuenow="battle.hp" aria-valuemin="0" aria-valuemax="100"><i :style="{width:`${battle.hp}%`}"></i></div><b>{{battle.hp}}/100</b></div>
            <div class="combat-ink" :aria-label="`墨息 ${battle.ink} / 6`"><span>墨息</span><div><i v-for="n in 6" :key="n" :class="{filled:n<=battle.ink}"></i></div><b>{{battle.ink}}/6</b></div>
            <span v-if="battle.counter" class="combat-counter">反击势 · 下一击 +4</span>
          </section>
          <div v-if="pulse==='break'" class="combat-break-callout" aria-hidden="true">破相<small>破相 · 显形两次行动</small></div>


        </section>

        <section class="combat-command-deck" aria-label="选择本回合招式">
          <div class="combat-message-box">
            <div class="combat-turnline"><b>第 {{battle.turn}} 回合</b><span>{{active?(encounter?.stage==='intro'?'读完遭遇后开始':busy?'招式结算中…':'选择招式'):(battle.status==='won'?'获胜':'暂退重整')}}</span></div>
            <section class="combat-intent" aria-label="敌人本回合意图" :class="{heavy:intent.danger==='重'}"><span>对方下招</span><h2>{{hiddenIntent?'藏了一手？':intent.name}}<i v-if="intent.interruptible">{{tutorial?'可破相打断':'可截断'}}</i></h2><p>{{!active?'怨势已息，暂停交手。':hiddenIntent?'假脸遮住了术势，试试辨相。':tutorial&&intent.name==='夺相'?'重击伤形 24，可用守息减伤。':intent.description}}</p></section>
            <p v-if="lastReport" class="combat-last-report" aria-live="polite">{{lastReport}}</p>
            <p class="combat-selected-note"><b>{{selection.name}}</b> · {{selection.reason||selection.description}}</p>
          </div>
          <div class="combat-action-panel">
            <div class="combat-moves"><button v-for="move in moves" :key="move.id" :class="[`move-${move.id}`,{selected:selected===move.id,'lesson-target':tutorial&&lesson?.action===move.id}]" :disabled="paused||busy||!!move.reason" :aria-label="`使用${move.name}`" :title="move.reason||move.description" @mouseenter="selected=move.id" @focus="selected=move.id" @click="act(move.id)"><span class="combat-move-top"><kbd>{{move.key}}</kbd><b>{{move.name}}</b><i>{{move.cost?'墨 −'+move.cost:'墨 +1'}}</i></span><span class="combat-move-bottom"><em>{{moveType(move.id)}}</em><strong>{{move.reason?briefReason(move.reason):move.preview}}</strong></span></button></div>
            <div class="combat-common"><button :class="{'lesson-target':tutorial&&lesson?.action==='breathe'}" :disabled="paused||busy||!active||!!actionReason('breathe')" @click="act('breathe')"><kbd>Q</kbd><b>守息</b><span>攒墨 +2 · 减伤</span></button><button v-if="!tutorial" :disabled="paused||busy||!!combatActionReason(battle,'swap')" @click="act('swap')"><kbd>F</kbd><b>换面</b><span>{{combatActionReason(battle,'swap')?briefReason(combatActionReason(battle,'swap')):`借${battle.face==='shen'?'周平':'沈砚'}之面`}}</span></button></div>
          </div>
          <p v-if="notice" class="combat-notice" role="alert">{{notice}}</p>
        </section>
      </div>

          <section v-if="!tutorial&&!active&&!busy" class="combat-result" role="status">
            <span class="combat-result-stamp">{{battle.status==='won'?'破相成功':'再来一回'}}</span>
            <h2>{{battle.status==='won'?(tutorial?'怨势暂歇':'获胜'):'落败'}}</h2>
            <p>{{battle.status==='won'?`第 ${battle.turn} 回合胜出，余形 ${battle.hp}。`:'留意下一招，守息攒墨，换张面再试试。'}}</p>
            <div><button @click="reset()">再试一阵 →</button><button @click="reset(startingFace==='shen'?'guard':'shen')">换一面起手</button></div>
          </section>
      <section v-if="encounter?.stage==='aftermath'" class="combat-lesson encounter-aftermath" aria-label="战后井边线索" role="dialog">
        <img :src="dreamSpirit.portrait" alt="白衣冤魂"/><div class="combat-story-copy"><ScreenPages><span>怨势暂歇 · 人鬼未明</span><h2>「旧谱……问那执笔的人。」</h2><p>白衣妇人伸手指向井沿，旋即散入水雾。{{wellClue.text}}</p><p>你已学会：查看敌意 → 积攒墨息 → 破相打断 → 趁两次显形行动伤形。守息与换面同样占一回合；借面之术仍待茶楼传授。</p></ScreenPages><button :disabled="paused||busy" @click="emit('next')">拾起青布 · 回到井边 →</button></div>
      </section>
      <section v-if="helpPanel" class="combat-help" role="dialog" :aria-label="helpPanel==='lesson'?'本回合机制教学':'招式小抄与斗法录'">
        <header><h2>{{helpPanel==='lesson'?lesson?.title:'招式小抄与斗法录'}}</h2><button @click="helpPanel=undefined">收起</button></header>
        <ScreenPages>
          <template v-if="helpPanel==='lesson'"><p v-if="previousLesson" class="lesson-feedback">{{previousLesson.after}}</p><p>{{lesson?.text}}</p></template>
          <template v-else><div class="combat-notebook-grid"><section v-if="!tutorial" class="combat-face-note"><h2>{{face.name}} · {{face.passive}}</h2><p>{{face.passiveText}}</p><p><b>沈砚</b>：辨相标记、勾线破相、落笔伤形。<br/><b>周平</b>：架刀反击、拘影截招、断案伤形。</p><details class="combat-guide"><summary>查看当前招式说明</summary><p v-for="move in moves" :key="move.id"><b>{{move.name}}</b> · {{move.description}}</p><p><b>守息</b> · {{combatMoves.breathe.description}}</p><p><b>换面</b> · {{combatMoves.swap.description}}</p></details><details class="combat-guide"><summary>看一条两面配合的走法</summary><p>辨相 → 换周平 → 横刀 → 拘影 → 守息 → 断案。</p><p>有皮相时只破相，伤害不溢出。破相取消当回合敌意，随后两次显形行动仍要接招；守息与换面也占用行动。</p></details></section><section v-if="tutorial" class="combat-face-note"><h2>梦中余墨</h2><p>本战不借用他人身份。陆知微只凭梦中记下的笔法应急，破相时回复 1 墨息；面谱仍未开启。</p><p>金框为本步招式。正式剧情会保存每次行动；从存档回来可接着练习。</p></section><section class="combat-log"><h2>斗法录</h2><p v-if="!latest.length">等你落下第一招。</p><ol v-else aria-label="战斗结算记录"><li v-for="(line,index) in latest" :key="`${latest.length}-${index}`" :class="line.side"><span>第 {{line.turn}} 回合 · {{line.side==='player'?'我方':line.side==='enemy'?'敌方':'形势'}}</span><p>{{line.text}}</p></li></ol></section></div><blockquote>“{{original.text}}”<cite>《聊斋志异 · 画皮》</cite></blockquote></template>
        </ScreenPages>
      </section>
      <footer class="combat-footer"><blockquote>“{{original.text}}”<cite>《聊斋志异 · 画皮》</cite></blockquote><p>{{tutorial?'序章剧情战 · 跟随案记逐步练习':'独立试玩，不影响剧情存档'}}</p></footer>
    </div>
  </main>
</template>

