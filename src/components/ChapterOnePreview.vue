<script setup lang="ts">
import {onUnmounted,ref,watch} from 'vue'
import {initialState,isValidState} from '../game/engine'
import {createChapterOne,chapterOneCommand,type ChapterOneCommand} from '../game/chapter-one'
import ChapterOneView from './ChapterOneView.vue'
const key='qianmian-chapter-one-preview-v1'
function exit(){window.location.assign('./')}
function fresh(){const s=initialState();s.chapterOne=createChapterOne();s.mode='hub';s.world=s.chapterOne.world;return s}
function load(){try{const value=JSON.parse(localStorage.getItem(key)||'null');if(isValidState(value)&&value.chapterOne)return value}catch{}return fresh()}
const state=ref(load()),notice=ref('')
let timer:ReturnType<typeof setTimeout>|undefined
function save(manual=false){try{localStorage.setItem(key,JSON.stringify(state.value));if(manual)message('第一章试玩进度已保存。正式剧情存档不受影响。')}catch{message('浏览器无法写入试玩存档，请保持本页打开。')}}
function message(text:string){notice.value=text;clearTimeout(timer);timer=setTimeout(()=>notice.value='',4000)}
function command(value:ChapterOneCommand){chapterOneCommand(state.value.chapterOne!,value);state.value.world=state.value.chapterOne!.world}
watch(state,()=>save(),{deep:true})
onUnmounted(()=>clearTimeout(timer))
</script>
<template>
  <ChapterOneView :state="state" preview @command="command" @save="save(true)" @restart="state=fresh()" @exit="exit"/>
  <p v-if="notice" class="chapter-preview-toast" role="status">{{notice}}</p>
</template>
<style scoped>.chapter-preview-toast{position:fixed;z-index:100;bottom:90px;left:50%;transform:translateX(-50%);max-width:90%;padding:14px 20px;background:#15251a;border:1px solid #ae9567;color:#e4d6b6;font-size:18px}</style>
