<script setup lang="ts">
import { computed, ref } from 'vue'
import DialoguePortrait from './DialoguePortrait.vue'
import { characterPortraits } from '../game/portraits'
import type { PortraitId } from '../game/portraits'
const selected = ref<PortraitId>('faceless')
const active = computed(() => characterPortraits[selected.value])
const lines: Record<PortraitId, string> = {
  self:'许兄约我来校旧谱，我总得查清他最后见过谁。',
  shen:'婆婆，我有这张脸，却不是沈砚。',
  guard:'借故捕快之相，重查一卷未了旧案。',
  mother:'阿砚……你总算回来了。',
  han:'有些旧事，总要讲清楚。',
  faceless:'须记：此面名沈砚。面虽是他，你却非他。',
  child:'哥哥。你这次带灯了么？',
  tea:'沈先生？你可叫韩捕快好找。',
  lantern:'双生槐那家的小满？母亲早不在了，屋子倒还留着。',
  chen:'他终于回来了。',
}
</script>

<template>
  <main class="portrait-gallery">
    <header><div><span class="eyebrow">画皮 · 借面</span><h1>借面人物谱</h1><p>选择人物，查看对话中的立绘效果。</p></div><a href="./">返回游戏 ↗</a></header>
    <div class="portrait-gallery-layout">
      <nav class="portrait-gallery-list" aria-label="选择对话人物">
        <button v-for="portrait in characterPortraits" :key="portrait.id" :class="{active: selected === portrait.id}" :aria-label="`预览${portrait.name}对话`" :aria-pressed="selected === portrait.id" @click="selected = portrait.id"><img :src="portrait.src" alt="" width="64" height="80" loading="lazy"/><span><b>{{ portrait.name }}</b><small>{{ portrait.role }}</small></span></button>
      </nav>
      <section class="portrait-gallery-stage" aria-label="人物对话展示" style="--dialogue-height:225px">
        <div class="portrait-gallery-scene"><span>槐阴县 · 旧梦灯影</span><p>借一张面，赴一场人间。</p></div>
        <DialoguePortrait :portrait="active"/>
        <section class="dialogue-panel rpg-dialogue"><div class="speaker-row"><span class="speaker-mark"></span><strong>{{ active.name }}</strong><span class="dialogue-line"></span></div><p class="dialogue-text">{{ lines[selected] }}</p><div class="dialogue-footer"><span>立绘预览 · 切换左侧人物</span><span class="next-button">{{ active.role }}</span></div></section>
      </section>
    </div>
    <footer>明清绣像 · 白描淡彩 · 市井人物 · AI 生成立绘</footer>
  </main>
</template>
