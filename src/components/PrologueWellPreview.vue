<script setup lang="ts">
import { ref } from 'vue'
import PrologueView from './PrologueView.vue'
import { advancePrologue, caseClues, dreamStations, initialPrologue, startWellEncounter, travelPrologue } from '../game/prologue'
import { advanceWellEncounter, performWellAction } from '../game/prologue-battle'
import type { CombatAction } from '../game/combat-data'
import type { WorldState } from '../game/types'
import { useSceneMusic } from '../game/music'
function morning() {
  const state = initialPrologue()
  state.phase = 'morning'; state.clues = caseClues.map(c => c.id); state.dreamSeen = dreamStations.map(s => s.id)
  return state
}
const state = ref(morning())
useSceneMusic('prologue', 10, () => state.value.phase !== 'completed')
function action(id: CombatAction) { if (state.value.wellEncounter) performWellAction(state.value.wellEncounter, id) }
function next() { if (state.value.wellEncounter) advanceWellEncounter(state.value.wellEncounter) }
function exit() { window.location.href = './' }
function position(value: WorldState) { if (value.map === state.value.world.map) state.value.world = value }
</script>
<template>
  <div class="well-preview-banner"><span>序章片段试玩</span><span class="well-preview-description">从梦醒开始 · 不写入正式存档</span><button @click="state=morning()">重新体验</button><a href="./">返回首页 ↗</a></div>
  <section v-if="state.phase==='completed'" class="well-preview-finish"><h1>井声暂歇，西街寻人。</h1><p>正式剧情在此接入无面茶楼，继续追查许文卿经手的旧谱。</p><a href="./">返回首页 →</a></section>
  <PrologueView v-else :state="state" :motion="true" @position="position" @travel="travelPrologue(state,$event)" @battle="startWellEncounter(state)" @battle-action="action" @battle-next="next" @next="advancePrologue(state)" @exit="exit"/>
</template>
<style>
.well-preview-banner{padding:10px 20px;color:#d9cfae;background:#1b3028;font-size:15px;display:flex;gap:20px;align-items:center;flex-wrap:wrap}.well-preview-banner button{margin-left:auto;color:inherit;background:transparent;border:1px solid #9e956a;padding:5px 12px;cursor:pointer}.well-preview-banner a{color:inherit}.well-preview-finish{max-width:700px;margin:90px auto;padding:25px;color:#d9cfae;line-height:2}.well-preview-finish h1{font-size:32px}.well-preview-finish p{font-size:20px}
</style>
