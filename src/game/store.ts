import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { GameState, SaveData, Location, WorldState } from './types'
import { worldSpawn } from './world'
import { advance, beginActivity, changeFace, choose, rest, startGame, visibleChoices } from './engine'
import { advancePrologue, inspectCase, inspectDream, knockAtWell, recordPrologueEvent, travelPrologue, startWellEncounter, unlockPrologueBox } from './prologue'
import { advanceWellEncounter, performWellAction } from './prologue-battle'
import type { CombatAction } from './combat-data'
import type { DreamPose, DreamStationId } from './prologue'
import { story } from './story'
import { readSave, writeSave } from './saves'
import { chapterOneCommand, startChapterOne, type ChapterOneCommand } from './chapter-one'
import { isPrologueDemo } from './build-profile'
export const useGame = defineStore('game', () => {
  const state = ref<GameState | null>(null)
  const saves = ref<Record<string, SaveData | undefined>>({})
  const error = ref('')
  const saving = ref(false)
  const ready = ref(false)
  let pending = Promise.resolve()
  const node = computed(() => state.value ? story[state.value.nodeId] : undefined)
  const choices = computed(() => state.value ? visibleChoices(state.value) : [])
  function autosave() {
    if (!state.value) return
    const snapshot = JSON.parse(JSON.stringify(state.value)) as GameState
    pending = pending.then(async () => { await writeSave('auto', snapshot); saves.value.auto = { version: 1, savedAt: Date.now(), state: snapshot }; error.value = '' }).catch(e => { error.value = (e as Error).message })
  }
  async function initialize() {
    await Promise.all(['auto', '1', '2', '3'].map(async slot => {
      try { saves.value[slot] = await readSave(slot) } catch (e) { error.value = (e as Error).message }
    }))
    ready.value = true
  }
  function newGame() { state.value = startGame(true); autosave() }
  function prologueNext() { const s=state.value,p=s?.prologue; if(s&&p?.phase==='curtain'){if(!isPrologueDemo&&startChapterOne(s))autosave();return} if (p && advancePrologue(p)) autosave() }
  function chapterCommand(command:ChapterOneCommand){
    const s=state.value,c=s?.chapterOne
    if(!s||!c||!chapterOneCommand(c,command))return
    s.world=c.world;s.flags.wearing_first_face=c.unlocked;s.stats.selfhood=c.stats.selfhood;s.stats.shen=c.stats.bond;s.stats.mother=c.stats.trust
    s.time=['report','complete'].includes(c.stage)?'dusk':'day'
    autosave()
  }
  function prologueEvent(id: string) { const p = state.value?.prologue; if (p && recordPrologueEvent(p, id)) autosave() }
  function prologueUnlock(answer: string) { const p = state.value?.prologue; if (p && unlockPrologueBox(p, answer)) autosave() }
  function prologueKnock() { const p = state.value?.prologue; if (p && knockAtWell(p)) autosave() }
  function inspectPrologue(id:string){const p=state.value?.prologue;if(p&&inspectCase(p,id))autosave()}
  function inspectDreamObject(id:DreamStationId){const p=state.value?.prologue;if(p&&inspectDream(p,id))autosave()}
  function rememberDreamPose(pose:DreamPose){const p=state.value?.prologue;if(!p||p.phase!=='dream')return;const old=p.dreamPose;if(old&&Math.abs(old.x-pose.x)+Math.abs(old.z-pose.z)+Math.abs(old.yaw-pose.yaw)+Math.abs(old.pitch-pose.pitch)<.01)return;p.dreamPose=pose;autosave()}
  function rememberProloguePosition(world:WorldState){const p=state.value?.prologue;if(!p||world.map!==p.world.map||p.wellEncounter&&p.wellEncounter.stage!=='complete')return;p.world=world;autosave()}
  function travelInPrologue(destination:Location){const p=state.value?.prologue;if(p&&travelPrologue(p,destination))autosave()}
  function beginWellBattle(door:string){const p=state.value?.prologue;if(p&&startWellEncounter(p,door))autosave()}
  function wellAction(action:CombatAction){const p=state.value?.prologue;if(p?.wellEncounter&&performWellAction(p.wellEncounter,action))autosave()}
  function wellNext(){
    const s=state.value,e=s?.prologue?.wellEncounter
    if(!s||!e||!advanceWellEncounter(e))return
    if(e.stage==='complete'){
      s.flags.prologue_well_resolved=true
      s.flags.prologue_finished=true
      if(!s.inventory.includes('well_cloth'))s.inventory.push('well_cloth')
      if(!s.journal.includes('well_witness'))s.journal.push('well_witness')
      advancePrologue(s.prologue!)
    }
    autosave()
  }
  function next() { if (state.value && advance(state.value)) autosave() }
  function select(id: string) { if (state.value && choose(state.value, id)) autosave() }
  function visit(id: string) { if (!state.value || !beginActivity(state.value, id)) return false; autosave(); return true }
  function wait() { if (state.value && rest(state.value)) autosave() }
  function equip(face: GameState['face']) { if (!state.value || !changeFace(state.value, face)) return false; autosave(); return true }
  async function save(slot: string) {
    if (!state.value || saving.value) return false
    saving.value = true
    try { await pending; await writeSave(slot, state.value); saves.value[slot] = await readSave(slot); return true }
    catch (e) { error.value = (e as Error).message; return false }
    finally { saving.value = false }
  }
  async function load(slot = 'auto') {
    try { await pending; const data = await readSave(slot); if (!data) return false; state.value = data.state; state.value.world ??= worldSpawn(state.value.mode === 'hub' ? 'street' : story[state.value.nodeId].location); autosave(); return true }
    catch (e) { error.value = (e as Error).message; return false }
  }
  function travel(map: Location, position?: [number,number]) { if (!state.value) return; state.value.world = worldSpawn(map,position); autosave() }
  function rememberPosition(world: WorldState) { if (!state.value || state.value.world?.map !== world.map) return; state.value.world = world; autosave() }
  function setTalking(value: boolean) { if (!state.value) return; state.value.flags.world_talk_open = value; autosave() }
  function rememberOriginals(ids: string[]) { if (!state.value) return; if (!state.value.inventory.includes('originals')) state.value.inventory.push('originals'); ids.forEach(id => {state.value!.flags[`original_${id}`] = true}); autosave() }
  return { state, saves, error, ready, saving, node, choices, initialize, newGame, next, select, visit, wait, equip, save, load, travel, rememberPosition, setTalking, rememberOriginals, chapterCommand, prologueNext, prologueEvent, prologueUnlock, prologueKnock, inspectPrologue, inspectDreamObject, rememberDreamPose, rememberProloguePosition, travelInPrologue, beginWellBattle, wellAction, wellNext }
})
