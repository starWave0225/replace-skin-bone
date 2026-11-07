import { dreamStations, type DreamStationId } from './prologue'

// Shadows stand on walkable ground, not on the furniture they reveal.
export const dreamShadows: Record<DreamStationId, { x: number; z: number }> = {
  hall: { x: 0, z: 6.6 },
  courtyard: { x: 2.2, z: 4.3 },
  lantern: { x: 1, z: 1.65 },
  brush: { x: -3, z: .3 },
  scroll: { x: 3, z: -3.8 },
  mirror: { x: -3.7, z: -9 },
}

export const dreamMirror = { x: -6.8, z: -10, approach: { x: -5.4, z: -10 } }

// The mirror stand stops the player at arm's reach. Face the glass to cross it.
export function dreamMirrorContact(seen: readonly DreamStationId[], position: { x: number; z: number; yaw: number }, blocked = false) {
  return !blocked && seen.length === dreamStations.length
    && position.x > dreamMirror.x && position.x <= -5.35
    && Math.abs(position.z - dreamMirror.z) < .65 && Math.sin(position.yaw) > .8
}

export const dreamLines: Record<DreamStationId, readonly string[]> = {
  hall: ['轻些。那时候，堂上还有人在等。'],
  courtyard: ['那夜还是喜筵。天亮时，院里只剩下雪。', '别去解绳。且随我来。'],
  lantern: ['纸灯还亮着，执笔的人却不在了。', '你近些，看看那支笔如何落墨。'],
  brush: ['「鋪人皮於榻上，執采筆而繪之。」', '一张脸，也可以这样画出来。'],
  scroll: ['人非我所杀。有人借这法子驱鬼杀人。', '借你此术七日，替我问个清白。', '再找一找，我那年等的人。'],
  mirror: ['七日之内，记住你自己的名字。', '铜镜里那盏茶尚温。走近些，穿过去。'],
}

export function dreamContact(seen: readonly DreamStationId[], position: { x: number; z: number }, renderedStage: number, blocked = false): DreamStationId | undefined {
  if (blocked || renderedStage !== seen.length) return
  const station = dreamStations[seen.length]
  if (!station) return
  const shadow = dreamShadows[station.id]
  if (Math.hypot(position.x - shadow.x, position.z - shadow.z) <= .85) return station.id
}
export function dreamLineDuration(line: string) { return Math.max(3400, line.length * 170) }
export function dreamPlaybackDuration(id: DreamStationId) {
  return dreamLines[id].reduce((total, line) => total + dreamLineDuration(line), 0) + 700
}
export function dreamSubtitle(id: DreamStationId, elapsed: number) {
  let offset = 0
  for (const [index, line] of dreamLines[id].entries()) {
    offset += dreamLineDuration(line)
    if (elapsed < offset) return { index, text: line }
  }
  return undefined
}
