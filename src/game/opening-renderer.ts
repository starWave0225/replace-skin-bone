import { assetUrl } from './asset-url'
import { openingFrame } from './opening'

export const openingImages = {
  exterior: assetUrl('/assets/opening/inn-exterior-v1.webp'),
  door: assetUrl('/assets/opening/guestroom-door-v1.webp'),
  room: assetUrl('/assets/opening/guestroom-closed-v1.webp'),
  storm: assetUrl('/assets/opening/guestroom-body-v1.webp'),
  book: assetUrl('/assets/opening/blank-book-v1.webp'),
  printed: assetUrl('/assets/opening/printed-book-v1.webp'),
  face: assetUrl('/assets/opening/rain-ink-face-v1.webp'),
  hand: assetUrl('/assets/opening/knocking-hand-v1.webp'),
}
type Images = Record<keyof typeof openingImages, HTMLImageElement>
let pending: Promise<Images> | undefined
let activeRenderers = 0
function preload() {
  return pending ??= Promise.all(Object.entries(openingImages).map(async ([id, src]) => {
    const image = new Image(); image.decoding = 'async'
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve(); image.onerror = () => reject(new Error(`Opening image unavailable: ${id}`)); image.src = src
    })
    await image.decode()
    return [id, image] as const
  })).then(entries => Object.fromEntries(entries) as Images).catch(error => { pending = undefined; throw error })
}

const clamp = (value: number) => Math.min(1, Math.max(0, value))
const ease = (value: number) => { const x = clamp(value); return x * x * (3 - 2 * x) }
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const noise = (value: number) => { const n = Math.sin(value * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n) }
type Point = [number, number]

// Two clipped affine triangles let an actual painted page turn in perspective.
function quad(ctx: CanvasRenderingContext2D, image: HTMLImageElement, source: [number, number, number, number], points: Point[]) {
  const [sx, sy, sw, sh] = source
  const corners: Point[] = [[sx, sy], [sx + sw, sy], [sx + sw, sy + sh], [sx, sy + sh]]
  for (const indices of [[0, 1, 2], [0, 2, 3]]) {
    const [a, b, c] = indices.map(i => corners[i]), [d, e, f] = indices.map(i => points[i])
    const det = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])
    const xx = ((e[0] - d[0]) * (c[1] - a[1]) - (f[0] - d[0]) * (b[1] - a[1])) / det
    const xy = ((e[1] - d[1]) * (c[1] - a[1]) - (f[1] - d[1]) * (b[1] - a[1])) / det
    const yx = ((f[0] - d[0]) * (b[0] - a[0]) - (e[0] - d[0]) * (c[0] - a[0])) / det
    const yy = ((f[1] - d[1]) * (b[0] - a[0]) - (e[1] - d[1]) * (c[0] - a[0])) / det
    ctx.save(); ctx.beginPath(); ctx.moveTo(...d); ctx.lineTo(...e); ctx.lineTo(...f); ctx.closePath(); ctx.clip()
    ctx.transform(xx, xy, yx, yy, d[0] - xx * a[0] - yx * a[1], d[1] - xy * a[0] - yy * a[1])
    ctx.drawImage(image, 0, 0); ctx.restore()
  }
}

