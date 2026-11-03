<script setup lang="ts">
import { assetUrl } from '../game/asset-url'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { WorldState } from '../game/types'
import { PLAYER_SPEED, TILE, findPath, movePlayer, nearestSpot, worldMaps } from '../game/world'
import type { WorldSpot } from '../game/world'
import { makeBackground, renderWorld } from '../game/world-renderer'
import { appearanceNames, DISGUISE_DURATION } from '../game/player-sprite'
import type { DisguiseFrame, PlayerAppearance } from '../game/player-sprite'
import Icon from './Icon.vue'
import { loadWorldArt } from '../game/world-art'
import type { WorldArt } from '../game/world-art'

const props = defineProps<{ world: WorldState; paused: boolean; night: boolean; appearance: PlayerAppearance; motion: boolean; quest: string }>()
const emit=defineEmits<{ interact:[spot:WorldSpot]; position:[world:WorldState] }>()
const canvas=ref<HTMLCanvasElement>()
const host=ref<HTMLElement>()
const nearby=ref<WorldSpot>()
const moving=ref(false)
const map=computed(()=>worldMaps[props.world.map])
let player={...props.world},keys=new Set<string>(),raf=0,last=0,atlas:HTMLImageElement|undefined,background:HTMLCanvasElement|undefined
let camera={x:0,y:0},zoom=1.4,size={w:800,h:600},path:{x:number;y:number}[]=[],targetSpot:WorldSpot|undefined,wasMoving=false
let observer:ResizeObserver|undefined
let art:WorldArt|undefined,alive=false
let gait=0,disguise:{from:PlayerAppearance;to:PlayerAppearance;startedAt:number}|undefined
function sendPosition(){emit('position',{...player})}
function setMap(){player={...props.world};keys.clear();path=[];targetSpot=undefined;nearby.value=undefined;background=makeBackground(map.value,atlas,art);camera={x:player.x-size.w/zoom/2,y:player.y-size.h/zoom/2}}
watch(()=>props.world.map,setMap)
watch(()=>props.appearance,(to,from)=>{disguise=props.motion?{from,to,startedAt:performance.now()}:undefined})
watch(()=>props.motion,enabled=>{if(!enabled)disguise=undefined})
watch(()=>props.paused,paused=>{if(paused){keys.clear();path=[];targetSpot=undefined;sendPosition()}})
function resize(){if(!canvas.value||!host.value)return;const box=host.value.getBoundingClientRect();size={w:box.width,h:box.height};const dpr=Math.min(2,window.devicePixelRatio||1);canvas.value.width=Math.round(size.w*dpr);canvas.value.height=Math.round(size.h*dpr);zoom=size.w<520?1.18:1.45}
function step(dx:number,dy:number){
  const result=movePlayer(map.value,player,dx,dy);player.x=result.x;player.y=result.y
  if(Math.abs(dx)>Math.abs(dy))player.facing=dx>0?'right':'left';else if(dy)player.facing=dy>0?'down':'up'
}
function keyDown(e:KeyboardEvent){
  if(props.paused||['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName))return
  const key=e.key.toLowerCase()
  if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','shift','e'].includes(key)){
    e.preventDefault();if(key==='e'){if(!e.repeat)interact();return}keys.add(key);path=[];targetSpot=undefined
    // A short tap also takes a visible step; holding a key is handled by the frame loop.
    if(!e.repeat){let dx=key==='a'||key==='arrowleft'?-PLAYER_SPEED.tap:key==='d'||key==='arrowright'?PLAYER_SPEED.tap:0,dy=key==='w'||key==='arrowup'?-PLAYER_SPEED.tap:key==='s'||key==='arrowdown'?PLAYER_SPEED.tap:0;step(dx,dy)}
  }
}
function keyUp(e:KeyboardEvent){keys.delete(e.key.toLowerCase());if(!keys.size)sendPosition()}
function blur(){keys.clear();path=[];sendPosition()}
function interact(){if(props.paused)return;const spot=nearestSpot(map.value,player.x,player.y);if(spot){sendPosition();emit('interact',spot)}}
function walkTo(spot:WorldSpot){
  if(props.paused)return
  if(Math.hypot(spot.x*TILE-player.x,spot.y*TILE-player.y)<62){sendPosition();emit('interact',spot);return}
  targetSpot=spot
  const approaches=[[spot.x,spot.y+1],[spot.x+1,spot.y],[spot.x-1,spot.y],[spot.x,spot.y-1]]
  path=[]
  for(const [x,y]of approaches){path=findPath(map.value,player,{x:x*TILE,y:y*TILE});if(path.length)break}
  if(!path.length)targetSpot=undefined
}
function point(e:PointerEvent){
  if(props.paused||!canvas.value)return
  canvas.value.focus({preventScroll:true});const bounds=canvas.value.getBoundingClientRect();const x=(e.clientX-bounds.left)/zoom+camera.x,y=(e.clientY-bounds.top)/zoom+camera.y
  const hit=map.value.spots.find(spot=>Math.hypot(spot.x*TILE-x,spot.y*TILE-15-y)<35)
  if(hit){walkTo(hit);return}targetSpot=undefined;path=findPath(map.value,player,{x,y})
}
function touchDirection(key:string,e:PointerEvent){e.preventDefault();if(props.paused)return;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);keys.add(key);path=[]}
function touchEnd(){keys.clear();sendPosition()}
function draw(now:number){
  raf=requestAnimationFrame(draw)
  if(!canvas.value||!background)return
  const elapsed=Math.min(1,(now-last)/1000||.016),dt=Math.min(.04,elapsed);last=now
  const previousX=player.x,previousY=player.y
  let dx=0,dy=0
  if(!props.paused){
    if(keys.has('w')||keys.has('arrowup'))dy--;if(keys.has('s')||keys.has('arrowdown'))dy++;if(keys.has('a')||keys.has('arrowleft'))dx--;if(keys.has('d')||keys.has('arrowright'))dx++
    if(dx||dy){const length=Math.hypot(dx,dy),speed=keys.has('shift')?PLAYER_SPEED.run:PLAYER_SPEED.walk;step(dx/length*speed*dt,dy/length*speed*dt)}
    else if(path.length){
      let budget=PLAYER_SPEED.path*elapsed
      while(path.length&&budget>0){
        const point=path[0],distance=Math.hypot(point.x-player.x,point.y-player.y)
        if(distance<1){path.shift();continue}
        dx=(point.x-player.x)/distance;dy=(point.y-player.y)/distance
        const stride=Math.min(4,distance,budget),oldX=player.x,oldY=player.y
        step(dx*stride,dy*stride);budget-=stride
        if(Math.hypot(player.x-oldX,player.y-oldY)<.01){path=[];targetSpot=undefined;break}
      }
      if(!path.length&&targetSpot){const spot=targetSpot;targetSpot=undefined;if(Math.hypot(spot.x*TILE-player.x,spot.y*TILE-player.y)<70){sendPosition();emit('interact',spot)}}
    }
  }
  const distance=Math.hypot(player.x-previousX,player.y-previousY)
  const walking=distance>.01;if(wasMoving&&!walking)sendPosition();wasMoving=walking
  if(walking)gait+=distance*.09
  if(moving.value!==walking)moving.value=walking
  const nearest=nearestSpot(map.value,player.x,player.y);if(nearby.value?.id!==nearest?.id)nearby.value=nearest
  const viewW=size.w/zoom,viewH=size.h/zoom
  const desiredX=Math.max(0,Math.min(map.value.width*TILE-viewW,player.x-viewW/2)),desiredY=Math.max(0,Math.min(map.value.height*TILE-viewH,player.y-viewH*(props.paused?.28:.53)))
  camera.x+=(desiredX-camera.x)*Math.min(1,dt*9);camera.y+=(desiredY-camera.y)*Math.min(1,dt*9)
  if(map.value.width*TILE<viewW)camera.x=(map.value.width*TILE-viewW)/2
  if(map.value.height*TILE<viewH)camera.y=(map.value.height*TILE-viewH)/2
  const ctx=canvas.value.getContext('2d')!,dpr=Math.min(2,window.devicePixelRatio||1)
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;ctx.fillStyle='#26392e';ctx.fillRect(0,0,size.w,size.h);ctx.scale(zoom,zoom);ctx.translate(-Math.round(camera.x),-Math.round(camera.y))
  let disguiseFrame:DisguiseFrame|undefined
  if(disguise){const progress=(now-disguise.startedAt)/DISGUISE_DURATION;if(progress>=1)disguise=undefined;else disguiseFrame={...disguise,progress:Math.max(0,progress)}}
  renderWorld(ctx,background,map.value,player,atlas,now,walking?gait:0,props.night,props.appearance,nearest,disguiseFrame,art)
  if(path.length){const goal=path.at(-1)!;ctx.strokeStyle='#ded4a588';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(goal.x,goal.y,7,3,0,0,Math.PI*2);ctx.stroke()}
  canvas.value.dataset.playerX=player.x.toFixed(1);canvas.value.dataset.playerY=player.y.toFixed(1);canvas.value.dataset.map=map.value.id
  canvas.value.dataset.disguising=disguiseFrame?'true':'false'
  canvas.value.dataset.worldArt=art?(art.failed.length?'partial':'ready'):'loading'
}
onMounted(()=>{
  alive=true;loadWorldArt().then(value=>{if(alive){art=value;background=makeBackground(map.value,atlas,art)}})
  atlas=new Image();atlas.onload=()=>{if(alive)background=makeBackground(map.value,atlas,art)};atlas.src=assetUrl('/assets/tiles/tiny-town.png');setMap();resize();observer=new ResizeObserver(resize);if(host.value)observer.observe(host.value)
  window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);window.addEventListener('blur',blur);raf=requestAnimationFrame(draw)
})
onUnmounted(()=>{alive=false;cancelAnimationFrame(raf);observer?.disconnect();window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',blur)})
</script>
<template>
  <section ref="host" class="world-view" :class="{ 'world-paused':paused }" :aria-label="`${map.name}俯视角探索地图`">
    <canvas ref="canvas" class="world-canvas" :data-player-appearance="appearance" :aria-label="`${map.name}。当前形貌：${appearanceNames[appearance]}。WASD或方向键移动，E键交互，也可点击地面行走。`" tabindex="0" @pointerdown="point"></canvas>
    <div class="world-top"><div class="world-place"><span class="small-diamond"></span><h2>{{ map.name }}</h2><span>{{ night ? '夜雨' : '槐阴' }}</span></div><div class="world-key-guide"><kbd>W A S D</kbd> 行走 <i></i><kbd>E</kbd> 交互</div></div>
    <div class="world-destinations" aria-label="场景中的人物与出入口"><span>寻路</span><button v-for="spot in map.spots" :key="spot.id" :disabled="paused" @click="walkTo(spot)">{{ spot.name }}<small>{{ spot.kind==='door'?'↗':'·' }}</small></button></div>
    <div v-if="!paused" class="world-bottom"><p><span class="small-diamond"></span>{{ quest }}</p><button class="world-interact" :disabled="!nearby" @click="interact"><kbd>E</kbd><span>{{ nearby ? `${nearby.hint} · ${nearby.name}` : '靠近人物或物件互动' }}</span><Icon :name="nearby?.kind==='door'?'arrow':'leaf'" :size="17"/></button></div>
    <div v-if="!paused" class="touch-controls" aria-label="触屏行走"><div class="dpad"><button aria-label="向上行走" @pointerdown="touchDirection('w',$event)" @pointerup="touchEnd" @pointercancel="touchEnd">↑</button><button aria-label="向左行走" @pointerdown="touchDirection('a',$event)" @pointerup="touchEnd" @pointercancel="touchEnd">←</button><span></span><button aria-label="向右行走" @pointerdown="touchDirection('d',$event)" @pointerup="touchEnd" @pointercancel="touchEnd">→</button><button aria-label="向下行走" @pointerdown="touchDirection('s',$event)" @pointerup="touchEnd" @pointercancel="touchEnd">↓</button></div><button class="touch-interact" aria-label="与附近目标交互" :disabled="!nearby" @click="interact">叩</button></div>
  </section>
</template>
