<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { assetUrl } from '../game/asset-url'
import { isPrologueDemo } from '../game/build-profile'

const props = defineProps<{ motion: boolean }>()
defineEmits<{ exit: []; next: [] }>()
const shots = [
  { art: '/assets/opening/ink/guestroom-storm.webp', line: '未闻县。一夜风雨，有人叩门。' },
  { art: '/assets/opening/rain-ink-face-v2.webp', line: '有人落笔，有人借相。' },
  { art: '/assets/title/painted-skin-title.webp', line: '是人是妖，是皮是相。' },
]
const shot = ref(0)
const frame = computed(() => shots[shot.value])
const title = computed(() => shot.value === shots.length - 1)
let timer: ReturnType<typeof setInterval> | undefined

function skip() { shot.value = shots.length - 1; clearInterval(timer) }
onMounted(() => {
  if (!props.motion || matchMedia('(prefers-reduced-motion: reduce)').matches) skip()
  else timer = setInterval(() => { shot.value++; if (title.value) clearInterval(timer) }, 3200)
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <main class="prologue-curtain" :class="{ 'curtain-motion': motion }" aria-label="序章片尾">
    <Transition name="curtain-fade">
      <img :key="frame.art" :src="assetUrl(frame.art)" alt="" />
    </Transition>
    <div class="curtain-shade"></div>
    <div class="curtain-copy" aria-live="polite">
      <span v-if="title">未闻志异 · 序章终</span>
      <h1 v-if="title">画皮<span>千面</span></h1>
      <p>{{ frame.line }}</p>
      <template v-if="title">
        <template v-if="isPrologueDemo">
          <small>序章试玩到此结束 · 感谢游玩</small>
          <button class="prologue-primary" @click="$emit('exit')">返回标题 <b>↗</b></button>
        </template>
        <template v-else>
          <small>第一章 · 借皮入世</small>
          <button class="prologue-primary" @click="$emit('next')">进入第一章 <b>→</b></button>
        </template>
      </template>
    </div>
    <button v-if="!title" class="curtain-skip" @click="skip">跳过片尾 ↗</button>
  </main>
</template>

<style scoped>
.prologue-curtain { position: relative; isolation: isolate; display: grid; place-items: center; width: 100%; height: 100%; min-height: 0; overflow: hidden; background: #0c0b0a; color: #efdfb8; }
.prologue-curtain > img, .curtain-shade { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.curtain-motion > img { animation: slow-in 7s both; }
.curtain-shade { background: radial-gradient(ellipse at 50% 50%, #0d0b09aa 8%, #0d0b091e 56%, #0d0b09cc 100%), linear-gradient(0deg, #110a07cc, #0d0b0922 56%); }
.curtain-copy { z-index: 1; display: grid; justify-items: center; gap: clamp(8px, 2.5vh, 25px); padding: 14px; text-align: center; text-shadow: 0 2px 16px #000; }
.curtain-copy > span, .curtain-copy small { letter-spacing: .18em; color: #e1c58e; }
.curtain-copy h1 { font: clamp(50px, 14vw, 125px)/1 MaShan, serif; letter-spacing: .11em; }
.curtain-copy h1 span { display: inline-block; font-size: .46em; vertical-align: middle; padding: .13em .22em; color: #ffcbab; border: 1px solid #ab6550; }
.curtain-copy p { font-size: clamp(20px, 4vw, 33px); }
.curtain-skip { position: absolute; right: 15px; bottom: 15px; min-height: 44px; padding: 0 12px; background: #191310d9; border: 1px solid #a8906670; }
.curtain-motion .curtain-fade-enter-active, .curtain-motion .curtain-fade-leave-active { transition: opacity .7s; }
.curtain-fade-enter-from, .curtain-fade-leave-to { opacity: 0; }
@keyframes slow-in { from { transform: scale(1); } to { transform: scale(1.07); } }
@media (prefers-reduced-motion: reduce) { .curtain-motion > img { animation: none; } }
</style>
