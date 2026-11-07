<script setup lang="ts">
import ScreenPages from './ScreenPages.vue'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { continuingOpeningCues, crossedOpeningCues, openingDuration, openingFrame, openingWeather } from '../game/opening'
import { blowOutOpeningCandle, openingBookPages } from '../game/opening-book'
import { openingCandleFrame, openingCandleLayout } from '../game/opening-light'
import { advanceOpeningPlayback, createOpeningPlayback, isOpeningBookWaiting, turnOpeningPage } from '../game/opening-playback'
import { OpeningRenderer } from '../game/opening-renderer'
import { openingCandleBlow, openingCue, setOpeningWind } from '../game/audio'
import { musicState, setMusicEnabled, useSceneMusic } from '../game/music'
import Icon from './Icon.vue'
import '../opening.css'

const props = defineProps<{ motion: boolean; fromBook?: boolean; paused?: boolean }>()
const emit = defineEmits<{ finish: []; exit: [] }>()
const canvas = ref<HTMLCanvasElement>()
const playback = ref(createOpeningPlayback(props.fromBook))
const elapsed = computed(() => playback.value.elapsed)
const bookActive = computed(() => isOpeningBookWaiting(playback.value))
const bookPage = computed(() => openingBookPages[playback.value.book.page])
const turning = computed(() => playback.value.book.turnElapsed !== null)
const poemPage = computed(() => bookPage.value.kind === 'poem')
const bookLabel = computed(() => poemPage.value ? (playback.value.book.revealed ? `旧谱末页：${bookPage.value.title}浮现` : '旧谱末页：纸面上有模糊的墨痕') : `旧谱第${playback.value.book.page + 1}页：${bookPage.value.title}`)
const userPaused = ref(false)
const paused = computed(() => userPaused.value || !!props.paused)
const hidden = ref(document.hidden)
const controlsVisible = ref(true)
const ready = ref(false)
const candleStyle = ref<Record<string, string>>({ visibility: 'hidden' })
const candleState = computed(() => playback.value.book.candleElapsed === null ? 'lit' : openingCandleFrame(playback.value.book.candleElapsed).flame > 0 ? 'blowing' : 'out')
useSceneMusic('opening', 20, computed(() => !paused.value && !hidden.value))
const frame = computed(() => openingFrame(elapsed.value))
let renderer: OpeningRenderer | undefined
let observer: ResizeObserver | undefined
let animation = 0, lastTime = 0, lastDraw = 0, finished = false
let reducedMotion = false
let preference: MediaQueryList | undefined
let controlsTimer: ReturnType<typeof setTimeout> | undefined
const sounds = new Set<() => void>()
let restoreSounds = false
watch(paused, value => { lastTime = 0; if (value) stopSounds() }, { flush: 'sync' })
watch(() => musicState.playing, playing => { if (playing) restoreSounds = true })
watch(bookActive, () => { void nextTick(placeCandleTarget) })

function placeCandleTarget() {
  const rect = canvas.value?.getBoundingClientRect(), parent = canvas.value?.parentElement?.getBoundingClientRect()
  if (!rect || !parent || !rect.width || !rect.height) return
  const { hit } = openingCandleLayout(rect.width, rect.height)
  candleStyle.value = { left: `${rect.left - parent.left + hit.left}px`, top: `${rect.top - parent.top + hit.top}px`, width: `${hit.width}px`, height: `${hit.height}px` }
}

function revealControls() {
  controlsVisible.value = true; clearTimeout(controlsTimer)
  controlsTimer = setTimeout(() => { controlsVisible.value = false }, 1800)
}
function stopSounds() { sounds.forEach(stop => stop()); sounds.clear(); restoreSounds = true }
function finish() {
  if (finished) return
  finished = true; cancelAnimationFrame(animation); stopSounds(); emit('finish')
}
function togglePause() { userPaused.value = !userPaused.value }
function toggleSound() { setMusicEnabled(!musicState.enabled); if (!musicState.enabled) stopSounds() }
function visibilityChanged() { hidden.value = document.hidden; lastTime = 0; if (hidden.value) stopSounds() }
function draw() { renderer?.draw(elapsed.value, reducedMotion || !props.motion, { book: playback.value.book, ambienceTime: playback.value.ambienceTime }) }
function preferenceChanged() { reducedMotion = preference?.matches ?? false; draw() }
function turnPage() {
  if (finished || paused.value || hidden.value || !renderer || !turnOpeningPage(playback.value, reducedMotion || !props.motion)) return
  if (musicState.playing) sounds.add(openingCue('page'))
  draw()
}
function blowCandle() {
  if (!ready.value || paused.value || hidden.value || !bookActive.value || !blowOutOpeningCandle(playback.value.book)) return
  if (musicState.playing) { sounds.add(openingCandleBlow()); restoreSounds = false }
  canvas.value?.focus({ preventScroll: true })
  draw()
}
function keyboard(event: KeyboardEvent) {
  if (props.paused) return
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
          const blowing = playback.value.book.candleElapsed
          if (blowing !== null && blowing < 760) sounds.add(openingCandleBlow(blowing))
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
    observer = new ResizeObserver(() => {
      const { width, height } = canvas.value!.getBoundingClientRect()
      renderer?.resize(width, height); placeCandleTarget(); draw()
    })
    observer.observe(canvas.value!)
    observer.observe(canvas.value!.parentElement!)
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
  finished = true; cancelAnimationFrame(animation); stopSounds(); observer?.disconnect(); renderer?.dispose()
  clearTimeout(controlsTimer)
  preference?.removeEventListener('change', preferenceChanged)
  document.removeEventListener('visibilitychange', visibilityChanged); window.removeEventListener('keydown', keyboard)
})
</script>

