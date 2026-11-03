export const openingShots = [
  { id: 'arrival', start: 0, end: 5200 },
  { id: 'door', start: 5200, end: 11400 },
  { id: 'discovery', start: 11400, end: 15600 },
  { id: 'storm', start: 15600, end: 19600 },
  { id: 'pages', start: 19600, end: 24600 },
  { id: 'face', start: 24600, end: 30600 },
  { id: 'dissolve', start: 30600, end: 33600 },
] as const

export type OpeningShot = typeof openingShots[number]['id']
export type OpeningCue = 'step' | 'knock' | 'door' | 'window' | 'thunder' | 'pages' | 'water'
export const openingDuration = openingShots.at(-1)!.end
export const openingCues: readonly { at: number; sound: OpeningCue }[] = [
  { at: 1100, sound: 'step' }, { at: 2050, sound: 'step' },
  { at: 3000, sound: 'step' }, { at: 3950, sound: 'step' },
  { at: 6050, sound: 'knock' }, { at: 6750, sound: 'knock' }, { at: 7450, sound: 'knock' },
  { at: 9700, sound: 'door' }, { at: 16100, sound: 'window' },
  { at: 16550, sound: 'thunder' }, { at: 18550, sound: 'thunder' },
  { at: 19650, sound: 'pages' }, { at: 25200, sound: 'water' },
]

export function openingFrame(elapsed: number) {
  const time = Math.min(openingDuration, Math.max(0, Number.isFinite(elapsed) ? elapsed : 0))
  const shot = openingShots.find(item => time < item.end) ?? openingShots.at(-1)!
  return { shot: shot.id, progress: (time - shot.start) / (shot.end - shot.start), time, finished: time === openingDuration }
}

export function crossedOpeningCues(previous: number, current: number) {
  return openingCues.filter(cue => cue.at > previous && cue.at <= current)
}
