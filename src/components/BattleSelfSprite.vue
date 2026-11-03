<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { drawWorldActor, loadWorldArt } from '../game/world-art'
const canvas = ref<HTMLCanvasElement>()
onMounted(async () => {
  const art = await loadWorldArt(), c = canvas.value?.getContext('2d')
  if (!c) return
  c.imageSmoothingEnabled = false
  drawWorldActor(c, art, 'self', 80, 151, 'up', 0, 8)
})
</script>
<template><canvas ref="canvas" width="160" height="160" role="img" aria-label="陆知微本人的像素战斗背影" class="combat-self-sprite"/></template>
