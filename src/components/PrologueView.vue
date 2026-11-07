<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { caseClues, echoDirections, hasCaseEvidence, prologueHintIds, verseDoors } from '../game/prologue'
import type { DreamPose, DreamStationId, PrologueState } from '../game/prologue'
import { prologueMap } from '../game/prologue-world'
import { playWellKnock } from '../game/well-echo-audio'
import type { WorldSpot } from '../game/world'
import type { Location, WorldState } from '../game/types'
import type { CombatAction } from '../game/combat-data'
import { getDialoguePortrait } from '../game/portraits'
import TaskGuideShortcut from './TaskGuideShortcut.vue'
import ScreenPages from './ScreenPages.vue'
import WorldView from './WorldView.vue'
import MusicControls from './MusicControls.vue'
import DialoguePortrait from './DialoguePortrait.vue'
import OpeningCinematic from './OpeningCinematic.vue'
import PrologueCurtain from './PrologueCurtain.vue'
import StoryCinematic from './StoryCinematic.vue'
import '../prologue.css'

const CombatEncounter = defineAsyncComponent(() => import('./CombatPreview.vue'))
const DreamExploration = defineAsyncComponent(() => import('./DreamExploration.vue'))
const props = defineProps<{ state: PrologueState; motion: boolean; paused?: boolean; standalone?: boolean }>()
const emit = defineEmits<{
  next: []; inspect: [id: string]; event: [id: string]; unlock: [answer: string]; knock: [];
  dreamInspect: [id: DreamStationId]; dreamPose: [pose: DreamPose]; position: [position: WorldState];
  travel: [destination: Location]; battle: [door: string]; battleAction: [id: CombatAction]; battleNext: []; exit: [];
}>()

const note = ref<{ title: string; text: string; speaker: string; letter?: boolean; room?: string }>()
const formOpen = ref(false)
const answer = ref('')
const wrongAnswer = ref(false)
const guideOpen = ref(false)
const phase = computed(() => props.state.phase)
const encounter = computed(() => props.state.wellEncounter)
const inBattle = computed(() => !!encounter.value && encounter.value.stage !== 'complete')
const map = computed(() => prologueMap(props.state))
const hints = computed(() => prologueHintIds(props.state))
const echoCaption = computed(() => props.state.echo ? `回声从${echoDirections[props.state.echo]}传来。` : '')

