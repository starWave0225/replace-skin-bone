<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { caseClues, discoveredDreamNotes, protagonist } from '../game/prologue'
import type { DreamPose, DreamStationId, PrologueState } from '../game/prologue'
import type { WorldSpot } from '../game/world'
import type { WorldState } from '../game/types'
import WorldView from './WorldView.vue'
import MusicControls from './MusicControls.vue'
import DialoguePortrait from './DialoguePortrait.vue'
import { getDialoguePortrait } from '../game/portraits'
import '../prologue.css'
const DreamExploration=defineAsyncComponent(()=>import('./DreamExploration.vue'))
const props=defineProps<{state:PrologueState;motion:boolean}>()
const emit=defineEmits<{next:[deduction?:string];inspect:[id:string];dreamInspect:[id:DreamStationId];dreamPose:[pose:DreamPose];position:[position:WorldState];exit:[]}>()
const note=ref<{title:string;text:string;speaker:string}>()
const phase=computed(()=>props.state.phase),allClues=computed(()=>props.state.clues.length===caseClues.length)
const dreamNotes=computed(()=>discoveredDreamNotes(props.state.dreamSeen))
const quest=computed(()=>phase.value==='morning'?'去西街寻找无面茶楼。':'查验半笺、入宿簿和窗下湿泥。')
function interact(spot:WorldSpot){
  if(spot.id==='teahouse'){
    if(phase.value==='morning')emit('next')
    else note.value={title:'雨尚未停',speaker:'陆知微',text:'先查完东厢再走。'}
    return
  }
  if(spot.id==='owner'){note.value=phase.value==='morning'?{title:'送茶',speaker:'茶摊老板',text:'你问送茶的事？小二只隔着门听见说话，并未看清另一名来客的脸。\n许先生来时，确实带着一册裹青布的旧谱。那部谱后来去了哪儿，我便不知道了。'}:{title:'昨夜的客人',speaker:'茶摊老板',text:'我在南街摆茶摊，晚间也替客舍记账。\n许先生酉时一个人来的。戌初，屋里倒像有两个人说话。\n你便是信上那个陆知微？韩捕快说，你先别走远。'};return}
  const clue=caseClues.find(c=>c.id===spot.id)
  if(clue){emit('inspect',clue.id);note.value={title:clue.title,text:clue.text,speaker:'陆知微'}}
}
watch(phase,value=>{note.value=undefined;if(value==='morning')note.value={title:'梦醒',speaker:'陆知微',text:'天色微亮。窗下的鞋印还在，案上的半笺也还在。\n那间茶楼的名字，清楚得不像一个梦。'}})
</script>
<template>
  <DreamExploration v-if="phase==='dream'" :visited="state.dreamSeen" :pose="state.dreamPose" @inspect="emit('dreamInspect',$event)" @pose="emit('dreamPose',$event)" @finish="emit('next')" @exit="emit('exit')"/>
  <main v-else class="prologue-page">
    <header class="prologue-header"><button class="prologue-logo" @click="emit('exit')">画皮 <i>借面</i></button><span>序章 · 雨夜寻凶</span><MusicControls/><button @click="emit('exit')">暂别此事 ↗</button></header>
    <template v-if="phase==='arrival'">
      <div class="prologue-landscape"></div><span class="prologue-inscription">雨落旧城，故人不至。</span>
      <section class="prologue-introduction"><span class="prologue-kicker">未闻县 · 入暮</span><h1>一封旧约。</h1><p>你叫 <b>陆知微</b>，以抄书、代写书信为生。<br/>故友许文卿寄信，请你来未闻县校一部旧谱。<br/>你赶了两日的路，却在客舍门前见到封条。</p><blockquote>“知微兄：旧谱有讹，烦来一校。<br/>戌时，东厢候。”<small>—— 许文卿的来信</small></blockquote><p class="prologue-small">昨夜，许文卿死在了那间东厢里。</p><button class="prologue-primary" @click="emit('next')">进客舍 <b>→</b></button></section>
      <figure class="prologue-self"><img :src="protagonist.portrait" alt="陆知微 · 本来面目"/><figcaption><b>陆知微</b><span>二十七岁 · 抄书人</span></figcaption></figure>
    </template>
    <template v-else-if="phase==='investigation'||phase==='morning'">
      <div class="prologue-investigation"><section class="prologue-map" :style="{'--dialogue-height':'235px'}"><WorldView :world="state.world" :paused="!!note" :night="phase!=='morning'" appearance="self" :motion="motion" :quest="quest" @interact="interact" @position="emit('position',$event)"/><DialoguePortrait v-if="note" :portrait="getDialoguePortrait(note.speaker)"/><section v-if="note" class="prologue-note" role="dialog" :aria-label="note.title"><span>{{note.speaker}}</span><h2>{{note.title}}</h2><p>{{note.text}}</p><button @click="note=undefined">继续 <b>→</b></button></section></section><aside class="prologue-casebook"><span class="prologue-kicker">{{phase==='morning'?'梦醒之后':'尚未结案'}}</span><h1>{{phase==='morning'?'西街寻人':'许文卿遇害案'}}</h1><div class="prologue-identity"><img :src="protagonist.portrait" alt=""/><div><b>陆知微</b><span>抄书人</span></div></div><article v-for="clue in caseClues" :key="clue.id" :class="{found:state.clues.includes(clue.id)}"><i>{{state.clues.includes(clue.id)?'✓':clue.mark}}</i><div><h3>{{clue.title}}</h3><p>{{state.clues.includes(clue.id)?clue.inference:'尚待查验 · 走近后按 E'}}</p></div></article><button v-if="phase==='investigation'" class="prologue-primary" :disabled="!allClues" @click="emit('next')">{{allClues?'核对三条线索':`待核实 ${state.clues.length} / 3`}}<b>→</b></button><details v-if="phase==='morning'&&dreamNotes.length" class="prologue-dream-notes"><summary>梦中案记 · {{dreamNotes.length}} 条待核</summary><article v-for="entry in dreamNotes" :key="entry.id"><h3>{{entry.clueTitle}}</h3><p>{{entry.clueNote}}</p></article></details></aside></div>
    </template>
    <section v-else-if="phase==='deduction'" class="prologue-deduction"><span class="prologue-kicker">东厢案记 · 初步判断</span><h1>屋里还有谁？</h1><p>门从内闩，窗闩无损。住客簿只记了一人，屋里却有交谈声。</p><div class="prologue-evidence"><span v-for="clue in caseClues" :key="clue.id">{{clue.inference}}</span></div><div class="prologue-deductions"><button @click="emit('next','window')"><i>壹</i><b>来者经过后窗。</b><span>→</span></button><button @click="emit('next','familiar')"><i>贰</i><b>许兄认得来人。</b><span>→</span></button><button @click="emit('next','uncertain')"><i>叁</i><b>还有一段时辰没对上。</b><span>→</span></button></div></section>
    <section v-else-if="phase==='night'" class="prologue-night"><span class="prologue-kicker">客舍 · 更深</span><h1>雨声入枕。</h1><p>你把半笺夹回书里。<br/>明日，再去问许兄经手的那部旧谱。</p><button class="prologue-primary" @click="emit('next')">熄灯歇下 <b>→</b></button></section>
  </main>
</template>
