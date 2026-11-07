import { assetUrl } from './asset-url'
import { classics } from './classics'
import { isValidWellEncounter, newWellEncounter } from './prologue-battle'
import type { WellEncounter } from './prologue-battle'
import type { Location, WorldState } from './types'
import { TILE, worldMaps, worldSpawn } from './world'

export const protagonist = { name: '陆知微', age: 27, occupation: '抄书人 · 代写书信', portrait: assetUrl('/assets/portraits/lu-v1.webp') }
export type ProloguePhase = 'arrival' | 'investigation' | 'search' | 'blackout' | 'dream' | 'morning' | 'curtain'
export type DreamStationId = 'hall' | 'courtyard' | 'lantern' | 'brush' | 'scroll' | 'mirror'
export interface DreamPose { x: number; z: number; yaw: number; pitch: number }
export const echoDirections = { up: '正前方', left: '左边', right: '右边' } as const
export type EchoDirection = keyof typeof echoDirections
export interface PrologueState {
  phase: ProloguePhase
  clues: string[]
  dreamSeen: DreamStationId[]
  world: WorldState
  dreamPose?: DreamPose
  heardAppeal?: true
  verseDoorsSeen?: string[]
  verseRoomFound?: true
  wallOpen?: true
  briefed?: true
  knocks: number
  echo?: EchoDirection
  wellEncounter?: WellEncounter
}

export const caseClues = [
  { id: 'letter', title: '未寄出的半笺', mark: '笺', text: '书案下压着半封写给你的信。许兄的字一向写得疏朗。偏是末尾相约那一行，笔锋尖重，落款却依旧是许文卿。', inference: '邀约地点与时辰的笔迹有异，需找许文卿旧信核对。' },
  { id: 'ledger', title: '客舍的入宿簿', mark: '簿', text: '许文卿酉时独自入宿。戌初，小二送茶，隔门听到两人交谈，茶却始终没人来接。戌正送炭，再叩门已无人应答。', inference: '簿上只有一人，小二听见两个人说话，未见第二人的脸。' },
  { id: 'tracks', title: '镜前至窗下的鞋印', mark: '履', text: '铜镜前落着一摊雨水。一串湿鞋印从镜前拖到后窗，越近窗台，泥色越淡。镜后的墙是实的，门内的地砖也没有泥。', inference: '湿鞋印起于铜镜前，止于后窗。' },
] as const

export const dreamSpirit = { name: '白衣女魂', portrait: assetUrl('/assets/dream/wronged-spirit-v1.webp') }
export const borrowedSpiritPortrait = assetUrl('/assets/dream/borrowed-woman-v1.webp')
export const dreamStations: { id: DreamStationId; title: string; action: string; position: [number, number]; approach: [number, number]; text: string; originalId?: string; revelation: string; whisper: string; clueTitle: string; clueNote: string }[] = [
  { id: 'hall', title: '一 · 旧喜堂', action: '察看旧喜堂', position: [0, 6.3], approach: [0, 7.8], text: '门上还贴着褪色的囍字，案前的喜烛早已烧尽。白衣女子停在厅堂尽头，回头看了你一眼。', revelation: '随白影穿过厅堂。', whisper: '轻些。那时候，堂上还有人在等。', clueTitle: '褪色的喜堂', clueNote: '梦中的宅院曾办过一场婚事。' },
  { id: 'courtyard', title: '二 · 庭雪', action: '查看雪中老树', position: [3.9, 3.7], approach: [2.2, 4.3], text: '一出厅堂，雨声便断了。中庭积雪没过石阶。老树上挂着一具尸身，垂下的衣摆冻得僵直。白影掠过树下，往书房去了。', revelation: '循灯进书房。', whisper: '别去解绳。且随我来。', clueTitle: '树下无足印', clueNote: '梦中雪庭有一具悬尸，面目与来历未明。' },
  { id: 'lantern', title: '三 · 书房纸灯', action: '挑起纸灯', position: [1, .15], approach: [1, 1.65], text: '纸灯下，墨汁新磨，屋里却不见执笔之人。桌上压着一方青布，露出半截旧纸。', originalId: 'window', revelation: '查看砚边的笔。', whisper: '你近些。看看那支笔如何落墨。', clueTitle: '书房里的青布', clueNote: '一方青布压在梦中书案上。' },
  { id: 'brush', title: '四 · 无手之笔', action: '察看自行落墨的笔', position: [-4.5, -1], approach: [-3, .3], text: '笔从砚边自行立起，蘸墨，落纸。它先勾出眉尾，再描出一张你从未见过的脸。', revelation: '走近画卷。', whisper: '画成了。你再抬眼看我。', clueTitle: '采笔自行', clueNote: '无人执笔，纸上却显出陌生面貌。' },
  { id: 'scroll', title: '五 · 一面七日', action: '察看画卷与女魂', position: [4.5, -5.5], approach: [3, -3.8], text: '白衣女魂转过脸，眉眼已与画中人分毫不差。她的声音仍是方才那一个。', originalId: 'wear', revelation: '找找这屋里何处映得出你自己的脸。', whisper: '人非我所杀。有人借这法子驱鬼杀人。我也有冤。借你此术七日，替我问个清白，再找一找我那年等的人。至于回去的路，你得自己找。', clueTitle: '女魂的七日之约', clueNote: '女魂称有人纵鬼杀人，借陆知微七日幻化之术，请他洗冤并寻旧人。' },
  { id: 'mirror', title: '六 · 镜中归路', action: '走近铜镜', position: [-5.7, -10], approach: [-3.7, -9], text: '镜中没有雪，也没有喜堂。你看见一间客房，床沿放着一盏茶，茶面还冒着热气。指尖碰到铜面时，水纹自镜心散开。', revelation: '穿过铜镜，离开梦境。', whisper: '七日之内。记住你自己的名字。', clueTitle: '铜镜是出口', clueNote: '镜中映出茶楼客房，通往醒来的地方。' },
]

