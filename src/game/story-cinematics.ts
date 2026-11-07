export type StoryCinematicId = 'ambush' | 'well'
export type StoryCue = 'wood' | 'cloth' | 'strike' | 'echo' | 'whisper'
interface Shot {
  id: string; duration: number; art: string; caption: string
  focus: [number, number]; zoom: [number, number]; shade?: boolean
}
export const storyCinematics: Record<StoryCinematicId, { title: string; shots: Shot[]; cues: { at: number; sound: StoryCue }[] }> = {
  ambush: {
    title: '无面茶楼 · 匣后有人',
    shots: [
      { id: 'skin', duration: 3900, art: '/assets/opening/ink/teahouse-skin-box-v1.webp', caption: '匣中皮囊，眉眼俱全。', focus: [70, 66], zoom: [1.03, 1.13] },
      { id: 'shadow', duration: 4200, art: '/assets/opening/ink/teahouse-ambush-v1.webp', caption: '身后，衣袖擦过墙板。', focus: [71, 35], zoom: [1.03, 1.1] },
      { id: 'strike', duration: 1900, art: '/assets/opening/ink/teahouse-ambush-v1.webp', caption: '「好看吗？」', focus: [45, 42], zoom: [1.1, 1.22] },
      { id: 'blackout', duration: 3000, art: '/assets/opening/ink/teahouse-ambush-v1.webp', caption: '后颈一痛。灯火，远了。', focus: [45, 42], zoom: [1.22, 1.25], shade: true },
    ],
    cues: [{ at: 400, sound: 'wood' }, { at: 4000, sound: 'cloth' }, { at: 8300, sound: 'strike' }],
  },
  well: {
    title: '栖雨客舍 · 井畔童影',
    shots: [
      { id: 'well', duration: 3600, art: '/assets/opening/ink/well-child-v1.webp', caption: '三叩已过。井底的回声，竟落在门后。', focus: [16, 65], zoom: [1.7, 1.8] },
      { id: 'door', duration: 3800, art: '/assets/opening/ink/well-child-v1.webp', caption: '循声推门，湿脚印一直走到脚边。', focus: [66, 60], zoom: [1.03, 1.1] },
      { id: 'child', duration: 4200, art: '/assets/opening/ink/well-child-v1.webp', caption: '孩子抓着井栏抬头，脸上贴着一张不合尺寸的纸相。', focus: [70, 38], zoom: [1.18, 1.32] },
      { id: 'masks', duration: 3000, art: '/assets/opening/ink/well-child-v1.webp', caption: '纸相忽然扯开嘴扑来。寒意透骨，你记起梦中的辨相之法。', focus: [65, 45], zoom: [1.08, 1.17] },
    ],
    cues: [{ at: 300, sound: 'echo' }, { at: 3800, sound: 'wood' }, { at: 7500, sound: 'whisper' }, { at: 11800, sound: 'cloth' }],
  },
}
export function cinematicDuration(id: StoryCinematicId) { return storyCinematics[id].shots.reduce((total, shot) => total + shot.duration, 0) }
export function cinematicFrame(id: StoryCinematicId, time: number) {
  const shots = storyCinematics[id].shots
  let local = Math.max(0, Number.isFinite(time) ? time : 0), index = 0
  while (index < shots.length - 1 && local >= shots[index].duration) { local -= shots[index].duration; index++ }
  const shot = shots[index], progress = Math.min(1, local / shot.duration)
  return { shot, index, progress, zoom: shot.zoom[0] + (shot.zoom[1] - shot.zoom[0]) * progress }
}
