import type { Face, WorldState } from './types'

export type PlayerAppearance = Face | 'nameless' | 'self'
export const DISGUISE_DURATION = 720
export const appearanceNames: Record<PlayerAppearance, string> = {
  shen: '沈砚之面', guard: '周平之面', nameless: '无相之身', self: '陆知微 · 本来面目',
}
export interface DisguiseFrame { from: PlayerAppearance; to: PlayerAppearance; progress: number }
type Ctx = CanvasRenderingContext2D

function block(c: Ctx, x: number, y: number, w: number, h: number, color: string) {
  c.fillStyle = color
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
}
function shape(c: Ctx, points: number[], color: string) {
  c.fillStyle = color
  c.beginPath()
  c.moveTo(points[0], points[1])
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1])
  c.closePath()
  c.fill()
}

// Both borrowed faces use the same feet origin and collision footprint.
// Silhouette, features, hair, clothes and belongings change with the identity.
export function drawPlayerSprite(c: Ctx, x: number, y: number, appearance: PlayerAppearance, facing: WorldState['facing'], frame = 0) {
  const guard = appearance === 'guard', nameless = appearance === 'nameless'
  const profile = facing === 'left' || facing === 'right', back = facing === 'up'
  const stride = Math.sin(frame) * 2.4, bob = Math.round(Math.abs(Math.sin(frame)) * .8)
  const skin = nameless ? '#c2c0a8' : guard ? '#ac9272' : '#cfbb98'
  const skinShade = guard ? '#806c55' : '#a38f73'
  const robe = nameless ? '#a3aa97' : guard ? '#4e5b56' : appearance==='self' ? '#5c6d7d' : '#abb7a5'
  const shade = nameless ? '#717e70' : guard ? '#303f3e' : appearance==='self' ? '#414a4c' : '#687f74'
  const light = nameless ? '#b8bcaa' : guard ? '#6d7970' : appearance==='self' ? '#a28c66' : '#c4ceba'
  const hair = guard ? '#343932' : '#273a32'

  c.save()
  c.translate(Math.round(x), Math.round(y))
  c.fillStyle = '#172d2470'
  c.beginPath(); c.ellipse(2, 2, 12, 4, 0, 0, Math.PI * 2); c.fill()
  if (facing === 'left') c.scale(-1, 1)
  // Shoes alternate around the same ground contact; the coat has split hems.
  block(c, -6 + stride, -11, 4, 11, shade)
  block(c, 3 - stride, -11, 4, 11, shade)
  block(c, -8 + stride, -1, 7, 3, '#23362f')
  block(c, 2 - stride, -1, 8, 3, '#23362f')
  const half = profile ? 7 : guard ? 10 : 9
  shape(c, [-half + 2, -43 - bob, half - 1, -43 - bob, half + 2, -9, 2, -7, 0, -15, -2, -7, -half - 2, -9], shade)
  shape(c, [-half + 4, -42 - bob, half - 3, -42 - bob, half - 1, -10, 2, -9, 0, -17, -3, -9, -half + 1, -10], robe)
  block(c, -half + 3, -34 - bob, 2, 17, light)
  block(c, half - 3, -27, 1, 15, shade)
  // Separate sleeves, cuffs and hands make the two professions readable at map scale.
  block(c, -half - 4, -41 - bob + stride * .3, 6, 21, robe)
  block(c, half - 1, -41 - bob - stride * .3, 6, 21, shade)
  block(c, -half - 4, -22 - bob + stride * .3, 6, guard ? 5 : 3, guard ? '#3b4640' : '#e0d6ba')
  block(c, half - 1, -22 - bob - stride * .3, 6, guard ? 5 : 3, guard ? '#3b4640' : '#d3c9ac')
  block(c, -half - 3, -18 - bob + stride * .3, 3, 5, skin)
  block(c, half, -18 - bob - stride * .3, 3, 5, skinShade)
  if (!back) {
    shape(c, [-5, -43 - bob, 0, -31 - bob, 5, -43 - bob, 2, -43 - bob, 0, -36 - bob, -2, -43 - bob], '#e0d6ba')
    block(c, 1, -36 - bob, 1, 10, light)
  } else block(c, -3, -42 - bob, 7, 2, light)
  block(c, -half, -29 - bob, half * 2 + 1, guard ? 4 : 2, guard ? '#4a4334' : '#667462')

  // The painter carries a brush case; the former constable has a tally and sheathed dao.
  if (appearance === 'shen') {
    block(c, -7, -26, 3, 11, '#b9ad89')
    block(c, -7, -28, 1, 11, '#3a4437')
    block(c, -7, -30, 1, 3, '#302e25')
    block(c, 4, -27, 4, 3, '#d5c9a4')
  } else if (guard) {
    block(c, 4, -26, 3, 8, '#b39862')
    block(c, 5, -24, 1, 3, '#6a6044')
    shape(c, [9, -30, 12, -28, 8, -3, 6, -3], '#463f31')
    block(c, 9, -38, 2, 9, '#88734b')
    block(c, 7, -31, 7, 2, '#b49b68')
    block(c, 7, -6, 2, 4, '#a28d5e')
    block(c, -6, -24, 2, 3, '#858e7c')
    block(c, -6, -22, 2, 1, '#3b4942')
  } else if (appearance === 'self') {
    shape(c, [-7,-41, -3,-40, -1,-28, -5,-12, -8,-13], '#796447')
    block(c, -9, -27, 7, 10, '#75634a')
    block(c, -8, -28, 5, 3, '#d1c6a7')
  }

  // Neck, ears and face; Zhou Ping's longer weathered face is distinct from Shen Yan.
  block(c, -2, -46 - bob, 5, 4, skinShade)
  const faceWidth = profile ? 7 : guard ? 10 : 9
  block(c, -5, -59 - bob, faceWidth + 1, guard ? 15 : 14, nameless ? skin : hair)
  if (!back) {
    block(c, -4, -56 - bob, faceWidth, guard ? 12 : 11, skin)
    block(c, -4, -46 - bob, faceWidth - 1, 2, skinShade)
    block(c, -6, -53 - bob, 2, 4, skinShade)
    if (!profile) block(c, 5, -53 - bob, 2, 4, skin)
    if (!nameless) {
      block(c, profile ? 1 : -3, -52 - bob, guard ? 3 : 2, 1, hair)
      if (!profile) block(c, 2, -52 - bob, 2, 1, hair)
      block(c, profile ? 2 : -2, -50 - bob, 1, 1, '#353c30')
      if (!profile) block(c, 3, -50 - bob, 1, 1, '#353c30')
      block(c, profile ? 4 : 1, -49 - bob, profile ? 2 : 1, 3, skinShade)
      if (guard) {
        block(c, profile ? 1 : -2, -46 - bob, profile ? 4 : 6, 1, '#514937')
        block(c, 0, -44 - bob, 3, 2, '#687064')
        block(c, -3, -49 - bob, 1, 2, '#c1ad8b')
      } else block(c, profile ? 1 : 0, -45 - bob, 2, 1, '#9e8167')
    } else block(c, 3, -54 - bob, 1, 7, '#a0aa92')
  }

  if (nameless) {
    // The unborrowed face has a paper seam, no hair, cap or invented human features.
    block(c, -5, -59 - bob, faceWidth + 1, 4, '#bbc1a8')
    block(c, -4, -59 - bob, 1, 12, '#9ca88d')
  } else {
    // Low Chinese cloth caps and a braid replace the old shared topknot.
    shape(c, [-7, -56 - bob, -6, -62 - bob, -3, -65 - bob, 3, -65 - bob, 7, -62 - bob, 8, -56 - bob], guard ? '#343d36' : '#2e3b32')
    block(c, -7, -58 - bob, profile ? 13 : 15, 2, guard ? '#706c50' : '#56624d')
    block(c, 0, -64 - bob, 1, 5, guard ? '#61634e' : '#465543')
    block(c, -4, -62 - bob, 1, 4, '#465344')
    if (back || profile) {
      const braidX = profile ? -5 : 0
      block(c, braidX, -45 - bob, 3, guard ? 19 : 22, hair)
      for (let k = 0; k < 5; k++) block(c, braidX + k % 2, -43 - bob + k * 4, 2, 2, guard ? '#6c7161' : '#4d5e4d')
      block(c, braidX, guard ? -27 : -24, 3, 2, '#91805b')
    }
  }
  c.restore()
}

