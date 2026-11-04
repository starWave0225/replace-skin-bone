import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { pixelRegions, worldPixelFiles } from '../src/game/world-pixel-assets'
import { worldActorFiles } from '../src/game/world-actors'
import { worldMaps } from '../src/game/world'

const root=new URL('../',import.meta.url)
const manifest=JSON.parse(readFileSync(new URL('docs/world-pixel-assets.json',root),'utf8'))
test('公开像素素材及归档原稿全部本地打包，来源、许可与哈希一致',()=>{
  assert.equal(manifest.assets.length,Object.keys(worldPixelFiles).length)
  assert.ok(manifest.authors.includes('Pixel-Boy'))
  assert.ok(manifest.authors.includes('AAA'))
  assert.equal(manifest.source_url,'https://pixel-boy.itch.io/ninja-adventure-asset-pack')
  for(const url of Object.values(worldPixelFiles)){
    const path='public'+url,entry=manifest.assets.find((a:{runtime:string})=>a.runtime===path)
    assert.ok(entry,`缺失来源：${path}`)
    const bytes=readFileSync(new URL(path,root))
    assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a')
    assert.equal(bytes.readUInt32BE(16),entry.width);assert.equal(bytes.readUInt32BE(20),entry.height)
    assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256)
    assert.equal(createHash('sha256').update(readFileSync(new URL(entry.source,root))).digest('hex'),entry.sha256)
    assert.equal(entry.license,'CC0-1.0')
  }
})
test('每个地形图块都在原稿内，全部地图人物都有已打包的新版画图集',()=>{
  for(const region of Object.values(pixelRegions)){
    const sheet=manifest.assets.find((asset:{id:string})=>asset.id===region.sheet)
    assert.ok(sheet)
    assert.ok(region.x>=0&&region.y>=0&&region.w>0&&region.h>0)
    assert.ok(region.x+region.w<=sheet.width,region.sheet)
    assert.ok(region.y+region.h<=sheet.height,region.sheet)
  }
  const roles=new Set(['self','shen','guard','nameless',...Object.values(worldMaps).flatMap(map=>map.spots.flatMap(spot=>spot.character?[spot.character]:[]))])
  for (const role of roles) assert.ok(role in worldActorFiles, role)
  for (const path of Object.values(worldActorFiles)) {
    const bytes = readFileSync(new URL('public' + path, root))
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', path)
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', path)
  }
})
