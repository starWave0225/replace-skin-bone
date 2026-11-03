import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { worldArtFiles } from '../src/game/world-art'
import { pixelCharacterFiles, pixelFacingColumns, pixelRegions, pixelWalkRow } from '../src/game/world-pixel-assets'
import { worldMaps } from '../src/game/world'

const root=new URL('../',import.meta.url)
const manifest=JSON.parse(readFileSync(new URL('docs/world-pixel-assets.json',root),'utf8'))
test('地图和角色公开像素原稿全部本地打包，来源、许可与哈希一致',()=>{
  assert.equal(manifest.assets.length,Object.keys(worldArtFiles).length)
  assert.ok(manifest.authors.includes('Pixel-Boy'))
  assert.ok(manifest.authors.includes('AAA'))
  assert.equal(manifest.source_url,'https://pixel-boy.itch.io/ninja-adventure-asset-pack')
  for(const url of Object.values(worldArtFiles)){
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
test('每个图块裁切都在原稿内，七处地图全部人物都有方向与行走帧',()=>{
  for(const region of Object.values(pixelRegions)){
    const sheet=manifest.assets.find((asset:{id:string})=>asset.id===region.sheet)
    assert.ok(sheet)
    assert.ok(region.x>=0&&region.y>=0&&region.w>0&&region.h>0)
    assert.ok(region.x+region.w<=sheet.width,region.sheet)
    assert.ok(region.y+region.h<=sheet.height,region.sheet)
  }
  const roles=new Set(['self','shen','guard','nameless',...Object.values(worldMaps).flatMap(map=>map.spots.flatMap(spot=>spot.character?[spot.character]:[]))])
  for(const role of roles){
    assert.ok(role in pixelCharacterFiles,role)
    const sheet=manifest.assets.find((asset:{id:string})=>asset.id===role)
    for(const column of Object.values(pixelFacingColumns))for(let gait=0;gait<200;gait+=.3){
      assert.ok((column+1)*16<=sheet.width)
      assert.ok((pixelWalkRow(gait,sheet.height/16)+1)*16<=sheet.height,role)
    }
  }
  assert.equal(new Set(Object.values(pixelFacingColumns)).size,4)
  assert.equal(pixelWalkRow(0),0)
})
