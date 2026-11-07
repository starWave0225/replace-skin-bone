<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { assetUrl } from '../game/asset-url'
import { isPrologueDemo } from '../game/build-profile'
const props = defineProps<{ motion: boolean }>()
defineEmits<{ exit: []; next: [] }>()
const shots = [
  { id:'umbrella', art:'/assets/opening/ink/well-child-v1.webp', line:'握住伞柄的一刻，指间忽然一凉。', duration:4200 },
  { id:'memory', art:'/assets/opening/ink/teahouse-skin-box-v1.webp', line:'旧灯、陌生的窗、未落完的一笔……这不是我的记忆。', duration:5200 },
  { id:'rain', art:'/assets/opening/ink/guestroom-storm.webp', line:'雨骤然落下。水里的人，也抬起了头。', duration:4400 },
  { id:'reflection', art:'/assets/opening/ink/guestroom-storm.webp', line:'那张脸，分明不是陆知微。', duration:5600 },
  { id:'title', art:'/assets/title/painted-skin-title.webp', line:'是人是妖，是皮是相。', duration:0 },
]
const shot = ref(0), paused = ref(false), hidden = ref(document.hidden), reduced = ref(false)
const frame = computed(() => shots[shot.value]!)
const title = computed(() => frame.value.id === 'title')
const animated = computed(() => props.motion && !reduced.value)
let raf=0, elapsed=0, last=0
let preference:MediaQueryList|undefined
function skip(){shot.value=shots.length-1;elapsed=0}
function replay(){shot.value=0;elapsed=0;last=0;paused.value=false}
function visibility(){hidden.value=document.hidden;last=0}
function reduce(){reduced.value=preference?.matches??false}
function tick(now:number){
  if(!paused.value&&!hidden.value&&!title.value){elapsed+=last?Math.min(100,now-last):0;if(elapsed>=frame.value.duration){elapsed=0;shot.value++}}
  last=now;raf=requestAnimationFrame(tick)
}
onMounted(()=>{preference=matchMedia('(prefers-reduced-motion: reduce)');reduce();preference.addEventListener('change',reduce);document.addEventListener('visibilitychange',visibility);raf=requestAnimationFrame(tick)})
onUnmounted(()=>{cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);preference?.removeEventListener('change',reduce)})
</script>
<template>
  <main class="prologue-curtain" :class="[{ 'curtain-motion':animated, 'curtain-paused':paused||hidden },`curtain-${frame.id}`]" :data-shot="frame.id" aria-label="拾伞易相 · 序章片尾">
    <Transition name="curtain-fade"><img :key="frame.art" class="curtain-background" :src="assetUrl(frame.art)" alt=""/></Transition>
    <div class="curtain-shade"></div>
    <svg v-if="frame.id==='umbrella'" class="curtain-umbrella" viewBox="0 0 560 440" role="img" aria-label="井沿拾起的旧油纸伞">
      <defs><radialGradient id="oil-paper"><stop stop-color="#b49961"/><stop offset="1" stop-color="#4e4938"/></radialGradient></defs>
      <path d="M290 126L277 391Q276 420 256 406" fill="none" stroke="#8d6d48" stroke-width="9" stroke-linecap="round"/>
      <path d="M70 231Q134 79 290 74Q443 95 497 253Q393 225 283 260Q166 210 70 231" fill="url(#oil-paper)" stroke="#b09b71" stroke-width="3"/>
      <g fill="none" stroke="#362f25" stroke-width="2" opacity=".6"><path d="M290 74L70 231M290 74L160 226M290 74L283 260M290 74L392 234M290 74L497 253"/><path d="M101 185Q288 153 468 207"/></g>
    </svg>
    <div v-if="frame.id==='memory'" class="curtain-memories" aria-hidden="true"><img :src="assetUrl('/assets/opening/ink/guestroom-closed.webp')" alt=""/><img :src="assetUrl('/assets/opening/rain-ink-face-v2.webp')" alt=""/></div>
    <div v-if="frame.id==='rain'||frame.id==='reflection'" class="curtain-water" role="img" :aria-label="frame.id==='reflection'?'雨水倒影从陆知微变成陌生面容':'雨水倒映出陆知微的面容'">
      <img class="water-self" :src="assetUrl('/assets/portraits/lu-v1.webp')" alt=""/><img v-if="frame.id==='reflection'" class="water-stranger" :src="assetUrl('/assets/portraits/shen-v2.webp')" alt=""/><i v-for="n in 5" :key="n" :style="{ '--ring':n }"></i>
    </div>
    <div v-if="frame.id==='rain'||frame.id==='reflection'" class="curtain-rainfall" aria-hidden="true"></div>
    <div class="curtain-copy" aria-live="polite">
      <span v-if="title">未闻志异 · 序章终</span><h1 v-if="title">画皮<span>千面</span></h1><p>{{frame.line}}</p>
      <template v-if="title"><small>{{isPrologueDemo?'序章试玩到此结束 · 感谢游玩':'第一章 · 借皮入世'}}</small><button v-if="isPrologueDemo" class="prologue-primary" @click="$emit('exit')">返回标题 <b>↗</b></button><button v-else class="prologue-primary" @click="$emit('next')">进入第一章 <b>→</b></button><button class="curtain-replay" @click="replay">重看片尾</button></template>
    </div>
    <nav v-if="!title" class="curtain-controls" aria-label="片尾播放控制"><button @click="paused=!paused">{{paused?'继续播放':'暂停播放'}}</button><button @click="skip">跳过片尾 ↗</button></nav>
  </main>
