<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { discoveredDreamNotes, dreamSpirit, dreamStations, originalPassage } from '../game/prologue'
import type { DreamPose, DreamStationId } from '../game/prologue'
import type { createDreamScene, DreamLookMode } from '../game/dream-scene'
import MusicControls from './MusicControls.vue'
import { useSceneMusic } from '../game/music'
import { clickTone } from '../game/audio'
import '../dream.css'
useSceneMusic('dream', 100)
const musicOpen = ref(false)

const props=defineProps<{visited:DreamStationId[];pose?:DreamPose;preview?:boolean}>()
const emit=defineEmits<{inspect:[id:DreamStationId];pose:[pose:DreamPose];finish:[];exit:[]}>()
const host=ref<HTMLElement>(),ready=ref(false),intro=ref(true),reading=ref<DreamStationId>(),near=ref<DreamStationId>(),error=ref(''),lowQuality=ref(false)
const casebookOpen=ref(false),whisper=ref<DreamStationId>()
const lookMode=ref<DreamLookMode>(matchMedia('(pointer:fine)').matches?'free':'touch')
let control:Awaited<ReturnType<typeof createDreamScene>>|undefined,alive=true,launchId=0
const current=computed(()=>dreamStations[Math.min(props.visited.length,dreamStations.length-1)])
const passage=computed(()=>dreamStations.find(s=>s.id===reading.value))
const original=computed(()=>originalPassage(passage.value?.originalId))
const complete=computed(()=>props.visited.length===dreamStations.length)
const notes=computed(()=>discoveredDreamNotes(props.visited))
const whispered=computed(()=>dreamStations.find(station=>station.id===whisper.value))
const blocked=computed(()=>intro.value||!!reading.value||casebookOpen.value||complete.value||musicOpen.value)
watch(blocked,value=>control?.setPaused(value))
watch(()=>props.visited.length,()=>whisper.value=undefined)
async function launch(low=false){
  if(!host.value)return
  control?.dispose();control=undefined
  const request=++launchId
  ready.value=false;error.value='';lowQuality.value=low
  try{
    await document.fonts.ready
    const module=await import('../game/dream-scene')
    if(!alive||!host.value||request!==launchId)return
    const created=await module.createDreamScene(host.value,{pose:props.pose,lowQuality:low,seen:()=>props.visited,onNear:id=>{if(request===launchId)near.value=id},onWhisper:id=>{if(request===launchId)whisper.value=id},onLookMode:mode=>{if(alive&&request===launchId)lookMode.value=mode},onInspect:id=>{reading.value=id;control?.setPaused(true);chime()},onPose:pose=>{if(alive&&request===launchId)emit('pose',pose)},onReady:()=>{if(alive&&request===launchId)ready.value=true}})
    if(!alive||request!==launchId){created.dispose();return}
    control=created
    control.setPaused(blocked.value)
  }catch(e){if(alive&&request===launchId){error.value='三维画面或本地素材未能载入。可以使用轻量画质重试。';console.error('Dream renderer:',e)}}
}
function resumeLook(){control?.setPaused(blocked.value);if(!blocked.value)control?.look();host.value?.querySelector('canvas')?.focus({preventScroll:true})}
function enter(){intro.value=false;resumeLook()}
function remember(){if(!reading.value)return;const last=reading.value==='door';emit('inspect',reading.value);reading.value=undefined;if(!last)resumeLook()}
function toggleCasebook(){if(reading.value)return;casebookOpen.value=!casebookOpen.value;if(casebookOpen.value)control?.setPaused(true);else resumeLook()}
function keyboard(e:KeyboardEvent){
  const key=e.key.toLowerCase()
  if(key==='escape'){control?.releaseLook();if(casebookOpen.value)casebookOpen.value=false;else if(reading.value)reading.value=undefined;else if(!intro.value&&!complete.value)intro.value=true}
  else if(key==='e'&&reading.value){e.preventDefault();e.stopImmediatePropagation();remember()}
  else if(key==='j'&&!e.repeat&&!intro.value&&!reading.value&&!complete.value){e.preventDefault();e.stopImmediatePropagation();toggleCasebook()}
  else if(key==='g'&&!e.repeat&&!blocked.value){e.preventDefault();control?.guide()}
  else if(key==='tab'&&!blocked.value){e.preventDefault();control?.releaseLook()}
}
function chime(){clickTone()}
function touch(key:string,active:boolean,e:PointerEvent){e.preventDefault();if(active)(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);control?.direction(key,active)}
onMounted(()=>{void launch();window.addEventListener('keydown',keyboard,true)})
onUnmounted(()=>{control?.dispose();alive=false;window.removeEventListener('keydown',keyboard,true)})
</script>

