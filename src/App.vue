<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useGame } from './game/store'
import { activityReason, changeFace } from './game/engine'
import { activities, clueInfo, itemInfo, journalInfo, locations } from './game/catalog'
import type { Activity, GameState, StoryNode } from './game/types'
import { clickTone } from './game/audio'
import MusicControls from './components/MusicControls.vue'
import { musicState, setMusicEnabled, useSceneMusic } from './game/music'
import { musicSceneForMap, musicSceneForPrologue, musicTracks, musicAuthor, musicLicense } from './game/music-data'
import { story } from './game/story'
import Icon from './components/Icon.vue'
import SceneArt from './components/SceneArt.vue'
import PaintedMask from './components/PaintedMask.vue'
import WorldView from './components/WorldView.vue'
import { worldSpawn } from './game/world'
import { worldGuidance } from './game/world-guidance'
import type { WorldSpot } from './game/world'
import { classics, originalSource } from './game/classics'
import DialoguePortrait from './components/DialoguePortrait.vue'
import { getDialoguePortrait } from './game/portraits'
import PrologueView from './components/PrologueView.vue'
import GameDock from './components/GameDock.vue'
import { navigationItems, navigationLock, type NavigationId } from './game/navigation'
import { wellClue } from './game/prologue-battle'
import { caseClues, discoveredDreamNotes, dreamSpirit, protagonist } from './game/prologue'

type Panel = 'map' | 'bag' | 'faces' | 'people' | 'journal' | 'save' | 'history' | 'settings' | 'credits' | 'rest' | 'restart' | 'classics' | ''
const game = useGame()
const screen = ref<'title' | 'game'>('title')
const panel = ref<Panel>('')
const toast = ref('')
const audio = computed(() => musicState.enabled)
const textSize = ref('normal')
const motion = ref(true)
const savingSlot = ref('')
const overwriteSlot = ref('')
const selectedMap = ref('')
const dialogueOpen = ref(false)
const ambientDialogue = ref<StoryNode>()
const ambientHint = ref('')
const currentDialogue = computed(() => ambientDialogue.value ?? game.node)
const hasDialogue = computed(() => dialogueOpen.value && !!currentDialogue.value && (!!ambientDialogue.value || game.state?.mode === 'story'))
const dialogueBox = ref<HTMLElement>()
const dialogueHeight = ref(225)
let dialogueObserver: ResizeObserver | undefined
const speakingPortrait = computed(() => {
  if(!hasDialogue.value)return undefined
  const speaker=currentDialogue.value?.speaker
  return getDialoguePortrait(!game.state?.flags.wearing_first_face&&speaker?.startsWith('你')?'陆知微':speaker,game.state?.face,currentDialogue.value?.portraitSpeaker)
})
watch(dialogueBox, element => {
  dialogueObserver?.disconnect()
  if (!element) return
  dialogueHeight.value = Math.ceil(element.getBoundingClientRect().height)
  dialogueObserver = new ResizeObserver(entries => { dialogueHeight.value = Math.ceil(entries[0].target.getBoundingClientRect().height) })
  dialogueObserver.observe(element)
}, { flush: 'post' })
const worldKey = ref(0)
const world = computed(() => game.state?.world ?? worldSpawn('theatre'))
const collectedOriginals = computed(() => classics.filter(p => game.state?.flags[`original_${p.id}`]))
const modal = ref<HTMLElement>()
const closeButton = ref<HTMLButtonElement>()
let previousFocus: HTMLElement | null = null
let toastTimer: ReturnType<typeof setTimeout>
const timeNames = { day: '白昼', dusk: '黄昏', night: '子夜' }
const dayNames = ['初一', '初二', '初三']
const s = computed(() => game.state)
const inPrologue = computed(() => !!s.value?.prologue && s.value.prologue.phase !== 'completed')
const place = computed(() => game.node ? locations[game.node.location] : locations.theatre)
const locationId = computed(() => world.value.map)
const guidance = computed(() => s.value ? worldGuidance(s.value, locationId.value, selectedMap.value) : { hints: [], primary: [] })
useSceneMusic(computed(() => screen.value === 'title' ? 'title' : inPrologue.value ? (s.value!.prologue!.world.map === 'inn_well' ? 'investigation' : musicSceneForPrologue(s.value!.prologue!.phase)) : musicSceneForMap(locationId.value, s.value?.time)))
const titleOfPanel: Record<Exclude<Panel, ''>, string> = {
  map: '未闻县行图', bag: '行囊', faces: '面谱', people: '人物',
  journal: '因果录', save: '存档', history: '对话记录', settings: '设置',
  credits: '鸣谢', classics: '画皮原文', rest: '休息', restart: '重新开始',
}
const prologueClues = computed(() => caseClues.filter(clue => s.value?.prologue?.clues.includes(clue.id)))
const prologueDreamNotes = computed(() => discoveredDreamNotes(s.value?.prologue?.dreamSeen ?? []))
const inventoryEntries = computed(() => {
  if (inPrologue.value) return [itemInfo.invitation, ...prologueClues.value.map(clue => ({ title: clue.title, text: clue.text, mark: clue.mark })), ...(s.value?.prologue?.wellEncounter?.stage === 'complete' ? [wellClue] : [])]
  return (s.value?.inventory ?? []).map(id => itemInfo[id] ?? { title: id, text: '', mark: '物' })
})
const prologuePeople = computed(() => [
  { name: protagonist.name, role: protagonist.occupation, text: '受故友之邀来到未闻县，正在调查许文卿遇害一案。', portrait: protagonist.portrait },
  { name: '许文卿', role: '故友 · 本案死者', text: '来信邀你校订旧谱，却在客舍东厢遇害。', portrait: '' },
  { name: '茶摊老板', role: '南街卖茶人 · 客舍记账人', text: '可向他核实入宿簿和送茶时听见的交谈。', portrait: getDialoguePortrait('茶摊老板')!.src },
  ...(prologueDreamNotes.value.length ? [{ name: dreamSpirit.name, role: '梦中所见 · 姓名未明', text: '她的片语与命案有关，尚须回到现实核实。', portrait: dreamSpirit.portrait }] : []),
])
const prologueJournal = computed(() => [
  { title: '许文卿遇害案', text: '旧谱邀约、未寄半笺、入宿簿与窗下鞋印。案子尚未查明。', status: '序章 · 雨夜寻凶' },
  ...prologueClues.value.map(clue => ({ title: clue.title, text: clue.inference, status: '已查验物证' })),
  ...(s.value?.prologue?.wellEncounter?.stage === 'complete' ? [{ title: '井畔怨声', text: wellClue.inference, status: '井边线索 · 尚待核实' }] : []),
  ...prologueDreamNotes.value.map(note => ({ title: note.clueTitle, text: note.clueNote, status: '梦中片语 · 待核实' })),
])

