<script setup lang="ts">
import PaintedMask from './PaintedMask.vue'
import type { Location } from '../game/types'
import { locations } from '../game/catalog'
withDefaults(defineProps<{ location: Location; cover?: boolean; night?: boolean }>(), { cover: false, night: false })
</script>
<template>
  <div class="scene-art" :class="[location, { cover, night }]" aria-hidden="true">
    <img class="scene-painting" :src="`/assets/${locations[location].image}`" alt="" />
    <div class="scene-shade"></div><div class="scene-mist mist-one"></div><div class="scene-mist mist-two"></div>
    <svg class="pine-branch" viewBox="0 0 400 400"><g stroke="currentColor" fill="none"><path d="M-20 30Q95 60 165 150Q230 205 380 218M112 97Q190 50 286 64M161 146Q170 260 270 329" stroke-width="5"/><path d="M172 146 212 98m-25 30 75-10m-51-19 20-35m-40 69 63 37m-2-52 65-24m-29-28 45-22M239 280l46-39m-44 39 79 16m-48 27 55-5" stroke-width="2"/><g stroke-width="1" opacity=".7"><path d="m221 95 7-49m-7 49 35-42m-35 42 48-22m-52 53 45-21m-45 21 56-2m-58 1 35 23m30-79 23-31m-23 31 45-15m-45 15 43 5m-8 22 38-35m-38 35 47-5m-47 5 32 19m-62 133 25-42m-25 42 49-23m-49 23 53 3m-25 47 38-23m-38 23 49 3"/></g></g></svg>
    <template v-if="location === 'theatre' || cover">
      <div class="theatre-curtain left"></div><div class="theatre-curtain right"></div>
      <div class="hanging-masks"><PaintedMask class="mask-back one" variant="empty"/><PaintedMask class="mask-front" variant="shen"/><PaintedMask class="mask-back two" variant="empty"/></div>
    </template>
    <div v-if="location !== 'well'" class="paper-lantern"><i></i><span>归</span><b></b></div>
    <div v-if="location === 'well'" class="old-well"><div class="well-water"></div><i></i></div>
    <img v-if="location === 'mansion'" class="woman-echo" src="/assets/woman.jpg" alt="" />
    <div class="embers"><i v-for="n in 14" :key="n" :style="{ '--n': n }"></i></div>
    <div v-if="['street', 'well'].includes(location)" class="rain-lines"></div>
  </div>
</template>