</template>
<style scoped>
.prologue-curtain{position:relative;isolation:isolate;display:grid;place-items:center;width:100%;height:100%;min-height:0;overflow:hidden;background:#0c0b0a;color:#efdfb8}
.curtain-background,.curtain-shade{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.curtain-background{filter:brightness(.5) saturate(.6)}
.curtain-shade{background:radial-gradient(ellipse at 50% 40%,transparent,#0b1013c9),linear-gradient(0deg,#090b0eee,transparent 66%)}
.curtain-umbrella{position:absolute;top:7%;height:70%;width:min(84%,640px);filter:drop-shadow(0 15px 35px #000)}
.curtain-memories{position:absolute;inset:5% 8% 20%;display:flex;gap:3%;opacity:.55;mix-blend-mode:screen}.curtain-memories img{width:48%;object-fit:cover;filter:sepia(.5);mask-image:radial-gradient(ellipse,#000,transparent 72%)}
.curtain-water{position:absolute;top:7%;left:15%;width:70%;height:66%;overflow:hidden;border-radius:50%;background:#1a292e;box-shadow:inset 0 0 70px 40px #080e12;transform:perspective(900px) rotateX(20deg)}
.curtain-water img{position:absolute;top:-8%;left:10%;width:80%;height:125%;object-fit:contain;transform:scaleY(-1);filter:saturate(.4) brightness(.7);mask-image:radial-gradient(ellipse,#000 20%,transparent 67%)}
.water-stranger{opacity:1}.curtain-reflection .water-self{opacity:0}.curtain-water i{position:absolute;inset:calc(18% + var(--ring)*3%);border:1px solid #a1c8cd42;border-radius:50%;transform:scaleX(1.6)}
.curtain-rainfall{position:absolute;inset:-30%;pointer-events:none;opacity:.25;background:repeating-linear-gradient(102deg,transparent 0 38px,#b0d1dc90 39px,transparent 40px 72px);transform:rotate(6deg)}
.curtain-copy{position:relative;z-index:2;display:grid;justify-items:center;gap:clamp(8px,2vh,22px);padding:20px;text-align:center;text-shadow:0 2px 16px #000;width:min(960px,100%);box-sizing:border-box}.prologue-curtain:not(.curtain-title) .curtain-copy{align-self:end;padding-bottom:max(90px,13vh)}
.curtain-copy>span,.curtain-copy small{letter-spacing:.18em;color:#e1c58e}.curtain-copy h1{font:clamp(50px,14vw,125px)/1 MaShan,serif;letter-spacing:.11em}.curtain-copy h1 span{display:inline-block;font-size:.46em;vertical-align:middle;padding:.13em .22em;color:#ffcbab;border:1px solid #ab6550}.curtain-copy p{font:clamp(22px,3vw,33px)/1.7 MaShan,serif;margin:0}
.curtain-controls{position:absolute;z-index:3;right:16px;bottom:max(16px,env(safe-area-inset-bottom));display:flex;gap:10px}.curtain-controls button,.curtain-replay{min-height:44px;padding:8px 16px;background:#191310d9;color:inherit;border:1px solid #a8906670;font-size:18px}
.curtain-motion .curtain-umbrella{animation:lift 4.2s ease-out both}.curtain-motion .curtain-memories img{animation:remember 5.2s ease-in-out both}.curtain-motion .curtain-memories img+img{animation-delay:.6s}.curtain-motion .water-stranger{animation:other-face 3s ease-in both}.curtain-motion.curtain-reflection .water-self{animation:self-face 3s ease-in both}.curtain-motion .curtain-water i{animation:ripple 2.6s linear infinite;animation-delay:calc(var(--ring)*-.5s)}.curtain-motion .curtain-rainfall{animation:rain .9s linear infinite}.curtain-paused *{animation-play-state:paused!important}
.curtain-motion .curtain-fade-enter-active,.curtain-motion .curtain-fade-leave-active{transition:opacity .7s}.curtain-fade-enter-from,.curtain-fade-leave-to{opacity:0}
@keyframes lift{from{transform:translateY(28%) rotate(-13deg);opacity:.25}to{transform:translateY(0) rotate(3deg);opacity:1}}@keyframes remember{0%{opacity:0;transform:scale(.96)}35%,65%{opacity:.85}100%{opacity:.2;transform:scale(1.08)}}@keyframes other-face{from{opacity:0}to{opacity:1}}@keyframes self-face{from{opacity:1}to{opacity:0}}@keyframes ripple{from{transform:scale(.5,.2);opacity:.8}to{transform:scale(2.3,1.1);opacity:0}}@keyframes rain{to{translate:-12px 70px}}
@media(max-height:500px){.curtain-copy{gap:8px}.curtain-copy h1{font-size:60px}.curtain-copy p{font-size:22px}.prologue-curtain:not(.curtain-title) .curtain-copy{padding-bottom:66px}.curtain-umbrella{top:0;height:75%}}
</style>
