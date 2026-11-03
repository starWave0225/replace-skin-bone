<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { continuingOpeningCues, crossedOpeningCues, openingDuration, openingFrame, openingWeather } from '../game/opening'
import { openingBookPages, setOpeningBookBrightness } from '../game/opening-book'
import { observeOpeningLight, type OpeningLightMode } from '../game/opening-light'
import { advanceOpeningPlayback, createOpeningPlayback, isOpeningBookWaiting, turnOpeningPage } from '../game/opening-playback'
import { OpeningRenderer } from '../game/opening-renderer'
import { openingCue, setOpeningWind } from '../game/audio'
import { musicState, setMusicEnabled, useSceneMusic } from '../game/music'
import Icon from './Icon.vue'
import '../opening.css'

const props = defineProps<{ motion: boolean; fromBook?: boolean }>()
const emit = defineEmits<{ finish: []; exit: [] }>()
const canvas = ref<HTMLCanvasElement>()
const film = ref<HTMLElement>()
const playback = ref(createOpeningPlayback(props.fromBook))
const elapsed = computed(() => playback.value.elapsed)
const bookActive = computed(() => isOpeningBookWaiting(playback.value))
const bookPage = computed(() => openingBookPages[playback.value.book.page])
const turning = computed(() => playback.value.book.turnElapsed !== null)
const poemPage = computed(() => bookPage.value.kind === 'poem')
const bookLabel = computed(() => poemPage.value ? (playback.value.book.revealed ? `旧谱末页：${bookPage.value.title}浮现` : '旧谱末页：纸面上有模糊的墨痕') : `旧谱第${playback.value.book.page + 1}页：${bookPage.value.title}`)
const paused = ref(false)
const hidden = ref(document.hidden)
const controlsVisible = ref(true)
const ready = ref(false)
const lightMode = ref<OpeningLightMode>('manual')
const manualLight = ref(false)
useSceneMusic('opening', 20, computed(() => !paused.value && !hidden.value))
const frame = computed(() => openingFrame(elapsed.value))
let renderer: OpeningRenderer | undefined
let observer: ResizeObserver | undefined
let animation = 0, lastTime = 0, lastDraw = 0, finished = false
let reducedMotion = false
let preference: MediaQueryList | undefined
let controlsTimer: ReturnType<typeof setTimeout> | undefined
let stopLight: (() => void) | undefined
const sounds = new Set<() => void>()
let restoreSounds = false
watch(() => musicState.playing, playing => { if (playing) restoreSounds = true })
watch(() => ready.value && bookActive.value && poemPage.value && !paused.value && !hidden.value && !manualLight.value, active => {
  stopLight?.(); stopLight = undefined
  if (active) stopLight = observeOpeningLight(brightness => {
    setOpeningBookBrightness(playback.value.book, brightness); draw()
  }, mode => { lightMode.value = mode })
}, { flush: 'post' })

function revealControls() {
  controlsVisible.value = true; clearTimeout(controlsTimer)
  controlsTimer = setTimeout(() => { controlsVisible.value = false }, 1800)
}
function stopSounds() { sounds.forEach(stop => stop()); sounds.clear(); restoreSounds = true }
function finish() {
  if (finished) return
  finished = true; cancelAnimationFrame(animation); stopSounds(); stopLight?.(); emit('finish')
}
function togglePause() { paused.value = !paused.value; lastTime = 0; if (paused.value) stopSounds() }
function toggleSound() { setMusicEnabled(!musicState.enabled); if (!musicState.enabled) stopSounds() }
function visibilityChanged() { hidden.value = document.hidden; lastTime = 0; if (hidden.value) stopSounds() }
function draw() { renderer?.draw(elapsed.value, reducedMotion || !props.motion, { book: playback.value.book, ambienceTime: playback.value.ambienceTime }) }
function preferenceChanged() { reducedMotion = preference?.matches ?? false; draw() }
function turnPage() {
  if (finished || paused.value || hidden.value || !renderer || !turnOpeningPage(playback.value, reducedMotion || !props.motion)) return
  if (musicState.playing) sounds.add(openingCue('page'))
  draw()
}
function adjustBrightness(event: Event) {
  if (paused.value || hidden.value) return
  manualLight.value = true; stopLight?.(); stopLight = undefined; lightMode.value = 'manual'
  setOpeningBookBrightness(playback.value.book, Number((event.target as HTMLInputElement).value) / 100)
  draw()
}
function keyboard(event: KeyboardEvent) {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return
  if (event.code !== 'Escape' && (event.target as HTMLElement)?.closest('input,select,textarea,[contenteditable]')) return
  const button = (event.target as HTMLElement)?.closest('button')
  if (bookActive.value && (!button || button.classList.contains('opening-book-hitarea')) && ['Space', 'Enter', 'ArrowRight'].includes(event.code)) {
    event.preventDefault(); turnPage(); return
  }
  if (event.code === 'Escape' || event.code === 'Space' && !button) {
    event.preventDefault(); revealControls(); togglePause()
  }
}
function tick(now: number) {
  if (finished) return
  if (!paused.value && !hidden.value) {
    const previous = elapsed.value
    advanceOpeningPlayback(playback.value, lastTime ? Math.min(100, now - lastTime) : 0)
    const weather = openingWeather(elapsed.value)
    setOpeningWind(weather.wind, playback.value.ambienceTime, weather.rain)
    if (musicState.playing) {
      if (restoreSounds) {
        if (bookActive.value) {
          if (playback.value.book.turnElapsed !== null) sounds.add(openingCue('page', playback.value.book.turnElapsed))
        } else for (const cue of continuingOpeningCues(previous)) sounds.add(openingCue(cue.sound, cue.offset))
        restoreSounds = false
      }
      for (const cue of crossedOpeningCues(previous, elapsed.value)) sounds.add(openingCue(cue.sound))
    }
    if (now - lastDraw >= 1000 / 30) {
      draw(); lastDraw = now
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
      renderer?.resize(width, height); draw()
    })
    observer.observe(film.value!)
    ready.value = true
    canvas.value?.focus({ preventScroll: true })
    revealControls()
    document.addEventListener('visibilitychange', visibilityChanged)
    visibilityChanged()
    window.addEventListener('keydown', keyboard)
    animation = requestAnimationFrame(tick)
  } catch { finish() }
})
onUnmounted(() => {
  finished = true; cancelAnimationFrame(animation); stopSounds(); stopLight?.(); observer?.disconnect(); renderer?.dispose()
  clearTimeout(controlsTimer)
  preference?.removeEventListener('change', preferenceChanged)
  document.removeEventListener('visibilitychange', visibilityChanged); window.removeEventListener('keydown', keyboard)
})
</script>

