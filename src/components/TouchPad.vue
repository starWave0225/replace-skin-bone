<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps<{ label: string }>()
const emit = defineEmits<{ direction: [key: string, held: boolean]; tap: [key: string] }>()
const directions = [
  { key: 'w', label: '向上行走', icon: '↑' },
  { key: 'a', label: '向左行走', icon: '←' },
  { key: 'd', label: '向右行走', icon: '→' },
  { key: 's', label: '向下行走', icon: '↓' },
]
const pointers = new Map<number, string>()
const sprint = ref(false)

function hold(key: string, event: PointerEvent) {
  if (event.button !== 0) return
  const alreadyHeld = [...pointers.values()].includes(key)
  pointers.set(event.pointerId, key)
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  if (!alreadyHeld) emit('direction', key, true)
}

function release(event: PointerEvent) {
  const key = pointers.get(event.pointerId)
  if (!key) return
  pointers.delete(event.pointerId)
  if (![...pointers.values()].includes(key)) emit('direction', key, false)
}

function toggleSprint() {
  sprint.value = !sprint.value
  emit('direction', 'shift', sprint.value)
}

function clear() {
  for (const key of new Set(pointers.values())) emit('direction', key, false)
  pointers.clear()
  if (sprint.value) toggleSprint()
}

function onVisibilityChange() { if (document.hidden) clear() }
onMounted(() => {
  window.addEventListener('blur', clear)
  document.addEventListener('visibilitychange', onVisibilityChange)
})
onBeforeUnmount(() => {
  clear()
  window.removeEventListener('blur', clear)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<template>
  <div class="touch-pad" role="group" :aria-label="label" @contextmenu.prevent>
    <button
      v-for="direction in directions"
      :key="direction.key"
      :class="`touch-direction-${direction.key}`"
      :aria-label="direction.label"
      @pointerdown.prevent="hold(direction.key, $event)"
      @pointerup="release"
      @pointercancel="release"
      @lostpointercapture="release"
      @click="event => { if (event.detail === 0) emit('tap', direction.key) }"
    >{{ direction.icon }}</button>
    <button class="touch-sprint" :aria-pressed="sprint" @click="toggleSprint">疾行</button>
  </div>
</template>

<style scoped>
.touch-pad { display: none; }
@media (max-width: 760px), (any-pointer: coarse), (max-height: 520px) and (max-width: 1100px) {
  .touch-pad {
    display: grid;
    grid-template: repeat(3, 44px) / repeat(3, 44px);
    gap: 2px;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }
  .touch-pad > button {
    display: grid;
    place-items: center;
    border: 1px solid #b4a97d80;
    border-radius: 5px;
    background: #203a2de8;
    color: #f0dfb0;
    font: 23px/1 serif;
    padding: 0;
    touch-action: none;
  }
  .touch-pad > button:active, .touch-pad > button[aria-pressed="true"] { background: #75663d; }
  .touch-direction-w { grid-area: 1 / 2; }
  .touch-direction-a { grid-area: 2 / 1; }
  .touch-direction-d { grid-area: 2 / 3; }
  .touch-direction-s { grid-area: 3 / 2; }
  .touch-pad > .touch-sprint { grid-area: 2 / 2; font: 14px/1.2 NotoSerif, serif; }
}
</style>
