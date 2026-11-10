import { TILE } from './world'
import type { WorldMap, WorldObject, WorldSpot } from './world'
import type { WorldState } from './types'
import { drawDisguisedPlayer } from './player-sprite'
import type { DisguiseFrame, PlayerAppearance } from './player-sprite'
import { drawWorldActor, fillWorldTexture, stampWorldPixel } from './world-art'
import type { WorldArt, WorldMaterial } from './world-art'
import type { PixelRegionId } from './world-pixel-assets'
import { npcHeight, type WorldNpc } from './world-actors'

type Ctx = CanvasRenderingContext2D
const noise = (x: number, y: number) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n) }
function rect(c: Ctx, x: number, y: number, w: number, h: number, color: string) {
  c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
}
function label(c: Ctx, text: string, x: number, y: number, size = 14, color = '#eadbb0') {
  c.save(); c.font = size + 'px NotoSerif,SimSun,serif'; c.textAlign = 'center'; c.textBaseline = 'middle'
  c.lineWidth = 3; c.strokeStyle = '#202b28dc'; c.strokeText(text, Math.round(x), Math.round(y))
  c.fillStyle = color; c.fillText(text, Math.round(x), Math.round(y)); c.restore()
}
function texture(c: Ctx, art: WorldArt | undefined, key: WorldMaterial, x: number, y: number, w: number, h: number) {
  if (!fillWorldTexture(c, art, key, x, y, w, h)) rect(c, x, y, w, h, '#445241')
}
function road(c: Ctx, art: WorldArt | undefined, x: number, y: number, w: number, h: number) {
  texture(c, art, 'stone', x * TILE, y * TILE, w * TILE, h * TILE)
  rect(c, x * TILE, y * TILE, w * TILE, 2, '#d2d0aa28')
  rect(c, x * TILE, (y + h) * TILE - 2, w * TILE, 2, '#263d3b3d')
}
function wall(c: Ctx, art: WorldArt | undefined, x: number, y: number, w: number, h: number) {
  texture(c, art, 'brick', x, y, w, h); texture(c, art, 'roof', x - 2, y - 3, w + 4, 8)
  rect(c, x, y + h - 3, w, 3, '#263d354d')
}
export function makeBackground(map: WorldMap, art?: WorldArt): HTMLCanvasElement {
  const surface = document.createElement('canvas'); surface.width = map.width * TILE; surface.height = map.height * TILE
  const c = surface.getContext('2d')!; c.imageSmoothingEnabled = false
  texture(c, art, map.interior ? (map.id === 'yamen' ? 'stone' : 'floor') : 'earth', 0, 0, surface.width, surface.height)
  if (!map.interior) {
    for (let k = 0; k < map.width * map.height / 4; k++) {
      const x = (1 + Math.floor(noise(k, 37) * (map.width - 2))) * TILE
      const y = (1 + Math.floor(noise(k, 63) * (map.height - 2))) * TILE
      c.save(); c.globalAlpha = .3
      stampWorldPixel(c, art, k % 6 ? 'grassDetail' : 'bush', x, y, 32, 32); c.restore()
    }
  }
  if (map.id === 'street') {
    road(c, art, 2, 15, 38, 4); road(c, art, 18, 2, 5, 28)
    road(c, art, 6, 10, 4, 6); road(c, art, 32, 10, 4, 7)
    road(c, art, 6, 27, 15, 3); road(c, art, 20, 26, 17, 3)
    for (let x = 1; x < map.width - 1; x++) {
      stampWorldPixel(c, art, 'waterTop', x * TILE, 20 * TILE)
      stampWorldPixel(c, art, 'waterBottom', x * TILE, 21 * TILE)
    }
    // The bridge covers the same five walkable columns as the collision map.
    for (let y = 20; y < 22; y++) for (let x = 18; x < 23; x++) stampWorldPixel(c, art, 'bridge', x * TILE, y * TILE)
    for (const x of [18, 22.9]) texture(c, art, 'wood', x * TILE, 19.8 * TILE, 4, 2.5 * TILE)
    stampWorldPixel(c, art, 'notice', 17 * TILE - 18, 13 * TILE - 48, 36, 64)
    label(c, '告示', 17 * TILE, 13 * TILE - 22, 11)
    stampWorldPixel(c, art, 'bench', 24 * TILE - 8, 17.5 * TILE, 48, 16)
  } else if (!map.interior) {
    road(c, art, 11, 3, 6, map.height - 5); road(c, art, 7, 10, map.width - 13, 4)
    if (map.id === 'home') road(c, art, 8, 3, 10, 5)
  } else {
    // Timber posts and floor borders use the same source-pixel scale as the furniture.
    for (const x of [2, map.width - 3]) for (let y = 3; y < map.height - 2; y += 5) texture(c, art, 'wood', x * TILE, y * TILE - 12, 8, 48)
    if (map.id === 'theatre' || map.id === 'mansion') {
      road(c, art, 9, 10, 8, 4)
      rect(c, 9 * TILE, 10 * TILE, 8 * TILE, 4 * TILE, '#9b5d492b')
    }
  }
  for (let x = 0; x < map.width; x++) {
    wall(c, art, x * TILE, 0, TILE, TILE); wall(c, art, x * TILE, (map.height - 1) * TILE, TILE, TILE)
  }
  for (let y = 1; y < map.height - 1; y++) {
    wall(c, art, 0, y * TILE, TILE, TILE); wall(c, art, (map.width - 1) * TILE, y * TILE, TILE, TILE)
  }
  return surface
}
export function drawObject(c: Ctx, object: WorldObject, art?: WorldArt) {
  if (!art) return
  const x = object.x * TILE, y = object.y * TILE, w = (object.w ?? 1) * TILE, h = (object.h ?? 1) * TILE
  const stamp = (id: PixelRegionId, px: number, py: number, width?: number, height?: number) => stampWorldPixel(c, art, id, px, py, width, height)
  if (object.kind === 'house') {
    const roof = Math.round(h * .53)
    rect(c, x + 10, y + h - 5, w, 16, '#1b2a3166')
    texture(c, art, 'plaster', x + 8, y + roof - 8, w - 16, h - roof + 8)
    texture(c, art, 'wood', x + 8, y + h - 8, w - 16, 8)
    for (let column = 0; column < w - 48; column += 64) {
      const px = x + 20 + column
      if (Math.abs(px - (x + w / 2)) > 42) stamp('window', px, y + roof + 16, 32, 32)
    }
    stamp('door', x + w / 2 - 19, y + h - 53, 38, 49)
    c.save(); c.beginPath()
    c.moveTo(x + 23, y); c.lineTo(x + w - 23, y); c.lineTo(x + w + 14, y + roof)
    c.lineTo(x + w + 18, y + roof - 12); c.lineTo(x + w + 18, y + roof + 7)
    c.lineTo(x - 18, y + roof + 7); c.lineTo(x - 18, y + roof - 12); c.lineTo(x - 14, y + roof); c.closePath(); c.clip()
    texture(c, art, 'roof', x - 18, y, w + 36, roof + 10); c.restore()
    rect(c, x + 20, y, w - 40, 4, '#b4bbb1'); rect(c, x - 16, y + roof + 3, w + 32, 5, '#364247')
    const signWidth = Math.min(w - 48, 104)
    stamp('bench', x + w / 2 - signWidth / 2, y + roof + 9, signWidth, 24)
    label(c, object.title ?? '', x + w / 2, y + roof + 21, 13)
  } else if (object.kind === 'tree' || object.kind === 'pine' || object.kind === 'willow') {
    const region = object.kind, width = region === 'tree' ? 96 : 128, height = 96
    stamp(region, x - width / 2, y - height + 12, width, height)
  } else if (object.kind === 'bamboo') {
    for (let i = 0; i < 3; i++) stamp('bamboo', x - 20 + i * 14, y - 66 - i % 2 * 8, 32, 64)
  } else if (object.kind === 'ceiling') {
    texture(c,art,'plaster',x,y,w,h)
    rect(c,x,y,w,8,'#3a3028');rect(c,x,y,5,h,'#4d3e2e');rect(c,x+w-5,y,5,h,'#4d3e2e')
    texture(c,art,'wood',x,y+h-9,w,9)
  } else if (object.kind === 'wall') wall(c, art, x, y, w, h)
  else if (object.kind === 'table') {
    stamp('table', x, y, w, h + 10)
    stamp('book', x + Math.max(8, w / 2 - 12), y + 3, 24, 24)
    if (object.title) label(c, object.title, x + w / 2, y - 10, 12)
  } else if (object.kind === 'shelf') {
    for (let px = 0; px < w; px += 32) stamp('shelf', x + px, y, Math.min(32, w - px), h)
    if (object.title) label(c, object.title, x + w / 2, y - 10, 12)
  } else if (object.kind === 'bed') stamp('bed', x, y, w, h)
  else if (object.kind === 'bench') stamp('bench', x, y, w, 20)
  else if (object.kind === 'pot') stamp('pot', x, y - 8, 32, 32)
  else if (object.kind === 'flowers') { for (let i = 0; i < 3; i++) stamp('flowers', x + i * 12, y - 10 + i % 2 * 10, 24, 24) }
  else if (object.kind === 'mirror') stamp('mirror', x - 24, y - 24, 48, 56)
  else if (object.kind === 'door') {
    if(object.open){texture(c,art,'wood',x,y,6,h);texture(c,art,'wood',x+w-6,y,6,h)}
    else if(object.couplet){
      texture(c,art,'wood',x,y,w,h);rect(c,x,y,w,5,'#bd9460')
      for(const side of [0,1]){
        const px=x+4+side*w/2
        rect(c,px,y+8,w/2-8,h*.42,'#28332a')
        for(let i=1;i<4;i++)rect(c,px+i*(w/2-8)/4,y+8,2,h*.42,'#987348')
        texture(c,art,'wood',px,y+h*.52,w/2-8,h*.4)
      }
      rect(c,x+w/2-1,y+5,2,h-5,'#261c15')
      for(const dx of [-5,5]){c.strokeStyle='#bea36b';c.lineWidth=2;c.beginPath();c.arc(x+w/2+dx,y+h*.6,3,0,Math.PI*2);c.stroke()}
    }
    else stamp('door', x, y, w, h)
  }
  else if (object.kind === 'stairs') {
    rect(c,x-4,y-4,w+8,h+8,'#201a17')
    for(let i=0;i<7;i++){
      const sy=y+i*h/7
      texture(c,art,'wood',x+5,sy,w-10,h/7-1)
      rect(c,x+5,sy,w-10,2,'#c4a87d')
      rect(c,x+5,sy+h/7-3,w-10,3,'#2b231e')
    }
    rect(c,x-2,y,5,h,'#8b6a42');rect(c,x+w-3,y,5,h,'#8b6a42')
    const down=object.direction==='down',cy=y+h/2
    c.save();c.strokeStyle='#f5dfad';c.lineWidth=3;c.beginPath();c.moveTo(x+w/2,cy+(down?-15:15));c.lineTo(x+w/2,cy+(down?15:-15));c.lineTo(x+w/2-7,cy+(down?8:-8));c.moveTo(x+w/2,cy+(down?15:-15));c.lineTo(x+w/2+7,cy+(down?8:-8));c.stroke();c.restore()
  }
  else if (object.kind === 'chest') {
    texture(c, art, 'wood', x, y, w, h)
    rect(c, x, y + h / 2, w, 3, '#3a261b')
    rect(c, x + w / 2 - 4, y + h / 2 - 2, 8, 9, '#b89153')
  } else if (object.kind === 'tracks') {
    c.save()
    for (let step = 0; step < 11; step++) {
      const left = x + (step % 2 ? 9 : -9), top = y + h * step / 11
      c.globalAlpha = .28 + step * .06
      rect(c, left, top, 8, 9, '#302922')
      rect(c, left + 1, top + 10, 6, 5, '#302922')
    }
    c.restore()
  }
  else if (object.kind === 'well') {
    texture(c, art, 'brick', x, y + 14, w, h - 14)
    rect(c, x, y + h - 4, w, 5, '#25393488')
    c.save(); c.filter = 'saturate(0) brightness(.84)'; stamp('well', x + w / 2 - 38, y - 5, 76, 76); c.restore()
    stamp('pot', x + w - 10, y + h - 24, 24, 24)
  } else if (object.kind === 'stage') {
    texture(c, art, 'wood', x, y, w, h); texture(c, art, 'floor', x + 10, y + 30, w - 20, h - 30)
    for (const px of [x, x + w - 48]) stamp('curtain', px, y, 48, h + 4)
    stamp('bench', x + w / 2 - 84, y + 3, 168, 26); label(c, object.title ?? '', x + w / 2, y + 16, 16)
  }
}
export function drawLantern(c: Ctx, art: WorldArt | undefined, x: number, y: number, time: number, night: boolean) {
  const sway = Math.round(Math.sin(time * .0012 + x) * 2)
  stampWorldPixel(c, art, 'lantern', x - 16 + sway, y - 56, 32, 64)
  const glow = c.createRadialGradient(x, y - 37, 3, x, y - 37, night ? 100 : 42)
  glow.addColorStop(0, night ? '#f6bd5745' : '#f6bd571a'); glow.addColorStop(1, '#f6bd5700')
  c.fillStyle = glow; c.fillRect(x - 100, y - 137, 200, 200)
}
export function drawCharacter(c: Ctx, art: WorldArt | undefined, x: number, y: number, role: WorldNpc, facing: WorldState['facing'] = 'down') {
  c.save(); if (role === 'child' || role === 'chen') c.globalAlpha = .8
  drawWorldActor(c, art, role, x, y, facing, 0, npcHeight[role]); c.restore()
}
const spriteCaches = new WeakMap<WorldArt, Map<string, { surface: HTMLCanvasElement; x: number; y: number }>>()
function objectSprite(object: WorldObject, art: WorldArt) {
  let cache = spriteCaches.get(art)
  if (!cache) { cache = new Map(); spriteCaches.set(art, cache) }
  const key = JSON.stringify(object)
  let sprite = cache.get(key)
  if (!sprite) {
    const padding = 96, surface = document.createElement('canvas')
    surface.width = (object.w ?? 1) * TILE + padding * 2; surface.height = (object.h ?? 1) * TILE + padding * 2
    const ctx = surface.getContext('2d')!; ctx.imageSmoothingEnabled = false
    ctx.translate(padding - object.x * TILE, padding - object.y * TILE); drawObject(ctx, object, art)
    sprite = { surface, x: object.x * TILE - padding, y: object.y * TILE - padding }; cache.set(key, sprite)
  }
  return sprite
}
export function renderInteractionHints(c: Ctx, map: WorldMap, ids: readonly string[], time: number, nearestId?: string, primaryIds: readonly string[] = ids) {
  const pulse = .5 + .5 * Math.sin(time / 460)
  c.save()
  for (const spot of map.spots) {
    if (!ids.includes(spot.id)) continue
    const x = spot.x * TILE, y = spot.y * TILE, nearby = spot.id === nearestId, primary = primaryIds.includes(spot.id)
    const radius = (primary ? 24 : nearby ? 20 : 17) + pulse * (primary ? 3 : 1.5)
    const glow = c.createRadialGradient(x, y, 3, x, y, 34)
    glow.addColorStop(0, primary ? '#f5d28755' : '#accca92a'); glow.addColorStop(1, '#f5d28700')
    c.fillStyle = glow; c.fillRect(x - 34, y - 26, 68, 52)
    c.strokeStyle = primary ? '#ffe4a9' : spot.kind === 'door' ? '#a8cfc6a8' : '#c2d2b293'; c.lineWidth = primary || nearby ? 1.7 : 1
    c.beginPath(); c.ellipse(x, y, radius, radius * .46, 0, 0, Math.PI * 2); c.stroke()
    if (primary || nearby) { c.strokeStyle = '#e8cf8566'; c.beginPath(); c.ellipse(x, y, radius + 5, (radius + 5) * .46, 0, 0, Math.PI * 2); c.stroke() }
    if (spot.kind === 'object') label(c, spot.name, x, y - 27 - pulse * 2, 14, primary ? '#f1d995' : '#b9c9ad')
  }
  c.restore()
}

