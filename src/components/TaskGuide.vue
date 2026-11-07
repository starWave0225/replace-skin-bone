<script setup lang="ts">
import {computed} from 'vue'
import {hasCaseEvidence,type PrologueState} from '../game/prologue'
import {chapterOneStages,type ChapterOneState} from '../game/chapter-one'
import {openingPoem} from '../game/opening-poem'

const props=defineProps<{prologue?:PrologueState;chapterOne?:ChapterOneState;objective?:string}>()
const guide=computed(()=>{
  if(props.chapterOne){const stage=chapterOneStages[props.chapterOne.stage];return {chapter:'第一章 · 借皮入世',title:stage.title,text:stage.goal}}
  const p=props.prologue
  if(!p)return {chapter:'第一章 · 借皮入世',title:'当前目标',text:props.objective||'继续寻访，听听眼前人的话。'}
  const chapter='序章 · 雨夜寻凶'
  if(p.phase==='investigation')return {chapter,title:'客舍寻凶',text:hasCaseEvidence(p)?'带着查到的疑点，再问客舍掌柜。':'调查客舍东厢，寻找许文卿遇害的线索。'}
  if(p.phase==='search')return {chapter,title:'循迹茶楼',text:['inn','street'].includes(p.world.map)?'穿过街巷，到无面茶楼打听。':p.world.map==='theatre'?'无面娘无心接待。可以在前堂走走，也可以上楼看看。':p.wallOpen?'看看墙后的木匣。':p.verseRoomFound?'留意房内高挂的楹联与墙板接缝。':'读读二楼各门题诗，找出韵脚不合的一间。'}
  if(p.phase==='morning')return {chapter,title:'梦醒问井',text:p.wellEncounter?.stage==='complete'?'拾得的青布似有来历，继续启程。':p.world.map!=='inn_well'?(p.briefed?'回栖雨客舍，去后堂查看枯井。':'问无面娘梦中借面的事。'):p.echo?'三道门已出现。循回声推门，或回井边重听。':p.knocks?'井里尚未应声。再想想旧谱的残谶。':'枯井里没有水。想想书册末页的残谶。'}
  if(p.phase==='dream')return {chapter,title:'雪宅残梦',text:'循白衣身影前行，触碰她的影子。最后从铜镜离开梦境。'}
  return {chapter,title:p.phase==='curtain'?'序章已毕':'雨夜来书',text:p.phase==='curtain'?'带上青布，进入第一章。':'翻阅许文卿留下的书册。'}
})
</script>
<template>
  <section class="task-guide" aria-label="当前任务">
    <span class="task-guide-chapter">{{guide.chapter}}</span>
    <h3>{{guide.title}}</h3>
    <p class="task-guide-objective">{{guide.text}}</p>
    <details v-if="prologue?.phase==='morning'" class="task-guide-poem"><summary>翻看旧谱末页</summary><blockquote><span v-for="line in openingPoem.lines" :key="line">{{line}}</span></blockquote></details>
  </section>
</template>
<style scoped>
.task-guide{padding:clamp(10px,3vw,24px) 0}.task-guide-chapter{color:#aeb89a;font-size:16px;letter-spacing:.12em}.task-guide h3{font:32px/1.5 MaShan,SimSun,serif;color:#e5cf9e;margin:16px 0}.task-guide-objective{font-size:21px;line-height:1.9;color:#e4d9b7;border-left:2px solid #b29a62;padding:12px 18px;background:#8a9d6c12;margin:0}.task-guide-poem{margin-top:24px;border-top:1px solid #ad9b6944;padding-top:14px}.task-guide-poem summary{cursor:pointer;min-height:44px;padding:8px 0;color:#d1bc8d;font-size:18px}.task-guide-poem blockquote{margin:8px 0 0;font:23px/1.8 MaShan,SimSun,serif;color:#dcc594}.task-guide-poem blockquote span{display:block}@media(max-width:600px){.task-guide-objective{font-size:19px;padding:10px 14px}.task-guide h3{font-size:29px}}
</style>
