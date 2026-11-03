import type { Face, WorldState } from './types'
import { drawWorldActor } from './world-art'
import type { WorldArt } from './world-art'

export type PlayerAppearance = Face | 'nameless' | 'self'
export const DISGUISE_DURATION = 720
export const appearanceNames: Record<PlayerAppearance, string> = {
  shen: '沈砚之面', guard: '周平之面', nameless: '无相之身', self: '陆知微 · 本来面目',
}
export interface DisguiseFrame { from: PlayerAppearance; to: PlayerAppearance; progress: number }
type Ctx = CanvasRenderingContext2D

// Public CC0 four-direction sheets share the existing feet anchor and collision footprint.
export function drawPlayerSprite(c: Ctx, x: number, y: number, appearance: PlayerAppearance, facing: WorldState['facing'], frame = 0, art?: WorldArt) {
  drawWorldActor(c, art, appearance, x, y, facing, frame)
}

export function drawDisguisedPlayer(c: Ctx, x: number, y: number, appearance: PlayerAppearance, facing: WorldState['facing'], frame: number, disguise?: DisguiseFrame, art?: WorldArt) {
  if (!disguise || disguise.progress >= 1) { drawPlayerSprite(c, x, y, appearance, facing, frame, art); return }
  const progress = Math.max(0, disguise.progress), seam = Math.round(y - 52 + progress * 59)
  c.save(); c.beginPath(); c.rect(x - 26, y - 55, 52, seam - (y - 55)); c.clip()
  drawPlayerSprite(c, x, y, disguise.to, facing, frame, art); c.restore()
  c.save(); c.beginPath(); c.rect(x - 26, seam, 52, y + 8 - seam); c.clip()
  drawPlayerSprite(c, x, y, disguise.from, facing, frame, art); c.restore()
  if (progress > .04 && progress < .96) {
    c.fillStyle = '#d8cba2'; c.fillRect(Math.round(x - 18), seam, 36, 2)
    for (let i = 0; i < 5; i++) {
      c.fillStyle = i % 2 ? '#d8cba2' : '#a9b7a0'
      c.fillRect(Math.round(x + (i % 2 ? 1 : -1) * (18 + Math.sin(progress * Math.PI) * i * 3)), seam - i * 4, 2, 3)
    }
  }
}