<template>
  <main class="dream-experience" aria-label="序章末尾的第一人称梦境探索">
    <div ref="host" class="dream-renderer"></div><div class="dream-film"></div><div class="dream-border"></div>
    <header class="dream-header"><div class="dream-brand"><span>画皮</span><i>借面</i><b>序章 · 梦中寻相</b></div><div class="dream-tools"><MusicControls @open="musicOpen=$event"/><button :disabled="!!reading" @click="toggleCasebook">案记 · {{notes.length}}</button><button @click="intro=true">操作</button><button :disabled="!ready" @click="launch(!lowQuality)">画质 · {{lowQuality?'轻量':'精细'}}</button><button @click="emit('exit')">离梦</button></div></header>
    <aside v-if="!intro&&!reading&&!complete" class="dream-objective"><span>循灯而行</span><h1>{{current.title}}</h1><p>{{current.revelation && visited.length ? dreamStations[visited.length-1].revelation : '你记得，方才是在客舍熄了灯。'}}</p><div class="dream-progress" aria-label="梦境发现进度"><i v-for="(station,index) in dreamStations" :key="station.id" :class="{done:index<visited.length,active:index===visited.length}"><b>{{['壹','贰','叁','肆','伍'][index]}}</b></i><small>{{visited.length}} / 5</small></div><button class="dream-guide" @click="control?.guide()">随灯引路 <span>↗</span></button></aside>
    <span v-if="!intro&&!reading&&!complete" class="dream-reticle" aria-hidden="true"></span>
    <div v-if="!blocked&&lookMode!=='touch'" class="dream-look-state"><button v-if="lookMode==='free'" :disabled="!ready" @click="resumeLook">点击画面，继续鼠标环顾</button><span v-else-if="lookMode==='captured'">鼠标环顾中 · Esc 释放 · J 案记</span><span v-else>鼠标移入画面即可环顾 · Esc 暂停</span></div>
    <Transition name="dream-sheet"><aside v-if="!blocked&&whispered" class="dream-whisper" role="status"><span>{{dreamSpirit.name}} · 光外低语</span><p>“{{whispered.whisper}}”</p></aside></Transition>
    <div v-if="!intro&&!reading&&!complete" class="dream-bottom"><p>W A S D 行走 <i>·</i> 鼠标环顾 <i>·</i> E 查验 <i>·</i> J 案记 <i>·</i> G 引路</p><button v-if="near" class="dream-interact" @click="control?.inspect()"><kbd>E</kbd>{{current.action}}<span>↗</span></button><span v-else class="dream-listen">静听灯外的声音，走近发光的物件。</span></div>
    <div v-if="!intro&&!reading&&!complete" class="dream-touch"><button aria-label="梦中向前" @pointerdown="touch('w',true,$event)" @pointerup="touch('w',false,$event)" @pointercancel="touch('w',false,$event)">↑</button><button aria-label="梦中向左" @pointerdown="touch('a',true,$event)" @pointerup="touch('a',false,$event)" @pointercancel="touch('a',false,$event)">←</button><button aria-label="梦中向后" @pointerdown="touch('s',true,$event)" @pointerup="touch('s',false,$event)" @pointercancel="touch('s',false,$event)">↓</button><button aria-label="梦中向右" @pointerdown="touch('d',true,$event)" @pointerup="touch('d',false,$event)" @pointercancel="touch('d',false,$event)">→</button></div>
    <Transition name="dream-sheet"><section v-if="reading&&passage" class="dream-reading" role="dialog" aria-modal="true" :aria-label="passage.title"><span class="dream-kicker">梦中拾遗 · {{visited.length+1}} / 5</span><h2>{{passage.title}}</h2><p class="dream-narrative">{{passage.text}}</p><div class="dream-spirit-dialogue"><img :src="dreamSpirit.portrait" :alt="`${dreamSpirit.name} · 显影`"/><div><span>{{dreamSpirit.name}}</span><p>“{{passage.whisper}}”</p></div></div><blockquote v-if="original"><span>《聊斋志异 · 画皮》原文</span>{{original.text}}</blockquote><div class="dream-clue-note"><span>案记 · {{passage.clueTitle}}</span><p>{{passage.clueNote}}</p></div><footer><span>梦中所闻，天明须核。</span><button class="dream-primary" @click="remember">记下此事 <b>→</b></button></footer></section></Transition>
    <section v-if="casebookOpen" class="dream-casebook" role="dialog" aria-modal="true" aria-label="梦中案记"><span class="dream-kicker">许文卿遇害案 · 梦中闻见</span><h2>未可据此断案。</h2><p>梦中所闻，尚不能作实证。天明后，须与半笺、入宿簿和窗下鞋印一一核验。</p><div class="dream-casebook-notes"><article v-for="(entry,index) in notes" :key="entry.id"><span>{{['壹','贰','叁','肆','伍'][index]}} · {{entry.clueTitle}}</span><p>{{entry.clueNote}}</p><small>女魂片语：{{entry.whisper}}</small></article><p v-if="!notes.length" class="dream-empty-note">尚未记下片语。先循灯而行，查验眼前之物。</p></div><button class="dream-primary" @click="toggleCasebook">收起案记 <b>→</b></button></section>
    <section v-if="intro&&!error" class="dream-intro"><span class="dream-kicker">一梦之间 · 第一人称探索</span><h1>灯外，有人。</h1><div class="dream-title-rule"></div><p>闭眼时，你还在栖雨客舍。<br/>睁眼后，白衣女魂停在灯照不到的地方。<br/>她有一段冤情，也有几句未说完的话。</p><button class="dream-primary" :disabled="!ready" @click="enter">{{ready?'步入梦中':'点灯入梦…'}}<b>→</b></button><small><span class="dream-mouse-help">进入后移动鼠标即可环顾 · WASD 行走 · Shift 疾行<br/>E 查验 · J 案记 · G 引路 · Esc 释放鼠标</span><span class="dream-touch-help">触屏拖动环顾 · 方向按钮行走 · 点击查验</span></small></section>
    <section v-if="complete&&!reading" class="dream-waking"><span class="dream-kicker">五物已见 · 一名未忘</span><h1>天明，往西街。</h1><p>无面茶楼。执笔之人。<br/>你把这两个词记在心里。<br/>还有自己的姓名：陆知微。</p><button class="dream-primary" @click="emit('finish')">叩门 · 梦醒 <b>→</b></button></section>
    <section v-if="error" class="dream-error" role="alert"><h2>灯尚未点起</h2><p>{{error}}</p><button class="dream-primary" @click="launch(true)">轻量画质重试</button><button @click="emit('exit')">返回</button></section>
  </main>
</template>
