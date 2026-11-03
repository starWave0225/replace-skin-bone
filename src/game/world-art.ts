import { assetUrl } from './asset-url'
import { pixelFacingColumns, pixelRegions, pixelWalkRow, worldPixelFiles } from './world-pixel-assets'
import type { PixelActor, PixelRegionId, PixelSheet } from './world-pixel-assets'
import type { WorldState } from './types'

export const worldArtFiles = worldPixelFiles
export type WorldMaterial = 'earth' | 'stone' | 'roof' | 'plaster' | 'brick' | 'floor' | 'wood'
export interface WorldArt {
  images: Partial<Record<PixelSheet, HTMLImageElement>>
  surfaces: Partial<Record<WorldMaterial, HTMLCanvasElement>>
  failed: string[]
}
const treatments: Record<WorldMaterial, { region: PixelRegionId; filter: string }> = {
  earth: { region: 'grass', filter: 'saturate(.63) brightness(.86)' },
  stone: { region: 'stone', filter: 'saturate(.2) brightness(1.38)' },
  roof: { region: 'roof', filter: 'saturate(0) brightness(.72)' },
  plaster: { region: 'plaster', filter: 'saturate(.65) brightness(.92)' },
  brick: { region: 'stone', filter: 'saturate(.2) brightness(1.05)' },
  floor: { region: 'floor', filter: 'saturate(.6) brightness(.78)' },
  wood: { region: 'wood', filter: 'saturate(.65) brightness(.8)' },
}
let loading: Promise<WorldArt> | undefined
export function loadWorldArt(): Promise<WorldArt> {
  return loading ??= (async () => {
    const art: WorldArt = { images: {}, surfaces: {}, failed: [] }
    await Promise.all(Object.entries(worldArtFiles).map(async ([name, path]) => {
      const image = new Image(); image.decoding = 'async'
      try {
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve(); image.onerror = () => reject(new Error(path)); image.src = assetUrl(path)
        })
        await image.decode(); art.images[name as PixelSheet] = image
      } catch { art.failed.push(path) }
    }))
    for (const [name, treatment] of Object.entries(treatments)) {
      const region = pixelRegions[treatment.region], image = art.images[region.sheet]
      if (!image) continue
      const surface = document.createElement('canvas'); surface.width = region.w * 2; surface.height = region.h * 2
      const context = surface.getContext('2d')!; context.imageSmoothingEnabled = false; context.filter = treatment.filter
      context.drawImage(image, region.x, region.y, region.w, region.h, 0, 0, surface.width, surface.height)
      art.surfaces[name as WorldMaterial] = surface
    }
    if (art.failed.length) loading = undefined
    return art
  })()
}
const patterns = new WeakMap<CanvasRenderingContext2D, Map<HTMLCanvasElement, CanvasPattern>>()
export function fillWorldTexture(context: CanvasRenderingContext2D, art: WorldArt | undefined, key: WorldMaterial, x: number, y: number, w: number, h: number) {
  const surface = art?.surfaces[key]
  if (!surface) return false
  let cache = patterns.get(context)
  if (!cache) { cache = new Map(); patterns.set(context, cache) }
  let pattern = cache.get(surface)
  if (!pattern) { const created = context.createPattern(surface, 'repeat'); if (!created) return false; pattern = created; cache.set(surface, pattern) }
  context.fillStyle = pattern; context.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); return true
}
export function stampWorldPixel(context: CanvasRenderingContext2D, art: WorldArt | undefined, id: PixelRegionId, x: number, y: number, width?: number, height?: number) {
  const region = pixelRegions[id], image = art?.images[region.sheet]
  if (!image) return
  context.drawImage(image, region.x, region.y, region.w, region.h, Math.round(x), Math.round(y), Math.round(width ?? region.w * 2), Math.round(height ?? region.h * 2))
}
export function drawWorldActor(context: CanvasRenderingContext2D, art: WorldArt | undefined, role: PixelActor, x: number, y: number, facing: WorldState['facing'], gait = 0, scale = 3) {
  const image = art?.images[role]
  if (!image) return
  const size = 16 * scale, shadow = art?.images.shadow
  if (shadow) { context.save(); context.globalAlpha *= .45; context.drawImage(shadow, Math.round(x - 13), Math.round(y - 3), 26, 10); context.restore() }
  context.drawImage(image, pixelFacingColumns[facing] * 16, pixelWalkRow(gait, Math.floor(image.naturalHeight / 16)) * 16, 16, 16, Math.round(x - size / 2), Math.round(y - size + 3), size, size)
}
