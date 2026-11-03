<script setup lang="ts">
import { ref } from 'vue'
import OpeningCinematic from './OpeningCinematic.vue'
import { useSceneMusic } from '../game/music'
import { assetUrl } from '../game/asset-url'
const watching = ref(true)
useSceneMusic('night')
</script>

<template>
  <OpeningCinematic v-if="watching" :motion="true" @finish="watching=false" @exit="watching=false"/>
  <main v-else class="opening-replay" aria-label="开场演出预览">
    <img :src="assetUrl('/assets/opening/inn-exterior-v1.webp')" alt=""/>
    <nav><button class="primary-button" @click="watching=true">重播开场 <span>↻</span></button><a href="./" class="outline-button">返回游戏</a></nav>
  </main>
</template>

<style scoped>
.opening-replay{position:fixed;inset:0;display:grid;place-items:center;background:#080d0c;color:#ddd0ad}
.opening-replay>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.25}
.opening-replay>nav{position:relative;display:flex;gap:20px;align-items:center}
.opening-replay a{text-decoration:none;font-size:17px;letter-spacing:2px;padding:16px 24px}
@media(max-width:500px){.opening-replay>nav{flex-direction:column}}
</style>
