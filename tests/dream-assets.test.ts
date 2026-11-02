import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'

const root=resolve('public/assets/dream/realism')
const manifest=JSON.parse(readFileSync('docs/dream-public-assets.json','utf8'))
test('公开三维模型的全部贴图与缓冲数据都在本地，下载后的模型没有悬空依赖',()=>{
  const models=manifest.assets.filter((a:{kind:string})=>a.kind==='model')
  assert.equal(models.length,6)
  for(const model of models){
    assert.equal(model.license,'CC0-1.0')
    const path=resolve(model.runtime),gltf=JSON.parse(readFileSync(path,'utf8'))
    for(const resource of [...gltf.buffers,...gltf.images]){
      assert.ok(!/^https?:/.test(resource.uri),model.id)
      const file=resolve(dirname(path),resource.uri)
      assert.ok(!relative(root,file).startsWith('..'))
      assert.ok(statSync(file).size>0,`${model.id}: ${resource.uri}`)
      if(resource.byteLength)assert.equal(statSync(file).size,resource.byteLength)
      else assert.equal(readFileSync(file).toString('ascii',8,12),'WEBP')
    }
  }
})
test('写实材质均包含颜色、法线和粗糙度数据，夜景环境文件已打包',()=>{
  for(const material of manifest.assets.filter((a:{kind:string})=>a.kind==='material'))for(const name of ['color','normal','arm']){
    const data=readFileSync(resolve(material.runtime,name+'.webp'))
    assert.equal(data.toString('ascii',8,12),'WEBP')
  }
  const hdr=manifest.assets.find((a:{kind:string})=>a.kind==='environment')
  assert.ok(readFileSync(hdr.runtime).toString('ascii',0,50).includes('#?RADIANCE'))
})
