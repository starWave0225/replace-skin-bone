import { createCombat, performCombatAction } from './combat'
import type { CombatAction } from './combat-data'

export interface WellEncounter {
  stage: 'cinematic' | 'intro' | 'fight' | 'aftermath' | 'complete'
  actions: CombatAction[]
}
export const wellClue = {
  title: '鬼童留下的青布', mark: '布',
  text: '门槛上留了一角青布。陆知微认得那针脚，与梦里压在书案上的布相同。',
  inference: '枯井回声引到青布。收好，日后可凭它继续查问。',
}
export const wellLessons: { action: CombatAction; title: string; text: string; after: string }[] = [
  { action: 'attack', title: '壹 · 一人一招，往来成回合', text: '你先选一招，鬼童再执行“对方下招”。等你选择时，敌人不会自行行动。先用「点墨」试探：破相 6，并回复 1 点墨息。', after: '点墨只削去了外层皮相，鬼童的“形”仍是 24。他随后扯袖，你的形减少了 8。' },
  { action: 'observe', title: '贰 · 先看敌意，再辨虚实', text: '“藏了一手”表示意图被假相遮住。「辨相」消耗 1 墨息，揭示隐藏意图，并使后续三次行动内的下一击额外 +8。它也占一回合。', after: '浮面是隔空施术；辨相已留下识破。下一次攻击会消耗这个标记，多破相 8。' },
  { action: 'outline', title: '叁 · 先破皮相，才伤其形', text: '「勾线」消耗 1 墨息，破相 16；加上识破足以打散剩余皮相。破相会取消本回合敌意，开启后续两次行动的显形窗口。多余伤害不会穿透到形。', after: '皮相已散，水缚蓄势被打断。敌人暂时显形，接下来两次行动可直接伤形；窗口用尽便会补相。' },
  { action: 'breathe', title: '肆 · 守息回墨，接住重击', text: '下招「夺相」会造成 24 伤害。「守息」不耗墨，回复 2 墨息，并使本次受伤减半。守息也占用一次显形行动，请留意敌方的显形状态。', after: '守息回复了 2 墨息，夺相被减为 12 伤害。显形只余一次行动，正可用重招收束怨势。' },
  { action: 'reveal', title: '伍 · 趁显形，落笔见真', text: '「落笔见真」消耗 3 墨息：有皮相时只破相 10，显形时却能伤形 24。此刻使用，压下怨势，再听他想说什么。', after: '怨势暂歇。此战压下的是缠住他的假相，并未断定他就是凶手。' },
]
export function newWellEncounter(): WellEncounter { return { stage: 'cinematic', actions: [] } }
export function wellCombat(encounter: WellEncounter) {
  return encounter.actions.reduce((state, action) => performCombatAction(state, action).state, createCombat('shen', 'prologue'))
}
export function wellActionReason(encounter: WellEncounter, action: CombatAction) {
  if (encounter.stage !== 'fight') return '先读完眼前的案记。'
  return wellLessons[encounter.actions.length]?.action === action ? '' : '本回合先练习案记中提示的招式。'
}
export function performWellAction(encounter: WellEncounter, action: CombatAction): boolean {
  if (wellActionReason(encounter, action)) return false
  const result = performCombatAction(wellCombat(encounter), action)
  if (!result.ok) return false
  encounter.actions.push(action)
  if (result.state.status === 'won') encounter.stage = 'aftermath'
  return true
}
export function advanceWellEncounter(encounter: WellEncounter): boolean {
  if (encounter.stage === 'cinematic') encounter.stage = 'intro'
  else if (encounter.stage === 'intro') encounter.stage = 'fight'
  else if (encounter.stage === 'aftermath') encounter.stage = 'complete'
  else return false
  return true
}
export function isValidWellEncounter(value: unknown): value is WellEncounter {
  if (!value || typeof value !== 'object') return false
  const e = value as WellEncounter
  if (!Array.isArray(e.actions) || e.actions.length > wellLessons.length || !e.actions.every((action, i) => action === wellLessons[i]?.action)) return false
  if (e.stage === 'cinematic' || e.stage === 'intro') return e.actions.length === 0
  if (e.stage === 'fight') return e.actions.length < wellLessons.length
  return ['aftermath', 'complete'].includes(e.stage) && e.actions.length === wellLessons.length
}
