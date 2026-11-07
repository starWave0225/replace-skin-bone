<script setup lang="ts">
import {nextTick,onUnmounted,ref} from 'vue'
import type {PrologueState} from '../game/prologue'
import TaskGuide from './TaskGuide.vue'
import ScreenPages from './ScreenPages.vue'
import Icon from './Icon.vue'
defineProps<{state:PrologueState;disabled?:boolean}>()
const emit=defineEmits<{toggle:[open:boolean]}>()
const open=ref(false),trigger=ref<HTMLButtonElement>(),closeButton=ref<HTMLButtonElement>()
function toggle(value:boolean){open.value=value;emit('toggle',value);void nextTick(()=>{(value?closeButton:trigger).value?.focus()})}
onUnmounted(()=>emit('toggle',false))
</script>
<template>
  <button ref="trigger" class="task-guide-shortcut" :disabled="disabled" :aria-expanded="open" aria-label="任务指引" @click="toggle(!open)"><Icon name="task"/><span>任务</span></button>
  <div v-if="open" class="task-shortcut-backdrop" @click.self="toggle(false)">
    <section class="task-shortcut-panel" role="dialog" aria-modal="true" aria-label="任务指引" @keydown.esc.stop="toggle(false)">
      <header><h2>任务指引</h2><button ref="closeButton" @click="toggle(false)">收起 ×</button></header>
      <ScreenPages><TaskGuide :prologue="state"/></ScreenPages>
    </section>
  </div>
</template>
<style scoped>
.task-guide-shortcut{position:fixed;z-index:90;left:50%;bottom:calc(12px + env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;align-items:center;gap:10px;min-height:48px;padding:8px 24px;border:1px solid #ae986b88;border-radius:7px;background:#1b3028f5;color:#e2d2a6;font:18px NotoSerif,SimSun,serif}.task-shortcut-backdrop{position:fixed;inset:0;z-index:110;display:grid;place-items:center;padding:18px;background:#06120dbc}.task-shortcut-panel{display:flex;flex-direction:column;width:min(620px,100%);max-height:calc(100dvh - 110px);background:#203327;color:#e4d5ac;border:1px solid #ac976977;padding:20px 24px}.task-shortcut-panel header{display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid #a8976244;padding-bottom:14px}.task-shortcut-panel h2{font-size:27px;font-weight:400;margin:0}.task-shortcut-panel header button{min-height:44px;padding:6px 12px;border:1px solid #ac976977}.task-shortcut-panel>.screen-pages{flex:1;min-height:0;max-height:60dvh}
</style>
