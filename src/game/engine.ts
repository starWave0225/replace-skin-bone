import type { Activity, Choice, Condition, Effect, GameState } from './types'
import { story } from './story'
import { activities } from './catalog'
import { worldSpawn, worldMaps } from './world'
import { initialPrologue, isValidPrologue } from './prologue'

export function initialState(): GameState {
  return { version: 1, nodeId: 'opening_1', day: 1, time: 'day', actionPoints: 3, face: 'shen',
    stats: { selfhood: 50, karma: 0, shen: 10, guard: 0, mother: 0, han: -20 },
    flags: {}, inventory: [], clues: [], journal: [], completed: [], applied: [], history: [], mode: 'story', world: worldSpawn('theatre') }
}
export function conditionMet(s: GameState, condition?: Condition): boolean {
  if (!condition) return true
  if ('all' in condition) return condition.all.every(c => conditionMet(s, c))
  if ('any' in condition) return condition.any.some(c => conditionMet(s, c))
  if ('not' in condition) return !conditionMet(s, condition.not)
  if ('flag' in condition) return !!s.flags[condition.flag] === (condition.is ?? true)
  if ('stat' in condition) return s.stats[condition.stat] >= condition.gte
  return s.face === condition.face
}
function unique(list: string[], value: string) { if (!list.includes(value)) list.push(value) }
export function refreshDerived(s: GameState) {
  const memories = ['child_name', 'home_tree', 'child_promise'].filter(id => s.clues.includes(id)).length
  s.flags.can_empathize = memories >= 2
  s.flags.mother_can_accept = s.stats.mother >= 20 && !!(s.flags.trust_meal || s.flags.trust_relic)
  s.flags.file_obtained = s.inventory.includes('file')
}
export function applyEffects(s: GameState, effects: Effect[] = [], key: string) {
  if (s.applied.includes(key)) return
  for (const effect of effects) {
    if ('stat' in effect) {
      const minimum = effect.stat === 'mother' || effect.stat === 'han' ? -100 : 0
      s.stats[effect.stat] = Math.max(minimum, Math.min(100, s.stats[effect.stat] + effect.add))
    } else if ('flag' in effect) s.flags[effect.flag] = effect.value ?? true
    else if ('item' in effect) unique(s.inventory, effect.item)
    else if ('clue' in effect) unique(s.clues, effect.clue)
    else if ('journal' in effect) unique(s.journal, effect.journal)
    else if ('face' in effect) s.face = effect.face
    else if ('ending' in effect) s.ending = effect.ending
  }
  unique(s.applied, key)
  refreshDerived(s)
}
export function enterNode(s: GameState, id: string) {
  const node = story[id]
  if (!node) throw new Error(`剧情节点不存在：${id}`)
  s.nodeId = id
  s.mode = 'story'
  if (!s.applied.includes(`node:${id}`)) {
    if (id === 'street_1') { s.actionPoints = 2; s.time = 'dusk' }
    if (id === 'arrival_end') { s.actionPoints = 1; s.time = 'night' }
    if (id === 'well_1') { s.day = 3; s.time = 'night'; s.actionPoints = 1 }
  }
  applyEffects(s, node.effects, `node:${id}`)
  s.history.push({ speaker: node.speaker ?? '旁白', text: node.text })
  if (s.history.length > 350) s.history.shift()
}
export function startGame(withPrologue = false): GameState { const s = initialState(); if(withPrologue)s.prologue=initialPrologue();else enterNode(s, s.nodeId); return s }
export function advance(s: GameState) {
  if (s.prologue && s.prologue.phase !== 'completed') return false
  if (s.mode !== 'story') return false
  const node = story[s.nodeId]
  if (node.choices) return false
  if (node.end === 'hub') {
    if (s.activity) {
      unique(s.completed, s.activity)
      s.activity = undefined
      spendTime(s)
    }
    if (s.day === 3 && s.time === 'dusk') enterNode(s, 'deadline_1')
    else s.mode = 'hub'
  } else if (node.end === 'ending') { s.mode = 'ending'; s.actionPoints = 0 }
  else if (node.next) enterNode(s, node.next)
  else return false
  return true
}
export function choose(s: GameState, choiceId: string) {
  if (s.prologue && s.prologue.phase !== 'completed') return false
  if (s.mode !== 'story') return false
  const choice = story[s.nodeId]?.choices?.find(c => c.id === choiceId)
  if (!choice || !conditionMet(s, choice.when)) return false
  const key = `choice:${s.nodeId}:${choiceId}`
  applyEffects(s, choice.effects, key)
  s.history.push({ speaker: '你', text: choice.text, choice: choiceId })
  enterNode(s, choice.next)
  return true
}
export function spendTime(s: GameState) {
  s.actionPoints = Math.max(0, s.actionPoints - 1)
  if (s.time === 'night') { s.day += 1; s.time = 'day'; s.actionPoints = 3 }
  else s.time = s.time === 'day' ? 'dusk' : 'night'
}
export function activityReason(s: GameState, activity: Activity) {
  if (s.mode !== 'hub') return '当前事件结束后再安排行动'
  if (s.completed.includes(activity.id)) return '此事已访，不可重复'
  if (s.actionPoints < 1) return '今日行动已尽'
  if (!activity.times.includes(s.time)) return activity.times.includes('night') ? '子夜可访' : '白昼或黄昏可访'
  if (s.face !== 'shen' && ['meal', 'relic'].includes(activity.id)) return '请先在面谱中换回沈砚之面'
  return ''
}
export function beginActivity(s: GameState, id: string) {
  const activity = activities.find(a => a.id === id)
  if (!activity || activityReason(s, activity)) return false
  s.activity = id
  enterNode(s, activity.start)
  return true
}
export function rest(s: GameState) {
  if (s.mode !== 'hub') return false
  spendTime(s)
  if (s.day === 3 && s.time === 'dusk') enterNode(s, 'deadline_1')
  return true
}
export function changeFace(s: GameState, face: GameState['face']) {
  if (!s.flags.wearing_first_face || s.mode === 'ending') return false
  if (face === 'guard' && !s.flags.guard_unlocked) return false
  if (s.mode === 'story' && !['case_archive', 'well_choice'].includes(s.nodeId)) return false
  s.face = face
  return true
}
export function visibleChoices(s: GameState): (Choice & { available: boolean })[] {
  return (story[s.nodeId]?.choices ?? []).filter(c => conditionMet(s, c.when) || !!c.locked).map(c => ({ ...c, available: conditionMet(s, c.when) }))
}
export function validateStory() {
  const errors: string[] = []
  for (const node of Object.values(story)) {
    for (const id of [node.next, ...node.choices?.map(c => c.next) ?? []].filter(Boolean) as string[]) {
      if (!story[id]) errors.push(`${node.id} → ${id} 不存在`)
    }
    if (!node.next && !node.choices?.length && !node.end) errors.push(`${node.id} 没有出口`)
  }
  return errors
}
export function isValidState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false
  const s = value as GameState
  return s.version === 1 && typeof s.nodeId === 'string' && !!story[s.nodeId]
    && (s.prologue === undefined || isValidPrologue(s.prologue))
    && ['story', 'hub', 'ending'].includes(s.mode) && ['shen', 'guard'].includes(s.face)
    && Number.isInteger(s.day) && s.day >= 1 && s.day <= 3 && ['day', 'dusk', 'night'].includes(s.time)
    && Number.isInteger(s.actionPoints) && s.actionPoints >= 0 && s.actionPoints <= 3
    && !!s.stats && ['selfhood', 'karma', 'shen', 'guard', 'mother', 'han'].every(k => {
      const v = s.stats[k as keyof typeof s.stats]; return typeof v === 'number' && Number.isFinite(v) && v >= (['mother','han'].includes(k) ? -100 : 0) && v <= 100
    }) && !!s.flags && typeof s.flags === 'object' && Object.values(s.flags).every(v => typeof v === 'boolean')
    && ['inventory','clues','journal','completed','applied'].every(k => Array.isArray(s[k as keyof GameState]) && (s[k as keyof GameState] as unknown[]).every(v => typeof v === 'string'))
    && Array.isArray(s.history) && s.history.every(v => !!v && typeof v.speaker === 'string' && typeof v.text === 'string')
    && (s.ending === undefined || ['stay', 'truth', 'leave'].includes(s.ending))
    && (s.mode !== 'ending' || !!s.ending)
    && (s.activity === undefined || activities.some(a => a.id === s.activity))
    && (s.world === undefined || (!!worldMaps[s.world.map] && Number.isFinite(s.world.x) && Number.isFinite(s.world.y)
      && s.world.x >= 0 && s.world.y >= 0 && s.world.x <= worldMaps[s.world.map].width * 32 && s.world.y <= worldMaps[s.world.map].height * 32
      && ['up','down','left','right'].includes(s.world.facing)))
}
