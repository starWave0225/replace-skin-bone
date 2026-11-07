<script setup lang="ts">
import { ref } from 'vue'
import PrologueView from './PrologueView.vue'
import { advancePrologue, caseClues, dreamStations, initialPrologue, knockAtWell, startWellEncounter, travelPrologue } from '../game/prologue'
import { advanceWellEncounter, performWellAction } from '../game/prologue-battle'
import { worldSpawn } from '../game/world'
import type { CombatAction } from '../game/combat-data'
import type { PrologueState } from '../game/prologue'
import type { WorldState } from '../game/types'
import { useSceneMusic } from '../game/music'

const state = ref<PrologueState>({
  ...initialPrologue(),
  phase: 'morning',
  clues: caseClues.map(clue => clue.id),
  dreamSeen: dreamStations.map(station => station.id),
  world: worldSpawn('inn_well'),
  wallOpen: true,
  briefed: true,
})
useSceneMusic('prologue', 10)
function action(id: CombatAction) { if (state.value.wellEncounter) performWellAction(state.value.wellEncounter, id) }
function next() {
  if (state.value.wellEncounter && advanceWellEncounter(state.value.wellEncounter)) advancePrologue(state.value)
}
function exit() { window.location.href = './' }
function position(value: WorldState) { if (value.map === state.value.world.map) state.value.world = value }
</script>

<template>
  <PrologueView standalone :state="state" :motion="true" @position="position" @travel="travelPrologue(state, $event)" @knock="knockAtWell(state)" @battle="startWellEncounter(state, $event)" @battle-action="action" @battle-next="next" @next="advancePrologue(state)" @exit="exit"/>
</template>
