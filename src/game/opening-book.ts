import { openingPoem } from './opening-poem'

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
    verso: ['未闻县旧谱', '栖雨客舍藏本'],
    lines: ['许文卿邀我来此校订旧谱', '说是旧宅名姓多有涂改', '信末只有一句莫认错了人', '落款的墨却迟迟没有干'],
  },
  {
    id: 'window', kind: 'text', title: '窗外人声',
    verso: ['东厢杂记', '戌初风雨未歇'],
    lines: ['戌初有人在后窗低声相唤', '房内应声的竟与许兄相同', '小二只听两人说话未见人', '泥里留下的脚印没有回头'],
  },
  {
    id: 'borrowed-face', kind: 'text', title: '借面旧闻',
    verso: ['县中异闻', '传者姓名已佚'],
    lines: ['县人相传有物能借人面目', '灯下看它眉眼俱与活人同', '惟铜镜中影子总慢了半拍', '若问姓名它便闭口不言'],
  },
  {
    id: 'missing-name', kind: 'text', title: '缺去的一名',
    verso: ['此处缺名', '墨迹似为新添'],
    lines: ['此页原应记着一位女子姓名', '纸上只剩被水浸开的墨痕', '旁注写着莫信眼前那张脸', '再往后翻却听见一声轻笑'],
  },
  { id: openingPoem.id, kind: 'poem', title: openingPoem.title, verso: [], lines: openingPoem.lines },
]

export const openingBookTurnDuration = 700
export const openingBookReducedTurnDuration = 180
export const openingPoemBrightnessThreshold = .3
export const openingPoemRevealDuration = 1100
export interface OpeningBookState {
  page: number; turnElapsed: number | null; turnDuration: number; complete: boolean
  brightness: number; revealElapsed: number; revealed: boolean
}
export function createOpeningBook(): OpeningBookState {
  return { page: 0, turnElapsed: null, turnDuration: openingBookTurnDuration, complete: false, brightness: 1, revealElapsed: 0, revealed: false }
}
export function openingPoemVisibility(brightness: number) {
  const value = Number.isFinite(brightness) ? brightness : 1
  const dark = Math.min(1, Math.max(0, (.72 - value) / .52))
  return .025 + .975 * dark * dark * (3 - 2 * dark)
}
export function setOpeningBookBrightness(book: OpeningBookState, brightness: number) {
  if (!Number.isFinite(brightness) || book.complete || openingBookPages[book.page].kind !== 'poem') return
  book.brightness = Math.min(1, Math.max(.05, brightness))
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
  if (book.turnElapsed === null) {
    if (openingBookPages[book.page].kind === 'poem' && !book.revealed) {
      book.revealElapsed = book.brightness <= openingPoemBrightnessThreshold ? book.revealElapsed + delta : 0
      if (book.revealElapsed >= openingPoemRevealDuration) book.revealed = true
    }
    return
  }
  book.turnElapsed = Math.min(book.turnDuration, book.turnElapsed + delta)
  if (book.turnElapsed < book.turnDuration) return
  book.page = Math.min(openingBookPages.length - 1, book.page + 1)
  book.turnElapsed = null
}
