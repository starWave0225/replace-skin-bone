<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { assetUrl } from '../game/asset-url'
import Icon from './Icon.vue'
import MusicControls from './MusicControls.vue'

const props = defineProps<{ ready: boolean; canContinue: boolean; paused: boolean }>()
const emit = defineEmits<{
  start: []
  continue: []
  load: []
  settings: []
  credits: []
}>()
const menu = ref<HTMLElement>()
const artwork = assetUrl('/assets/title/painted-skin-title.webp')

function onKey(event: KeyboardEvent) {
  if (props.paused || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  if (!menu.value || !['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) return
  const active = document.activeElement
  if (active !== document.body && !menu.value.contains(active)) return
  const items = Array.from(menu.value.querySelectorAll<HTMLElement>('.title-menu-entry:not(:disabled)'))
  const preferred = items.find(item => item.classList.contains('is-preferred')) ?? items[0]
  if (!preferred) return

  if (event.key === 'Enter') {
    if (active === document.body && props.ready && !event.repeat) {
      event.preventDefault()
      preferred.click()
    }
    return
  }

  event.preventDefault()
  const index = items.findIndex(item => item === active)
  const direction = event.key === 'ArrowDown' ? 1 : -1
  const next = index === -1 ? preferred : items[(index + direction + items.length) % items.length]
  next.focus()
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <main class="title-screen" :inert="paused">
    <div class="title-stage">
      <div class="title-painting" aria-hidden="true">
        <img :src="artwork" alt="" fetchpriority="high" width="1672" height="941"/>
      </div>
      <div class="title-frame" aria-hidden="true"></div>

      <div class="title-menu-block">
        <div class="title-brand">
          <p class="title-series"><span aria-hidden="true"></span>未闻志异</p>
          <h1 aria-label="画皮：借面"><span>画皮</span><i>借面</i></h1>
          <p class="title-tagline">是人是妖，是皮是相。</p>
        </div>

        <nav ref="menu" class="title-menu" aria-label="主菜单">
          <button class="title-menu-entry" :class="{ 'is-preferred': !canContinue }" :disabled="!ready" @click="emit('start')">
            <span>开始游戏</span><small aria-hidden="true">NEW GAME</small>
          </button>
          <button class="title-menu-entry" :class="{ 'is-preferred': canContinue }" :disabled="!ready || !canContinue" @click="emit('continue')">
            <span>继续游戏</span><small aria-hidden="true">CONTINUE</small>
          </button>
          <button class="title-menu-entry" :disabled="!ready" @click="emit('load')">
            <span>读取存档</span><small aria-hidden="true">LOAD GAME</small>
          </button>
          <button class="title-menu-entry" @click="emit('settings')">
            <span>游戏设置</span><small aria-hidden="true">OPTIONS</small>
          </button>
        </nav>

        <nav class="title-demos" aria-label="独立试玩">
          <a href="?view=dream" target="_blank" rel="noopener">梦境试玩 <span aria-hidden="true">↗</span></a>
          <a href="?view=combat" target="_blank" rel="noopener">战斗试玩 <span aria-hidden="true">↗</span></a>
        </nav>
      </div>

      <footer class="title-screen-footer">
        <p class="title-chapter"><span>序章</span>雨夜寻凶</p>
        <p class="title-key-hint" aria-hidden="true">↑ ↓ 选择 <span>·</span> Enter 确认</p>
        <div class="title-utilities">
          <button @click="emit('credits')">制作鸣谢</button>
          <MusicControls/>
        </div>
      </footer>
    </div>
  </main>
</template>

<style scoped>
.title-screen {
  --title-paper: #eadcbb;
  --title-gold: #bc9a64;
  --title-line: #c5a26859;
  --title-ink: #1a1412;
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: var(--title-ink);
  color: var(--title-paper);
}

.title-stage {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 16px;
  min-height: 100%;
  padding: max(26px, env(safe-area-inset-top)) max(4.1vw, env(safe-area-inset-right))
    max(22px, env(safe-area-inset-bottom)) max(4.1vw, env(safe-area-inset-left));
}

.title-painting, .title-painting::after {
  position: absolute;
  z-index: -2;
  inset: 0;
}

.title-painting img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 68% 45%;
}

.title-painting::after {
  content: '';
  z-index: auto;
  background:
    linear-gradient(90deg, #16100feb, #181210bd 29%, #18121022 52%, transparent 70%),
    linear-gradient(0deg, #150f0ee8, transparent 21%, transparent 92%, #140f0e50);
}

.title-frame {
  position: absolute;
  z-index: -1;
  inset: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right))
    max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
  border: 1px solid var(--title-line);
  pointer-events: none;
}

.title-frame::before, .title-frame::after {
  content: '';
  position: absolute;
  inset: -1px;
  background:
    linear-gradient(var(--title-gold) 0 0) left top / 29px 1px,
    linear-gradient(var(--title-gold) 0 0) left top / 1px 29px,
    linear-gradient(var(--title-gold) 0 0) right bottom / 29px 1px,
    linear-gradient(var(--title-gold) 0 0) right bottom / 1px 29px;
  background-repeat: no-repeat;
}

.title-frame::after {
  transform: scaleX(-1);
}

.title-menu-block {
  width: min(100%, 360px);
  margin-left: clamp(4px, 3.5vw, 64px);
  align-self: center;
}

.title-brand {
  margin-bottom: clamp(15px, 4dvh, 40px);
}

.title-series {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  letter-spacing: .45em;
  color: #d2b784;
}

.title-series span {
  width: 24px;
  height: 1px;
  background: var(--title-gold);
}

.title-brand h1 {
  display: flex;
  align-items: center;
  gap: clamp(8px, 1.3vw, 20px);
  margin: 3px 0 9px -4px;
  color: #f3e4c4;
  font: clamp(74px, min(10vw, 17dvh), 155px)/1.06 MaShan, 'KaiTi', serif;
  white-space: nowrap;
  text-shadow: 1px 2px #6e5035, 0 5px 16px #080504b0;
}

.title-brand i {
  writing-mode: vertical-rl;
  padding: 6px 3px;
  border: 1px solid #ca7f64;
  outline: 1px solid #ca7f6488;
  outline-offset: 3px;
  background: #8e3f31;
  color: #ffe6bc;
  font: clamp(20px, min(2.3vw, 4.4dvh), 35px)/1 MaShan, 'KaiTi', serif;
  letter-spacing: .12em;
  text-shadow: none;
}

.title-tagline {
  color: #cdb897;
  font-size: clamp(13px, 1.3vw, 17px);
  letter-spacing: .13em;
}

.title-menu {
  display: grid;
  gap: 7px;
  width: min(100%, 324px);
}

.title-menu-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: clamp(44px, 6.35dvh, 56px);
  padding: 3px 13px 3px 15px;
  border: 1px solid #b995603d;
  background: linear-gradient(90deg, #211815de, #20181577);
  text-align: left;
  font-size: clamp(17px, 1.65vw, 22px);
  letter-spacing: .16em;
}

.title-menu-entry::before {
  content: '';
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  transform: rotate(45deg);
  border: 1px solid #b69562;
}

.title-menu-entry small {
  margin-left: auto;
  color: #c8ac83;
  font: 10px/1.2 Georgia, serif;
  letter-spacing: .13em;
}

.title-menu-entry:disabled {
  opacity: .55;
}

.title-menu-entry:not(:disabled):hover, .title-menu-entry:focus-visible,
.title-menu:not(:hover, :has(:focus-visible)) .title-menu-entry.is-preferred:not(:disabled) {
  border-color: #d6ac71;
  background: linear-gradient(90deg, #873f2de8, #4a2820ed 70%, #2a1b17e6);
  box-shadow: inset 0 0 0 2px #1f140e8c, 0 2px 8px #130c0aa8;
  color: #fff0d2;
}

.title-menu-entry:not(:disabled):hover::before, .title-menu-entry:focus-visible::before,
.title-menu:not(:hover, :has(:focus-visible)) .title-menu-entry.is-preferred:not(:disabled)::before {
  background: #efd19a;
}

.title-screen :focus-visible {
  outline: 1px solid #ffdf9d;
  outline-offset: 3px;
}

.title-demos {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 20px;
  margin-top: 7px;
}

.title-demos a, .title-utilities > button:not(.music-switch) {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 44px;
  padding: 0;
  color: #dbc6a2;
  font-size: 13px;
  letter-spacing: .08em;
  text-decoration: none;
}

.title-demos a:hover, .title-utilities > button:not(.music-switch):hover {
  color: #ffe6b2;
  text-decoration: underline;
}

.title-demos span {
  color: var(--title-gold);
}

.title-screen-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px 14px;
  border-top: 1px solid var(--title-line);
  padding-top: 8px;
  font-size: 13px;
  letter-spacing: .14em;
  text-shadow: 0 1px 5px #0f0907;
}

.title-chapter, .title-utilities {
  display: flex;
  align-items: center;
  gap: 11px;
  white-space: nowrap;
}

.title-chapter span {
  padding: 3px 5px;
  border: 1px solid var(--title-line);
  color: #ddaf87;
}

.title-key-hint {
  color: #cfbc9e;
  font-size: 12px;
}

.title-key-hint span {
  margin-inline: 5px;
}

.title-utilities :deep(.music-switch) {
  min-height: 44px;
  border-color: var(--title-line);
  background: #241a15e8;
  color: var(--title-paper);
  font-size: 13px;
}

@media (orientation: portrait) {
  .title-stage {
    padding-inline: max(24px, env(safe-area-inset-left)) max(24px, env(safe-area-inset-right));
    gap: 4px;
  }

  .title-painting {
    height: clamp(230px, 59dvh, 690px);
  }

  .title-painting img {
    object-position: 82% 37%;
  }

  .title-painting::after {
    background: linear-gradient(0deg, var(--title-ink) 1%, #1a1412aa 18%, transparent 48%);
  }

  .title-menu-block {
    width: min(100%, 368px);
    margin: clamp(146px, calc(53dvh - 135px), 540px) auto 0;
    align-self: end;
  }

  .title-brand {
    margin-bottom: 15px;
  }

  .title-brand h1 {
    font-size: clamp(74px, 18vw, 128px);
  }

  .title-brand i {
    font-size: clamp(20px, 5vw, 29px);
  }

  .title-menu {
    width: 100%;
    gap: 5px;
  }

  .title-key-hint {
    display: none;
  }
}

@media (orientation: portrait) and (max-height: 740px) {
  .title-stage {
    padding-block: max(18px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-bottom));
  }

  .title-menu-block {
    margin-top: max(115px, calc(51dvh - 154px));
  }

  .title-brand {
    margin-bottom: 10px;
  }

  .title-brand h1 {
    font-size: clamp(55px, 17vw, 78px);
  }

  .title-demos {
    margin-top: 3px;
  }
}

@media (max-width: 360px) {
  .title-screen-footer {
    letter-spacing: 0;
  }

  .title-chapter, .title-utilities {
    gap: 6px;
  }

  .title-utilities :deep(.music-switch) span {
    display: none;
  }
}

@media (max-height: 520px) and (orientation: landscape) {
  .title-stage {
    gap: 5px;
    padding-block: max(18px, env(safe-area-inset-top)) max(15px, env(safe-area-inset-bottom));
  }

  .title-brand {
    margin-bottom: 8px;
  }

  .title-brand h1 {
    margin-block: 0 5px;
    font-size: clamp(45px, 15dvh, 74px);
  }

  .title-tagline {
    display: none;
  }

  .title-menu {
    gap: 4px;
    width: min(100%, 265px);
  }

  .title-menu-entry {
    min-height: 35px;
    font-size: 15px;
  }

  .title-demos {
    margin-top: 2px;
  }

  .title-demos a, .title-utilities > button, .title-utilities :deep(.music-switch) {
    min-height: 34px;
  }

  .title-screen-footer {
    padding-top: 1px;
  }
}
</style>