export function discoveredDreamNotes(seen: readonly DreamStationId[]) {
  let count = 0
  while (count < dreamStations.length && seen[count] === dreamStations[count].id) count++
  return dreamStations.slice(0, count)
}
export function originalPassage(id?: string) { return classics.find(p => p.id === id) }

export function initialPrologue(): PrologueState {
  return { phase: 'arrival', clues: [], dreamSeen: [], world: { ...worldSpawn('inn'), facing: 'up' }, knocks: 0 }
}
export function hasCaseEvidence(p: PrologueState) { return caseClues.every(clue => p.clues.includes(clue.id)) }
export function inspectCase(p: PrologueState, id: string): boolean {
  if (p.phase !== 'investigation' || !caseClues.some(c => c.id === id) || p.clues.includes(id)) return false
  p.clues.push(id)
  return true
}
export function inspectDream(p: PrologueState, id: DreamStationId): boolean {
  if (p.phase !== 'dream' || dreamStations[p.dreamSeen.length]?.id !== id) return false
  p.dreamSeen.push(id)
  return true
}
export function advancePrologue(p: PrologueState): boolean {
  if (p.phase === 'arrival') p.phase = 'investigation'
  else if (p.phase === 'blackout') p.phase = 'dream'
  else if (p.phase === 'dream' && p.dreamSeen.length === dreamStations.length) {
    p.phase = 'morning'
    p.world = worldSpawn('theatre_upper', [7, 11])
  } else if (p.phase === 'morning' && p.wellEncounter?.stage === 'complete') p.phase = 'curtain'
  else return false
  return true
}
export function recordPrologueEvent(p: PrologueState, id: string): boolean {
  if (id === 'owner' && p.phase === 'investigation' && hasCaseEvidence(p)) p.phase = 'search'
  else if (id === 'appeal' && ['search', 'morning'].includes(p.phase) && p.world.map === 'street' && !p.heardAppeal) p.heardAppeal = true
  else if (id.startsWith('read_verse_') && p.phase === 'search' && p.world.map === 'theatre_upper' && verseDoors.some(d => 'read_' + d.id === id)) {
    const key=id.slice(5);p.verseDoorsSeen??=[];if(p.verseDoorsSeen.includes(key))return false;p.verseDoorsSeen.push(key)
  }
  else if (verseDoors.some(d=>'enter_'+d.id===id&&d.wrong) && p.phase === 'search' && p.world.map === 'theatre_upper' && verseDoors.every(d=>p.verseDoorsSeen?.includes(d.id)) && !p.verseRoomFound) p.verseRoomFound=true
  else if (id === 'wall' && p.phase === 'search' && p.world.map === 'theatre_upper' && p.verseRoomFound && !p.wallOpen) p.wallOpen = true
  else if (id === 'briefing' && p.phase === 'morning' && p.world.map === 'theatre_upper' && !p.briefed) p.briefed = true
  else return false
  return true
}
export const verseDoors = [
  { id: 'verse_rain', name: '听雨房', x: 2.5, lines: ['隔窗残烛照秋江', '一夜疏雨过空窗'], sounds: '江 jiāng · 窗 chuāng', wrong: false },
  { id: 'verse_snow', name: '候雪房', x: 13.5, lines: ['雪落空庭掩旧门', '灯残犹照旧苔痕'], sounds: '门 mén · 痕 hén', wrong: false },
  { id: 'verse_moon', name: '待月房', x: 16.5, lines: ['半卷残书待月明', '隔帘旧梦逐秋水'], sounds: '明 míng · 水 shuǐ', wrong: true },
] as const
export const boxAnswer = '红褪墨残'
export function unlockPrologueBox(p: PrologueState, text: string): boolean {
  if (p.phase !== 'search' || p.world.map !== 'theatre_upper' || !p.wallOpen || text.replace(/[\s，。！？、,.!?]/g, '') !== boxAnswer) return false
  p.phase = 'blackout'
  return true
}