function say(speaker: string, title: string, text: string, letter = false) {
  note.value = { speaker, title, text, letter }
}
function speakToOwner() {
  if (hasCaseEvidence(props.state)) {
    emit('event', 'owner')
    say('客舍掌柜', '镜前的泥', '你说泥是从镜前起的？近来另有两宗入室命案，也是凶器、凶手全无踪影……陆先生，可否告知生辰？\n你把生辰说了。掌柜掐指一算，脸色微变：“年、月、日、时皆属阴，竟是纯阴之体。或许你能看见常人看不见的东西。”\n廊外传来捕快的脚步。掌柜压低声音：“西街尽处有间无面茶楼。若真有些不干净的缘故，那里的人，比我们知道得多。”')
  } else {
    say('客舍掌柜', '东厢的客人', '许先生酉时一个人来的。戌初屋里却有说话声。你是他约来校谱的陆先生？东厢的东西还在原处。')
  }
}
function interact(spot: WorldSpot) {
  if (spot.destination) {
    if (spot.id === 'downstairs' && phase.value === 'morning' && !props.state.briefed) say('陆知微', '梦方醒', '无面娘就在屋里。先问问她昨夜的事。')
    else emit('travel', spot.destination)
    return
  }
  const door = verseDoors.find(d=>d.id===spot.id)
  if(door){emit('event','read_'+door.id);note.value={speaker:'陆知微',title:door.name+' · 门上题诗',text:door.lines.join('\n'),room:door.id};return}
  const clue = caseClues.find(entry => entry.id === spot.id)
  if (clue) {
    emit('inspect', clue.id)
    say('陆知微', clue.title, clue.text, clue.id === 'letter')
    return
  }
  switch (spot.id) {
    case 'owner':
      speakToOwner()
      break
    case 'appeal':
      emit('event', 'appeal')
      say('卖灯人', '喊冤', '我儿绝不是凶手！案发那晚他还在替我挑灯，怎会去杀人？我要到县衙请命！\n旁人低声劝他莫喊，怕连自己也牵连进去。')
      break
    case 'faceless':
      say('无面娘', '隔夜茶', '你问起许文卿和近日的命案。无面娘理着旧戏单的手停了一瞬。\n“楼上有空座。”\n她又低下头，再不接你的话。')
      break
    case 'playbill':
      say('陆知微', '戏台的旧曲牌', '旧楹联，红褪墨残谁来揭？\n曲牌一角被烟熏黑，余句已经辨不出了。')
      break
    case 'hidden_wall':
      emit('event', 'wall')
      say('陆知微', '隔墙暗室', '墙板下沿有一道细缝。顺着缝向里一推，墙板向侧面滑开，里面露出一只木匣。')
      break
    case 'secret_box':
      answer.value = ''
      wrongAnswer.value = false
      formOpen.value = true
      break
    case 'briefing':
      emit('event', 'briefing')
      say('无面娘', '借一双眼', '这间客房你先住着。你若要查借相，便得借旁人的眼睛看旧事。前阵子有个画师叫沈砚，冤死在狱里。往后，他或可成为你的第二张脸。\n梦里给你的只是一缕魂力。真正借面，须依面谱行术，替亡者了却心愿，才好放其魂魄归去。\n皮囊之术会损人性命。七日之内，办完未竟之事，将借来的面归还；过了期限，后果不堪设想。\n不过，先去栖雨客舍后堂，看看那口枯井。耳朵听见的、眼睛看见的，你自己分辨。')
      break
    case 'well_spirit':
      if (!props.state.echo) emit('knock')
      void playWellKnock(props.state.echo)
      break
    default:
      if (spot.id.startsWith('echo_')) {
        const direction = spot.id.slice(5)
        if (direction === props.state.echo) emit('battle', direction)
        else say('陆知微', '门后无声', '推门只见一面冷墙。回井边再听一遍。')
      }
  }
}
function chooseVerseRoom(id:string){
  const door=verseDoors.find(d=>d.id===id)
  if(!verseDoors.every(d=>props.state.verseDoorsSeen?.includes(d.id))){say('陆知微','尚缺两相对照','先把三扇门上的诗都读一遍，再辨哪一处不合韵。');return}
  if(!door?.wrong){say('陆知微','韵脚相应','两句尾字读来相应。推门只见寻常客房，秘密应在别处。');return}
  emit('event','enter_'+id)
  say('陆知微','一字失韵','“明”与“水”不押韵。推门入内，一幅旧楹联挂得比旁边的画略高，墙板下沿露着细缝。')
}
function submitBox() {
  emit('unlock', answer.value)
  if (props.state.phase === 'search') wrongAnswer.value = true
}
watch(phase, (value, previous) => {
  guideOpen.value = false
  formOpen.value = false
  if (previous === 'dream' && value === 'morning') say('陆知微', '醒在茶楼', '身下是一张陌生的床。窗外雨势已歇，床边那盏茶还热着。无面娘正站在屋里。')
})
</script>