export function drawDisguisedPlayer(c: Ctx, x: number, y: number, appearance: PlayerAppearance, facing: WorldState['facing'], frame: number, disguise?: DisguiseFrame) {
  if (!disguise || disguise.progress >= 1) { drawPlayerSprite(c, x, y, appearance, facing, frame); return }
  const progress = Math.max(0, disguise.progress), seam = Math.round(y - 70 + progress * 76)
  // The new face is revealed from head to hem, with a narrow paper edge passing over it.
  c.save(); c.beginPath(); c.rect(x - 24, y - 74, 48, seam - (y - 74)); c.clip()
  drawPlayerSprite(c, x, y, disguise.to, facing, frame); c.restore()
  c.save(); c.beginPath(); c.rect(x - 24, seam, 48, y + 8 - seam); c.clip()
  drawPlayerSprite(c, x, y, disguise.from, facing, frame); c.restore()
  if (progress > .04 && progress < .96) {
    const spread = Math.sin(progress * Math.PI)
    block(c, x - 13, seam - 1, 26, 1, '#dac8a0')
    block(c, x - 9, seam, 18, 1, '#b5845f')
    for (let i = 0; i < 5; i++) {
      const side = i % 2 ? 1 : -1
      block(c, x + side * (13 + spread * (4 + i * 2)), seam - i * 5 + spread * 3, 2, 3, i % 2 ? '#b9c4aa' : '#d1c5a2')
    }
  }
}
