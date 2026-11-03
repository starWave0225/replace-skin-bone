import { assetUrl } from './asset-url'
import { openingBeats, openingDuration, openingFrame, openingShots } from './opening'
import { openingCamera } from './opening-camera'
import { createOpeningBook, openingBookPages, openingPoemVisibility, type OpeningBookState } from './opening-book'
import { openingPoem } from './opening-poem'

export const openingImages = {
  eaves: assetUrl('/assets/opening/eaves-rain-v1.webp'),
  exterior: assetUrl('/assets/opening/inn-exterior-v1.webp'),
  door: assetUrl('/assets/opening/guestroom-door-v1.webp'),
  room: assetUrl('/assets/opening/guestroom-closed-v1.webp'),
  storm: assetUrl('/assets/opening/guestroom-body-v1.webp'),
  book: assetUrl('/assets/opening/blank-book-v1.webp'),
  hand: assetUrl('/assets/opening/knocking-hand-v1.webp'),
  gallery: assetUrl('/assets/opening/gallery-track-v1.webp'),
  ground: assetUrl('/assets/opening/dead-hand-v1.webp'),
  reaction: assetUrl('/assets/opening/lu-reaction-v2.webp'),
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
const noise = (value: number) => { const n = Math.sin(value * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n) }
type Point = [number, number]
type PaintedImage = HTMLImageElement | HTMLCanvasElement
export interface OpeningRenderState { book?: Readonly<OpeningBookState>; ambienceTime?: number }

// Two clipped affine triangles let an actual painted page turn in perspective.
function quad(ctx: CanvasRenderingContext2D, image: PaintedImage, source: [number, number, number, number], points: Point[]) {
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
  private grain = document.createElement('canvas')
  private bookSurfaces: HTMLCanvasElement[] = []
  private constructor(private canvas: HTMLCanvasElement, private images: Images) {
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('Canvas unavailable')
    this.context = context
    activeRenderers++
    this.ink.width = this.mask.width = 512; this.ink.height = this.mask.height = 768
    this.grain.width = this.grain.height = 128
    const grain = this.grain.getContext('2d')!, pixels = grain.createImageData(128, 128)
    for (let i = 0; i < pixels.data.length; i += 4) {
      const shade = Math.round(noise(i) * 255)
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = shade; pixels.data[i + 3] = 255
    }
    grain.putImageData(pixels, 0, 0)
  }
  static async create(canvas: HTMLCanvasElement) {
    const [images] = await Promise.all([preload(), document.fonts.ready])
    return new OpeningRenderer(canvas, images)
  }
  resize(width: number, height: number) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    this.width = Math.max(1, Math.round(width)); this.height = Math.max(1, Math.round(height))
    this.canvas.width = Math.round(this.width * ratio); this.canvas.height = Math.round(this.height * ratio)
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0)
    this.context.imageSmoothingEnabled = true; this.context.imageSmoothingQuality = 'high'
  }
  private background(image: PaintedImage, opacity = 1) {
    const ctx = this.context, w = this.width, h = this.height
    ctx.save(); ctx.globalAlpha *= opacity
    ctx.drawImage(image, 0, 0, w, h)
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
  private room(time: number, storm: boolean, reduced: boolean) {
    const open = storm ? ease((time - openingBeats.window) / 550) : 0
    this.background(this.images.room)
    if (!storm || open <= 0) return
    this.background(this.images.storm, open)
    if (open < 1) {
      const ctx = this.context, w = this.width, h = this.height, image = this.images.room
      const wx = w * .64, wy = h * .105, ww = w * .292, wh = h * .39
      const factor = Math.max(.015, Math.cos(open * Math.PI * .56)), drift = Math.sin(open * Math.PI / 2) * w * .023
      ctx.save(); ctx.globalAlpha = 1 - ease((open - .7) / .3)
      ctx.drawImage(image, image.width * .64, image.height * .105, image.width * .146, image.height * .39, wx - drift, wy, ww / 2 * factor, wh)
      ctx.drawImage(image, image.width * .786, image.height * .105, image.width * .146, image.height * .39, wx + ww - ww / 2 * factor + drift, wy, ww / 2 * factor, wh)
      ctx.restore()
    }
    if (!reduced) this.rain(time, Math.round(open * 100), true)
  }
  private door(time: number, open: number, reduced: boolean) {
    this.background(this.images.room)
    const ctx = this.context, w = this.width, h = this.height, image = this.images.door
    const factor = Math.max(.002, Math.cos(open * Math.PI / 2)), depth = Math.sin(open * Math.PI / 2) * h * .09
    const movement = reduced ? 0 : openingBeats.knocks.reduce((a, at) => a + Math.sin(clamp((time - at) / 210) * Math.PI), 0)
    ctx.save(); ctx.translate(0, movement * h * .002)
    ctx.globalAlpha = 1 - ease((open - .9) / .1)
    quad(ctx, image, [0, 0, image.width / 2, image.height], [[0, 0], [w / 2 * factor, depth], [w / 2 * factor, h - depth], [0, h]])
    quad(ctx, image, [image.width / 2, 0, image.width / 2, image.height], [[w - w / 2 * factor, depth], [w, 0], [w, h], [w - w / 2 * factor, h - depth]])
    ctx.restore()
    const raised = ease((time - openingBeats.handRise) / 450) * (1 - ease((time - openingBeats.handWithdraw) / 650))
    if (raised > 0) {
      const hand = this.images.hand, hw = w * .39
      ctx.save(); ctx.globalAlpha = raised
      ctx.drawImage(hand, w * .41 - movement * w * .006, h * .46 + (1 - raised) * h * .45 - movement * h * .018, hw, hw * hand.height / hand.width)
      ctx.restore()
    }
  }
  private bookSurface(index: number) {
    if (this.bookSurfaces[index]) return this.bookSurfaces[index]
    const page = openingBookPages[index], paper = this.images.book
    const surface = document.createElement('canvas'); surface.width = paper.width; surface.height = paper.height
    const ctx = surface.getContext('2d')!, w = surface.width, h = surface.height
    ctx.drawImage(paper, 0, 0)
    const leaf = (title: string, lines: readonly string[]) => {
      const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 768
      const ink = canvas.getContext('2d')!
      ink.textAlign = 'center'; ink.textBaseline = 'top'; ink.fillStyle = '#32251de8'
      const stride = Math.min(43, 470 / Math.max(1, ...lines.map(line => Array.from(line).length)))
      const column = (text: string, x: number, size: number, spacing = 43) => {
        ink.font = `${size}px NotoSerif, "Songti SC", SimSun, serif`
        Array.from(text).forEach((character, i) => ink.fillText(character, x * 512, 92 + i * spacing))
      }
      column(title, .89, 42)
      lines.forEach((line, i) => column(line, .67 - i * .17, Math.min(38, stride * .9), stride))
      return canvas
    }
    if (page.kind === 'text') {
      ctx.globalCompositeOperation = 'multiply'
      const left = leaf(page.verso[0] ?? '', page.verso.slice(1)), right = leaf(page.title, page.lines)
      quad(ctx, left, [0, 0, 512, 768], [[w * .162, h * .165], [w * .462, h * .172], [w * .462, h * .883], [w * .111, h * .88]])
      quad(ctx, right, [0, 0, 512, 768], [[w * .506, h * .173], [w * .842, h * .184], [w * .913, h * .89], [w * .506, h * .887]])
      left.width = right.width = 0
    }
    this.bookSurfaces[index] = surface
    return surface
  }
  private book(time: number, reduced: boolean, book: Readonly<OpeningBookState>) {
    const ctx = this.context, w = this.width, h = this.height
    const turning = book.turnElapsed !== null, turn = ease((book.turnElapsed ?? 0) / book.turnDuration)
    const current = this.bookSurface(book.page), next = this.bookSurface(Math.min(openingBookPages.length - 1, book.page + 1))
    this.background(turning ? next : current)
    if (turning && reduced) this.background(current, 1 - turn)
    if (turning && !reduced) {
      const angle = turn * Math.PI, lift = Math.sin(angle)
      const edge = (u: number, bottom: boolean): Point => {
        const curl = lift * (u * .7 + Math.sin(u * Math.PI) * .55)
        return [w * (.48 + Math.cos(angle) * u * (bottom ? .43 : .37) + lift * Math.sin(u * Math.PI) * .035), h * ((bottom ? .944 - .004 * u : .125 + .035 * u) - curl * (bottom ? .065 : .12))]
      }
      ctx.save()
      const outline = [edge(0, false), edge(1, false), edge(1, true), edge(0, true)]
      ctx.beginPath(); ctx.moveTo(...outline[0]); outline.slice(1).forEach(point => ctx.lineTo(...point)); ctx.closePath()
      ctx.shadowColor = '#211a10aa'; ctx.shadowBlur = w * .012; ctx.shadowOffsetX = lift * w * .015; ctx.shadowOffsetY = lift * h * .025
      ctx.fillStyle = '#aa9878'; ctx.fill(); ctx.shadowColor = 'transparent'
      const image = current
      // Narrow strips bend the leaf across its width instead of moving a rigid rectangle.
      for (let i = 0; i < 14; i++) {
        const u = i / 14, next = (i + 1) / 14
        const points = [edge(u, false), edge(next, false), edge(next, true), edge(u, true)]
        quad(ctx, image, [image.width * (.5 + .38 * u), image.height * .14, image.width * .38 / 14, image.height * .78], points)
        ctx.beginPath(); ctx.moveTo(...points[0]); points.slice(1).forEach(point => ctx.lineTo(...point)); ctx.closePath()
        ctx.fillStyle = `rgba(57,42,22,${lift * (.06 + .18 * (1 - u))})`; ctx.fill()
      }
      ctx.restore()
    }
    if (!reduced) this.rain(time, 22, true)
  }
  private poem(progress: number, reduced: boolean, opacity = 1) {
    const appear = ease((progress - .12) / .42), vanish = ease((progress - .73) / .27)
    if (!appear || vanish >= 1) return
    const ink = this.ink.getContext('2d')!, mask = this.mask.getContext('2d')!
    ink.clearRect(0, 0, 512, 768); mask.clearRect(0, 0, 512, 768)
    ink.fillStyle = '#30271e'; ink.textAlign = 'center'; ink.textBaseline = 'top'
    ink.font = '30px NotoSerif, "Songti SC", SimSun, serif'
    Array.from(openingPoem.title).forEach((character, i) => ink.fillText(character, 455, 100 + i * 38))
    ink.font = '44px NotoSerif, "Songti SC", SimSun, serif'
    openingPoem.lines.forEach((line, column) => {
      Array.from(line).forEach((character, row) => ink.fillText(character, 360 - column * 85, 170 + row * 62))
    })
    for (let i = 0; i < 9; i++) {
      const x = 256 + (noise(i + 8) - .5) * 310, y = 365 + (noise(i + 15) - .5) * 400
      const radius = Math.max(1, appear * (370 + noise(i) * 100) - i * 13)
      const bloom = mask.createRadialGradient(x, y, radius * .25, x, y, radius)
      bloom.addColorStop(0, '#fff'); bloom.addColorStop(.65, '#fffffff0'); bloom.addColorStop(1, '#fff0')
      mask.fillStyle = bloom; mask.fillRect(x - radius, y - radius, radius * 2, radius * 2)
    }
    ink.globalCompositeOperation = 'destination-in'; ink.drawImage(this.mask, 0, 0); ink.globalCompositeOperation = 'source-over'
    if (vanish > 0) {
      // Water eats through the ink in irregular blooms before the last trace fades.
      ink.globalCompositeOperation = 'destination-out'
      for (let i = 0; i < 12; i++) {
        const radius = Math.max(1, vanish * 410 - i * 12), x = 80 + noise(i + 41) * 360, y = 90 + noise(i + 57) * 620
        const wash = ink.createRadialGradient(x, y, 0, x, y, radius)
        wash.addColorStop(0, '#fffffff0'); wash.addColorStop(.45, '#ffffff99'); wash.addColorStop(1, '#fff0')
        ink.fillStyle = wash; ink.fillRect(x - radius, y - radius, radius * 2, radius * 2)
      }
      ink.globalCompositeOperation = 'source-over'
    }
    const ctx = this.context, w = this.width, h = this.height
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = (1 - vanish) * .92 * opacity
    if (!reduced) ctx.filter = `blur(${vanish * 5}px)`
    quad(ctx, this.ink, [0, 0, 512, 768], [[w * .506, h * .173], [w * .842, h * .184], [w * .913, h * .89], [w * .506, h * .887]])
    ctx.restore()
  }
  private bookLighting(brightness: number) {
    const ctx = this.context
    ctx.save(); ctx.fillStyle = `rgba(4,9,12,${(1 - brightness) * .36})`; ctx.fillRect(0, 0, this.width, this.height); ctx.restore()
  }
  private water(time: number, p: number, reduced: boolean, opacity = 1) {
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
    if (p < .8 && !reduced) this.rain(time, 13, true)
  }
  private filmTexture(time: number, reduced: boolean) {
    const ctx = this.context, w = this.width, h = this.height
    const pattern = ctx.createPattern(this.grain, 'repeat')
    if (!pattern) return
    const offset = reduced ? 0 : Math.floor(time / 90) * 13 % 128
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = .11
    ctx.translate(-offset, -offset / 2); ctx.fillStyle = pattern; ctx.fillRect(0, 0, w + 128, h + 128)
    ctx.restore()
  }
  draw(elapsed: number, reducedMotion = false, state: OpeningRenderState = {}) {
    if (this.disposed || !this.width || !this.height) return
    const frame = openingFrame(elapsed), { time, progress: p, shot } = frame
    const ctx = this.context, w = this.width, h = this.height
    ctx.fillStyle = '#080d0c'; ctx.fillRect(0, 0, w, h)
    ctx.save()
    const poemPage = state.book && !state.book.complete && openingBookPages[state.book.page].kind === 'poem'
    const camera = openingCamera(poemPage ? openingShots.find(shot => shot.id === 'pages')!.start : time, reducedMotion)
    const shake = !reducedMotion && shot === 'storm' ? Math.sin(time / 45) * Math.max(0, 1 - Math.abs(time - openingBeats.window) / 650) * w * .001 : 0
    ctx.translate(w / 2 + shake, h / 2)
    ctx.rotate(camera.roll * Math.PI / 180); ctx.scale(camera.zoom, camera.zoom); ctx.translate(-w * camera.x, -h * camera.y)
    if (camera.blur) ctx.filter = `blur(${camera.blur}px)`
    if (poemPage && state.book) {
      this.background(this.images.book)
      this.poem(.65, reducedMotion, openingPoemVisibility(state.book.brightness))
      this.bookLighting(state.book.brightness)
    } else if (shot === 'eaves' || shot === 'arrival') {
      this.background(shot === 'eaves' ? this.images.eaves : this.images.exterior)
      if (!reducedMotion) this.rain(time, shot === 'eaves' ? 60 : 130)
    } else if (shot === 'gallery') {
      this.background(this.images.gallery)
      if (!reducedMotion) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w * .37, h); ctx.clip(); this.rain(time, 100); ctx.restore()
      }
    }
    else if (shot === 'door') this.door(time, 0, reducedMotion)
    else if (shot === 'threshold') this.door(time, ease((p - .13) / .82), reducedMotion)
    else if (shot === 'hand') this.background(this.images.ground)
    else if (shot === 'discovery') this.room(time, false, reducedMotion)
    else if (shot === 'reaction') this.background(this.images.reaction)
    else if (shot === 'storm') this.room(time, true, reducedMotion)
    else if (shot === 'pages') this.book(state.ambienceTime ?? time, reducedMotion, state.book ?? createOpeningBook())
    else {
      this.background(this.images.book)
      if (shot === 'poem') { this.water(time, p, reducedMotion); this.poem(p, reducedMotion) }
      else if (shot === 'blank') this.water(time, p * .27, reducedMotion)
      else {
        if (state.book?.complete) {
          this.poem(.73 + p * .27, reducedMotion, openingPoemVisibility(state.book.brightness))
          this.bookLighting(state.book.brightness)
        }
        this.water(time, 1, reducedMotion, 1 - ease(p))
      }
    }
    ctx.restore()
    const flash = reducedMotion ? 0 : Math.max(0, ...openingBeats.thunder.map(at => 1 - Math.abs(time - at) / 180))
    if (flash > 0) { ctx.fillStyle = `rgba(185,211,233,${flash * .35})`; ctx.fillRect(0, 0, w, h) }
    const vignette = ctx.createRadialGradient(w * .5, h * .5, h * .15, w * .5, h * .5, w * .65)
    vignette.addColorStop(0, '#0000'); vignette.addColorStop(1, '#0008')
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, w, h)
    this.filmTexture(state.ambienceTime ?? time, reducedMotion)
    ctx.fillStyle = '#080d0c'; ctx.fillRect(0, 0, w, h * .028); ctx.fillRect(0, h * .972, w, h * .028)
    const fade = 1 - ease(time / 950) * (1 - ease((time - (openingDuration - 1800)) / 1800))
    if (fade > 0) { ctx.fillStyle = `rgba(8,13,12,${fade})`; ctx.fillRect(0, 0, w, h) }
  }
  dispose() {
    if (this.disposed) return
    this.disposed = true; this.ink.width = this.mask.width = this.grain.width = 0
    this.bookSurfaces.forEach(surface => { surface.width = 0 }); this.bookSurfaces = []
    this.images = {} as Images
    if (--activeRenderers === 0) pending = undefined
  }
}