<template>
  <OpeningCinematic v-if="phase === 'arrival'" :motion="motion" :paused="paused" @finish="emit('next')" @exit="emit('exit')"/>
  <PrologueCurtain v-else-if="phase === 'curtain'" :motion="motion" @exit="emit('exit')" @next="emit('next')"/>
  <StoryCinematic v-else-if="phase === 'blackout'" key="ambush" scene="ambush" :motion="motion" :paused="paused" @finish="emit('next')" @exit="emit('exit')"/>
  <DreamExploration v-else-if="phase === 'dream'" :visited="state.dreamSeen" :pose="state.dreamPose" :paused="paused" @inspect="emit('dreamInspect', $event)" @pose="emit('dreamPose', $event)" @finish="emit('next')" @exit="emit('exit')"/>
  <StoryCinematic v-else-if="encounter?.stage === 'cinematic'" key="well" scene="well" :motion="motion" :paused="paused" @finish="emit('battleNext')" @exit="emit('exit')"/>
  <CombatEncounter v-else-if="inBattle && encounter" :encounter="encounter" :paused="paused" @action="emit('battleAction', $event)" @next="emit('battleNext')" @exit="emit('exit')"/>
  <main v-else class="prologue-page" :class="{'prologue-standalone':standalone}">
    <header class="prologue-header">
      <button class="prologue-logo" @click="emit('exit')">画皮 <i>千面</i></button>
      <span>序章 · 雨夜寻凶</span>
      <MusicControls/>
      <button aria-label="暂别此事" @click="emit('exit')">暂别<span class="prologue-exit-tail">此事 ↗</span></button>
    </header>
    <div class="prologue-investigation">
      <section class="prologue-map" :style="{ '--dialogue-height': '235px' }">
        <WorldView :key="map.id" :map-override="map" :world="state.world" :paused="!!note || formOpen || !!paused || guideOpen" :hints="hints" :primary-hints="state.echo ? [] : hints" :night="phase !== 'morning' || map.id === 'inn_well'" appearance="self" :motion="motion" quest="" @interact="interact" @position="emit('position', $event)"/>
        <p v-if="map.id === 'inn_well' && state.knocks" class="well-echo-caption" role="status">{{ echoCaption || `叩井 ${state.knocks} / 3` }}</p>
        <DialoguePortrait v-if="note" :portrait="getDialoguePortrait(note.speaker)"/>
        <section v-if="note" class="prologue-note" :class="{'verse-note':note.room}" role="dialog" :aria-label="note.title">
          <span>{{ note.speaker }}</span><h2>{{ note.title }}</h2>
          <ScreenPages :key="note.title">
            <p v-if="note.letter" class="prologue-letter">知微兄，旧谱有讹，烦来一校。<br/><strong>戌时，东厢候。</strong><br/>文卿手书</p>
            <p style="white-space:pre-line">{{ note.text }}</p>
            <details v-if="note.room"><summary>辨读韵脚</summary><p>{{verseDoors.find(d=>d.id===note?.room)?.sounds}}</p><p>比较每句最后一字的韵母，不必按声调判断。</p></details>
          </ScreenPages>
          <button v-if="note.room" @click="chooseVerseRoom(note.room)">此门失韵，入内查看</button>
          <button @click="note = undefined">继续 <b>→</b></button>
        </section>
        <form v-if="formOpen" class="prologue-note box-form" role="dialog" aria-label="暗室木匣" @submit.prevent="submitBox">
          <span>暗室 · 木匣</span><h2>旧楹联，□□□□谁来揭？</h2>
          <ScreenPages class="box-description">
            <p>匣盖刻着一段残词。戏台旁似乎挂着旧曲牌。</p>
            <p v-if="wrongAnswer" role="status">木匣纹丝未动，再核对旧曲牌。</p>
          </ScreenPages>
          <label class="box-answer" for="box-verse"><span>补入四字</span><input id="box-verse" v-model="answer" autocomplete="off" spellcheck="false" maxlength="12" @input="wrongAnswer = false"/></label>
          <div class="box-actions"><button type="button" @click="formOpen = false">稍后再试</button><button type="submit" :disabled="!answer.trim()">补写开匣 →</button></div>
        </form>
      </section>

    </div>
    <TaskGuideShortcut v-if="standalone" :state="state" :disabled="!!paused" @toggle="guideOpen=$event"/>
  </main>
</template>

<style scoped>
.verse-note{height:min(460px,calc(100dvh - 155px));max-height:calc(100dvh - 155px)}
.verse-note>button{min-height:44px;flex-shrink:0}
.verse-note summary{min-height:44px;cursor:pointer}

.prologue-letter { padding: 8px 12px; margin: 3px 0 8px; border-left: 2px solid #9b8055; font: 23px/1.25 MaShan, cursive; color: #393a2c; }
.prologue-letter strong { font: 700 20px/1.25 NotoSerif, serif; color: #653c30; }
.box-form { gap: 7px; }
.box-form h2, .box-form p { margin: 0; }
.box-form > span, .box-form > h2, .box-answer, .box-actions { flex-shrink: 0; }
.box-description { min-height: 0; }
.box-answer { display: flex; align-items: center; gap: 10px; }
.box-answer > span { white-space: nowrap; }
.box-form input { width: min(100%, 250px); min-height: 44px; padding: 6px 10px; border: 1px solid #978564; background: #fbf1d6; color: #312a1e; font: inherit; }
.box-form > div { display: flex; flex-wrap: wrap; gap: 8px; justify-content: end; }
.box-form button { min-height: 44px; border: 1px solid #978564; padding: 4px 12px; }
@media (max-height: 520px) {
  .box-form { padding: 7px 12px; }
  .box-form > span { display: none; }
  .box-form h2 { font-size: 24px; }
  .box-answer input { flex: 1; min-width: 0; }
}
.well-echo-caption { position: absolute; z-index: 5; left: 50%; bottom: 25%; transform: translateX(-50%); max-width: 90%; padding: 8px 14px; border: 1px solid #c9b3817a; background: #1a231fe8; color: #f1e4bd; text-align: center; pointer-events: none; }
</style>
