<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { caseClues, discoveredDreamNotes, protagonist, prologueHintIds } from '../game/prologue'
import type { DreamPose, DreamStationId, PrologueState } from '../game/prologue'
import type { WorldSpot } from '../game/world'
import type { WorldState } from '../game/types'
import WorldView from './WorldView.vue'
import MusicControls from './MusicControls.vue'
import DialoguePortrait from './DialoguePortrait.vue'
import OpeningCinematic from './OpeningCinematic.vue'
import type { CombatAction } from '../game/combat-data'
import { getDialoguePortrait } from '../game/portraits'
import '../prologue.css'
const CombatEncounter=defineAsyncComponent(()=>import('./CombatPreview.vue'))
const DreamExploration=defineAsyncComponent(()=>import('./DreamExploration.vue'))
const props=defineProps<{state:PrologueState;motion:boolean;paused?:boolean}>()
const emit=defineEmits<{next:[deduction?:string];inspect:[id:string];dreamInspect:[id:DreamStationId];dreamPose:[pose:DreamPose];position:[position:WorldState];travel:[destination:string];battle:[];battleAction:[id:CombatAction];battleNext:[];exit:[]}>()
const note=ref<{title:string;text:string;speaker:string}>()
const phase=computed(()=>props.state.phase),allClues=computed(()=>props.state.clues.length===caseClues.length)
const hints=computed(()=>prologueHintIds(props.state))
const dreamNotes=computed(()=>discoveredDreamNotes(props.state.dreamSeen))
const encounter=computed(()=>props.state.wellEncounter)
const inBattle=computed(()=>!!encounter.value&&encounter.value.stage!=='complete')
const quest=computed(()=>phase.value!=='morning'?'查验半笺、入宿簿和窗下湿泥。':props.state.world.map==='inn_well'?(encounter.value?.stage==='complete'?'返回东厢，再往西街无面茶楼。':'循光圈走近旧井，按 E 查看哭声。'):encounter.value?.stage==='complete'?'去西街寻找无面茶楼。':'后院传来梦中哭声，先去客舍后井查看。')
function interact(spot:WorldSpot){
  if(spot.destination){
    if(phase.value==='morning')emit('travel',spot.destination)
    else note.value={title:'后院未开',speaker:'茶摊老板',text:'先把东厢的几处物证看明白，后院的门天亮才开。'}
    return
  }
  if(spot.id==='well_spirit'){
    if(encounter.value?.stage==='complete')note.value={title:'井水渐平',speaker:'陆知微',text:'青布已收好，纸屑上的“戌初”还要查问。去西街，寻那执笔的人。'}
    else emit('battle')
    return
  }
  if(spot.id==='teahouse'){
    if(phase.value==='morning'&&encounter.value?.stage==='complete')emit('next')
    else if(phase.value==='morning')note.value={title:'后院的哭声',speaker:'陆知微',text:'井边传来昨夜梦里的哭声。先去后院看看，再赴西街。'}
    else note.value={title:'雨尚未停',speaker:'陆知微',text:'先查完东厢再走。'}
    return
  }
  if(spot.id==='owner'){note.value=phase.value==='morning'?{title:'送茶',speaker:'茶摊老板',text:'你问送茶的事？小二只隔着门听见说话，并未看清另一名来客的脸。\n许先生来时，确实带着一册裹青布的旧谱。那部谱后来去了哪儿，我便不知道了。'}:{title:'东厢的客人',speaker:'茶摊老板',text:'我在南街摆茶摊，晚间也替客舍记账。\n许先生酉时一个人来的。戌初，屋里倒像有两个人说话。\n你便是信上那个陆知微？韩捕快说，你先别走远。'};return}
  const clue=caseClues.find(c=>c.id===spot.id)
  if(clue){emit('inspect',clue.id);note.value={title:clue.title,text:clue.text,speaker:'陆知微'}}
}
watch(phase,value=>{note.value=undefined;if(value==='morning')note.value={title:'梦醒',speaker:'陆知微',text:'天色微亮。窗下的鞋印还在，案上的半笺也还在。\n那间茶楼的名字，清楚得不像一个梦。\n后院的旧井旁，忽又传来同样的哭声。'}})
</script>
<template>
  <OpeningCinematic v-if="phase==='arrival'" :motion="motion" :paused="paused" @finish="emit('next')" @exit="emit('exit')"/>
  <DreamExploration v-else-if="phase==='dream'" :visited="state.dreamSeen" :pose="state.dreamPose" :paused="paused" @inspect="emit('dreamInspect',$event)" @pose="emit('dreamPose',$event)" @finish="emit('next')" @exit="emit('exit')"/>
  <CombatEncounter v-else-if="inBattle && encounter" :encounter="encounter" :paused="paused" @action="emit('battleAction',$event)" @next="emit('battleNext')" @exit="emit('exit')"/>
  <main v-else class="prologue-page">
    <header class="prologue-header"><button class="prologue-logo" @click="emit('exit')">画皮 <i>借面</i></button><span>序章 · 雨夜寻凶</span><MusicControls/><button @click="emit('exit')">暂别此事 ↗</button></header>
    <template v-if="phase==='investigation'||phase==='morning'">
      <div class="prologue-investigation"><section class="prologue-map" :style="{'--dialogue-height':'235px'}"><WorldView :key="state.world.map" :world="state.world" :paused="!!note || !!paused" :hints="hints" :night="phase!=='morning'" appearance="self" :motion="motion" :quest="quest" @interact="interact" @position="emit('position',$event)"/><DialoguePortrait v-if="note" :portrait="getDialoguePortrait(note.speaker)"/><section v-if="note" class="prologue-note" role="dialog" :aria-label="note.title"><span>{{note.speaker}}</span><h2>{{note.title}}</h2><p>{{note.text}}</p><button @click="note=undefined">继续 <b>→</b></button></section></section><aside class="prologue-casebook"><span class="prologue-kicker">{{phase==='morning'?'梦醒之后':'尚未结案'}}</span><h1>{{phase==='morning'?(encounter?.stage==='complete'?'西街寻人':'井畔哭声'):'许文卿遇害案'}}</h1><div class="prologue-identity"><img :src="protagonist.portrait" alt=""/><div><b>陆知微</b><span>抄书人</span></div></div><article v-for="clue in caseClues" :key="clue.id" :class="{found:state.clues.includes(clue.id)}"><i>{{state.clues.includes(clue.id)?'✓':clue.mark}}</i><div><h3>{{clue.title}}</h3><p>{{state.clues.includes(clue.id)?clue.inference:'尚待查验 · 走近后按 E'}}</p></div></article><button v-if="phase==='investigation'" class="prologue-primary" :disabled="!allClues" @click="emit('next')">{{allClues?'核对三条线索':`待核实 ${state.clues.length} / 3`}}<b>→</b></button><p v-if="phase==='morning'" class="prologue-well-task">{{quest}}</p><p v-if="encounter?.stage==='complete'" class="prologue-well-task">已记：井沿青布与“戌初”纸屑，来历待查。</p><details v-if="phase==='morning'&&dreamNotes.length" class="prologue-dream-notes"><summary>梦中案记 · {{dreamNotes.length}} 条待核</summary><article v-for="entry in dreamNotes" :key="entry.id"><h3>{{entry.clueTitle}}</h3><p>{{entry.clueNote}}</p></article></details></aside></div>
    </template>
    <section v-else-if="phase==='deduction'" class="prologue-deduction"><span class="prologue-kicker">东厢案记 · 初步判断</span><h1>屋里还有谁？</h1><p>敲门无人应答，窗闩无损。住客簿只记了一人，屋里却有交谈声。</p><div class="prologue-evidence"><span v-for="clue in caseClues" :key="clue.id">{{clue.inference}}</span></div><div class="prologue-deductions"><button @click="emit('next','window')"><i>壹</i><b>来者经过后窗。</b><span>→</span></button><button @click="emit('next','familiar')"><i>贰</i><b>许兄认得来人。</b><span>→</span></button><button @click="emit('next','uncertain')"><i>叁</i><b>还有一段时辰没对上。</b><span>→</span></button></div></section>
    <section v-else-if="phase==='night'" class="prologue-night"><span class="prologue-kicker">客舍 · 更深</span><h1>雨声入枕。</h1><p>你把半笺夹回书里。<br/>明日，再去问许兄经手的那部旧谱。</p><button class="prologue-primary" @click="emit('next')">熄灯歇下 <b>→</b></button></section>
  </main>
</template>
