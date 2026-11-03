import { assetUrl } from './asset-url'
import * as T from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import { dreamSpirit } from './prologue'

const root=assetUrl('/assets/dream/realism/')
export const dreamModelIds=['chinese_chandelier','chinese_console_table','chinese_armchair','chinese_screen_panels','chinese_tea_table','chinese_cabinet'] as const
export type DreamModelId=typeof dreamModelIds[number]

export async function loadDreamAssets(renderer:T.WebGLRenderer) {
  const textures=new Set<T.Texture>(),materials=new Set<T.Material>(),geometries=new Set<T.BufferGeometry>()
  let environment:T.WebGLRenderTarget|undefined
  const textureLoader=new T.TextureLoader(),gltfLoader=new GLTFLoader()
  async function map(url:string,color=false,repeat:[number,number]=[1,1]){
    const texture=await textureLoader.loadAsync(root+url)
    if(color)texture.colorSpace=T.SRGBColorSpace
    texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(...repeat)
    texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.add(texture)
    return texture
  }
  async function surface(id:string,repeat:[number,number]=[1,1]){
    const [color,normal,arm]=await Promise.all([map(id+'/color.webp',true,repeat),map(id+'/normal.webp',false,repeat),map(id+'/arm.webp',false,repeat)])
    const material=new T.MeshStandardMaterial({map:color,normalMap:normal,normalScale:new T.Vector2(.75,.75),roughnessMap:arm,aoMap:arm,aoMapIntensity:.65,roughness:1})
    materials.add(material);return material
  }
  function dispose(){environment?.dispose();textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose())}
  const jobs=[
    surface('old_wood_floor',[4.8,9.1]),surface('dark_wood'),surface('worn_plaster_wall'),surface('rough_linen',[5,7]),
    ...dreamModelIds.map(async id=>{
      const model=(await gltfLoader.loadAsync(root+id+'/model.gltf')).scene
      model.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=o.receiveShadow=true;geometries.add(o.geometry);const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){materials.add(m);for(const value of Object.values(m))if(value instanceof T.Texture){textures.add(value);value.anisotropy=4}}}})
      return model
    }),
    textureLoader.loadAsync(dreamSpirit.portrait).then(texture=>{texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;textures.add(texture);return texture}),
    new HDRLoader().loadAsync(root+'night.hdr').then(hdr=>{
      textures.add(hdr);hdr.mapping=T.EquirectangularReflectionMapping
      const pmrem=new T.PMREMGenerator(renderer);environment=pmrem.fromEquirectangular(hdr);pmrem.dispose()
      return {hdr,environment:environment.texture}
    }),
  ]
  const loaded=await Promise.allSettled(jobs)
  const failed=loaded.find(r=>r.status==='rejected')
  if(failed?.status==='rejected'){dispose();throw failed.reason}
  const result=loaded.map(r=>(r as PromiseFulfilledResult<unknown>).value)
  const [floor,wood,plaster,linen]=result as T.MeshStandardMaterial[]
  const models=Object.fromEntries(dreamModelIds.map((id,index)=>[id,result[index+4] as T.Group])) as Record<DreamModelId,T.Group>
  const sky=result.at(-1) as {hdr:T.DataTexture;environment:T.Texture}
  function place(id:DreamModelId,x:number,y:number,z:number,height:number,parent:T.Object3D,rotation=0){
    const object=models[id].clone(true),bounds=new T.Box3().setFromObject(object),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3())
    const group=new T.Group();object.position.x-=center.x;object.position.y-=bounds.min.y;object.position.z-=center.z
    group.add(object);group.scale.setScalar(height/size.y);group.position.set(x,y,z);group.rotation.y=rotation;parent.add(group)
    return group
  }
  const spirit=result[4+dreamModelIds.length] as T.Texture
  return {floor,wood,plaster,linen,sky,spirit,place,dispose}
}
