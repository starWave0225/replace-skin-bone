<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const root = ref<HTMLElement>()
const windowBox = ref<HTMLElement>()
const content = ref<HTMLElement>()
const page = ref(0)
const offsets = ref([0])
const offset = computed(() => offsets.value[page.value] ?? 0)
let observer: ResizeObserver | undefined

function measure() {
  if (!root.value || !windowBox.value || !content.value) return
  const footer = root.value.querySelector<HTMLElement>('.screen-pages-nav')
  const available = windowBox.value.clientHeight + (footer?.offsetHeight ?? 0)
  const height = content.value.offsetHeight
  if (!available || height <= available + 1) {
    offsets.value = [0]
    page.value = 0
    return
  }

  // Reserve the same space on every page, even when the first page just begins to overflow.
  const step = Math.max(24, available - (footer?.offsetHeight || 38))
  const base = content.value.getBoundingClientRect().top
  const protectedBounds: { top: number; bottom: number }[] = []
  for (const el of content.value.querySelectorAll('button, a, input, select, summary, h1, h2, h3, img')) {
    const rect = el.getBoundingClientRect()
    if (rect.height) protectedBounds.push({ top: rect.top - base, bottom: rect.bottom - base })
  }
  const walker = document.createTreeWalker(content.value, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    for (const rect of range.getClientRects()) {
      if (rect.height) protectedBounds.push({ top: rect.top - base, bottom: rect.bottom - base })
    }
  }
  const next = [0]
  let start = 0
  while (start + step < height - 1) {
    const limit = start + step
    const cut = protectedBounds.filter(bounds => bounds.top > start + 8 && bounds.top < limit && bounds.bottom > limit)
    const end = cut.length ? Math.min(...cut.map(bounds => bounds.top)) : limit
    start = Math.max(start + 8, Math.floor(end))
    next.push(start)
  }
  offsets.value = next
  page.value = Math.min(page.value, next.length - 1)
}

function revealFocus(event: FocusEvent) {
  const target = event.target as HTMLElement
  if (!content.value?.contains(target) || !windowBox.value) return
  const box = windowBox.value.getBoundingClientRect()
  const rect = target.getBoundingClientRect()
  if (rect.top >= box.top - 1 && rect.bottom <= box.bottom + 1) return
  const top = rect.top - content.value.getBoundingClientRect().top
  let targetPage = offsets.value.length - 1
  while (targetPage > 0 && offsets.value[targetPage] > top + 1) targetPage--
  page.value = targetPage
}

onMounted(() => {
  observer = new ResizeObserver(measure)
  if (root.value && content.value && windowBox.value) {
    observer.observe(root.value)
    observer.observe(content.value)
    observer.observe(windowBox.value)
  }
  measure()
})
onUnmounted(() => observer?.disconnect())
</script>

<template>
  <div ref="root" class="screen-pages">
    <div ref="windowBox" class="screen-page-window" @focusin="revealFocus">
      <div ref="content" class="screen-page-content" :style="{ transform: `translateY(-${offset}px)` }"><slot/></div>
    </div>
    <nav v-if="offsets.length > 1" class="screen-pages-nav" aria-label="内容翻页">
      <button type="button" :disabled="page === 0" @click="page--">上一页</button>
      <span aria-live="polite">{{page + 1}} / {{offsets.length}}</span>
      <button type="button" :disabled="page === offsets.length - 1" @click="page++">下一页</button>
    </nav>
  </div>
</template>

<style>
.screen-pages { display: flex; flex-direction: column; min-height: 0; min-width: 0; }
.screen-page-window { flex: 1 1 auto; min-height: 0; overflow: clip; }
.screen-page-content { display: flow-root; min-width: 0; overflow-wrap: anywhere; }
.screen-pages-nav { display: flex; justify-content: space-between; align-items: center; min-height: 38px; gap: 8px; font-size: 14px; border-top: 1px solid currentColor; }
.screen-pages-nav button { min-height: 38px; padding: 3px 9px; }
</style>
