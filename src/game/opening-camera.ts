import { openingFrame, type OpeningShot } from './opening'

export interface OpeningCamera { zoom: number; x: number; y: number; roll: number; blur: number }
type Mark = { at: number } & OpeningCamera
const mark = (at: number, zoom: number, x: number, y: number, roll = 0, blur = 0): Mark => ({ at, zoom, x, y, roll, blur })
const tracks: Record<OpeningShot, readonly Mark[]> = {
  eaves: [mark(0, 1.1, .48, .5), mark(1, 1.24, .56, .48)],
  arrival: [mark(0, 1.08, .5, .53), mark(1, 1.34, .6, .52)],
  gallery: [mark(0, 1.12, .48, .51, -.35), mark(1, 1.46, .64, .54, 0)],
  door: [mark(0, 1.08, .49, .53), mark(.45, 1.22, .47, .58), mark(.68, 1.22, .47, .58), mark(1, 1.27, .48, .57)],
  threshold: [mark(0, 1.27, .48, .57), mark(.35, 1.27, .48, .57, -.6), mark(1, 1.5, .52, .65, -.6)],
  hand: [mark(0, 1.24, .63, .65, -.6), mark(1, 1.44, .56, .53, 0)],
  discovery: [mark(0, 1.75, .45, .7), mark(.8, 1.14, .5, .55), mark(1, 1.14, .5, .55)],
  reaction: [mark(0, 1.15, .47, .47), mark(.62, 1.48, .48, .41), mark(1, 1.48, .48, .41)],
  storm: [mark(0, 1.25, .48, .52), mark(.12, 1.25, .48, .52), mark(.2, 1.55, .64, .4, .5, 3), mark(.3, 1.8, .7, .32), mark(.58, 1.8, .7, .32), mark(1, 2.2, .76, .73)],
  pages: [mark(0, 1.65, .7, .5), mark(1, 1.65, .7, .5)],
  blank: [mark(0, 1.65, .7, .5), mark(.55, 1.94, .72, .5), mark(1, 1.94, .72, .5)],
  poem: [mark(0, 1.65, .7, .5), mark(1, 1.65, .7, .5)],
  dissolve: [mark(0, 1.65, .7, .5), mark(.8, 1.45, .65, .52), mark(1, 1.45, .65, .52)],
}
const smooth = (t: number) => t * t * (3 - 2 * t)

export function openingCamera(elapsed: number, reducedMotion = false): OpeningCamera {
  const frame = openingFrame(elapsed), marks = tracks[frame.shot]
  const progress = reducedMotion ? .5 : frame.progress
  const right = marks.findIndex(item => item.at >= progress)
  const a = marks[Math.max(0, (right < 0 ? marks.length - 1 : right) - 1)], b = marks[right < 0 ? marks.length - 1 : right]
  const t = a === b ? 0 : smooth((progress - a.at) / (b.at - a.at))
  const interpolate = (key: keyof OpeningCamera) => a[key] + (b[key] - a[key]) * t
  const camera: OpeningCamera = { zoom: interpolate('zoom'), x: interpolate('x'), y: interpolate('y'), roll: interpolate('roll'), blur: interpolate('blur') }
  if (reducedMotion) { camera.roll = 0; camera.blur = 0 }
  // Leave enough image outside the aperture even when the horizon is slightly canted.
  const angle = Math.abs(camera.roll) * Math.PI / 180, cosine = Math.cos(angle), sine = Math.sin(angle)
  const marginX = .5 / camera.zoom * (cosine + sine / (16 / 9)), marginY = .5 / camera.zoom * (cosine + sine * (16 / 9))
  camera.x = Math.max(marginX, Math.min(1 - marginX, camera.x))
  camera.y = Math.max(marginY, Math.min(1 - marginY, camera.y))
  return camera
}
