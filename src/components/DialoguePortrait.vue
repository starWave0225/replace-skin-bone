<script setup lang="ts">
import type { CharacterPortrait } from '../game/portraits'
defineProps<{ portrait?: CharacterPortrait }>()
</script>

<template>
  <Transition name="dialogue-portrait" mode="out-in">
    <figure v-if="portrait" :key="portrait.id" class="dialogue-character" :class="[`character-${portrait.side}`, `character-${portrait.id}`]" :data-portrait-id="portrait.id" aria-label="说话人物立绘">
      <img :src="portrait.src" :alt="`${portrait.name} · 对话立绘`" decoding="async" width="1024" height="1536" draggable="false" />
      <figcaption><span>{{ portrait.name }}</span><small>{{ portrait.role }}</small></figcaption>
    </figure>
  </Transition>
</template>
