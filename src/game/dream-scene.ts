import { assetUrl } from './asset-url'
import * as T from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { Reflector } from 'three/addons/objects/Reflector.js'
import { borrowedSpiritPortrait, dreamStations } from './prologue'
import type { DreamPose, DreamStationId } from './prologue'
import { dreamBlocked, dreamPath, moveInDream } from './dream-navigation'
import { dreamContact, dreamMirror, dreamMirrorContact, dreamShadows } from './dream-presence'
import { loadDreamAssets } from './dream-assets'

export type DreamLookMode='captured'|'free'|'hover'|'touch'
export interface DreamSceneOptions {
  pose?: DreamPose; lowQuality?: boolean;
  seen: () => readonly DreamStationId[];
  onTouch: (id: DreamStationId) => void;
  onMirrorTouch: () => void;
  onLookMode?: (mode:DreamLookMode) => void;
  onPose: (pose: DreamPose) => void;
  onReady: () => void;
}
const noise = (n: number) => { const a = Math.sin(n * 127.13 + 13.1) * 43758.5453; return a - Math.floor(a) }

export async function createDreamScene(host: HTMLElement, options: DreamSceneOptions) {
  const scene = new T.Scene()
  scene.background = new T.Color('#152622')
  scene.fog = new T.FogExp2('#0b171b', .043)
  const camera = new T.PerspectiveCamera(63, 1, .08, 70)
  const initial = options.pose && !dreamBlocked(options.pose.x, options.pose.z) ? options.pose : { x: 0, z: 8.3, yaw: 0, pitch: -.03 }
  let pose = { ...initial }, paused = true, storyActive = false, disposed = false, low = !!options.lowQuality
  let route: {x:number;z:number}[] = [], lookPointer: number | undefined, lastPointer:{x:number;y:number}|undefined, lastPoseAt = 0
  let mouseLook=matchMedia('(pointer:fine)').matches,lookMode:DreamLookMode=mouseLook?'free':'touch',lockPending=false
  let guideFocus: {x:number;y:number;z:number}|undefined
  const keys = new Set<string>(), touchKeys = new Set<string>(), textures = new Set<T.Texture>(), animated: ((time:number)=>void)[] = []
  const renderer = new T.WebGLRenderer({ antialias: !low, powerPreference: low ? 'low-power' : 'high-performance', alpha: false })
  renderer.setPixelRatio(Math.min(devicePixelRatio, low ? 1 : 1.6))
  renderer.outputColorSpace = T.SRGBColorSpace
  renderer.toneMapping = T.ACESFilmicToneMapping
  renderer.toneMappingExposure = .92
  renderer.shadowMap.enabled = !low
  renderer.shadowMap.type = T.PCFShadowMap
  renderer.domElement.setAttribute('aria-label', '梦境三维探索。触屏拖动环顾，方向按钮行走。也可用 WASD 行走和鼠标环顾。')
  renderer.domElement.setAttribute('tabindex', '0')
  renderer.domElement.className = 'dream-canvas'
  host.appendChild(renderer.domElement)
  let assets:Awaited<ReturnType<typeof loadDreamAssets>>
  try{assets=await loadDreamAssets(renderer)}catch(e){renderer.dispose();renderer.domElement.remove();throw e}
  scene.environment=assets.sky.environment;scene.environmentIntensity=.075
  // Keep the HDRI for surface lighting; its modern clubhouse must not appear outside these windows.
  scene.background=new T.Color('#060e15')
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new T.Vector2(1,1), .28, .55, .95)
  composer.addPass(bloom); composer.addPass(new OutputPass())

  function texture(kind: 'wood'|'paper'|'plaster'|'cloth'|'label', text = '') {
    const canvas = document.createElement('canvas'); canvas.width = kind === 'label' ? 1024 : 512; canvas.height = 512
    const c = canvas.getContext('2d')!
    c.fillStyle = kind === 'wood' ? '#69503a' : kind === 'plaster' ? '#b7aa89' : kind === 'cloth' ? '#69372f' : '#d4c49a'
    c.fillRect(0,0,canvas.width,512)
    for(let i=0;i<5000;i++){
      const x=noise(i*3)*canvas.width,y=noise(i*3+1)*512
      c.fillStyle = i%2 ? 'rgba(42,29,21,.09)' : 'rgba(244,222,177,.1)'
      c.fillRect(x,y,kind==='wood' ? 18+noise(i+4)*170 : 1+noise(i+4)*4,kind==='cloth'?1:noise(i+2)*2+.4)
    }
    if(kind==='wood')for(let i=0;i<38;i++){c.strokeStyle='rgba(25,17,12,.12)';c.beginPath();c.moveTo(0,i*15);c.bezierCurveTo(160,i*15+12,300,i*15-7,512,i*15+3);c.stroke()}
    if(kind==='paper'){c.strokeStyle='#a2957044';for(let i=0;i<16;i++){c.beginPath();c.moveTo(i*31,0);c.lineTo(i*31+5,512);c.stroke()}}
    if(kind==='label'){
      c.fillStyle=text==='囍'?'#7c332b':'#24372d';c.fillRect(0,0,1024,512);c.strokeStyle='#b59a60';c.lineWidth=5;c.strokeRect(24,24,976,464);c.lineWidth=1;c.strokeRect(35,35,954,442)
      c.fillStyle='#d5c49a';c.textAlign='center';c.textBaseline='middle';c.font='134px MaShan, NotoSerif, serif';c.fillText(text,512,258)
    }
    const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=renderer.capabilities.getMaxAnisotropy();textures.add(tex);return tex
  }
  const paperMap=texture('paper')
  const wood=assets.wood
  const darkWood=wood.clone();darkWood.color.set('#7f786e')
  const gold = new T.MeshStandardMaterial({color:'#9c7844',metalness:.72,roughness:.45})
  const paper = new T.MeshStandardMaterial({map:paperMap,color:'#e1cfaa',roughness:.94,side:T.DoubleSide})
  const red=assets.linen;red.side=T.DoubleSide;red.color.set('#91605b')
  const wall=assets.plaster;wall.color.set('#d7d2be')
  const jade = new T.MeshStandardMaterial({color:'#4e6a5e',roughness:.45,metalness:.15})
  function mesh(geometry:T.BufferGeometry, material:T.Material, x:number,y:number,z:number, parent:T.Object3D=scene) {
    const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m
  }
  const box=(x:number,y:number,z:number,w:number,h:number,d:number,material:T.Material=wood,parent:T.Object3D=scene)=>{
    const geometry=new T.BoxGeometry(w,h,d),uv=geometry.getAttribute('uv')
    if(material===wood||material===darkWood||material===wall){
      const scale=material===wall?2:1
      for(let face=0;face<6;face++){const width=face<2?d:w,height=face===2||face===3?d:h;for(let i=face*4;i<face*4+4;i++)uv.setXY(i,uv.getX(i)*width/scale,uv.getY(i)*height/scale)}
    }
    return mesh(geometry,material,x,y,z,parent)
  }
  const cylinder=(x:number,y:number,z:number,r:number,height:number,material:T.Material=wood,parent:T.Object3D=scene)=>mesh(new T.CylinderGeometry(r,r,height,20),material,x,y,z,parent)
  function planeImage(url:string,x:number,y:number,z:number,w:number,h:number,rotation=0) {
    const map=new T.TextureLoader().load(assetUrl(url), t=>{if(disposed)t.dispose()});map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;textures.add(map)
    const m=mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map,roughness:.95,side:T.DoubleSide}),x,y,z);m.rotation.y=rotation;return m
  }
  scene.add(new T.HemisphereLight('#8da7b5','#2d2925',.16))
  const moon = new T.DirectionalLight('#8eafcf',.28);moon.position.set(5,9,-10);scene.add(moon)
  const key = new T.SpotLight('#e5b47a',34,19,.8,.65,1.6);key.position.set(-3,5,1);key.target.position.set(0,0,-5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.bias=-.0002;key.shadow.normalBias=.025;scene.add(key,key.target)
  const front = new T.SpotLight('#e7bb83',25,15,.9,.7,1.5);front.position.set(2,4.8,7);front.target.position.set(0,0,3);front.castShadow=true;front.shadow.mapSize.set(1024,1024);front.shadow.normalBias=.02;scene.add(front,front.target)
  const fill = new T.PointLight('#7596b8',5,16,1.8);fill.position.set(3,3,-13);scene.add(fill)

  // Photographic PBR boards replace the uniform procedural slab grid.
  const floor=mesh(new T.PlaneGeometry(14.6,28),assets.floor,0,-.015,-4);floor.rotation.x=-Math.PI/2
  box(0,-.3,-4,15,.3,29,darkWood)
  for(const side of [-1,1]){
    box(side*7.35,.55,-4,.4,1.1,28,wall);box(side*7.35,4.8,-4,.4,1.5,28,wall)
    for(const [a,b]of [[-18,-14.75],[-11.25,-8.75],[-5.25,-2.75],[.75,3.25],[6.75,10]])box(side*7.35,2.6,(a+b)/2,.4,3,b-a,wall)
    box(side*7.08,.22,-4,.15,.43,28,darkWood);box(side*7.08,4,-4,.15,.14,28,wood)
  }
  box(0,2.6,10.2,15,5.6,.4,wall)
  box(0,5.5,-8.55,15,.2,18.9,darkWood)
  box(0,5.5,8.2,15,.2,3.6,darkWood)
  for (const x of [-5.6, 5.6]) box(x,5.5,3.65,3.8,.2,5.5,darkWood)
  for(const x of [-6.6,6.6])for(const z of [7,2,-3,-8,-13,-17]){
    cylinder(x,2.45,z,.19,5.1,darkWood);box(x,.3,z,.6,.6,.6,wood);cylinder(x,4.95,z,.23,.22,gold)
    box(0,4.9,z,13.7,.3,.32,darkWood)
    for(const side of [-1,1]){const brace=box(x-side*.55,4.5,z,1.6,.13,.2,wood);brace.rotation.z=side*(x<0?1:-1)*.45}
  }
  for(const z of [5,-1,-7,-13])for(const side of [-1,1]){
    const x=side*7.08
    for(const height of [1.22,3.98])box(x,height,z,.18,.15,3.55,darkWood)
    for(const edge of [-1.73,1.73])box(x,2.6,z+edge,.18,2.8,.13,darkWood)
    const glass=new T.MeshStandardMaterial({color:'#b4c0bd',transparent:true,opacity:.1,roughness:.4,side:T.DoubleSide,depthWrite:false})
    box(x-side*.07,2.6,z,.05,2.45,3.2,glass)
    for(let i=0;i<9;i++)box(x-side*.1,2.6,z-1.5+i*.375,.08,2.4,.045,wood)
    for(let i=0;i<6;i++)box(x-side*.12,1.4+i*.48,z,.08,.045,3.2,wood)
    for(let i=0;i<4;i++)for(const angle of [-Math.PI/4,Math.PI/4]){const lattice=box(x-side*.14,2.6,z-1.1+i*.7,.08,.55,.035,wood);lattice.rotation.x=angle}
  }
  // The abandoned wedding hall opens into a snow-covered courtyard.
  const weddingSign = new T.MeshStandardMaterial({ map: texture('label','囍'), roughness: .95, transparent:true, opacity:.48 })
  mesh(new T.PlaneGeometry(1.25,1.25),weddingSign,0,3.9,6.45).rotation.z=-.14
  for (const side of [-1,1]) {
    const valance=box(side*2.4,4.35,6.35,2.5,.6,.1,red)
    valance.rotation.z=side*.18
    box(side*3.65,2.55,6.35,.57,3.6,.12,red)
    cylinder(side*2.4,.7,7,.13,1.4,darkWood)
    cylinder(side*2.4,1.48,7,.08,.32,red)
  }
  const snowMaterial = new T.MeshStandardMaterial({ color:'#b1c4c6', roughness:.99 })
  const snow = mesh(new T.PlaneGeometry(11.1,5.4,24,14),snowMaterial,0,.027,3.65)
  const drifts = snow.geometry.attributes.position
  for (let i=0; i<drifts.count; i++) drifts.setZ(i,noise(i*2.9)*.056)
  snow.geometry.computeVertexNormals()
  snow.rotation.x=-Math.PI/2
  const snowLight=new T.PointLight('#a8cced',18,12,2);snowLight.position.set(2,4.9,3.6);scene.add(snowLight)
  function branch(from:T.Vector3,to:T.Vector3,width:number) {
    const axis=to.clone().sub(from),middle=from.clone().addScaledVector(axis,.5)
    const limb=mesh(new T.CylinderGeometry(width*.55,width,axis.length(),10),darkWood,middle.x,middle.y,middle.z)
    limb.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis.normalize())
  }
  const fork=new T.Vector3(4.2,2.4,3.7), crown=new T.Vector3(4.42,3.64,3.71)
  branch(new T.Vector3(4.2,0,3.8),fork,.33)
  branch(fork,crown,.23)
  for (const x of [2.55,3.3,5.25,5.7]) {
    const tip=new T.Vector3(x,3.95+noise(x)*.52,3.7+noise(x+1)*.45)
    branch(crown,tip,.10)
    branch(tip,tip.clone().add(new T.Vector3(x<4?-.26:.25,.58,-.12)),.042)
  }
  const hanging=new T.Group();hanging.position.set(3.26,4.06,3.9);scene.add(hanging)
  const rope=new T.MeshStandardMaterial({color:'#4c4030',roughness:1})
  const burialRobe=new T.MeshBasicMaterial({color:'#9daeb2',transparent:true,opacity:.18,depthWrite:false});rope.transparent=true;rope.opacity=.12;rope.depthWrite=false
  cylinder(0,-.42,0,.022,.84,rope,hanging)
  const hood=mesh(new T.SphereGeometry(.16,16,12),burialRobe,0,-.93,0,hanging);hood.scale.set(.92,1.27,.92)
  const body=mesh(new T.CylinderGeometry(.24,.38,1.26,16),burialRobe,0,-1.74,0,hanging);body.scale.z=.62
  for (const x of [-.29,.29]) {
    const sleeve=cylinder(x,-1.63,0,.115,.73,burialRobe,hanging);sleeve.rotation.z=x*.72
    box(x*.48,-2.45,.015,.14,.17,.24,burialRobe,hanging)
  }
  hanging.traverse(o=>{o.castShadow=false;o.receiveShadow=false});
  animated.push(t=>{hanging.rotation.z=Math.sin(t*.55)*.021;burialRobe.opacity=.12+Math.sin(t*.7)*.07})

  box(-4.9,2.5,-17.8,4.3,5.2,.4,wall);box(4.9,2.5,-17.8,4.3,5.2,.4,wall);box(0,4.9,-17.8,6,1,.4,darkWood)
  box(-1.25,2,-17.4,2.45,4,.18,darkWood);box(1.25,2,-17.4,2.45,4,.18,darkWood)
  for(const x of [-2.5,2.5])box(x,2.1,-17.3,.18,4.4,.3,wood)
  for(let i=0;i<12;i++)box(-2.2+i*.4,3.1,-17.25,.035,1.2,.12,gold)
  for(const x of [-.3,.3]){const handle=mesh(new T.TorusGeometry(.1,.022,8,22),gold,x,1.85,-17.15);handle.rotation.y=0}
  mesh(new T.PlaneGeometry(3.8,1.9),new T.MeshStandardMaterial({map:texture('label','旧梦'),roughness:.9}),0,4.35,-17.04)
  box(0,4.35,-17.15,4,2.1,.12,darkWood)
  box(0,-.08,-22,16,.12,8,jade)
  const distantMoon=mesh(new T.SphereGeometry(1.2,32,20),new T.MeshBasicMaterial({color:'#c5d7c6'}),0,7,-30)
  distantMoon.scale.z=.1

  function lantern(x:number,y:number,z:number,scale=1,parent:T.Object3D=scene,kind:'room'|'guide'|'hand'='room'){
    const g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(scale);parent.add(g)
    assets.place('chinese_chandelier',0,-.45,0,.9,g)
    const power=kind==='hand'?4.5:kind==='guide'?11:3.3*scale
    const light=new T.PointLight('#f3c58c',power,kind==='hand'?6:kind==='guide'?8:5,1.7);light.position.y=.08;g.add(light)
    const flame=mesh(new T.SphereGeometry(.035,12,8),new T.MeshBasicMaterial({color:'#ffdfae'}),0,.08,0,g)
    animated.push(t=>{g.rotation.z=Math.sin(t*.55+x)*.018;light.intensity=power*(.91+Math.sin(t*2.1+x)*.055+Math.sin(t*.37+z)*.035);flame.scale.y=1+Math.sin(t*5)*.12})
    return g
  }
  for(const z of [6,0,-6,-12])for(const x of [-5.3,5.3]){
    cylinder(x,4.45,z,.012,1,darkWood);lantern(x,3.65,z,.85)
  }
  // First object: a freestanding paper lamp and a lit path through the hall.
  assets.place('chinese_tea_table',1,0,.15,.6,scene);cylinder(1,.87,.15,.04,.55,gold);lantern(1,1.55,.15,1.1,scene,'guide')
  const handheld=new T.Group();camera.add(handheld);handheld.position.set(.42,-.48,-.65);lantern(0,0,0,.24,handheld,'hand');scene.add(camera)

  function table(x:number,z:number,w:number,d:number){
    const furniture=assets.place('chinese_console_table',x,0,z,1.09,scene)
    const bounds=new T.Box3().setFromObject(furniture),size=bounds.getSize(new T.Vector3());furniture.scale.x*=w/size.x;furniture.scale.z*=d/size.z
  }
  assets.place('chinese_armchair',-5.6,0,7.6,1.45,scene,.18)
  assets.place('chinese_armchair',5.6,0,3.2,1.45,scene,-Math.PI/2)
  assets.place('chinese_screen_panels',-5.7,0,-5,2.4,scene,Math.PI/2)
  assets.place('chinese_screen_panels',5.7,0,-10,2.4,scene,-Math.PI/2)
  assets.place('chinese_cabinet',5.9,0,-14.5,2.25,scene,-Math.PI/2)
  table(-4.5,-1,2.4,1.2)
  box(-4.5,1.115,-1,1.5,.012,.8,paper)
  const ink=new T.MeshStandardMaterial({color:'#1b2726',metalness:.2,roughness:.25})
  cylinder(-5.15,1.15,-.95,.18,.08,ink)
  for(let i=0;i<3;i++){
    const brush=cylinder(-4.4,1.15,-.76+i*.09,.017,.46,gold);brush.rotation.z=Math.PI/2
    mesh(new T.ConeGeometry(.025,.1,9),ink,-4.67,1.15,-.76+i*.09).rotation.z=Math.PI/2
  }
  const inkPath=new T.QuadraticBezierCurve3(new T.Vector3(-.28,0,-.05),new T.Vector3(-.04,0,-.29),new T.Vector3(.2,0,-.02)).getPoints(65)
  const inkLine=new T.Line(new T.BufferGeometry().setFromPoints(inkPath),new T.LineBasicMaterial({color:'#692b21'}));inkLine.position.set(-4.5,1.13,-1);scene.add(inkLine)
  inkLine.geometry.setDrawRange(0,0)
  const drawingBrush=new T.Group();scene.add(drawingBrush)
  const pen=cylinder(0,.31,0,.018,.48,gold,drawingBrush);pen.rotation.z=-.23
  mesh(new T.ConeGeometry(.022,.12,12),ink,.05,.045,0,drawingBrush).rotation.z=Math.PI
  let inkReveal=options.seen().includes('brush')?1:0,scrollReveal=options.seen().includes('scroll')?1:0,mirrorArrival:number|undefined
  const drawnFace=planeImage(borrowedSpiritPortrait,-4.5,1.135,-1,.51,.71)
  drawnFace.rotation.x=-Math.PI/2
  const drawnFaceMaterial=drawnFace.material as T.MeshStandardMaterial
  drawnFaceMaterial.transparent=true;drawnFaceMaterial.depthWrite=false;drawnFace.castShadow=false
  for(let i=0;i<5;i++)box(-5.4,1.14+i*.045,-1.2,.45,.04,.5,i%2?paper:jade)
  // The scroll is part of the room, with silk backing and carved rollers.
  table(4.8,-5.5,2.1,1.3)
  box(6.8,2.75,-5.5,.12,3.3,2.6,red)
  const scroll=planeImage(borrowedSpiritPortrait,6.67,2.75,-5.5,1.9,2.53,-Math.PI/2)
  const scrollMaterial=scroll.material as T.MeshStandardMaterial;scrollMaterial.transparent=true;scrollMaterial.opacity=0
  const blankScroll=mesh(new T.PlaneGeometry(1.9,2.8),paper,6.7,2.75,-5.5);blankScroll.rotation.y=-Math.PI/2
  for(const y of [1.22,4.28]){const roller=cylinder(6.65,y,-5.5,.065,2.3,darkWood);roller.rotation.x=Math.PI/2}
  box(4.8,1.14,-5.5,.8,.025,.6,paper)
  const blueCloth=red.clone();blueCloth.color.set('#4e737b')
  const clothScrap=mesh(new T.PlaneGeometry(.55,.24,10,4),blueCloth,4.88,1.16,-5.07);clothScrap.rotation.x=-Math.PI/2;clothScrap.rotation.z=.22

  // Carved bronze mirror, with a genuine reflection of the room.
  const mirror=new Reflector(new T.PlaneGeometry(1.65,2.65),{clipBias:.02,textureWidth:low?256:768,textureHeight:low?256:768,color:0x8fa69e})
  mirror.position.set(-6.8,2.3,-10);mirror.rotation.y=Math.PI/2;scene.add(mirror)
  for(const z of [-10.97,-9.03])box(-6.7,2.3,z,.25,3.05,.18,gold)
  for(const y of [.8,3.8])box(-6.7,y,-10,.25,.17,2.1,gold)
  for(let i=0;i<7;i++){const ornament=mesh(new T.TorusGeometry(.09,.025,6,12),gold,-6.54,3.8,-10.8+i*.27);ornament.rotation.y=Math.PI/2}
  box(-6.6,.35,-10,.65,.65,2.4,darkWood)
  const wakingRoom=planeImage('/assets/opening/ink/teahouse-skin-box-v1.webp',-6.76,2.3,-10,1.6,2.58,Math.PI/2)
  const wakingMaterial=wakingRoom.material as T.MeshStandardMaterial
  wakingMaterial.map!.repeat.set(.46,1)
  wakingMaterial.transparent=true;wakingMaterial.depthWrite=false;wakingRoom.castShadow=false

  // Hanging cloth parts after the drawing is discovered; paper faces then become visible.
  const curtains:{cloth:T.Mesh;trim:T.Mesh;side:number}[]=[]
  for(const side of [-1,1]){
    const cloth=mesh(new T.PlaneGeometry(3.3,4.5,16,24),red,side*2.15,2.65,-3)
    const vertices=cloth.geometry.getAttribute('position')
    for(let i=0;i<vertices.count;i++)vertices.setZ(i,Math.cos(vertices.getX(i)*10)*.07)
    vertices.needsUpdate=true;cloth.geometry.computeVertexNormals()
    box(side*2.15,4.95,-3,3.5,.12,.16,gold)
    const trim=mesh(new T.PlaneGeometry(.055,4.5),gold,side*.55,2.65,-2.98);curtains.push({cloth,trim,side})
  }
  // A depth-tested spectral figure belongs to the room: columns, screens and cloth can hide her.
  const hauntPositions=dreamStations.map(station=>new T.Vector3(dreamShadows[station.id].x,1.48,dreamShadows[station.id].z))
  const spiritMaterial=new T.MeshBasicMaterial({map:assets.spirit,transparent:true,opacity:0,color:'#89aba7',depthWrite:false,alphaTest:.008,side:T.DoubleSide})
  const spirit=mesh(new T.PlaneGeometry(1.68,2.52,16,24),spiritMaterial,0,1.48,0)
  const borrowedMaterial=spiritMaterial.clone()
  borrowedMaterial.map=scrollMaterial.map
  const borrowedSpirit=mesh(new T.PlaneGeometry(1.55,2.06),borrowedMaterial,0,0,.04,spirit)
  borrowedSpirit.castShadow=borrowedSpirit.receiveShadow=false
  spirit.castShadow=spirit.receiveShadow=false
  let spiritStage=Math.min(options.seen().length,dreamStations.length-1),spiritOpacity=0
  spirit.position.copy(hauntPositions[spiritStage])
  const spiritGlow=new T.PointLight('#739d97',.7,3.3,2);scene.add(spiritGlow)
  const mistCanvas=document.createElement('canvas');mistCanvas.width=mistCanvas.height=128
  const mc=mistCanvas.getContext('2d')!,mistGradient=mc.createRadialGradient(64,64,2,64,64,62)
  mistGradient.addColorStop(0,'rgba(155,187,178,.3)');mistGradient.addColorStop(.4,'rgba(115,160,149,.12)');mistGradient.addColorStop(1,'rgba(115,160,149,0)');mc.fillStyle=mistGradient;mc.fillRect(0,0,128,128)
  const mistTexture=new T.CanvasTexture(mistCanvas);textures.add(mistTexture)
  const mistMaterial=new T.MeshBasicMaterial({map:mistTexture,transparent:true,depthWrite:false,opacity:0,side:T.DoubleSide})
  const spectralMist=mesh(new T.PlaneGeometry(2.4,2.4),mistMaterial,0,.04,0);spectralMist.rotation.x=-Math.PI/2;spectralMist.castShadow=false
  const masks=new T.Group();scene.add(masks)
  for(let i=0;i<7;i++){
    const x=-4.5+i*1.5,z=-11.8+(i%2)*.8,y=2.65+noise(i)*.7
    cylinder(x,(5.2+y)/2,z,.008,5.2-y,red,masks)
    const mask=new T.Group();mask.position.set(x,y,z);masks.add(mask)
    const head=mesh(new T.SphereGeometry(.32,28,20),paper,0,0,0,mask);head.scale.set(.79,1.15,.37)
    for(const ex of [-.105,.105]){const eye=mesh(new T.SphereGeometry(.045,12,8),ink,ex,.04,.105,mask);eye.scale.set(1.45,.3,.13)}
    const nose=mesh(new T.ConeGeometry(.035,.16,12),paper,0,-.035,.15,mask);nose.rotation.x=.24
    const mouth=mesh(new T.SphereGeometry(.035,12,8),ink,0,-.14,.105,mask);mouth.scale.set(1.4,.2,.1)
    animated.push(t=>{mask.rotation.y=Math.sin(t*.35+i)*.16;mask.rotation.z=Math.sin(t*.45+i)*.045})
  }
  const dustCount=low?100:450,dustGeo=new T.BufferGeometry(),dustPosition=new Float32Array(dustCount*3)
  for(let i=0;i<dustCount;i++){dustPosition[i*3]=(noise(i*5)-.5)*13;dustPosition[i*3+1]=noise(i*5+1)*4.8;dustPosition[i*3+2]=9-noise(i*5+2)*26}
  dustGeo.setAttribute('position',new T.BufferAttribute(dustPosition,3));const dust=new T.Points(dustGeo,new T.PointsMaterial({color:'#d7bb86',size:.018,transparent:true,opacity:.6,depthWrite:false}));scene.add(dust)
  // Fine rain beyond the windows, moon-blue light and broad transparent shafts.
  const rainGeo=new T.BufferGeometry(),rainPositions=new Float32Array(180*6)
  for(let i=0;i<180;i++){const x=(i%2?1:-1)*(7.6+noise(i)*2),y=noise(i+1)*7,z=9-noise(i+2)*27;rainPositions.set([x,y,z,x-.025,y-.22,z],i*6)}
  rainGeo.setAttribute('position',new T.BufferAttribute(rainPositions,3));const rain=new T.LineSegments(rainGeo,new T.LineBasicMaterial({color:'#a2c8c6',transparent:true,opacity:.16}));scene.add(rain)

  let raf=0, previous=performance.now(), previousRender=0, elapsed=0, walkingPhase=0
  function down(e:KeyboardEvent){
    if(['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement)?.tagName))return
    const k=e.key.toLowerCase()
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)&&!paused&&!storyActive&&lookMode!=='free'){e.preventDefault();keys.add(k);route=[];guideFocus=undefined}
  }
  function up(e:KeyboardEvent){keys.delete(e.key.toLowerCase())}
  function clear(){keys.clear();touchKeys.clear();lookPointer=undefined;lastPointer=undefined}
  function setLookMode(mode:DreamLookMode){lookMode=mode;renderer.domElement.dataset.lookMode=mode;options.onLookMode?.(mode)}
  function releaseLook(){clear();route=[];guideFocus=undefined;if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();setLookMode(mouseLook?'free':'touch');options.onPose({...pose})}
  function lockFailed(reason?:unknown){lockPending=false;if(reason instanceof Error)renderer.domElement.dataset.lookError=`${reason.name}: ${reason.message}`;if(!disposed&&!paused)setLookMode('hover')}
  function requestLook(){
    if(paused||disposed||!mouseLook||lockPending||document.pointerLockElement===renderer.domElement)return
    renderer.domElement.focus({preventScroll:true});lastPointer=undefined
    if(!renderer.domElement.requestPointerLock){setLookMode('hover');return}
    lockPending=true
    try{const request=renderer.domElement.requestPointerLock();if(request)void request.catch(lockFailed)}catch{lockFailed()}
  }
  function lockChanged(){
    lockPending=false
    if(disposed)return
    const captured=document.pointerLockElement===renderer.domElement
    if(captured&&paused){document.exitPointerLock();return}
    if(captured)delete renderer.domElement.dataset.lookError
    clear();if(!captured){route=[];guideFocus=undefined;options.onPose({...pose})}
    setLookMode(captured?'captured':mouseLook?'free':'touch')
  }
  function turn(dx:number,dy:number,sensitivity=.0028){
    if(!Number.isFinite(dx)||!Number.isFinite(dy))return
    pose.yaw-=dx*sensitivity;pose.pitch=Math.max(-1.1,Math.min(1.1,pose.pitch-dy*sensitivity*.82));route=[];guideFocus=undefined
  }
  function mouseMove(e:MouseEvent){if(!paused&&!storyActive&&document.pointerLockElement===renderer.domElement)turn(e.movementX,e.movementY)}
  function pointerDown(e:PointerEvent){
    if(paused||storyActive)return
    renderer.domElement.focus({preventScroll:true})
    if(e.pointerType==='mouse'){mouseLook=true;if(e.button===0)requestLook();return}
    if (lookPointer !== undefined) return
    e.preventDefault()
    lookPointer = e.pointerId
    setLookMode('touch')
    guideFocus=undefined;route=[];lastPointer={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId)
  }
  function pointerEnter(e:PointerEvent){if(e.pointerType==='mouse')lastPointer={x:e.clientX,y:e.clientY}}
  function pointerLeave(){if(lookPointer===undefined)lastPointer=undefined}
  function pointerMove(e:PointerEvent){
    if(paused||storyActive)return
    if(document.pointerLockElement===renderer.domElement)return // Relative motion is handled once, by mousemove.
    if(lookPointer===e.pointerId||lookPointer===undefined&&lookMode==='hover'&&e.pointerType==='mouse'){
      if(lastPointer)turn(e.clientX-lastPointer.x,e.clientY-lastPointer.y,.004)
      lastPointer={x:e.clientX,y:e.clientY}
    }
  }
  function pointerUp(event: PointerEvent) {
    if (lookPointer !== event.pointerId) return
    lookPointer = undefined
    lastPointer = undefined
    options.onPose({ ...pose })
  }
  function visibility(){if(document.hidden)releaseLook()}
  function contextMenu(e:Event){if(document.pointerLockElement===renderer.domElement)e.preventDefault()}
  setLookMode(lookMode)
  renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('pointercancel',pointerUp);renderer.domElement.addEventListener('pointerenter',pointerEnter);renderer.domElement.addEventListener('pointerleave',pointerLeave);renderer.domElement.addEventListener('contextmenu',contextMenu)
  renderer.domElement.addEventListener('lostpointercapture', pointerUp)
  document.addEventListener('mousemove',mouseMove);document.addEventListener('pointerlockchange',lockChanged);document.addEventListener('pointerlockerror',lockFailed);document.addEventListener('visibilitychange',visibility)
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',releaseLook)
  function resize(){const {width,height}=host.getBoundingClientRect();camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);composer.setSize(width,height)}
  const observer=new ResizeObserver(resize);observer.observe(host);resize()
  function held(key: string) { return keys.has(key) || touchKeys.has(key) }
  function walk(forward: number, side: number, seconds: number) {
    const speed = (held('shift') ? 3.6 : 2.45) * seconds / Math.hypot(forward, side)
    const next = moveInDream(pose, (-Math.sin(pose.yaw) * forward + Math.cos(pose.yaw) * side) * speed, (-Math.cos(pose.yaw) * forward - Math.sin(pose.yaw) * side) * speed)
    const distance = Math.hypot(next.x - pose.x, next.z - pose.z)
    pose = { ...pose, ...next }
    return distance
  }
  function tap(key: string) {
    if (paused || storyActive) return
    const forward = Number(key === 'w') - Number(key === 's')
    const side = Number(key === 'd') - Number(key === 'a')
    if (!forward && !side) return
    route = []; guideFocus = undefined
    walk(forward, side, .045)
  }
  function frame(now:number){
    if(disposed)return;raf=requestAnimationFrame(frame)
    if(document.hidden){previous=now;return}
    if(paused&&now-previousRender<100)return
    previousRender=now
    const dt=Math.min(.045,(now-previous)/1000);previous=now;elapsed+=dt
    const seen=options.seen(), stage=Math.min(seen.length,dreamStations.length-1), current=dreamStations[stage]
    let distance=0
    if(!paused&&!storyActive){
      const forward=Number(held('w')||held('arrowup'))-Number(held('s')||held('arrowdown')),side=Number(held('d'))-Number(held('a'))
      if(keys.has('arrowleft'))pose.yaw+=dt*1.5;if(keys.has('arrowright'))pose.yaw-=dt*1.5
      if(forward||side)distance=walk(forward,side,dt)
      else if(route.length){const target=route[0],dist=Math.hypot(target.x-pose.x,target.z-pose.z);if(dist<.12)route.shift();else{const stride=Math.min(dt*2.2,dist),dx=(target.x-pose.x)/dist,dz=(target.z-pose.z)/dist,next=moveInDream(pose,dx*stride,dz*stride);distance=Math.hypot(next.x-pose.x,next.z-pose.z);pose={...pose,...next};const desired=Math.atan2(-dx,-dz);let delta=desired-pose.yaw;while(delta>Math.PI)delta-=Math.PI*2;while(delta< -Math.PI)delta+=Math.PI*2;pose.yaw+=delta*Math.min(1,dt*6)}}
    }
    if(!paused){
      if(!route.length&&guideFocus){
        const dx=guideFocus.x-pose.x,dz=guideFocus.z-pose.z,desired=Math.atan2(-dx,-dz)
        let delta=desired-pose.yaw;while(delta>Math.PI)delta-=Math.PI*2;while(delta< -Math.PI)delta+=Math.PI*2
        const pitch=Math.atan2(guideFocus.y-1.66,Math.hypot(dx,dz))
        pose.yaw+=delta*Math.min(1,dt*4);pose.pitch=T.MathUtils.lerp(pose.pitch,pitch,dt*4)
        if(Math.abs(delta)<.005&&Math.abs(pose.pitch-pitch)<.005)guideFocus=undefined
      }
      if(now-lastPoseAt>1800){options.onPose({...pose});lastPoseAt=now}
    }
    if(distance)walkingPhase+=distance*7
    camera.position.set(pose.x,1.66+(distance?Math.sin(walkingPhase)*.018:Math.sin(elapsed*.7)*.004),pose.z)
    camera.rotation.set(pose.pitch,pose.yaw,0,'YXZ')
    const closeness=1-T.MathUtils.smoothstep(Math.hypot(pose.x-hauntPositions[stage].x,pose.z-hauntPositions[stage].z),1,6)
    if(stage!==spiritStage){spiritOpacity=Math.max(0,spiritOpacity-dt*.65);if(spiritOpacity<.01){spiritStage=stage;spirit.position.copy(hauntPositions[stage])}}
    else spiritOpacity=T.MathUtils.lerp(spiritOpacity,seen.length===dreamStations.length?0:storyActive?.025:paused?.32:.21+closeness*.38,dt*1.7)
    const changedFace=seen.includes('brush') ? T.MathUtils.smoothstep(scrollReveal,.12,.85) : 0
    spiritMaterial.opacity=spiritOpacity*(1-changedFace)
    borrowedMaterial.opacity=spiritOpacity*changedFace
    spirit.position.y=1.48+Math.sin(elapsed*.6)*.035;spirit.rotation.y=Math.atan2(pose.x-spirit.position.x,pose.z-spirit.position.z);spirit.rotation.z=Math.sin(elapsed*.4)*.009
    spiritGlow.position.copy(spirit.position);spiritGlow.intensity=spiritOpacity*1.4
    spectralMist.position.set(spirit.position.x,.04,spirit.position.z);mistMaterial.opacity=spiritOpacity*.5
    handheld.visible=seen.includes('lantern');handheld.rotation.z=Math.sin(walkingPhase)*.025
    if(seen.includes('brush')) inkReveal=1
    else if(seen.includes('lantern')&&Math.hypot(pose.x+4.5,pose.z+1)<3.5)inkReveal=Math.min(1,inkReveal+dt*.34)
    const drawn=Math.floor(inkReveal*(inkPath.length-1));inkLine.geometry.setDrawRange(0,drawn+1)
    drawnFaceMaterial.opacity=T.MathUtils.smoothstep(inkReveal,.15,1)
    drawingBrush.visible=seen.includes('lantern')&&inkReveal<1
    drawingBrush.position.copy(inkPath[drawn]).add(inkLine.position);drawingBrush.position.y+=Math.sin(elapsed*2)*.008
    if(seen.includes('scroll')) scrollReveal=1
    else if(seen.includes('brush')&&Math.hypot(pose.x-4.5,pose.z+5.5)<3.8)scrollReveal=Math.min(1,scrollReveal+dt*.55)
    scrollMaterial.opacity=scrollReveal
    masks.visible=seen.includes('scroll');scroll.visible=seen.includes('brush')
    const opening=seen.includes('lantern')?1:0
    for(const {cloth,trim,side} of curtains){cloth.position.x=T.MathUtils.lerp(cloth.position.x,side*(2.15+opening*1.75),dt*2);trim.position.x=cloth.position.x-side*1.6;cloth.rotation.y=trim.rotation.y=Math.sin(elapsed*.5)*.025}
    if(seen.includes('scroll')&&Math.hypot(pose.x+5.7,pose.z+10)<3.2&&mirrorArrival===undefined)mirrorArrival=elapsed
    wakingMaterial.opacity=mirrorArrival===undefined?0:T.MathUtils.smoothstep(elapsed-mirrorArrival,0,2)
    animated.forEach(a=>a(elapsed));dust.rotation.y=Math.sin(elapsed*.03)*.018;rain.position.y=-(elapsed*1.5)%2
    renderer.domElement.dataset.station=current.id;renderer.domElement.dataset.x=pose.x.toFixed(2);renderer.domElement.dataset.z=pose.z.toFixed(2)
    renderer.domElement.dataset.yaw=pose.yaw.toFixed(3);renderer.domElement.dataset.pitch=pose.pitch.toFixed(3)
    if(low)renderer.render(scene,camera);else composer.render()
    const contact=dreamContact(seen,pose,spiritStage,paused||storyActive||spiritOpacity<.15)
    if(contact)options.onTouch(contact)
    if(dreamMirrorContact(seen,pose,paused||storyActive))options.onMirrorTouch()
  }
  frame(performance.now());options.onReady()
  return {
    setPaused(value:boolean){paused=value;if(value)releaseLook()},
    story(id:DreamStationId|undefined){
      storyActive=!!id;clear();route=[]
      if(id){
        const focus:Record<DreamStationId,[number,number,number]>={hall:[0,1.7,5.5],courtyard:[3.26,2.45,3.9],lantern:[1,1.55,.15],brush:[-4.5,1.15,-1],scroll:[6.69,2.75,-5.5],mirror:[-6.8,2.3,-10]}
        const [x,y,z]=focus[id];guideFocus={x,y,z}
      }else{
        const next=dreamStations[options.seen().length]
        guideFocus=next?{...dreamShadows[next.id],y:1.55}:{x:dreamMirror.x,y:2.3,z:dreamMirror.z}
      }
    },
    guide(){
      if(paused||storyActive)return
      const station=dreamStations[options.seen().length]
      const target=station?dreamShadows[station.id]:dreamMirror.approach
      route=dreamPath(pose,target)
      pose.pitch=-.04
      guideFocus=station?{...target,y:1.55}:{x:dreamMirror.x,y:2.3,z:dreamMirror.z}
    },
    look:requestLook,
    releaseLook,
    tap,
    direction(key: string, active: boolean) {
      if (!active) { touchKeys.delete(key); return }
      if (paused || storyActive) return
      touchKeys.add(key)
      tap(key)
    },
    dispose(){
      disposed=true;cancelAnimationFrame(raf);observer.disconnect();options.onPose({...pose});clear()
      window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',releaseLook)
      document.removeEventListener('mousemove',mouseMove);document.removeEventListener('pointerlockchange',lockChanged);document.removeEventListener('pointerlockerror',lockFailed);document.removeEventListener('visibilitychange',visibility)
      renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointermove',pointerMove);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('pointercancel',pointerUp);renderer.domElement.removeEventListener('pointerenter',pointerEnter);renderer.domElement.removeEventListener('pointerleave',pointerLeave);renderer.domElement.removeEventListener('contextmenu',contextMenu)
      renderer.domElement.removeEventListener('lostpointercapture', pointerUp)
      if(document.pointerLockElement===renderer.domElement)document.exitPointerLock()
      scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Points||o instanceof T.LineSegments){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose())}})
      assets.dispose();mirror.getRenderTarget().dispose();textures.forEach(t=>t.dispose());composer.dispose();renderer.dispose();renderer.domElement.remove()
    },
  }
}