export function renderWorld(c: Ctx, background: HTMLCanvasElement, map: WorldMap, player: WorldState, time: number, walkFrame: number, night: boolean, appearance: PlayerAppearance, nearest: WorldSpot | undefined, disguise?: DisguiseFrame, art?: WorldArt) {
  c.imageSmoothingEnabled = false; c.drawImage(background, 0, 0)
  if (map.id === 'street') {
    c.save(); c.globalAlpha = .24
    for (let i = 0; i < 24; i++) {
      const x = 1 + Math.floor(noise(i, 48) * 40)
      if (x >= 18 && x < 23) continue
      const y = (20.4 + noise(i, 83) * 1.2) * TILE
      stampWorldPixel(c, art, 'ripple', x * TILE + Math.floor(time / 300 + i) % 3 * 2, y, 24, 12)
    }
    c.restore()
  }
  const objects: { y: number; draw: () => void }[] = []
  if (art) for (const object of map.objects) if (object.kind !== 'lantern') objects.push({
    y: (object.y + (object.h ?? 0)) * TILE,
    draw: () => { const sprite = objectSprite(object, art); c.drawImage(sprite.surface, sprite.x, sprite.y) },
  })
  for (const spot of map.spots) {
    if (spot.kind === 'npc') objects.push({ y: spot.y * TILE, draw: () => {
      const facing = Math.hypot(player.x - spot.x * TILE, player.y - spot.y * TILE) < 100
        ? (Math.abs(player.x - spot.x * TILE) > Math.abs(player.y - spot.y * TILE) ? (player.x > spot.x * TILE ? 'right' : 'left') : (player.y > spot.y * TILE ? 'down' : 'up')) : 'down'
      const role = spot.character ?? 'tea', nameY = spot.y * TILE - npcHeight[role] - 11
      drawCharacter(c, art, spot.x * TILE, spot.y * TILE, role, facing)
      label(c, spot.name, spot.x * TILE, nameY, 13)
      if (nearest?.id === spot.id) label(c, '◆', spot.x * TILE, nameY - 17, 12, '#f2cc7d')
    } })
    if (spot.kind === 'door') {
      if(!spot.stairs)label(c, '⌄', spot.x * TILE, spot.y * TILE + 3, 22, '#e2c38b')
      label(c, spot.name, spot.x * TILE, spot.y * TILE + 24, 12)
    }
  }
  objects.push({ y: player.y, draw: () => drawDisguisedPlayer(c, player.x, player.y, appearance, player.facing, walkFrame, disguise, art) })
  objects.sort((a, b) => a.y - b.y).forEach(object => object.draw())
  if (night) rect(c, 0, 0, map.width * TILE, map.height * TILE, '#1b304c47')
  if (!map.interior) for (let i = 0; i < 90; i++) {
    const x = Math.round(noise(i, 17) * map.width * TILE + (time * .012) % 47)
    const y = Math.round((noise(i, 59) * map.height * TILE + time * .18) % (map.height * TILE))
    rect(c, x, y, 2, 8, night ? '#b8cbd22a' : '#d5dfbc26')
  }
  for (const object of map.objects) if (object.kind === 'lantern') drawLantern(c, art, object.x * TILE, object.y * TILE, time, night)
  const vignette = c.createRadialGradient(player.x, player.y, 120, player.x, player.y, 650)
  vignette.addColorStop(0, '#102a2400'); vignette.addColorStop(1, '#102a2455')
  c.fillStyle = vignette; c.fillRect(0, 0, map.width * TILE, map.height * TILE)
  // Door inscriptions belong to the scenery, independent of interaction rings or proximity.
  for(const object of map.objects)if(object.couplet){
    const center=(object.x+(object.w??1)/2)*TILE,top=object.y*TILE
    label(c,object.title??'',center,top-14,17,'#f4e0b2')
    object.couplet.forEach((line,index)=>{
      const x=center+(index===0?1:-1)*((object.w??1)*TILE/2+19)
      rect(c,x-12,top-2,24,line.length*18+8,'#603f32')
      rect(c,x-11,top-1,22,line.length*18+6,'#c1a06e')
      c.save();c.font='17px MaShan, NotoSerif, serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#211d18'
      Array.from(line).forEach((char,i)=>c.fillText(char,x,top+11+i*18));c.restore()
    })
  }
}