export class OpeningRenderer {
  private context: CanvasRenderingContext2D
  private width = 0
  private height = 0
  private disposed = false
  private ink = document.createElement('canvas')
  private mask = document.createElement('canvas')
  private constructor(private canvas: HTMLCanvasElement, private images: Images) {
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('Canvas unavailable')
    this.context = context
    activeRenderers++
    this.ink.width = this.mask.width = 512; this.ink.height = this.mask.height = 768
  }
  static async create(canvas: HTMLCanvasElement) { return new OpeningRenderer(canvas, await preload()) }
  resize(width: number, height: number) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    this.width = Math.max(1, Math.round(width)); this.height = Math.max(1, Math.round(height))
    this.canvas.width = Math.round(this.width * ratio); this.canvas.height = Math.round(this.height * ratio)
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0)
    this.context.imageSmoothingEnabled = true; this.context.imageSmoothingQuality = 'high'
  }
  private background(image: HTMLImageElement, zoom = 1, x = .5, y = .5, opacity = 1) {
    const ctx = this.context, w = this.width, h = this.height
    ctx.save(); ctx.globalAlpha *= opacity
    ctx.drawImage(image, -w * (zoom - 1) * x, -h * (zoom - 1) * y, w * zoom, h * zoom)
    ctx.restore()
  }
  private rain(time: number, amount: number, interior = false) {
    const ctx = this.context, w = this.width, h = this.height
    ctx.save(); ctx.strokeStyle = interior ? '#a8bfd16b' : '#b7c8cd66'; ctx.lineWidth = Math.max(.5, w / 1800)
    ctx.beginPath()
    for (let i = 0; i < amount; i++) {
      const travel = (time / (interior ? 620 : 900) + noise(i)) % 1
      const x = interior ? w * (.91 - travel * .58 + noise(i + 5) * .08) : ((noise(i + 4) - travel * .11 + 1) % 1) * w
      const y = interior ? h * (.14 + travel * .8 + noise(i + 8) * .14) : travel * h
      ctx.moveTo(x, y); ctx.lineTo(x - w * (interior ? .016 : .006), y + h * .024)
    }
    ctx.stroke(); ctx.restore()
  }
  private room(time: number, storm: boolean, zoom = 1, x = .5, y = .5) {
    const open = storm ? ease((time - 16100) / 550) : 0
    this.background(this.images.room, zoom, x, y)
    if (!storm || open <= 0) return
    this.background(this.images.storm, zoom, x, y, open)
    if (open < 1) {
      const ctx = this.context, w = this.width, h = this.height, image = this.images.room
      const wx = w * .64, wy = h * .105, ww = w * .292, wh = h * .39
      const factor = Math.max(.015, Math.cos(open * Math.PI * .56)), drift = Math.sin(open * Math.PI / 2) * w * .023
      ctx.save(); ctx.globalAlpha = 1 - ease((open - .7) / .3)
      ctx.drawImage(image, image.width * .64, image.height * .105, image.width * .146, image.height * .39, wx - drift, wy, ww / 2 * factor, wh)
      ctx.drawImage(image, image.width * .786, image.height * .105, image.width * .146, image.height * .39, wx + ww - ww / 2 * factor + drift, wy, ww / 2 * factor, wh)
      ctx.restore()
    }
    this.rain(time, 100, true)
    const ctx = this.context, w = this.width, h = this.height
    for (let i = 0; i < 5; i++) {
      const flight = ((time - 16100) / 1600 + i * .19) % 1
      if (flight < 0) continue
      const px = w * (.81 - flight * .55), py = h * (.72 - Math.sin(flight * Math.PI) * (.22 + noise(i) * .2))
      ctx.save(); ctx.translate(px, py); ctx.rotate(-flight * 2 + i)
      ctx.globalAlpha = Math.sin(flight * Math.PI) * .65
      ctx.drawImage(this.images.book, 920, 220, 180, 200, -w * .015, -h * .02, w * .03, h * .04)
      ctx.restore()
    }
  }
  private door(time: number, p: number, reduced: boolean) {
    this.room(time, false)
    const ctx = this.context, w = this.width, h = this.height, image = this.images.door
    const open = ease((p - .69) / .31), factor = Math.max(0, Math.cos(open * Math.PI / 2))
    const movement = reduced ? 0 : [6050, 6750, 7450].reduce((a, at) => a + Math.sin(clamp((time - at) / 210) * Math.PI), 0)
    ctx.save(); ctx.translate(0, movement * h * .002)
    ctx.drawImage(image, 0, 0, image.width / 2, image.height, 0, 0, w / 2 * factor, h)
    ctx.drawImage(image, image.width / 2, 0, image.width / 2, image.height, w - w / 2 * factor, 0, w / 2 * factor, h)
    ctx.restore()
    const raised = ease((time - 5550) / 550) * (1 - ease((time - 8250) / 650))
    if (raised > 0) {
      const hand = this.images.hand, hw = w * .39
      ctx.save(); ctx.globalAlpha = raised
      ctx.drawImage(hand, w * .41 - movement * w * .006, h * .46 + (1 - raised) * h * .45 - movement * h * .018, hw, hw * hand.height / hand.width)
      ctx.restore()
    }
  }
  private book(time: number, p: number, reduced: boolean) {
    const ctx = this.context, w = this.width, h = this.height
    const blank = ease((p - .84) / .14)
    this.background(this.images.printed)
    this.background(this.images.book, 1, .5, .5, blank)
    if (p < .965 && !reduced) {
      const turn = (p * 24 - p * p * 10) % 1, angle = turn * Math.PI
      const top: Point = [w * .48, h * .125], bottom: Point = [w * .48, h * .944]
      const tip = Math.cos(angle) * w * .43, lift = Math.sin(angle) * h * .15
      const points: Point[] = [top, [top[0] + tip * .83, h * .16 - lift], [bottom[0] + tip, h * .94 - lift * .6], bottom]
      ctx.save()
      ctx.shadowColor = '#1b160a99'; ctx.shadowBlur = w * .014
      const image = p > .88 ? this.images.book : this.images.printed
      quad(ctx, image, [image.width * .5, image.height * .14, image.width * .38, image.height * .78], points)
      ctx.restore()
    }
    this.rain(time, 22, true)
  }
  private portrait(progress: number, reduced: boolean) {
    const appear = ease((progress - .12) / .42), vanish = ease((progress - .73) / .27)
    if (!appear || vanish >= 1) return
    const ink = this.ink.getContext('2d')!, mask = this.mask.getContext('2d')!
    ink.clearRect(0, 0, 512, 768); mask.clearRect(0, 0, 512, 768)
    ink.drawImage(this.images.face, 0, 0, 512, 768)
    for (let i = 0; i < 9; i++) {
      const x = 256 + (noise(i + 8) - .5) * 310, y = 365 + (noise(i + 15) - .5) * 400
      const radius = Math.max(1, appear * (370 + noise(i) * 100) - i * 13)
      const bloom = mask.createRadialGradient(x, y, radius * .25, x, y, radius)
      bloom.addColorStop(0, '#fff'); bloom.addColorStop(.65, '#fffffff0'); bloom.addColorStop(1, '#fff0')
      mask.fillStyle = bloom; mask.fillRect(x - radius, y - radius, radius * 2, radius * 2)
    }
    ink.globalCompositeOperation = 'destination-in'; ink.drawImage(this.mask, 0, 0); ink.globalCompositeOperation = 'source-over'
    const ctx = this.context, w = this.width, h = this.height
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = (1 - vanish) * .92
    if (!reduced) ctx.filter = `blur(${vanish * 5}px)`
    ctx.drawImage(this.ink, w * (.595 - vanish * .014), h * (.2 + vanish * .025), w * (.27 + vanish * .025), h * .68)
    ctx.restore()
  }
  private water(time: number, p: number, opacity = 1) {
    const ctx = this.context, w = this.width, h = this.height
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = opacity
    for (let i = 0; i < 8; i++) {
      const age = clamp((p - i * .035) * 2.6), x = w * (.6 + noise(i + 7) * .27), y = h * (.22 + noise(i + 9) * .58)
      if (!age) continue
      const radius = w * .035 * age, water = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, radius))
      water.addColorStop(0, '#656b5c0b'); water.addColorStop(.8, '#656b5c13'); water.addColorStop(1, '#656b5c00')
      ctx.fillStyle = water; ctx.beginPath(); ctx.ellipse(x, y, radius, radius * .8, -.3, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
    if (p < .8) this.rain(time, 13, true)
  }
  draw(elapsed: number, reducedMotion = false) {
    if (this.disposed || !this.width || !this.height) return
    const frame = openingFrame(elapsed), { time, progress: p, shot } = frame
    const ctx = this.context, w = this.width, h = this.height
    ctx.fillStyle = '#080d0c'; ctx.fillRect(0, 0, w, h)
    ctx.save()
    const shake = !reducedMotion && shot === 'storm' ? Math.sin(time / 35) * Math.max(0, 1 - (time - 16100) / 1500) * w * .0015 : 0
    ctx.translate(shake, shake * .3)
    if (shot === 'arrival') {
      this.background(this.images.exterior, reducedMotion ? 1 : mix(1, 1.13, ease(p)), .64, .57)
      if (!reducedMotion) this.rain(time, 130)
    } else if (shot === 'door') this.door(time, p, reducedMotion)
    else if (shot === 'discovery') this.room(time, false, reducedMotion ? 1 : mix(1, 1.08, ease(p)), .4, .75)
    else if (shot === 'storm') this.room(time, true)
    else if (shot === 'pages') this.book(time, p, reducedMotion)
    else {
      this.background(this.images.book)
      if (shot === 'face') { this.water(time, p); this.portrait(p, reducedMotion) }
      else this.water(time, 1, 1 - ease(p))
    }
    ctx.restore()
    const flash = reducedMotion ? 0 : Math.max(0, 1 - Math.abs(time - 16550) / 180, 1 - Math.abs(time - 18550) / 160)
    if (flash > 0) { ctx.fillStyle = `rgba(185,211,233,${flash * .35})`; ctx.fillRect(0, 0, w, h) }
    const vignette = ctx.createRadialGradient(w * .5, h * .5, h * .15, w * .5, h * .5, w * .65)
    vignette.addColorStop(0, '#0000'); vignette.addColorStop(1, '#0008')
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, w, h)
    const fade = 1 - ease(time / 650) * (1 - ease((time - 31400) / 2200))
    if (fade > 0) { ctx.fillStyle = `rgba(8,13,12,${fade})`; ctx.fillRect(0, 0, w, h) }
  }
  dispose() {
    if (this.disposed) return
    this.disposed = true; this.ink.width = this.mask.width = 0
    this.images = {} as Images
    if (--activeRenderers === 0) pending = undefined
  }
}
