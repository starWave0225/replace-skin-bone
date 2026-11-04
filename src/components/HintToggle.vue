<script setup lang="ts">
import { interactionRingsEnabled, toggleInteractionRings } from '../game/hints'
</script>

<template>
  <button class="hint-switch" role="switch" :aria-checked="interactionRingsEnabled" aria-label="调查光圈" @click.stop="toggleInteractionRings">
    <span>光圈</span><small>{{ interactionRingsEnabled ? '开' : '关' }}</small>
  </button>
</template>

<style>
.hint-switch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 6px;
  min-height: 40px;
  color: #d4c59d;
  border: 1px solid #b4a97d66;
  background: #182c24;
  white-space: nowrap;
  font: 14px/1.1 NotoSerif, serif;
}
.hint-switch small { font-size: 12px; }
.hint-switch[aria-checked="true"] small { color: #edca80; }
.hint-switch[aria-checked="false"] small { color: #a4b0a6; }
.game-dock .hint-switch {
  flex-direction: column;
  gap: 3px;
  font-size: 13px;
  padding-inline: 0;
  border-color: #b4a97d44;
}
</style>