const currentTask = computed(() => {
  if (!s.value) return '调查许文卿遇害案。'
  const exploring = !dialogueOpen.value || !!ambientDialogue.value
  if (exploring && s.value.nodeId === 'street_1') return '去南街见戚婆婆。'
  if (exploring && s.value.nodeId === 'deadline_1') return '第三日黄昏，往南街寻韩七。'
  if (exploring && s.value.nodeId === 'well_1') return '穿过戚家小院，去后井探听哭声。'
  if (exploring && s.value.nodeId === 'farewell_1') return '携旧画回前院，与戚婆婆相见。'
  if (s.value.mode === 'ending') return '第一章结束。'
  if (s.value.mode === 'hub') return '调查沈砚与井中童影。'
  if (s.value.nodeId.startsWith('opening') || ['dressing', 'mirror', 'touch', 'room', 'wear'].some(x => s.value!.nodeId.startsWith(x))) return '向无面娘打听旧谱。'
  if (s.value.flags.scroll_found) return '带着旧画卷，回应戚婆婆最后的问话。'
  if (s.value.flags.death_known) return '前往戚家后井，面对那个等待天亮的孩子。'
  return '调查沈砚的旧事。'
})
const chapterProgress = computed(() => {
  if (!s.value) return 0
  if (s.value.mode === 'ending') return 100
  if (s.value.flags.scroll_found) return 88
  if (s.value.flags.death_known) return 70
  if (s.value.mode === 'hub' || s.value.activity) return 30 + s.value.completed.length * 6
  if (s.value.flags.wearing_first_face) return 18
  return 5
})
const endingInfo = computed(() => {
  const ending = s.value?.ending
  if (ending === 'stay') return { title: '灯下有人', seal: '留', verse: '一盏灯，一碗面。\n借来的名字，也能留下真实的日子。' }
  if (ending === 'truth') return { title: '面下之人', seal: '真', verse: s.value?.flags.mother_accepts_player ? '她认出了假面，也接住了真心。\n往后回来，先敲门。' : '真话已说出口，伤口仍需时间。\n你终于开始，以自己的身份走路。' }
  return { title: '雨中背影', seal: '别', verse: '你没有回头。\n那盏灯，还在南街尽头亮着。' }
})
const nearby = computed(() => s.value ? activities.filter(a => !s.value!.completed.includes(a.id)).slice(0, 3) : [])
function notify(message: string) { toast.value = message; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.value = '' }, 3200) }
function openPanel(value: Panel) {
  if (screen.value === 'game' && navigationItems.some(item => item.id === value)) {
    const reason = navigationLock(s.value, value as NavigationId)
    if (reason) { notify(reason); return }
  }
  previousFocus = document.activeElement as HTMLElement; panel.value = value
}
function closePanel() { panel.value = ''; previousFocus?.focus() }
watch(panel, async value => { if (value) { await nextTick(); closeButton.value?.focus() } })
watch(() => s.value?.nodeId, () => { selectedMap.value = '' })
function setTalking(value: boolean) { ambientDialogue.value = undefined; dialogueOpen.value = value; game.setTalking(value) }
function showAmbientDialogue(speaker: string, text: string, hint = '') {
  ambientDialogue.value = { id: `ambient:${speaker}`, speaker, text, location: world.value.map }
  ambientHint.value = hint
  // Greetings do not advance or reopen the underlying story when a save is restored.
  game.setTalking(false)
  dialogueOpen.value = true
  clickTone()
}
function start() { ambientDialogue.value = undefined; game.newGame(); worldKey.value++; dialogueOpen.value = false; screen.value = 'game'; closePanel(); clickTone() }
async function resume(slot = 'auto') { if (await game.load(slot)) { ambientDialogue.value = undefined; screen.value = 'game'; worldKey.value++; dialogueOpen.value = !!game.state?.flags.world_talk_open; closePanel(); notify('旧梦已续。') } else notify(game.error || '这里还没有存档。') }
function next() {
  if (ambientDialogue.value) { ambientDialogue.value = undefined; dialogueOpen.value = false; clickTone(); return }
  const target = game.node?.next
  game.next(); clickTone()
  if (s.value?.mode === 'hub' || s.value?.mode === 'ending') setTalking(false)
  else if (target && ['street_1','well_1','farewell_1'].includes(target)) {
    setTalking(false)
    notify(target === 'street_1' ? '面已借得。走到茶楼门口，按 E 入南街。' : target === 'well_1' ? '穿过戚家小院，到后井查看。' : '携画归前院，再与婆婆说几句话。')
  } else if (s.value?.nodeId === 'deadline_1') { setTalking(false); notify('韩七在南街候你，旧事将至。') }
  else if (target === 'coda_1') game.travel('mansion')
}
function select(id: string) { game.select(id); clickTone() }
function visit(activity: Activity) {
  if (game.visit(activity.id)) { closePanel(); setTalking(true); clickTone(); return }
  const reason = activityReason(s.value!, activity)
  const replies: Record<string, [string, string]> = {
    meal: ['戚婆婆', s.value?.time === 'night' ? '夜深了，雨里寒。\n先歇一歇，有话明日再说。' : '灶上还有热水。\n你先去忙，回来时，记得敲门。'],
    tea: ['茶摊老板', s.value?.time === 'night' ? '炉火将歇，茶也凉了。\n明日再来，给你沏一碗热的。' : '旧事我能说的，都说与你听了。\n路上若冷，再来喝碗茶。'],
    case: ['韩七', s.value?.time === 'night' ? '卷宗已收。\n待到天明，你再来值房寻我。' : '旧卷里的字，你已经看过。\n卷外的事，还得你自己去查。'],
    ritual: ['无面娘', s.value?.time !== 'night' ? '日头还在，阴事不宜多问。\n待到子夜，再来。' : '借来的面孔，替不了你自己的心。\n往后的路，想好了再走。'],
  }
  const reply = replies[activity.id]
  if (reply) showAmbientDialogue(reply[0], reply[1], reason)
  else notify(reason)
}
function locateActivity(activity: Activity) { selectedMap.value = activity.id; closePanel(); notify(`已标出前往${locations[activity.location].name}的引导光圈。`) }
function rest() { game.wait(); closePanel(); if (s.value?.nodeId === 'deadline_1') { setTalking(false); notify('韩七在南街候你。') } else notify('灯影移了一寸。') }
function equip(face: GameState['face']) {
  if (game.equip(face)) {
    closePanel()
    notify(face === 'shen' ? '已借沈砚之面。' : '已借周平之面。')
    clickTone()
  } else notify('此刻尚不便换面，待事件间歇再试。')
}
const canChangeFace = computed(() => {
  if (!s.value) return false
  const copy = JSON.parse(JSON.stringify(s.value)) as GameState
  return changeFace(copy, copy.face)
})
function toggleAudio() { setMusicEnabled(!musicState.enabled) }
async function save(slot: string) { savingSlot.value = slot; if (await game.save(slot)) notify('此刻已封存。'); else notify(game.error || '尚未进入旧梦。'); savingSlot.value = ''; overwriteSlot.value = '' }
function requestSave(slot: string) { if (game.saves[slot] && overwriteSlot.value !== slot) { overwriteSlot.value = slot; return } void save(slot) }
function exportSave() {
  if (!s.value) return
  const blob = new Blob([JSON.stringify({ version: 1, savedAt: Date.now(), state: s.value }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = '画皮借面-存档.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function saveLabel(slot: string) {
  const value = game.saves[slot]
  if (!value) return '尚未落笔'
  const state = value.state, p = state.prologue
  if (p && p.phase !== 'completed') return `序章 · ${p.phase === 'dream' ? '梦中寻相' : p.phase === 'arrival' ? '雨夜寻凶' : locations[p.world.map].name}`
  return `${dayNames[state.day - 1]} · ${timeNames[state.time]} · ${state.mode === 'ending' ? '章末' : locations[state.world?.map ?? story[state.nodeId]?.location ?? 'theatre'].name}`
}
function formatDate(timestamp: number) { return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' }).format(timestamp) }
function returnTitle() { screen.value = 'title'; closePanel() }
function readOriginals(ids: string[]) { game.rememberOriginals(ids); openPanel('classics') }
function interactWorld(spot: WorldSpot) {
  if (!s.value) return
  const state = s.value
  if (spot.kind === 'door' && spot.destination) {
    if (!state.flags.wearing_first_face && spot.destination === 'street') { notify('茶楼里还有话未问完。先去寻那位执笔的人。'); return }
    if (spot.destination === 'well' && state.nodeId === 'street_1') { notify('南街老妇尚有话要说。'); return }
    game.travel(spot.destination,spot.arrival); clickTone(); return
  }
  if (['rest','home_rest'].includes(spot.id)) { if (state.mode === 'hub') openPanel('rest'); else notify('旧事未了，此时尚不能歇下。'); return }
  if (spot.id === 'notice') { readOriginals(['encounter','homeless','warning']); return }
  if (spot.id === 'mirror') { readOriginals(['window','wear','judgment']); return }
  if (spot.id === 'archive' && state.nodeId !== 'case_archive') { readOriginals(['scroll','wife','revival']); return }
  if ((spot.id === 'faceless' && world.value.map === 'theatre' && !state.flags.wearing_first_face)
    || (spot.id === 'skin' && state.nodeId === 'dressing')
    || (spot.id === 'mother_street' && state.nodeId === 'street_1')
    || (spot.id === 'han_street' && state.nodeId === 'deadline_1')
    || (['well','child'].includes(spot.id) && state.nodeId === 'well_1')
    || (spot.id === 'mother' && state.nodeId === 'farewell_1')
    || (spot.id === 'archive' && state.nodeId === 'case_archive')) { if (spot.id === 'faceless') game.rememberOriginals(['judgment','pity']); setTalking(true); return }
  if (state.mode === 'hub') {
    const activityId: Record<string,string> = {faceless:'ritual',mother:'meal',relic:'relic',tea:'tea',han:'case',well:'watch',child:'watch'}
    const id=activityId[spot.id]
    if(spot.id==='relic') game.rememberOriginals(['wife','revival'])
    if(['well','child'].includes(spot.id)) game.rememberOriginals(['night','karma'])
    if(spot.id==='han') game.rememberOriginals(['scroll','warning'])
    if (id) { const activity=activities.find(a=>a.id===id)!; visit(activity); return }
    if(spot.id==='skin'){readOriginals(['scroll','pity']);return}
  }
  if (state.mode === 'story' && world.value.map === game.node?.location && !['street_1','well_1','farewell_1','deadline_1'].includes(state.nodeId)) { if (spot.id === 'faceless') game.rememberOriginals(['judgment','pity']); setTalking(true); return }
  if (spot.id === 'mother_street') showAmbientDialogue('戚婆婆', '寒雨侵衣，且来家中坐坐。')
  else if (spot.id === 'han_street') showAmbientDialogue('韩七', '有事去县衙说。旧案，尚未了结。')
  else notify(currentTask.value)
}
function onKey(event: KeyboardEvent) {
  if (panel.value) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); closePanel(); return }
    if (event.key === 'Tab' && modal.value) {
      const elements = [...modal.value.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,[tabindex="0"]')]
      if (!elements.length) return
      if (event.shiftKey && document.activeElement === elements[0]) { event.preventDefault(); elements.at(-1)?.focus() }
      else if (!event.shiftKey && document.activeElement === elements.at(-1)) { event.preventDefault(); elements[0]?.focus() }
    }
    return
  }
  if (!dialogueOpen.value) return
  if (screen.value !== 'game' || ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) return
  if ((event.code === 'Space' || event.code === 'Enter') && hasDialogue.value && !currentDialogue.value?.choices) { event.preventDefault(); next() }
}
onMounted(() => { void game.initialize(); window.addEventListener('keydown', onKey) })
onUnmounted(() => { dialogueObserver?.disconnect(); window.removeEventListener('keydown', onKey); clearTimeout(toastTimer) })
</script>

<template>
  <div class="app" :class="[{ 'motion-off': !motion, 'large-text': textSize === 'large', 'in-prologue': inPrologue, 'has-game-dock': screen === 'game' && !!s }, screen]">
    <template v-if="screen === 'title'">
      <header class="title-header"><div class="wordmark"><span class="tiny-seal">志怪</span><span>未闻志异</span></div><div class="title-header-right"><MusicControls/><button class="icon-button" aria-label="设置" @click="openPanel('settings')"><Icon name="settings"/></button></div></header>
      <main class="title-main">
        <div class="title-visual"><SceneArt location="street" cover/><img class="title-own-character" src="/assets/portraits/lu-v1.webp" alt=""/><div class="moon-disc"></div><div class="visual-border"></div><span class="art-inscription">世人以貌识人<br/>以心辨善恶</span><span class="art-index">未闻县 · 壹</span></div>
        <div class="title-copy">
          <div class="main-title"><h1>画皮</h1><div class="subtitle-column"><span class="title-seal">借面</span></div></div>
          <div class="title-rule"></div>
          <p class="title-verse">一纸旧约，人已不在。<br/>一城烟雨，谁在借相。</p>
          <div class="title-actions">
            <button class="primary-button" :disabled="!game.ready" @click="game.saves.auto ? resume() : start()">
              <span>{{ !game.ready ? '读取中…' : game.saves.auto ? '继续游戏' : '赴未闻县' }}</span><Icon name="arrow" :size="22"/>
            </button>
            <button v-if="game.ready && game.saves.auto" class="continue-button" @click="openPanel('restart')">重新开始</button>
          </div>
          <nav class="title-previews" aria-label="独立试玩"><a href="?view=dream" target="_blank" rel="noopener">梦境试玩 <span>↗</span></a><a href="?view=combat" target="_blank" rel="noopener">战斗试玩 <span>↗</span></a></nav>
        </div>
      </main>
      <footer class="title-footer"><div><span class="chapter-number">壹</span><div><span>雨夜寻凶</span></div></div><button @click="openPanel('credits')">画外拾遗 <span>↗</span></button></footer>
    </template>

    <PrologueView v-else-if="s?.prologue && inPrologue" :state="s.prologue" :motion="motion" :paused="!!panel" @next="game.prologueNext" @inspect="game.inspectPrologue" @dream-inspect="game.inspectDreamObject" @dream-pose="game.rememberDreamPose" @position="game.rememberProloguePosition" @travel="game.travelInPrologue" @battle="game.beginWellBattle" @battle-action="game.wellAction" @battle-next="game.wellNext" @exit="returnTitle"/>
    <template v-else-if="s">
      <header class="game-header"><button class="game-logo" aria-label="返回标题页" @click="returnTitle"><span>画皮</span><i>借面</i></button><div class="header-chapter"><span>卷一</span><b>借皮入世</b><i></i><small>{{ locations[world.map].name }}</small></div><div class="header-actions"><span class="autosave-label"><i :class="{ error: game.error }"></i>{{ game.error ? '存档异常' : '随行记事' }}</span><MusicControls/><button class="icon-button" aria-label="存档与读档" @click="openPanel('save')"><Icon name="save"/></button><button class="icon-button" aria-label="设置" @click="openPanel('settings')"><Icon name="settings"/></button></div></header>
      <div class="game-body">
        <aside class="left-rail"><div class="rail-top"><span>未</span><span>闻</span><span>县</span></div><div class="rail-line"></div><button class="icon-button" aria-label="查看对话记录" @click="openPanel('history')"><Icon name="history"/></button></aside>
        <main class="game-main rpg-main" :style="{ '--dialogue-height': `${dialogueHeight}px` }">
          <template v-if="s.mode !== 'ending'">
            <WorldView :key="worldKey" :world="world" :hints="guidance.hints" :primary-hints="guidance.primary" :paused="dialogueOpen || !!panel" :night="s.time === 'night'" :appearance="s.flags.wearing_first_face ? s.face : 'self'" :motion="motion" :quest="currentTask" @interact="interactWorld" @position="game.rememberPosition"/>
            <DialoguePortrait v-if="hasDialogue" :portrait="speakingPortrait"/>
            <section v-if="hasDialogue && currentDialogue" ref="dialogueBox" class="dialogue-panel rpg-dialogue" :key="currentDialogue.id" aria-label="当前剧情"><div class="speaker-row"><span class="speaker-mark"></span><strong>{{ currentDialogue.speaker || '旁白' }}</strong><span class="dialogue-line"></span><button class="text-icon" aria-label="查看对话记录" @click="openPanel('history')"><Icon name="history" :size="16"/></button></div><p class="dialogue-text">{{ currentDialogue.text }}</p><div v-if="currentDialogue.choices" class="story-choices"><button v-for="(choice,index) in game.choices" :key="choice.id" class="choice-button" :disabled="!choice.available" :title="choice.available ? choice.note : choice.locked" @click="select(choice.id)"><span class="choice-index">{{ ['壹','贰','叁','肆'][index] }}</span><span><b>{{ choice.text }}</b><small v-if="!choice.available">{{ choice.locked }}</small></span><Icon :name="choice.available ? 'arrow' : 'lock'" :size="17"/></button></div><div v-else class="dialogue-footer"><span>{{ ambientDialogue ? (ambientHint || '空格继续') : '空格继续' }}</span><button class="next-button" @click="next">{{ ambientDialogue ? '继续行旅' : currentDialogue.end === 'hub' ? '继续行旅' : currentDialogue.end === 'ending' ? '落定此章' : '继续' }}<Icon name="arrow" :size="18"/></button></div></section>

          </template>
          <section v-else class="ending-screen"><div class="ending-art"><img src="/assets/garden.jpg" alt="公有领域中国古画山水局部"/></div><span class="ending-kicker">第一章 · 借皮入世 · 章末</span><div class="ending-seal">{{ endingInfo.seal }}</div><h2>{{ endingInfo.title }}</h2><p class="ending-verse">{{ endingInfo.verse }}</p><div class="ending-details"><div><span>与戚婆婆</span><b>{{ s.flags.mother_accepts_player ? '以你之名，留一双筷子' : s.ending === 'stay' ? s.flags.mother_knows_truth ? '以真相相伴，等她慢慢接受' : '借旧名，续一场陪伴' : s.ending === 'leave' ? '灯仍亮着，人已远去' : '真话已明，尚待来日' }}</b></div><div><span>与井中童影</span><b>{{ s.flags.child_at_peace ? '一愿已偿，归路有灯' : s.flags.child_bound ? '暂安灯中，来日须偿' : '依附相随，又添旧债' }}</b></div><div><span>旧事寻访</span><b>{{ s.completed.length }} / 6 桩 · {{ s.clues.length }} 条记忆</b></div></div><p class="ending-next">第一章结束。<br/><small>后续章节尚未开放。</small></p><div class="ending-actions"><button class="primary-button" @click="openPanel('journal')">回望因果 <Icon name="book"/></button><button class="outline-button" @click="openPanel('restart')">再借一面</button></div></section>
        </main>
        <aside class="right-sidebar"><div class="day-card"><div class="side-label">时辰</div><div class="day-display"><span>{{ dayNames[s.day - 1] }}</span><div><Icon :name="s.time === 'day' ? 'sun' : s.time === 'dusk' ? 'dusk' : 'moon'" :size="22"/><b>{{ timeNames[s.time] }}</b></div></div><div class="time-track"><i v-for="(name,index) in ['白昼','黄昏','子夜']" :key="name" :class="{ active: index === ['day','dusk','night'].indexOf(s.time) }"><span></span><small>{{ name }}</small></i></div><div class="action-points"><span>今日余力</span><div><i v-for="n in 3" :key="n" :class="{ filled: n <= s.actionPoints }"></i></div><b>{{ s.actionPoints }}<small> / 3</small></b></div></div><div class="task-card"><div class="side-label"><Icon name="leaf" :size="17"/> 当前目标</div><h3>借皮入世</h3><p>{{ currentTask }}</p><div class="chapter-track"><i :style="{ width: `${chapterProgress}%` }"></i></div></div><button class="current-face" :disabled="!!navigationLock(s,'faces')" @click="openPanel('faces')"><div class="mini-mask"><PaintedMask :variant="s.flags.wearing_first_face ? s.face : 'empty'" small/></div><span><small>此刻借相</small><b>{{ s.face === 'guard' ? '故捕快' : s.flags.wearing_first_face ? '沈砚' : '陆知微' }}</b><em>{{ s.flags.wearing_first_face ? '面谱 · 查看身份' : '本来面目' }}</em></span><Icon name="arrow" :size="17"/></button><button class="side-journal" @click="openPanel('journal')"><Icon name="book" :size="17"/>因果已记 {{ s.journal.length }} 笔<Icon name="arrow" :size="15"/></button></aside>
      </div>
    </template>

    <GameDock v-if="screen === 'game' && s" :state="s" :active="panel" @open="openPanel"/>

    <Transition name="modal"><div v-if="panel" class="modal-backdrop" @click.self="closePanel"><section ref="modal" class="modal-panel" :class="[`panel-${panel}`]" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-header"><div><span class="eyebrow">画皮 · 借面</span><h2 id="modal-title">{{ titleOfPanel[panel] }}</h2></div><button ref="closeButton" class="icon-button close-button" aria-label="关闭面板" @click="closePanel"><Icon name="close"/></button></header><div class="modal-content">
      <template v-if="panel === 'map' && s"><template v-if="inPrologue"><div class="prologue-map-panel"><small>序章 · 东厢调查</small><h3>栖雨客舍</h3><p>在客舍内步行查验物证；梦醒后循光圈前往后井，平复怨势后再去西街。</p><ul><li v-for="clue in caseClues" :key="clue.id">{{s.prologue?.clues.includes(clue.id) ? '已查验' : '待查验'}} · {{clue.title}}</li></ul><p v-if="prologueDreamNotes.length === 5" class="known-destination">{{s.prologue?.wellEncounter?.stage === 'complete' ? '井边青布已入囊。下一站：西街尽处，无面茶楼。' : '梦中指路：西街尽处，无面茶楼。先查后院井声。'}}</p></div></template><template v-else><div class="map-illustration"><img src="/assets/landscape.jpg" alt="未闻县行图，以清代公有领域山水画作底"/><span class="map-place theatre-place">无面茶楼</span><span class="map-place street-place">未闻县南街</span><span class="map-place home-place">戚家小院</span><span class="map-place yamen-place">县衙值房</span><span class="map-place well-place">戚家后井</span></div><p class="panel-hint">{{ s.mode === 'hub' ? `${dayNames[s.day - 1]}${timeNames[s.time]} · 余力 ${s.actionPoints} 点。步行不耗时；完成调查推进一个时段。` : '循地图步行至人物或物件旁，按 E 交谈或调查。' }}</p><div class="map-activities"><button v-for="activity in activities" :key="activity.id" class="map-activity" :disabled="!!activityReason(s,activity)" @click="locateActivity(activity)"><span class="activity-mark">{{ activity.mark }}</span><span><b>{{ activity.title }}</b><small>{{ activityReason(s,activity) || `${locations[activity.location].name} · 消耗一点行动` }}</small></span><Icon :name="s.completed.includes(activity.id) ? 'check' : 'arrow'" :size="17"/></button></div></template></template>
      <template v-else-if="panel === 'bag' && s"><button v-if="s.inventory.includes('originals')" class="outline-button original-book-button" @click="panel = 'classics'"><Icon name="book" :size="17"/>展读《画皮》残卷</button><div v-if="!inventoryEntries.length" class="empty-state"><Icon name="bag" :size="40"/><p>两手空空，尚未入世。</p></div><div class="inventory-grid"><article v-for="item in inventoryEntries" :key="item.title" class="item-card"><span>{{ item.mark }}</span><h3>{{ item.title }}</h3><p>{{ item.text }}</p></article></div><div v-if="s.clues.length" class="memory-list"><h3>拾得的记忆</h3><p v-for="id in s.clues" :key="id"><i></i>{{ clueInfo[id] }}</p></div></template>
      <template v-else-if="panel === 'faces' && s"><p class="panel-hint">{{ canChangeFace ? '此刻可以换面，不消耗行动。不同身份会改变入口与交涉。' : '换面需在自由寻访、县衙查卷或井边抉择时进行。' }}</p><div class="face-grid"><article class="face-card" :class="{ equipped: s.face === 'shen' && s.flags.wearing_first_face }"><div class="face-portrait"><PaintedMask variant="shen"/></div><span class="face-kicker">已故画师 · 观察 / 绘像</span><h3>沈砚之面</h3><div class="bond-meter"><span>面契</span><b>{{ s.stats.shen }}<small> / 100</small></b><i><em :style="{ width: `${s.stats.shen}%` }"></em></i></div><p class="face-skill">辨相 · 留意对方神情，发现隐藏交涉</p><button class="outline-button" :disabled="!canChangeFace || s.face === 'shen'" @click="equip('shen')">{{ s.face === 'shen' && s.flags.wearing_first_face ? '此刻正借' : '借用此面' }}</button></article><article class="face-card" :class="{ equipped: s.face === 'guard', undiscovered: !s.flags.guard_unlocked }"><div class="face-portrait"><PaintedMask :variant="s.flags.guard_unlocked ? 'guard' : 'empty'"/></div><span class="face-kicker">{{ s.flags.guard_unlocked ? '已故捕快 · 查案 / 交涉' : '因果未至' }}</span><h3>{{ s.flags.guard_unlocked ? '故捕快之面' : '未见之面' }}</h3><p>{{ s.flags.guard_unlocked ? '韩七交付的周平面谱。' : '查阅县衙旧案后获得。' }}</p><div v-if="s.flags.guard_unlocked" class="bond-meter"><span>面契</span><b>{{ s.stats.guard }}<small> / 100</small></b><i><em :style="{ width: `${s.stats.guard}%` }"></em></i></div><p class="face-skill">{{ s.flags.guard_unlocked ? '旧职 · 以捕快身份查阅封存卷宗' : '面皮只取亡者遗存或术法仿面' }}</p><button class="outline-button" :disabled="!canChangeFace || !s.flags.guard_unlocked || s.face === 'guard'" @click="equip('guard')">{{ s.face === 'guard' ? '此刻正借' : '借用此面' }}</button></article></div><div class="self-stats"><div><span>本心</span><b>{{ s.stats.selfhood }}</b></div><div><span>业债</span><b>{{ s.stats.karma }}</b></div></div></template>
      <template v-else-if="panel === 'people' && s"><div v-if="inPrologue" class="people-list prologue-people"><article v-for="person in prologuePeople" :key="person.name"><img v-if="person.portrait" :src="person.portrait" :alt="person.name"/><span v-else class="person-medallion">{{person.name.slice(0,1)}}</span><div><small>{{person.role}}</small><h3>{{person.name}}</h3><p>{{person.text}}</p></div></article></div><div v-else class="people-list"><article><span class="person-medallion mother">戚</span><div><small>沈砚的养母 · 六十一岁</small><h3>戚婆婆</h3><p>门前留着一盏灯，等一个迟迟不归的孩子。</p><span class="relation-status">{{ s.flags.mother_accepts_player ? '知晓真相 · 接受你' : s.flags.mother_knows_truth ? '已知真相 · 尚待时日' : s.flags.mother_suspicious ? '有所察觉' : s.flags.met_mother ? '旧面相认' : '尚未相见' }}</span><div class="relation-bar"><i :style="{ width: `${(s.stats.mother + 100) / 2}%` }"></i></div><small>对沈砚之面的羁绊 · {{ s.stats.mother >= 20 ? '愿意亲近' : s.stats.mother > 0 ? '试探来往' : '旧情未明' }}</small></div></article><article><span class="person-medallion han">韩</span><div><small>县衙捕快 · 三十四岁</small><h3>韩七</h3><p>他在追查沈砚，也在追问自己的过去。</p><span class="relation-status">{{ s.flags.han_knows_truth ? '知晓身份 · 愿意合作' : s.flags.han_exposed ? '旧事已揭 · 戒心未除' : s.flags.met_han ? '起疑 · 正在查证' : '尚未相见' }}</span><div class="relation-bar"><i :style="{ width: `${(s.stats.han + 100) / 2}%` }"></i></div><small>对沈砚之面的羁绊 · {{ s.stats.han >= 0 ? '可以交谈' : '心存戒备' }}</small></div></article><article><span class="person-medallion faceless">无</span><div><small>无面茶楼之主 · 年岁不详</small><h3>无面娘</h3><p>通晓借面与安魂之术。</p><span class="relation-status">{{ s.flags.knows_ritual ? '以忆换术 · 仍有隐瞒' : '知晓你的本相' }}</span></div></article><article><span class="person-medallion child">{{ s.flags.met_child || s.flags.seen_child ? '满' : '？' }}</span><div><small>井中童影 · 一段未完的承诺</small><h3>{{ s.clues.includes('child_name') ? '小满' : '井中童影' }}</h3><p>“等天亮，带我回家。”</p><span class="relation-status">{{ s.flags.child_at_peace ? '执念已解 · 安息' : s.flags.child_bound ? '安置灯中 · 归期待定' : s.flags.child_attached ? '认你为沈砚 · 依附相随' : s.flags.seen_child || s.flags.met_child ? '等候之中' : '尚未相见' }}</span></div></article></div></template>
      <template v-else-if="panel === 'journal' && s"><template v-if="inPrologue"><div class="journal-intro"><span>序章</span><p>雨夜寻凶</p><small>{{prologueClues.length}} 条物证 · {{prologueDreamNotes.length}} 条梦中片语</small></div><article v-for="(entry,index) in prologueJournal" :key="entry.title" class="journal-entry"><span class="journal-number">{{String(index+1).padStart(2,'0')}}</span><div><small>{{entry.status}}</small><h3>{{entry.title}}</h3><p>{{entry.text}}</p></div></article></template><template v-else><div class="journal-intro"><span>卷一</span><p>借皮入世</p><small>{{ s.journal.length }} 笔因果 · {{ s.clues.length }} 段记忆</small></div><div v-if="!s.journal.length" class="empty-state"><Icon name="book" :size="38"/><p>故事尚未落笔。</p></div><article v-for="(id,index) in s.journal" :key="id" class="journal-entry"><span class="journal-number">{{ String(index+1).padStart(2,'0') }}</span><div><small>{{ journalInfo[id]?.status }}</small><h3>{{ journalInfo[id]?.title }}</h3><p>{{ journalInfo[id]?.text }}</p></div></article></template></template>
      <template v-else-if="panel === 'history' && s"><div class="history-list"><article v-for="(entry,index) in s.history" :key="index" :class="{ 'is-choice': entry.choice }"><span>{{ entry.choice ? '你的选择' : entry.speaker }}</span><p>{{ entry.text }}</p></article></div></template>
      <template v-else-if="panel === 'save'"><p class="panel-hint">剧情推进时自动记事。手动存档独立保留在当前浏览器中。</p><div class="save-list"><article v-for="slot in ['auto','1','2','3']" :key="slot"><span class="save-index">{{ slot === 'auto' ? '随' : ['壹','贰','叁'][Number(slot)-1] }}</span><div><h3>{{ slot === 'auto' ? '随行记事 · 自动' : `旧梦 ${slot}` }}</h3><p>{{ saveLabel(slot) }}</p><small>{{ game.saves[slot] ? formatDate(game.saves[slot]!.savedAt) : '空存档' }}</small></div><div class="save-buttons"><button v-if="slot !== 'auto'" class="outline-button" :disabled="!s || game.saving" @click="requestSave(slot)">{{ savingSlot === slot ? '封存中' : overwriteSlot === slot ? '确认覆盖' : '封存' }}</button><button class="text-button" :disabled="!game.saves[slot]" @click="resume(slot)">续梦 <Icon name="arrow" :size="15"/></button></div></article></div><button class="text-button export-button" :disabled="!s" @click="exportSave"><Icon name="download" :size="17"/>导出当前存档</button><p v-if="game.error" class="storage-error" role="alert">{{ game.error }}。可先导出当前存档留存。</p></template>
      <template v-else-if="panel === 'settings'"><div class="setting-row"><div><h3>场景配乐与雨声</h3><p>随场景切换</p></div><button class="toggle" :class="{ on: audio }" role="switch" :aria-checked="audio" aria-label="场景配乐与雨声" @click="toggleAudio"><i></i></button></div><label class="setting-row"><span><b>阅读字号</b><small>对话与故事面板</small></span><select v-model="textSize" aria-label="阅读字号"><option value="normal">常规</option><option value="large">较大</option></select></label><div class="setting-row"><div><h3>灯影与浮尘</h3><p>关闭后减少动态效果</p></div><button class="toggle" :class="{ on: motion }" role="switch" :aria-checked="motion" aria-label="灯影与浮尘" @click="motion = !motion"><i></i></button></div><div class="how-to"><h3>操作</h3><p>用 WASD 或方向键行走，Shift 疾行，E 交谈或调查；也可点击地面寻路。走到门口按 E 出入场景。交谈时点击「继续」或按空格阅读。步行不耗行动，完成调查才推进时段。</p><p>存档保存在当前浏览器。清理网站数据会移除存档，重要节点可另行导出。</p></div><button v-if="screen === 'game'" class="outline-button" @click="returnTitle">返回标题页</button></template>
      <template v-else-if="panel === 'classics'"><div class="classic-intro"><span>聊斋志异 · 卷一</span><h3>画皮</h3><p>清 · 蒲松龄</p></div><p class="panel-hint">原文摘句。游戏人物与情节为衍生创作。</p><article v-for="passage in collectedOriginals" :key="passage.id" class="classic-passage"><span>原典摘句 · {{ passage.title }}</span><blockquote>{{ passage.text }}</blockquote><p>{{ passage.context }}</p></article><a :href="originalSource" target="_blank" rel="noopener noreferrer" class="text-button">核读《画皮》原文 <Icon name="arrow" :size="16"/></a></template><template v-else-if="panel === 'credits'"><div class="credits-intro"><span class="credits-logo">画皮<span>借面</span></span><p>据《画皮：借面》GDD v1.0 制作的俯视角剧情 RPG。<br/>以《聊斋志异》的志怪与人情为灵感，剧情人物为本作虚构。</p></div><h3>古画与场景</h3><p class="credits-desc">以下作品由大都会艺术博物馆标注为 Public Domain，并依 Open Access / CC0 提供。此处以裁切、调色与叠层构成场景，画中人物不代表剧情角色。</p><ul class="credits-list"><li><a href="https://www.metmuseum.org/art/collection/search/51664" target="_blank" rel="noopener noreferrer">佚名《Landscape with Temple》</a><span>明代 · 茶楼 / 后井底图</span></li><li><a href="https://www.metmuseum.org/art/collection/search/51688" target="_blank" rel="noopener noreferrer">佚名《Landscape with Fishing Village and Boat on Lake》</a><span>明或清代 · 南街底图</span></li><li><a href="https://www.metmuseum.org/art/collection/search/65075" target="_blank" rel="noopener noreferrer">王翚等《仿古山水图》册</a><span>1692 年 · 行图 / 县衙底图</span></li><li><a href="https://www.metmuseum.org/art/collection/search/49113" target="_blank" rel="noopener noreferrer">王鉴《仿古山水图》册</a><span>1668 年 · 庭院 / 王宅底图</span></li><li><a href="https://www.metmuseum.org/art/collection/search/737761" target="_blank" rel="noopener noreferrer">传任熊《Woman in a garden》</a><span>19 世纪中期 · 残梦视觉意象</span></li></ul><h3>专属对话立绘</h3><p class="credits-desc">人物立绘由 AI 生成。</p><a class="text-button" href="?view=portraits" target="_blank" rel="noopener noreferrer">展看借面人物谱 <Icon name="arrow" :size="15"/></a><h3>场景配乐</h3><p class="credits-desc">{{musicAuthor}}。所用七首均为 2015—2021 年作品，依原 CC BY 4.0 许可使用。五首选用官方循环版，两首悬疑曲使用官方完整版本；文件未改编，游戏内循环播放并调整音量、切景淡入淡出。中文曲签为本作场景名。</p><ul class="credits-list"><li v-for="track in musicTracks" :key="track.id"><a :href="track.source" target="_blank" rel="noopener noreferrer">{{track.title}}</a><span>{{track.scenes}}</span></li></ul><a class="text-button" :href="musicLicense" target="_blank" rel="noopener noreferrer">CC BY 4.0 · 查看许可 ↗</a><h3>字体与原创部分</h3><p class="credits-desc">马善政毛笔楷体、Noto Serif SC，依 SIL Open Font License 1.1 本地使用。主地图的旧瓦、苔石、腐叶湿土、灰墙、砖石、木地板与深色木纹使用 Poly Haven CC0 公开材质；草木局部使用 Kenney Tiny Town（CC0）。中式房屋造型、窗棂门匾、长衫人物、陈设、面具与程序化环境声由本 Demo 绘制。</p><a class="text-button" href="https://www.metmuseum.org/hubs/open-access" target="_blank" rel="noopener noreferrer">查看博物馆开放使用政策 <Icon name="arrow" :size="15"/></a></template>
      <template v-else-if="panel === 'rest' && s"><div class="rest-illustration"><Icon name="moon" :size="60"/></div><p class="rest-question">暂歇片刻，等候{{ s.time === 'night' ? '明日白昼' : s.time === 'day' ? '黄昏' : '子夜' }}？</p><p class="panel-hint">消耗一点行动，推进一个时段。</p><div class="confirm-actions"><button class="outline-button" @click="closePanel">再想一想</button><button class="primary-button" @click="rest">静候天时 <Icon name="arrow" :size="17"/></button></div></template>
      <template v-else-if="panel === 'restart'"><div class="rest-illustration"><Icon name="mask" :size="60"/></div><p class="rest-question">重新开始？</p><p class="panel-hint">将覆盖自动存档，手动存档保留。</p><div class="confirm-actions"><button class="outline-button" @click="closePanel">留在此刻</button><button class="primary-button" @click="start">重入此梦 <Icon name="arrow" :size="17"/></button></div></template>
    </div><footer class="modal-footer"><small>按 Esc 收起</small></footer></section></div></Transition>
    <Transition name="toast"><div v-if="toast" class="toast-message" role="status"><span class="small-diamond"></span>{{ toast }}</div></Transition>
  </div>
</template>
