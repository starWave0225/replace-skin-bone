import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { worldArtFiles } from '../src/game/world-art'

const root=new URL('../',import.meta.url)
const manifest=JSON.parse(readFileSync(new URL('docs/world-public-assets.json',root),'utf8'))
test('主地图七套公开材质全部本地打包，与来源清单和下载后的哈希一致',()=>{
  assert.equal(manifest.assets.length,7)
  for(const url of Object.values(worldArtFiles)){
    const path='public'+url,entry=manifest.assets.find((a:{runtime:string})=>a.runtime===path)
    assert.ok(entry,`缺失来源：${path}`)
    const bytes=readFileSync(new URL(path,root))
    assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP')
    assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256)
    assert.equal(entry.license,'CC0-1.0');assert.ok(Object.keys(entry.author).length)
  }
})
test('保留的源纹理通过官方 MD5 校验，未把网站示例渲染图当作可用素材',()=>{
  for(const entry of manifest.assets){
    const original=readFileSync(new URL(`assets-source/world-materials/${entry.id}/diffuse-1k.jpg`,root))
    assert.equal(createHash('md5').update(original).digest('hex'),entry.md5)
    assert.ok(entry.download.startsWith('https://dl.polyhaven.org/file/ph-assets/Textures/'))
  }
})
