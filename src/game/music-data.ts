import type { Location } from './types'

export const musicTracks = [
  { id: 'chinatown_healing', title: 'Chinatown_Healing', label: '雨落客舍', mood: '笛与筝 · 清淡、舒缓', scenes: '标题 / 栖雨客舍', source: 'https://peritune.com/blog/2017/06/22/chinatown/' },
  { id: 'folk_chinese', title: 'Folk_Chinese', label: '未闻县市声', mood: '二胡与笛 · 轻快市井', scenes: '白昼南街', source: 'https://peritune.com/blog/2018/01/14/folk_chinese/' },
  { id: 'taohua', title: 'Taohua', label: '庭前桃花', mood: '二胡、古筝 · 温柔人情', scenes: '戚家小院 / 斗法胜利', source: 'https://peritune.com/blog/2021/03/03/taohua/' },
  { id: 'shenxian_drumless', title: 'Shenxian_Drumless', label: '灯下问相', mood: '无鼓版 · 幽微、空灵', scenes: '无面茶楼 / 王宅', source: 'https://peritune.com/blog/2020/06/05/shenxian/' },
  { id: 'suspense', title: 'Suspense', label: '井下旧事', mood: '低回弦乐 · 疑案未明', scenes: '县衙 / 后井 / 夜间调查', source: 'https://peritune.com/blog/2015/05/10/suspense1/' },
  { id: 'suspense3', title: 'Suspense3', label: '灯外幽魂', mood: '悬疑氛围 · 不安、残梦', scenes: '第一人称梦境 / 入夜', source: 'https://peritune.com/blog/2015/08/29/suspense3/' },
  { id: 'wuxia2_guzheng_pipa', title: 'Wuxia2_Guzheng_Pipa', label: '借面斗法', mood: '古筝与琵琶 · 灵动武侠', scenes: '回合制战斗', source: 'https://peritune.com/blog/2018/10/13/wuxia2/' },
] as const
export type MusicTrackId = typeof musicTracks[number]['id']
export type MusicScene = 'title' | 'inn' | 'street' | 'home' | 'teahouse' | 'investigation' | 'night' | 'dream' | 'battle' | 'victory' | 'defeat'
export const musicScenes: Record<MusicScene, { name: string; track: MusicTrackId }> = {
  title: { name: '未闻志异', track: 'chinatown_healing' }, inn: { name: '栖雨客舍', track: 'chinatown_healing' },
  street: { name: '未闻县南街', track: 'folk_chinese' }, home: { name: '戚家小院', track: 'taohua' },
  teahouse: { name: '灯下寻人', track: 'shenxian_drumless' }, investigation: { name: '旧案寻踪', track: 'suspense' },
  night: { name: '夜雨疑踪', track: 'suspense' }, dream: { name: '灯外有魂', track: 'suspense3' },
  battle: { name: '借面斗法', track: 'wuxia2_guzheng_pipa' }, victory: { name: '影散天明', track: 'taohua' }, defeat: { name: '暂退此阵', track: 'suspense' },
}
export function musicSceneForMap(location: Location, time: 'day' | 'dusk' | 'night' = 'day'): MusicScene {
  if (location === 'well' || location === 'yamen') return 'investigation'
  if (location === 'theatre' || location === 'mansion') return 'teahouse'
  if (location === 'home') return 'home'
  if (location === 'inn') return 'inn'
  return time === 'night' ? 'night' : 'street'
}
export function musicSceneForPrologue(phase: string): MusicScene {
  if (phase === 'arrival') return 'night'
  if (phase === 'dream' || phase === 'night') return 'dream'
  if (phase === 'investigation' || phase === 'deduction') return 'investigation'
  return 'inn'
}
export const musicAuthor = 'PeriTune / むつき醒 (Sei Mutsuki)'
export const musicLicense = 'https://creativecommons.org/licenses/by/4.0/'
