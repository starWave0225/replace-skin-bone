<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { crossedOpeningCues, openingDuration, openingFrame } from '../game/opening'
import { OpeningRenderer } from '../game/opening-renderer'
import { openingCue } from '../game/audio'
import { musicState, setMusicEnabled } from '../game/music'
import '../opening.css'

const props = defineProps<{ motion: boolean }>()
const emit = defineEmits<{ finish: []; exit: [] }>()
const canvas = ref<HTMLCanvasElement>()
const film = ref<HTMLElement>()
const elapsed = ref(0)
const paused = ref(false)
const hidden = ref(document.hidden)
const frame = computed(() => openingFrame(elapsed.value))
let renderer: OpeningRenderer | undefined
let observer: ResizeObserver | undefined
let animation = 0, lastTime = 0, lastDraw = 0, finished = false
let reducedMotion = false
let preference: MediaQueryList | undefined
const sounds = new Set<() => void>()

function stopSounds() { sounds.forEach(stop => stop()); sounds.clear() }
function finish() {
  if (finished) return
  finished = true; cancelAnimationFrame(animation); stopSounds(); emit('finish')
}
function togglePause() { paused.value = !paused.value; lastTime = 0; if (paused.value) stopSounds() }
function toggleSound() { setMusicEnabled(!musicState.enabled); if (!musicState.enabled) stopSounds() }
function visibilityChanged() { hidden.value = document.hidden; lastTime = 0; if (hidden.value) stopSounds() }
function preferenceChanged() { reducedMotion = preference?.matches ?? false; renderer?.draw(elapsed.value, reducedMotion || !props.motion) }
function keyboard(event: KeyboardEvent) {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return
  if (event.code === 'Escape' || event.code === 'Space' && !(event.target as HTMLElement)?.closest('button')) {
    event.preventDefault(); togglePause()
  }
}
function tick(now: number) {
  if (finished) return
  if (!paused.value && !hidden.value) {
    const previous = elapsed.value
    elapsed.value = Math.min(openingDuration, previous + (lastTime ? Math.min(100, now - lastTime) : 0))
    if (musicState.enabled) for (const cue of crossedOpeningCues(previous, elapsed.value)) sounds.add(openingCue(cue.sound))
    if (now - lastDraw >= 1000 / 30) {
      renderer?.draw(elapsed.value, reducedMotion || !props.motion); lastDraw = now
    }
    if (elapsed.value >= openingDuration) { finish(); return }
  }
  lastTime = now; animation = requestAnimationFrame(tick)
}

onMounted(async () => {
  try {
    const loaded = await OpeningRenderer.create(canvas.value!)
    if (finished) { loaded.dispose(); return }
    renderer = loaded
    preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    preferenceChanged(); preference.addEventListener('change', preferenceChanged)
    observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      renderer?.resize(width, height); renderer?.draw(elapsed.value, reducedMotion || !props.motion)
    })
    observer.observe(film.value!)
    canvas.value?.focus({ preventScroll: true })
    document.addEventListener('visibilitychange', visibilityChanged)
    visibilityChanged()
    window.addEventListener('keydown', keyboard)
    animation = requestAnimationFrame(tick)
  } catch { finish() }
})
onUnmounted(() => {
  finished = true; cancelAnimationFrame(animation); stopSounds(); observer?.disconnect(); renderer?.dispose()
  preference?.removeEventListener('change', preferenceChanged)
  document.removeEventListener('visibilitychange', visibilityChanged); window.removeEventListener('keydown', keyboard)
})
</script>

<template>
  <main class="opening-page" :class="{ 'opening-paused': paused }" :data-shot="frame.shot" aria-label="雨夜寻凶 · 开场演出">
    <div ref="film" class="opening-film">
      <canvas ref="canvas" tabindex="0" role="img" aria-label="雨夜客舍开场演出"/>
    </div>
    <nav class="opening-controls" aria-label="演出控制">
      <button :aria-label="musicState.enabled ? '静音' : '开启声音'" :title="musicState.enabled ? '静音' : '开启声音'" :class="{ muted: !musicState.enabled }" @click="toggleSound">♪</button>
      <button :aria-label="paused ? '继续演出' : '暂停演出'" :title="paused ? '继续演出' : '暂停演出'" @click="togglePause">{{ paused ? '▷' : 'Ⅱ' }}</button>
      <button aria-label="跳过开场演出" title="跳过开场演出" @click="finish">»</button>
      <button aria-label="返回标题页" title="返回标题页" @click="emit('exit')">×</button>
    </nav>
  </main>
</template>
