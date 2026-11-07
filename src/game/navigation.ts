import type { GameState } from './types'

export const navigationItems = [
  { id: 'tasks', icon: 'task', label: '任务指引' },
  { id: 'map', icon: 'map', label: '地图' }, { id: 'bag', icon: 'bag', label: '行囊' },
  { id: 'faces', icon: 'mask', label: '面谱' }, { id: 'people', icon: 'people', label: '人物' },
  { id: 'journal', icon: 'book', label: '因果录' }, { id: 'rest', icon: 'moon', label: '休息' },
  { id: 'save', icon: 'save', label: '存档' },
] as const
export type NavigationId = typeof navigationItems[number]['id']
export function navigationLock(state: GameState | null, id: NavigationId): string {
  if (!state) return '进入游戏后开启'
  const phase = state.prologue?.phase
  const prologue = !!phase
  if (id === 'save') return ''
  if(state.chapterOne){
    if(id==='faces')return state.chapterOne.unlocked?'':'首次借面后开启'
    if(id==='rest')return '本章时辰随剧情推进'
    return ''
  }
  if (id === 'faces') return !prologue && state.flags.wearing_first_face ? '' : '首次借面后开启'
  if (id === 'rest') return !prologue && state.mode === 'hub' ? '' : '自由寻访时可休息'
  if (phase === 'arrival') return '片头结束、进入客舍调查后开启'
  return ''
}
