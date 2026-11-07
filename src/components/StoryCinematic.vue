<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { assetUrl } from '../game/asset-url'
import { cinematicDuration, cinematicFrame, storyCinematics } from '../game/story-cinematics'
import type { StoryCinematicId } from '../game/story-cinematics'
import { createCinematicAudio } from '../game/cinematic-audio'
import { musicState, setMusicEnabled, useSceneMusic } from '../game/music'

const props = defineProps<{ scene: StoryCinematicId; motion: boolean; paused?: boolean }>()
const emit = defineEmits<{ finish: []; exit: [] }>()
const elapsed = ref(0), ready = ref(false), userPaused = ref(false), hidden = ref(document.hidden), reduced = ref(false)
const film = computed(() => storyCinematics[props.scene]), frame = computed(() => cinematicFrame(props.scene, elapsed.value))
const paused = computed(() => userPaused.value || !!props.paused || hidden.value)
const animated = computed(() => props.motion && !reduced.value)
const audio = createCinematicAudio()
let raf = 0, last = 0, disposed = false, finished = false
let preference: MediaQueryList | undefined
const played = new Set<number>()
useSceneMusic('opening', 30, computed(() => ready.value && !paused.value))
const pictureStyle = computed(() => ({
  objectPosition: `${frame.value.shot.focus[0]}% ${frame.value.shot.focus[1]}%`,
  transformOrigin: `${frame.value.shot.focus[0]}% ${frame.value.shot.focus[1]}%`,
  transform: `scale(${animated.value ? frame.value.zoom : frame.value.shot.zoom[0]})`,
}))
function finish() { if (finished || props.paused) return; finished = true; audio.stop(); emit('finish') }
function exit() { if (props.paused) return; audio.stop(); emit('exit') }
function togglePause() { if (!props.paused) userPaused.value = !userPaused.value }
function visibility() { hidden.value = document.hidden; last = 0 }
function preferenceChanged() { reduced.value = preference?.matches ?? false }
function keyboard(event: KeyboardEvent) {
  if (props.paused || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return
  if (event.code === 'Escape' || event.code === 'Space' && !(event.target as HTMLElement)?.closest('button')) { event.preventDefault(); togglePause() }
}
watch([paused, () => musicState.enabled], () => { last = 0; if (paused.value || !musicState.enabled) audio.stop() })
function tick(now: number) {
  if (disposed || finished) return
  if (ready.value && !paused.value) {
    elapsed.value = Math.min(cinematicDuration(props.scene), elapsed.value + (last ? Math.min(100, now - last) : 0))
    film.value.cues.forEach((cue, index) => {
      if (elapsed.value >= cue.at && !played.has(index)) { played.add(index); if (musicState.enabled) void audio.play(cue.sound, musicState.volume) }
    })
    if (elapsed.value >= cinematicDuration(props.scene)) { finish(); return }
  }
  last = now; raf = requestAnimationFrame(tick)
}
onMounted(async () => {
  preference = matchMedia('(prefers-reduced-motion: reduce)'); preferenceChanged(); preference.addEventListener('change', preferenceChanged)
  document.addEventListener('visibilitychange', visibility); window.addEventListener('keydown', keyboard)
  await Promise.all([...new Set(film.value.shots.map(shot => shot.art))].map(src => new Promise<void>(resolve => {
    const image = new Image(); image.onload = () => resolve(); image.onerror = () => resolve(); image.src = assetUrl(src)
  })))
  if (disposed) return
  ready.value = true; raf = requestAnimationFrame(tick)
})
onUnmounted(() => { disposed = true; cancelAnimationFrame(raf); audio.dispose(); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('keydown', keyboard); preference?.removeEventListener('change', preferenceChanged) })
</script>

<template>
  <main class="story-cinematic" :class="{ 'cg-paused': paused, 'cg-motion': animated, 'cg-dark': frame.shot.shade }" :aria-label="film.title" :data-scene="scene" :data-shot="frame.shot.id" :data-elapsed="Math.floor(elapsed)">
    <Transition name="story-shot">
      <div :key="frame.shot.id" class="story-cg-frame" :class="`cg-shot-${frame.shot.id}`">
        <img :src="assetUrl(frame.shot.art)" alt="" :style="pictureStyle"/>
      </div>
    </Transition>
    <div class="story-cg-vignette"></div>
    <div class="story-cg-black"></div>
    <header><span>{{ film.title }}</span><button @click="exit">返回首页</button></header>
    <p v-if="!ready" class="story-cg-loading" role="status">灯影将起……</p>
    <p v-if="ready" :key="frame.shot.id" class="story-cg-caption" aria-live="polite">{{ frame.shot.caption }}</p>
    <div v-if="userPaused" class="story-cg-pause" role="status">演出已暂停</div>
    <footer>
      <div class="story-cg-progress" aria-hidden="true"><i v-for="(shot,index) in film.shots" :key="shot.id" :class="{ passed: index < frame.index }"><b :style="{ width: index < frame.index ? '100%' : index === frame.index ? `${frame.progress * 100}%` : '0%' }"/></i></div>
      <nav aria-label="CG 播放控制">
        <button @click="setMusicEnabled(!musicState.enabled)">声音 · {{ musicState.enabled ? '开' : '关' }}</button>
        <button :disabled="!ready || !!props.paused" @click="togglePause">{{ userPaused ? '继续播放' : '暂停播放' }}</button>
        <button :disabled="!!props.paused" @click="finish">跳过演出 ↗</button>
      </nav>
    </footer>
  </main>
</template>

<style scoped>
.story-cinematic { position: relative; isolation: isolate; width: 100%; height: 100%; flex: 1; min-height: 0; overflow: hidden; background: #0c0907; color: #f0dfbc; }
.story-cg-frame, .story-cg-frame img, .story-cg-vignette, .story-cg-black { position: absolute; inset: 0; width: 100%; height: 100%; }
.story-cg-frame { overflow: hidden; }
.story-cg-frame img { object-fit: cover; }
.story-cg-vignette { background: linear-gradient(0deg, #070908ed, #07090822 35%, transparent 67%, #0b0908b0), radial-gradient(ellipse, transparent 40%, #0c09075e); }
.story-cg-black { background: #080909; opacity: 0; transition: opacity .9s; }
.cg-dark .story-cg-black { opacity: 1; }
.story-cinematic header, .story-cinematic footer { position: absolute; z-index: 3; left: 0; right: 0; padding: 16px max(20px, env(safe-area-inset-right)); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.story-cinematic header { top: 0; font-size: 18px; letter-spacing: .1em; }
.story-cinematic button { font: inherit; color: inherit; background: #16100e99; border: 1px solid #cfb27966; padding: 8px 14px; min-height: 44px; cursor: pointer; }
.story-cinematic button:focus-visible { outline: 2px solid #e6ca8e; outline-offset: 3px; }
.story-cinematic footer { bottom: 0; padding-bottom: max(16px, env(safe-area-inset-bottom)); }
.story-cinematic nav { display: flex; gap: 8px; font-size: 17px; }
.story-cg-progress { display: flex; gap: 5px; width: min(180px, 20vw); }
.story-cg-progress i { height: 2px; background: #a68d5c44; flex: 1; }
.story-cg-progress b { display: block; height: 100%; background: #c0a371; }
.story-cg-caption { position: absolute; z-index: 2; left: 5%; right: 5%; bottom: 90px; margin: 0 auto; max-width: 740px; text-align: center; font-size: clamp(22px, 2.2vw, 31px); line-height: 1.6; text-shadow: 0 2px 10px #000; }
.story-cg-loading, .story-cg-pause { position: absolute; z-index: 4; left: 50%; top: 50%; transform: translate(-50%, -50%); background: #101511df; padding: 15px 22px; font-size: 22px; }
.cg-motion .story-shot-enter-active, .cg-motion .story-shot-leave-active { transition: opacity .55s; }
.story-shot-enter-from, .story-shot-leave-to { opacity: 0; }
.cg-motion .cg-shot-strike { animation: cg-impact .4s .2s both; }
.cg-paused * { animation-play-state: paused !important; }
@keyframes cg-impact { 35% { transform: translate(-8px, 5px) rotate(-.7deg); filter: brightness(.75); } 65% { transform: translate(5px, -3px); } }
@media (max-width: 650px) {
  .story-cinematic header { font-size: 15px; padding: 12px; gap: 5px; }
  .story-cinematic header button { font-size: 15px; padding: 7px 10px; }
  .story-cinematic footer { display: grid; justify-items: center; justify-content: center; gap: 13px; padding-left: 12px; padding-right: 12px; }
  .story-cinematic nav { font-size: 16px; gap: 5px; }
  .story-cinematic nav button { padding: 7px 10px; }
  .story-cg-progress { width: 160px; }
  .story-cg-caption { bottom: 108px; font-size: 23px; }
}
@media (max-height: 450px) { .story-cinematic header { padding-top: 6px; } .story-cg-caption { bottom: 72px; font-size: 22px; } .story-cinematic footer { padding-top: 4px; padding-bottom: 10px; } }
@media (prefers-reduced-motion: reduce) { .story-cg-black { transition: none; } }
</style>
