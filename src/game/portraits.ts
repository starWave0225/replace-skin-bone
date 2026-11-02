import type { Face } from './types'

export const characterPortraits = {
  self: { id: 'self', name: '陆知微', role: '抄书人 · 本来面目', src: '/assets/portraits/lu-v1.webp', side: 'left' },
  shen: { id: 'shen', name: '沈砚之面', role: '借面之人', src: '/assets/portraits/shen-v2.webp', side: 'left' },
  guard: { id: 'guard', name: '周平之面', role: '故捕快之相', src: '/assets/portraits/guard-v2.webp', side: 'left' },
  mother: { id: 'mother', name: '戚婆婆', role: '沈砚的养母', src: '/assets/portraits/mother-v2.webp', side: 'right' },
  han: { id: 'han', name: '韩七', role: '槐阴县捕快', src: '/assets/portraits/han-v2.webp', side: 'right' },
  faceless: { id: 'faceless', name: '无面娘', role: '无面茶楼之主', src: '/assets/portraits/faceless-v2.webp', side: 'right' },
  child: { id: 'child', name: '井中童影', role: '等候天明的孩子', src: '/assets/portraits/child-v2.webp', side: 'right' },
  tea: { id: 'tea', name: '茶摊老板', role: '南街卖茶人', src: '/assets/portraits/tea-v2.webp', side: 'right' },
  lantern: { id: 'lantern', name: '卖灯人', role: '南街扎灯匠', src: '/assets/portraits/lantern-v2.webp', side: 'right' },
  chen: { id: 'chen', name: '镜中残影', role: '王宅旧梦', src: '/assets/portraits/chen-v2.webp', side: 'right' },
} as const
export type PortraitId = keyof typeof characterPortraits
export type CharacterPortrait = typeof characterPortraits[PortraitId]

export const dialogueSpeakerPortraits: Record<string, PortraitId> = {
  '陆知微': 'self',
  '戚婆婆': 'mother', '韩七': 'han', '无面娘': 'faceless', '井中童影': 'child',
  '小满': 'child', '茶摊老板': 'tea', '卖灯人': 'lantern', '镜中残影': 'chen', '陈氏': 'chen',
}

export function getDialoguePortrait(speaker?: string, face: Face = 'shen', portraitSpeaker?: string): CharacterPortrait | undefined {
  if ((!speaker || speaker === '旁白') && portraitSpeaker) return getDialoguePortrait(portraitSpeaker, face)
  if (!speaker) return undefined
  if (speaker === '你' || speaker.startsWith('你 ·')) return characterPortraits[face === 'guard' ? 'guard' : 'shen']
  const id = dialogueSpeakerPortraits[speaker]
  return id ? characterPortraits[id] : undefined
}
