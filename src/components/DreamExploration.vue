<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { assetUrl } from '../game/asset-url'
import { borrowedSpiritPortrait, dreamSpirit, dreamStations } from '../game/prologue'
import type { DreamPose, DreamStationId } from '../game/prologue'
import type { createDreamScene, DreamLookMode } from '../game/dream-scene'
import { dreamPlaybackDuration, dreamSubtitle } from '../game/dream-presence'
import MusicControls from './MusicControls.vue'
import TouchPad from './TouchPad.vue'
import { useSceneMusic } from '../game/music'
import '../dream.css'

const props = defineProps<{ visited: DreamStationId[]; pose?: DreamPose; preview?: boolean; paused?: boolean }>()
const emit = defineEmits<{ inspect: [id: DreamStationId]; pose: [pose: DreamPose]; finish: []; exit: [] }>()
const host = ref<HTMLElement>(), menuPanel = ref<HTMLElement>()
const ready = ref(false), intro = ref(true), menu = ref(false), simpleMode = ref(false), lowQuality = ref(false)
const hidden = ref(document.hidden), error = ref(''), playing = ref<DreamStationId>(), elapsed = ref(0), hintRemaining = ref(0)
const lookMode = ref<DreamLookMode>(matchMedia('(pointer:fine)').matches ? 'free' : 'touch')
const current = computed(() => dreamStations[Math.min(props.visited.length, dreamStations.length - 1)])
const mirrorReady = computed(() => props.visited.length >= dreamStations.length)
const waking = ref(false)
const blocked = computed(() => !ready.value || intro.value || menu.value || !!error.value || waking.value || !!props.paused || hidden.value)
const subtitle = computed(() => playing.value ? dreamSubtitle(playing.value, elapsed.value) : undefined)
const fallbackArt = computed(() => assetUrl(props.visited.length < 2 ? '/assets/opening/ink/guestroom-storm.webp' : '/assets/opening/ink/teahouse-skin-box-v1.webp'))
const shadowPortrait = computed(() => props.visited.includes('brush') ? borrowedSpiritPortrait : dreamSpirit.portrait)
useSceneMusic(() => props.preview ? 'dream' : 'prologue', 100, () => !menu.value && !props.paused && !hidden.value)

let control: Awaited<ReturnType<typeof createDreamScene>> | undefined
let alive = true, launchId = 0, raf = 0, previousTime = 0, finishing = false, wakeElapsed = 0
watch(blocked, value => {
  control?.setPaused(value)
  if (!value && playing.value) control?.story(playing.value)
}, { flush: 'sync' })
watch(menu, async value => { if (value) { await nextTick(); menuPanel.value?.querySelector<HTMLButtonElement>('button')?.focus() } })

function encounter(id: DreamStationId) {
  if (blocked.value || mirrorReady.value || playing.value || id !== current.value.id) return
  playing.value = id
  elapsed.value = 0
  hintRemaining.value = 0
  control?.story(id)
}

async function launch(low = false) {
  if (!host.value) return
  const request = ++launchId
  control?.dispose(); control = undefined
  ready.value = false; error.value = ''; lowQuality.value = low; simpleMode.value = false
  try {
    await document.fonts.ready
    const module = await import('../game/dream-scene')
    if (!alive || !host.value || request !== launchId) return
    const created = await module.createDreamScene(host.value, {
      pose: props.pose, lowQuality: low, seen: () => props.visited,
      onTouch: encounter,
      onMirrorTouch: enterMirror,
      onLookMode: mode => {
        if (!alive || request !== launchId) return
        const released = lookMode.value === 'captured' && mode === 'free'
        lookMode.value = mode
        if (released && !blocked.value) openMenu()
      },
      onPose: pose => { if (alive && request === launchId) emit('pose', pose) },
      onReady: () => { if (alive && request === launchId) ready.value = true },
    })
    if (!alive || request !== launchId) { created.dispose(); return }
    control = created
    control.setPaused(blocked.value)
    if (playing.value) control.story(playing.value)
  } catch (reason) {
    if (alive && request === launchId) {
      error.value = '梦境未能展开。'
      console.warn('Dream renderer:', reason)
    }
  }
}

function useSimpleMode() {
  ++launchId
  control?.dispose(); control = undefined
  simpleMode.value = true; ready.value = true; error.value = ''
  enter()
}
function contextLost() {
  if (simpleMode.value || !alive) return
  useSimpleMode()
}
function resumeLook() {
  control?.setPaused(blocked.value)
  if (!blocked.value) control?.look()
  host.value?.querySelector('canvas')?.focus({ preventScroll: true })
}
function enter() {
  intro.value = false; menu.value = false
  hintRemaining.value = mirrorReady.value ? 0 : 6500
  resumeLook()
}
function openMenu() { menu.value = true }
function resume() { menu.value = false; resumeLook() }
function guide() {
  menu.value = false
  resumeLook()
  control?.guide()
}
function finish() { if (!finishing) { finishing = true; emit('finish') } }
function enterMirror() {
  if (blocked.value || playing.value || !mirrorReady.value) return
  waking.value = true
  wakeElapsed = 0
}

