import { openingPoem } from './opening-poem'
import { openingCandleDimDuration, openingCandleDuration, openingCandleFrame } from './opening-light'

// 片头旧谱的临时文案；均为本作衍生文字，末页诗文在 opening-poem.ts 中维护。
// 每条 lines 为一列竖排文字，建议每列不超过十四字。
export interface OpeningBookPage {
  id: string
  kind: 'text' | 'poem'
  title: string
  verso: readonly string[]
  lines: readonly string[]
}

export const openingBookPages: readonly OpeningBookPage[] = [
  {
    id: 'invitation', kind: 'text', title: '雨夜来书',
    verso: ['未闻县', '栖雨客舍记'],
    lines: ['知微兄 旧谱有误 烦来校对', '薄酒小菜 尚可叙旧', '许文卿谨书'],
  },
  {
    id: 'window', kind: 'text', title: '窗外人声',
    verso: ['东厢杂记', '戌初风雨未歇'],
    lines: ['戌初有人在后窗低声相唤', '房内应声的竟似故人', '小二只听人声未见人影', '怕是梦魇来扰 莫回头'],
  },
  {
    id: 'borrowed-face', kind: 'text', title: '异闻',
    verso: ['县中异闻', '传者姓名已佚'],
    lines: ['县人相传有异物能借人面目', '光下看它眉眼俱与活人同', '惟铜镜中影子可现原形'],
  },
  {
    id: 'wang-record', kind: 'text', title: '王家秘辛',
    verso: ['王宅私记', '抄自旧谱'],
    lines: ['王宅尝设喜筵', '席散 宾客归家', '次晨落雪', '闻说此后王家衰败 再未见人'],
  },
  { id: openingPoem.id, kind: 'poem', title: openingPoem.title, verso: [], lines: openingPoem.lines },
]

export const openingBookTurnDuration = 700
export const openingBookReducedTurnDuration = 180
export const openingPoemBrightnessThreshold = .3
export const openingPoemRevealDuration = 1100
export interface OpeningBookState {
  page: number; turnElapsed: number | null; turnDuration: number; complete: boolean
  brightness: number; revealElapsed: number; revealed: boolean; candleElapsed: number | null
}
export function createOpeningBook(): OpeningBookState {
  return { page: 0, turnElapsed: null, turnDuration: openingBookTurnDuration, complete: false, brightness: 1, revealElapsed: 0, revealed: false, candleElapsed: null }
}
export function openingPoemVisibility(brightness: number) {
  const value = Number.isFinite(brightness) ? brightness : 1
  const dark = Math.min(1, Math.max(0, (.72 - value) / .52))
  return .025 + .975 * dark * dark * (3 - 2 * dark)
}
export function blowOutOpeningCandle(book: OpeningBookState) {
  if (book.complete || book.turnElapsed !== null || book.candleElapsed !== null || openingBookPages[book.page].kind !== 'poem') return false
  book.candleElapsed = 0
  return true
}
export function beginOpeningBookTurn(book: OpeningBookState, reducedMotion = false) {
  if (book.complete || book.turnElapsed !== null) return false
  if (openingBookPages[book.page].kind === 'poem') {
    if (!book.revealed) return false
    book.complete = true
    return true
  }
  book.turnElapsed = 0
  book.turnDuration = reducedMotion ? openingBookReducedTurnDuration : openingBookTurnDuration
  return true
}
export function advanceOpeningBook(book: OpeningBookState, delta: number) {
  if (!Number.isFinite(delta) || delta <= 0 || book.complete) return
  if (book.candleElapsed !== null) {
    book.candleElapsed = Math.min(openingCandleDuration, book.candleElapsed + delta)
    book.brightness = openingCandleFrame(book.candleElapsed).brightness
  }
  if (book.turnElapsed === null) {
    if (openingBookPages[book.page].kind === 'poem' && !book.revealed) {
      book.revealElapsed = book.brightness <= openingPoemBrightnessThreshold && book.candleElapsed !== null ? Math.max(0, book.candleElapsed - openingCandleDimDuration) : 0
      if (book.revealElapsed >= openingPoemRevealDuration) book.revealed = true
    }
    return
  }
  book.turnElapsed = Math.min(book.turnDuration, book.turnElapsed + delta)
  if (book.turnElapsed < book.turnDuration) return
  book.page = Math.min(openingBookPages.length - 1, book.page + 1)
  book.turnElapsed = null
}
