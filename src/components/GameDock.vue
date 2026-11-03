<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'
import { navigationItems, navigationLock, type NavigationId } from '../game/navigation'
import type { GameState } from '../game/types'
import '../dock.css'
const props = defineProps<{ state: GameState; active: string }>()
const emit = defineEmits<{ open: [id: NavigationId] }>()
const entries = computed(() => navigationItems.map(item => ({ ...item, locked: navigationLock(props.state, item.id) })))
</script>
<template>
  <nav class="game-dock" aria-label="游戏功能" @keydown.stop @pointerdown.stop>
    <span v-for="entry in entries" :key="entry.id" class="dock-slot" :class="{ locked: !!entry.locked, active: active === entry.id }" :tabindex="entry.locked ? 0 : -1" :title="entry.locked ? `${entry.label} · ${entry.locked}` : entry.label">
      <button :disabled="!!entry.locked" :aria-label="entry.locked ? `${entry.label}（未解锁）` : entry.label" :aria-describedby="`dock-hint-${entry.id}`" :aria-pressed="active === entry.id" @click="emit('open',entry.id)">
        <Icon :name="entry.icon" :size="24"/>
        <Icon v-if="entry.locked" class="dock-lock" name="lock" :size="10"/>
      </button>
      <span :id="`dock-hint-${entry.id}`" class="dock-hint" role="tooltip">{{entry.label}}<small v-if="entry.locked">{{entry.locked}}</small></span>
    </span>
  </nav>
</template>
