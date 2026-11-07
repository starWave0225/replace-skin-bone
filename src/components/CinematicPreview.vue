<script setup lang="ts">
import { ref } from 'vue'
import StoryCinematic from './StoryCinematic.vue'
import PrologueCurtain from './PrologueCurtain.vue'
const requestedScene = new URLSearchParams(location.search).get('scene')
const scene = requestedScene === 'curtain' ? 'curtain' : requestedScene === 'well' ? 'well' : 'ambush'
const finished = ref(false)
</script>
<template>
  <PrologueCurtain v-if="!finished && scene==='curtain'" :motion="true" @next="finished=true" @exit="finished=true"/>
  <StoryCinematic v-else-if="!finished && scene!=='curtain'" :scene="scene" :motion="true" @finish="finished = true" @exit="finished = true"/>
  <main v-else class="cg-preview-end"><p>画皮 · 千面</p><h1>{{ scene === 'ambush' ? '灯灭，梦起。' : '井畔有声，提笔应战。' }}</h1><button @click="finished = false">再看一次</button><a :href="scene === 'ambush' ? '?view=cg&scene=well' : '?view=cg&scene=ambush'">{{ scene === 'ambush' ? '看鬼童 CG' : '看开匣 CG' }}</a><a href="./">返回首页</a></main>
</template>
<style scoped>
.cg-preview-end { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; padding: 20px; background: #141a16; color: #e4d4af; text-align: center; }
.cg-preview-end h1 { font: clamp(28px, 5vw, 48px) MaShan, serif; }
.cg-preview-end button, .cg-preview-end a { font-size: 20px; color: inherit; padding: 10px 18px; border: 1px solid #897b5e; background: transparent; min-height: 44px; }
</style>
