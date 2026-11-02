<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
import type { DreamPose, DreamStationId } from '../game/prologue'
const DreamExploration=defineAsyncComponent(()=>import('./DreamExploration.vue'))
const visited=ref<DreamStationId[]>([]),pose=ref<DreamPose>(),finished=ref(false),key=ref(0)
function restart(){visited.value=[];pose.value=undefined;finished.value=false;key.value++}
</script>
<template>
  <DreamExploration v-if="!finished" :key="key" :visited="visited" :pose="pose" preview @inspect="visited.push($event)" @pose="pose=$event" @finish="finished=true" @exit="finished=true"/>
  <main v-else class="dream-preview-end"><span>画皮 · 借面</span><h1>梦醒，案未了。</h1><p>完整序章里，你将先以陆知微的身份调查故人遇害一案，<br/>再循此梦，去西街寻找无面茶楼。</p><a class="dream-primary" href="./">从完整序章开始 <b>→</b></a><button @click="restart">再入此梦</button></main>
</template>