<template>
  <main class="opening-page" :class="{ 'opening-paused': paused, 'opening-controls-visible': controlsVisible, 'opening-reading-book': bookActive }" :data-shot="frame.shot" :data-elapsed="Math.round(elapsed)" :data-book-page="playback.book.page + 1" :data-book-turning="turning" :data-candle-state="candleState" data-audio-mode="environment" :data-audio-playing="musicState.playing" :data-audio-waiting="musicState.awaitingInteraction" aria-label="雨夜寻凶 · 开场演出" @pointermove="revealControls" @pointerdown="revealControls">
    <p v-if="frame.shot==='reaction'" class="opening-discovery-caption">掌下只有刺骨的凉。许文卿死了。</p>
    <div class="opening-film">
      <div class="opening-picture">
        <canvas ref="canvas" tabindex="0" role="img" :aria-label="bookActive ? bookLabel : '雨夜客舍开场演出'"/>
        <button v-if="bookActive" class="opening-book-hitarea" :aria-label="poemPage ? '收起旧谱继续' : '翻到下一页'" aria-describedby="opening-book-text" :disabled="!ready || paused || turning || poemPage && !playback.book.revealed" @click="turnPage"/>
        <button v-if="bookActive && poemPage" class="opening-candle-hitarea" :style="candleStyle" :aria-label="candleState === 'lit' ? '吹灭蜡烛' : '烛火已熄'" :disabled="!ready || paused || turning || candleState !== 'lit'" @click.stop="blowCandle"><span v-if="candleState === 'lit'">吹灭</span></button>
      </div>
      <template v-if="bookActive">
        <div class="opening-book-tools">
          <div class="opening-book-prompt" aria-hidden="true"><span>{{ playback.book.page + 1 }} / {{ openingBookPages.length }}</span><span>{{ paused ? '演出已暂停' : turning ? '翻页中' : poemPage ? (playback.book.revealed ? '点击书页继续' : candleState === 'lit' ? '暗处有字，吹烛细看' : '烛光将尽，字迹渐显') : '点击书页翻阅' }}</span><span v-if="!paused && !turning && (!poemPage || playback.book.revealed)">→</span></div>
        </div>
        <section class="opening-touch-book" aria-label="旧谱正文">
          <ScreenPages :key="playback.book.page">
          <h2>{{ poemPage && !playback.book.revealed ? '纸上墨痕' : bookPage.title }}</h2>
          <p v-if="poemPage && !playback.book.revealed">{{ candleState === 'lit' ? '吹灭书旁的蜡烛，等字迹浮现。' : '火光一灭，纸上的墨痕渐渐清楚。' }}</p>
          <template v-else><p v-for="line in bookPage.lines" :key="line">{{ line }}</p></template>
          </ScreenPages>
          <button class="outline-button" :disabled="!ready || paused || turning || poemPage && !playback.book.revealed" @click="turnPage">
            {{ poemPage ? '收起旧谱继续' : '下一页' }} →
          </button>
        </section>
        <div id="opening-book-text" class="opening-visually-hidden" role="status" aria-live="polite"><p>{{ poemPage ? (playback.book.revealed ? '一则残谶已从纸上浮现，可以收起旧谱。' : '暗处藏着字迹。点触书旁的蜡烛，吹灭烛火后辨认残谶。') : bookPage.title }}</p><template v-if="!poemPage || playback.book.revealed"><p v-for="line in bookPage.lines" :key="line">{{ line }}</p></template></div>
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

<style scoped>
.opening-discovery-caption{position:absolute;z-index:8;bottom:12%;left:5%;right:5%;margin:0;text-align:center;color:#eedfc5;text-shadow:0 2px 8px #000;font:clamp(18px,3vw,28px)/1.7 MaShan,SimSun,serif;pointer-events:none}
</style>
