<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
import type { DreamPose, DreamStationId } from '../game/prologue'
const DreamExploration=defineAsyncComponent(()=>import('./DreamExploration.vue'))
const visited=ref<DreamStationId[]>([]),pose=ref<DreamPose>(),finished=ref(false),key=ref(0)
function restart(){visited.value=[];pose.value=undefined;finished.value=false;key.value++}
function exit(){window.location.assign('./')}
</script>
<template>
  <DreamExploration v-if="!finished" :key="key" :visited="visited" :pose="pose" preview @inspect="visited.push($event)" @pose="pose=$event" @finish="finished=true" @exit="exit"/>
  <main v-else class="dream-preview-end"><span>画皮 · 千面</span><h1>梦醒，案未了。</h1><a class="dream-primary" href="./">返回游戏 <b>→</b></a><button @click="restart">再入此梦</button></main>
</template>