function tick(now: number) {
  if (!alive) return
  const dt = previousTime ? Math.min(100, now - previousTime) : 0
  previousTime = now
  if (!blocked.value) {
    hintRemaining.value = Math.max(0, hintRemaining.value - dt)
    const id = playing.value
    if (id) {
      elapsed.value += dt
      if (elapsed.value >= dreamPlaybackDuration(id)) {
        emit('inspect', id)
        playing.value = undefined
        control?.story(undefined)
      }
    }
  }
  if (waking.value && !hidden.value && !props.paused) {
    wakeElapsed += dt
    if (wakeElapsed >= 750) finish()
  }
  raf = requestAnimationFrame(tick)
}
function keyboard(event: KeyboardEvent) {
  if (props.paused || intro.value || waking.value) return
  if (event.key === 'Escape' || event.key === 'Tab') {
    if (event.key === 'Tab' && menu.value) {
      const items = [...(menuPanel.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])]
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus() }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0]?.focus() }
      return
    }
    event.preventDefault(); event.stopImmediatePropagation()
    if (menu.value) resume(); else openMenu()
  }
}
function visibility() { hidden.value = document.hidden }
function blur() { if (!intro.value && !waking.value) openMenu() }
function touch(key: string, active: boolean) { control?.direction(key, active) }
function tap(key: string) { control?.tap(key) }

onMounted(() => {
  void launch(matchMedia('(any-pointer: coarse), (max-width: 760px), (max-height: 520px) and (max-width: 1100px)').matches)
  raf = requestAnimationFrame(tick)
  window.addEventListener('keydown', keyboard, true)
  window.addEventListener('blur', blur)
  document.addEventListener('visibilitychange', visibility)
})
onUnmounted(() => {
  alive = false; ++launchId; cancelAnimationFrame(raf); control?.dispose()
  window.removeEventListener('keydown', keyboard, true)
  window.removeEventListener('blur', blur)
  document.removeEventListener('visibilitychange', visibility)
})
</script>

<template>
  <main class="dream-experience dream-immersive" :class="{ 'is-waking': waking }" aria-label="第一人称雪宅梦境">
    <div v-show="!simpleMode" ref="host" class="dream-renderer" @webglcontextlost.capture="contextLost"></div>
    <div v-if="simpleMode" class="dream-shadow-room" :style="{ backgroundImage: `url('${fallbackArt}')` }">
      <button v-if="!blocked && !mirrorReady" :key="current.id" class="dream-shadow-touch" :class="{ speaking: !!playing }" :disabled="!!playing" aria-label="触碰女鬼的影子" @click="encounter(current.id)"><img :src="shadowPortrait" alt=""/></button>
      <button v-else-if="!blocked && mirrorReady" class="dream-mirror-touch" :style="{ backgroundImage: `url('${fallbackArt}')` }" aria-label="穿过铜镜" @click="enterMirror"></button>
    </div>
    <div class="dream-film"></div>
    <button v-if="!intro && !menu && !waking && !error" class="dream-pause-control" aria-label="暂停梦境" title="暂停 · Esc" @click="openMenu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg></button>

    <Transition name="dream-caption"><p v-if="hintRemaining > 0 && !blocked && !playing" class="dream-entry-hint"><template v-if="simpleMode">触碰她的影子</template><template v-else><span class="dream-mouse-help">WASD 行走 · 鼠标环顾</span><span class="dream-touch-help">方向键行走 · 划动画面环顾</span><br/>走近她的影子</template></p></Transition>
    <Transition name="dream-caption" mode="out-in"><p v-if="subtitle && !menu && !paused" :key="`${playing}-${subtitle.index}`" class="dream-subtitle" aria-live="polite">{{ subtitle.text }}</p></Transition>
    <TouchPad v-if="!blocked && !playing && !simpleMode" class="dream-pad dream-quiet-pad" label="梦中触屏行走" @direction="touch" @tap="tap"/>

    <section v-if="intro && !error && !waking" class="dream-entry">
      <h1>灯外，有人。</h1>
      <button class="dream-enter-button" :disabled="!ready || paused" @click="enter">{{ ready ? '入梦' : '入梦中…' }}</button>
      <button v-if="!ready" class="dream-entry-alternative" @click="useSimpleMode">轻触入梦</button>
    </section>

    <section v-if="menu && !error" ref="menuPanel" class="dream-pause-menu" role="dialog" aria-modal="true" aria-label="梦境暂停">
      <h2>梦未醒</h2>
      <button class="dream-enter-button" @click="resume">继续入梦</button>
      <MusicControls/>
      <button v-if="!simpleMode && !playing" @click="guide">{{ mirrorReady ? '走向铜镜' : '随影前行' }}</button>
      <button :disabled="!ready || !!playing" @click="launch(simpleMode || !lowQuality)">{{ simpleMode ? '重试三维画面' : lowQuality ? '画质 · 轻量' : '画质 · 精细' }}</button>
      <button v-if="!simpleMode" @click="useSimpleMode">轻触探索</button>
      <button @click="emit('exit')">{{ preview ? '返回首页' : '返回标题' }}</button>
      <small><span class="dream-mouse-help">WASD 行走 · 鼠标环顾 · Esc 暂停</span><span class="dream-touch-help">方向键行走 · 划动画面环顾</span></small>
    </section>

    <section v-if="error" class="dream-fallback-prompt" role="status"><p>{{ error }}</p><button class="dream-enter-button" @click="useSimpleMode">轻触入梦</button><button @click="launch(true)">重新入梦</button><button @click="emit('exit')">{{ preview ? '返回首页' : '返回标题' }}</button></section>
    <div class="dream-wake-fade" aria-hidden="true"></div>
  </main>
</template>