const routes: Partial<Record<Location, Partial<Record<Location, [number, number]>>>> = {
  inn: { street: [20, 17], inn_well: [11, 16] },
  street: { inn: [14, 18], theatre: [13, 15] },
  theatre: { street: [8, 29], theatre_upper: [4, 13] },
  theatre_upper: { theatre: [21, 11] },
  inn_well: { inn: [3, 12] },
}
export function travelPrologue(p: PrologueState, destination: Location): boolean {
  if (p.phase !== 'search' && p.phase !== 'morning') return false
  if (p.wellEncounter || (p.phase === 'morning' && !p.briefed) || (destination === 'inn_well' && p.phase !== 'morning')) return false
  const arrival = routes[p.world.map]?.[destination]
  if (!arrival) return false
  p.world = worldSpawn(destination, arrival)
  return true
}
export function knockAtWell(p: PrologueState): boolean {
  if (p.phase !== 'morning' || p.world.map !== 'inn_well' || p.knocks >= 3 || p.wellEncounter) return false
  p.knocks++
  if (p.knocks === 3) {
    const directions = Object.keys(echoDirections) as EchoDirection[]
    p.echo = directions[Math.floor(Math.random() * directions.length)]
  }
  return true
}
export function startWellEncounter(p: PrologueState, door?: string): boolean {
  if (p.phase !== 'morning' || p.world.map !== 'inn_well' || p.wellEncounter || !p.echo || door !== p.echo) return false
  p.wellEncounter = newWellEncounter()
  return true
}

export function prologueHintIds(p: PrologueState): string[] {
  const map = p.world.map
  if (p.phase === 'investigation') return hasCaseEvidence(p) ? ['owner'] : caseClues.filter(clue => !p.clues.includes(clue.id)).map(clue => clue.id)
  if (p.phase === 'search') {
    if (map === 'inn') return ['inn_street']
    if (map === 'street') return ['street_theatre']
    if (map === 'theatre') return ['upstairs']
    return p.wallOpen ? ['secret_box'] : p.verseRoomFound ? ['hidden_wall'] : verseDoors.map(d=>d.id)
  }
  if (p.phase !== 'morning') return []
  if (map === 'theatre_upper') return [p.briefed ? 'downstairs' : 'briefing']
  if (map === 'theatre') return ['exit']
  if (map === 'street') return ['street_inn']
  if (map === 'inn') return ['backyard']
  return p.echo ? ['echo_up', 'echo_left', 'echo_right'] : ['well_spirit']
}

const phaseMaps: Record<ProloguePhase, readonly Location[]> = {
  arrival: ['inn'], investigation: ['inn'],
  search: ['inn', 'street', 'theatre', 'theatre_upper'],
  blackout: ['theatre_upper'], dream: ['theatre_upper'],
  morning: ['theatre_upper', 'theatre', 'street', 'inn', 'inn_well'],
  curtain: ['inn_well'],
}
export function isValidPrologue(value: unknown): value is PrologueState {
  if (!value || typeof value !== 'object') return false
  const p = value as PrologueState
  if (!Object.hasOwn(phaseMaps, p.phase) || !p.world || !phaseMaps[p.phase].includes(p.world.map)) return false
  if (!Array.isArray(p.clues) || new Set(p.clues).size !== p.clues.length || !p.clues.every(id => caseClues.some(c => c.id === id))) return false
  if (!['arrival', 'investigation'].includes(p.phase) && !hasCaseEvidence(p)) return false
  if (!Array.isArray(p.dreamSeen) || !p.dreamSeen.every((id, index) => dreamStations[index]?.id === id)) return false
  if (['blackout', 'dream', 'morning', 'curtain'].includes(p.phase) && p.wallOpen !== true) return false
  if (['morning', 'curtain'].includes(p.phase) && p.dreamSeen.length !== dreamStations.length) return false
  if (p.phase === 'morning' && p.world.map !== 'theatre_upper' && p.briefed !== true) return false
  if (!Number.isInteger(p.knocks) || p.knocks < 0 || p.knocks > 3 || (p.knocks === 3 ? !Object.hasOwn(echoDirections, p.echo ?? '') : p.echo !== undefined)) return false
  if (p.wellEncounter !== undefined && (!p.echo || p.world.map !== 'inn_well' || !isValidWellEncounter(p.wellEncounter))) return false
  if (p.phase === 'curtain' && p.wellEncounter?.stage !== 'complete') return false
  if (p.verseDoorsSeen !== undefined && (!Array.isArray(p.verseDoorsSeen) || new Set(p.verseDoorsSeen).size !== p.verseDoorsSeen.length || !p.verseDoorsSeen.every(id=>verseDoors.some(d=>d.id===id)))) return false
  if (p.verseRoomFound !== undefined && p.verseRoomFound !== true) return false
  const map = worldMaps[p.world.map]
  if (!Number.isFinite(p.world.x) || !Number.isFinite(p.world.y) || p.world.x < 0 || p.world.x > map.width * TILE || p.world.y < 0 || p.world.y > map.height * TILE || !['up', 'down', 'left', 'right'].includes(p.world.facing)) return false
  const pose = p.dreamPose
  return pose === undefined || (!!pose && [pose.x, pose.z, pose.yaw, pose.pitch].every(Number.isFinite) && pose.x >= -7 && pose.x <= 7 && pose.z >= -17 && pose.z <= 10 && Math.abs(pose.pitch) <= 1.1)
}
