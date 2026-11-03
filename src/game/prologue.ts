import { assetUrl } from './asset-url'
import type { WorldState } from './types'
import { classics } from './classics'

export const protagonist = { name: '陆知微', age: 27, occupation: '抄书人 · 代写书信', portrait: assetUrl('/assets/portraits/lu-v1.webp') }
export type ProloguePhase = 'arrival' | 'investigation' | 'deduction' | 'night' | 'dream' | 'morning' | 'completed'
export type DreamStationId = 'lantern' | 'brush' | 'scroll' | 'mirror' | 'door'
export interface DreamPose { x: number; z: number; yaw: number; pitch: number }
export interface PrologueState {
  phase: ProloguePhase; clues: string[]; dreamSeen: DreamStationId[]; world: WorldState;
  deduction?: string; dreamPose?: DreamPose;
}
export const caseClues = [
  { id: 'letter', title: '未寄出的半笺', mark: '笺', text: '书案下压着半封写给你的信。\n“知微兄：旧谱有讹，烦来一校。戌时，东厢候。”\n落款仍是许文卿，笔锋却比你熟悉的更重。末行被人沿折痕撕去。', inference: '邀约的时辰是戌时，落笔习惯却有细微不同。' },
  { id: 'ledger', title: '客舍的入宿簿', mark: '簿', text: '掌柜把账簿推给你：许文卿在酉时入宿，只有一人。\n戌初，小二送茶，听见屋内有人交谈。\n到戌正送炭时，敲门已无人应答。', inference: '记载只有一名住客，屋里却曾有两个人的声音。' },
  { id: 'tracks', title: '窗下的湿泥', mark: '履', text: '窗台有一小块新蹭落的灰。窗下两枚半干的鞋印，鞋头朝向屋内。\n门外的廊板仍是干的，窗闩也没有被撬断。', inference: '来者可能经过后窗，但没有强行破窗的痕迹。' },
] as const
export const dreamSpirit={name:'白衣女魂',portrait:assetUrl('/assets/dream/wronged-spirit-v1.webp')}
export const dreamStations: { id: DreamStationId; title: string; action: string; position: [number, number]; approach: [number, number]; text: string; originalId?: string; revelation: string; whisper:string; clueTitle:string; clueNote:string }[] = [
  { id: 'lantern', title: '一 · 灯外有声', action: '挑起纸灯', position: [0, 4], approach: [0, 6], text: '雨声停了。帘后却有人低低地哭。\n灯火照出一个白衣妇人的影子。她似要走近，又停在光外，反复唤着许文卿的名字。', originalId: 'night', revelation: '查看采笔。', whisper:'戌初……窗下，尚有人。莫只看那道门闩。',clueTitle:'戌初的窗下',clueNote:'戌初窗下有人。鞋印留下的时辰待查。' },
  { id: 'brush', title: '二 · 采笔未干', action: '查看采笔', position: [-4.5, -1], approach: [-3, .3], text: '砚边的采笔尚湿，笔尖自行描出一道眼尾。\n妇人隔着书案伸手，指向那一处过重的收笔。你想起半笺末行，同样有一道不相称的重笔。', originalId: 'window', revelation: '查看帘后的画卷。',whisper:'信上的末一行……你再看一看。那笔，太重了。',clueTitle:'半笺上的异笔',clueNote:'半笺末行有重笔，需与许文卿旧字比对。' },
  { id: 'scroll', title: '三 · 画中借相', action: '展看画卷', position: [4.5, -5.5], approach: [3, -3.8], text: '灯光移过，画中眉眼一点点生出来，宛如一件可以披起的旧衣。\n画轴下压着一角青布，与女魂腰间的旧布颜色相近。她没有解释自己的来历，只望向窗外的湿痕。', originalId: 'wear', revelation: '查看铜镜。',whisper:'送茶的人……只听见了声音。可曾看清来客的脸？',clueTitle:'听见与看见',clueNote:'小二是否见过来客的脸？' },
  { id: 'mirror', title: '四 · 镜里迟了一瞬', action: '凝视铜镜', position: [-5.7, -10], approach: [-3.7, -9], text: '镜里先是你的脸，随即换作一个陌生画师。再凝神看，白衣妇人也站在镜中。\n她张了张口，未及说出自己的姓名。身后的薄相轻轻摆动。', originalId: 'judgment', revelation: '查看门上的字。',whisper:'认得那张脸……便算认得那个人么？妾有冤，未得申。',clueTitle:'镜中画师',clueNote:'镜中出现的画师是谁？' },
  { id: 'door', title: '五 · 无面茶楼', action: '叩问门后之人', position: [0, -16.3], approach: [0, -14], text: '门后传来斟茶声：“若问许文卿最后见过谁，天明后，往西街尽处。”\n“寻无面茶楼，寻那个执笔的人。”\n白衣女魂停在门侧，手中的旧布缓缓垂下。她没有再开口。', revelation: '去西街无面茶楼。',whisper:'旧谱经过谁的手……替妾，问一问。',clueTitle:'旧谱与执笔者',clueNote:'去无面茶楼，查问旧谱的经手人。' },
]
export function discoveredDreamNotes(seen:readonly DreamStationId[]){
  let count=0
  while(count<dreamStations.length&&seen[count]===dreamStations[count].id)count++
  return dreamStations.slice(0,count)
}
export function initialPrologue(): PrologueState { return { phase: 'arrival', clues: [], dreamSeen: [], world: { map: 'inn', x: 14 * 32, y: 17 * 32, facing: 'up' } } }
export function inspectCase(p: PrologueState, id: string): boolean {
  if (p.phase !== 'investigation' || !caseClues.some(c => c.id === id) || p.clues.includes(id)) return false
  p.clues.push(id); return true
}
export function inspectDream(p: PrologueState, id: DreamStationId): boolean {
  if (p.phase !== 'dream' || dreamStations[p.dreamSeen.length]?.id !== id) return false
  p.dreamSeen.push(id); return true
}
export function advancePrologue(p: PrologueState, deduction?: string): boolean {
  if (p.phase === 'arrival') p.phase = 'investigation'
  else if (p.phase === 'investigation' && caseClues.every(c => p.clues.includes(c.id))) p.phase = 'deduction'
  else if (p.phase === 'deduction' && ['window', 'familiar', 'uncertain'].includes(deduction ?? '')) { p.deduction = deduction; p.phase = 'night' }
  else if (p.phase === 'night') p.phase = 'dream'
  else if (p.phase === 'dream' && p.dreamSeen.length === dreamStations.length) p.phase = 'morning'
  else if (p.phase === 'morning') p.phase = 'completed'
  else return false
  return true
}
export function isValidPrologue(value: unknown): value is PrologueState {
  if (!value || typeof value !== 'object') return false
  const p = value as PrologueState
  const phases: ProloguePhase[] = ['arrival', 'investigation', 'deduction', 'night', 'dream', 'morning', 'completed']
  if (!phases.includes(p.phase) || !Array.isArray(p.clues) || !Array.isArray(p.dreamSeen)) return false
  if (new Set(p.clues).size !== p.clues.length || !p.clues.every(id => caseClues.some(c => c.id === id))) return false
  if (!p.dreamSeen.every((id, i) => dreamStations[i]?.id === id)) return false
  if (p.deduction !== undefined && !['window', 'familiar', 'uncertain'].includes(p.deduction)) return false
  if (p.phase !== 'arrival' && p.phase !== 'investigation' && !caseClues.every(c => p.clues.includes(c.id))) return false
  if (['morning', 'completed'].includes(p.phase) && p.dreamSeen.length !== dreamStations.length) return false
  if (!p.world || p.world.map !== 'inn' || !Number.isFinite(p.world.x) || !Number.isFinite(p.world.y) || p.world.x < 0 || p.world.x > 28 * 32 || p.world.y < 0 || p.world.y > 22 * 32 || !['up','down','left','right'].includes(p.world.facing)) return false
  if(p.dreamPose === undefined)return true
  const pose=p.dreamPose
  return !!pose && typeof pose === 'object' && ['x','z','yaw','pitch'].every(k => typeof pose[k as keyof DreamPose] === 'number' && Number.isFinite(pose[k as keyof DreamPose])) && pose.x >= -7 && pose.x <= 7 && pose.z >= -17 && pose.z <= 10 && Math.abs(pose.pitch)<=1.1
}
export function originalPassage(id?: string) { return classics.find(p => p.id === id) }
