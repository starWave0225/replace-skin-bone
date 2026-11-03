import { openingDuration, openingShots } from './opening'
import { advanceOpeningBook, beginOpeningBookTurn, createOpeningBook, openingBookPages } from './opening-book'

export const openingBookStart = openingShots.find(shot => shot.id === 'pages')!.start
export const openingBookReveal = openingShots.find(shot => shot.id === 'poem')!.start
export const openingBookAftermath = openingShots.find(shot => shot.id === 'dissolve')!.start
export function createOpeningPlayback(fromBook = false) {
  const elapsed = fromBook ? openingBookStart : 0
  return { elapsed, ambienceTime: elapsed, book: createOpeningBook() }
}
export type OpeningPlayback = ReturnType<typeof createOpeningPlayback>
export function isOpeningBookWaiting(playback: OpeningPlayback) {
  return playback.elapsed >= openingBookStart && !playback.book.complete
}
export function turnOpeningPage(playback: OpeningPlayback, reducedMotion = false) {
  return isOpeningBookWaiting(playback) && beginOpeningBookTurn(playback.book, reducedMotion)
}
export function advanceOpeningPlayback(playback: OpeningPlayback, delta: number) {
  if (!Number.isFinite(delta) || delta <= 0) return
  playback.ambienceTime += delta
  if (playback.elapsed < openingBookStart) {
    // Even a late frame must land on the first readable page instead of skipping it.
    playback.elapsed = Math.min(openingBookStart, playback.elapsed + delta)
  } else if (!playback.book.complete) {
    advanceOpeningBook(playback.book, delta)
    if (openingBookPages[playback.book.page].kind === 'poem') playback.elapsed = openingBookReveal
  } else if (playback.elapsed < openingBookAftermath) playback.elapsed = openingBookAftermath
  else playback.elapsed = Math.min(openingDuration, playback.elapsed + delta)
}
