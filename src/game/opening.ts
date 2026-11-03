import { openingBookTurnDuration } from './opening-book'

export const openingShots = [
  { id: 'eaves', start: 0, end: 4200 },
  { id: 'arrival', start: 4200, end: 8600 },
  { id: 'gallery', start: 8600, end: 13500 },
  { id: 'door', start: 13500, end: 20100 },
  { id: 'threshold', start: 20100, end: 23700 },
  { id: 'hand', start: 23700, end: 26900 },
  { id: 'discovery', start: 26900, end: 30100 },
  { id: 'reaction', start: 30100, end: 32700 },
  { id: 'storm', start: 32700, end: 35500 },
  { id: 'pages', start: 35500, end: 40800 },
  { id: 'blank', start: 40800, end: 43200 },
  { id: 'poem', start: 43200, end: 48800 },
  { id: 'dissolve', start: 48800, end: 51800 },
] as const

export type OpeningShot = typeof openingShots[number]['id']
export type OpeningCue = 'step' | 'knock' | 'door' | 'window' | 'thunder' | 'page' | 'water'
export const openingDuration = openingShots.at(-1)!.end
export const openingBeats = {
  handRise: 14000, knocks: [14450, 15250, 16050], handWithdraw: 17200,
  door: 20600, window: 33600, thunder: [33900, 35050], water: 41850,
} as const
export const openingCues: readonly { at: number; sound: OpeningCue }[] = [
  ...[4900, 5800, 6700, 7600, 9100, 10050, 11000, 11950].map(at => ({ at, sound: 'step' as const })),
  ...openingBeats.knocks.map(at => ({ at, sound: 'knock' as const })),
  { at: openingBeats.door, sound: 'door' }, { at: openingBeats.window, sound: 'window' },
  ...openingBeats.thunder.map(at => ({ at, sound: 'thunder' as const })),
  { at: openingBeats.water, sound: 'water' },
]

export function openingFrame(elapsed: number) {
  const time = Math.min(openingDuration, Math.max(0, Number.isFinite(elapsed) ? elapsed : 0))
  const shot = openingShots.find(item => time < item.end) ?? openingShots.at(-1)!
  return { shot: shot.id, progress: (time - shot.start) / (shot.end - shot.start), time, finished: time === openingDuration }
}

export function crossedOpeningCues(previous: number, current: number) {
  return openingCues.filter(cue => cue.at > previous && cue.at <= current)
}

export function openingCueDuration(cue: OpeningCue) {
  return cue === 'page' ? openingBookTurnDuration : cue === 'thunder' ? 3400 : cue === 'door' ? 1800 : cue === 'window' ? 2800 : 400
}

export function continuingOpeningCues(elapsed: number) {
  return openingCues.filter(cue => cue.at <= elapsed && elapsed < cue.at + openingCueDuration(cue.sound))
    .map(cue => ({ ...cue, offset: elapsed - cue.at }))
}

export function openingWeather(elapsed: number) {
  const { shot, progress, time } = openingFrame(elapsed)
  const levels = {
    eaves: [.22, .8], arrival: [.35, 1.3], gallery: [.12, .45], door: [.025, .17],
    threshold: [.06, .2], hand: [.03, .12], discovery: [.04, .12], reaction: [.015, .1],
    storm: [1, 1.8], pages: [.8, 1.35], blank: [.5, .9], poem: [.25, .6], dissolve: [.12, .35],
  }[shot]
  if (shot === 'storm') {
    const opening = Math.min(1, Math.max(0, (time - openingBeats.window) / 650))
    const gust = opening * opening * (3 - 2 * opening)
    return { wind: .015 + .985 * gust, rain: .1 + 1.7 * gust }
  }
  const fade = shot === 'dissolve' ? 1 - progress : Math.min(1, time / 950)
  return { wind: levels[0] * fade, rain: levels[1] * fade }
}