<template>
  <main class="opening-page" :class="{ 'opening-paused': paused, 'opening-controls-visible': controlsVisible }" :data-shot="frame.shot" :data-elapsed="Math.round(elapsed)" :data-book-page="playback.book.page + 1" :data-book-turning="turning" :data-light-mode="lightMode" data-audio-mode="environment" :data-audio-playing="musicState.playing" :data-audio-waiting="musicState.awaitingInteraction" aria-label="雨夜寻凶 · 开场演出" @pointermove="revealControls" @pointerdown="revealControls">
    <div ref="film" class="opening-film">
      <canvas ref="canvas" tabindex="0" role="img" :aria-label="bookActive ? bookLabel : '雨夜客舍开场演出'"/>
      <template v-if="bookActive">
        <button class="opening-book-hitarea" :aria-label="poemPage ? '收起旧谱继续' : '翻到下一页'" aria-describedby="opening-book-text" :disabled="!ready || paused || turning || poemPage && !playback.book.revealed" @click="turnPage"/>
        <div class="opening-book-tools">
          <div class="opening-book-prompt" aria-hidden="true"><span>{{ playback.book.page + 1 }} / {{ openingBookPages.length }}</span><span>{{ paused ? '演出已暂停' : turning ? '翻页中' : poemPage ? (playback.book.revealed ? '点击书页继续' : '暗处有字，熄灯细看') : '点击书页翻阅' }}</span><span v-if="!paused && !turning && (!poemPage || playback.book.revealed)">→</span></div>
          <template v-if="poemPage">
            <div class="opening-brightness"><label for="opening-lamp">灯火</label><input id="opening-lamp" type="range" min="5" max="100" step="1" aria-label="页内灯火亮度" aria-describedby="opening-light-note" :value="Math.round(playback.book.brightness * 100)" :disabled="paused" @input="adjustBrightness"><output>{{ Math.round(playback.book.brightness * 100) }}%</output></div>
            <p id="opening-light-note" class="opening-light-note" role="status">{{ lightMode === 'ambient' ? '随环境光明暗显字；也可手动调光' : lightMode === 'sensing' ? '正在感应环境光，也可手动调光' : '手动调暗页内灯火，字迹渐显' }}</p>
          </template>
        </div>
        <div id="opening-book-text" class="opening-visually-hidden" role="status" aria-live="polite"><p>{{ poemPage ? (playback.book.revealed ? '一则残谶已从纸上浮现，可以收起旧谱。' : '暗处藏着字迹。移至暗处或调低页内灯火，辨认纸上的残谶。') : bookPage.title }}</p><template v-if="!poemPage || playback.book.revealed"><p v-for="line in bookPage.lines" :key="line">{{ line }}</p></template></div>
      </template>
    </div>
    <nav class="opening-controls" aria-label="演出控制">
      <button :aria-label="musicState.enabled ? '静音' : '开启声音'" :title="musicState.enabled ? '静音' : '开启声音'" @click="toggleSound"><Icon :name="musicState.enabled ? 'sound' : 'mute'" :size="20"/></button>
      <button :aria-label="paused ? '继续演出' : '暂停演出'" :title="paused ? '继续演出' : '暂停演出'" @click="togglePause">{{ paused ? '▷' : 'Ⅱ' }}</button>
      <button aria-label="跳过开场演出" title="跳过开场演出" @click="finish">»</button>
      <button aria-label="返回标题页" title="返回标题页" @click="emit('exit')">×</button>
    </nav>
  </main>
</template>
