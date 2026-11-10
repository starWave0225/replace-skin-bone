import type { Location, WorldState } from './types'
import type { WorldNpc } from './world-actors'
export const TILE = 32
export const PLAYER_SPEED = { walk: 160, run: 245, path: 190, tap: 6 } as const
export interface Rect { x: number; y: number; w: number; h: number }
export interface WorldObject { kind: 'house' | 'tree' | 'pine' | 'willow' | 'wall' | 'table' | 'bed' | 'shelf' | 'well' | 'pot' | 'stage' | 'mirror' | 'lantern' | 'bench' | 'bamboo' | 'flowers' | 'door' | 'chest' | 'tracks' | 'stairs'; x: number; y: number; w?: number; h?: number; title?: string; color?: string; couplet?: readonly string[]; open?: boolean; direction?: 'up' | 'down' }
export interface WorldSpot { id: string; name: string; hint: string; x: number; y: number; kind: 'npc' | 'door' | 'object'; character?: WorldNpc; destination?: Location; arrival?: [number, number]; stairs?: 'up' | 'down' }
export interface WorldMap { id: Location; name: string; width: number; height: number; interior: boolean; spawn: [number,number]; solids: Rect[]; objects: WorldObject[]; spots: WorldSpot[] }
const R=(x:number,y:number,w:number,h:number):Rect=>({x:x*TILE,y:y*TILE,w:w*TILE,h:h*TILE})
const trees=(points:[number,number][]):WorldObject[]=>points.map(([x,y],index)=>({kind:index%3===0?'willow':index%3===1?'tree':'pine',x,y}))
const boundary=(w:number,h:number):Rect[]=>[R(0,0,w,1),R(0,h-1,w,1),R(0,0,1,h),R(w-1,0,1,h)]
export const worldMaps: Record<Location,WorldMap> = {
  studio:{id:'studio',name:'沈砚画舍',width:28,height:22,interior:true,spawn:[14,18],solids:[...boundary(28,22),R(3,2,22,3),R(4,8,5,2),R(17,8,6,2),R(3,13,3,3)],objects:[
    {kind:'shelf',x:3,y:2,w:22,h:3,title:'旧画'},{kind:'table',x:4,y:8,w:5,h:2,title:'残画'},{kind:'table',x:17,y:8,w:6,h:2,title:'灯影'},{kind:'shelf',x:3,y:13,w:3,h:3,title:'颜料'},{kind:'chest',x:20,y:14,w:2,h:2},{kind:'mirror',x:24,y:6},{kind:'lantern',x:10,y:6},{kind:'lantern',x:16,y:6},{kind:'bench',x:11,y:14}
  ],spots:[]},
  inn:{id:'inn',name:'栖雨客舍 · 东厢',width:28,height:22,interior:true,spawn:[14,17],solids:[...boundary(28,22),R(3,2,22,3),R(4,7,4,2),R(18,6,5,4),R(18,13,4,2)],objects:[
    {kind:'shelf',x:3,y:2,w:22,h:3},{kind:'table',x:4,y:7,w:4,h:2,title:'宿簿'},{kind:'bed',x:18,y:6,w:5,h:4},{kind:'table',x:18,y:13,w:4,h:2,title:'书札'},{kind:'bench',x:7,y:14},{kind:'lantern',x:4,y:11},{kind:'lantern',x:23,y:11},{kind:'pot',x:3,y:17},{kind:'flowers',x:23,y:17}
  ],spots:[{id:'ledger',name:'入宿簿',hint:'核对账目',x:6,y:10,kind:'object'},{id:'letter',name:'案下半笺',hint:'拾看书信',x:20,y:16,kind:'object'},{id:'tracks',name:'窗下湿泥',hint:'查看鞋印',x:24,y:7,kind:'object'},{id:'owner',name:'茶摊老板',hint:'询问昨夜',x:11,y:11,kind:'npc',character:'tea'},{id:'backyard',name:'客舍后井',hint:'循哭声去后院',x:2,y:12,kind:'door',destination:'inn_well',arrival:[11,16]},{id:'teahouse',name:'西街尽处',hint:'离开客舍',x:14,y:20,kind:'object'}]},
  inn_well:{id:'inn_well',name:'栖雨客舍 · 后井',width:24,height:20,interior:false,spawn:[11,16],solids:[...boundary(24,20),R(10,5,4,3),R(3,2,5,3),R(17,2,4,3)],objects:[
    {kind:'well',x:10,y:5,w:4,h:3},{kind:'wall',x:3,y:2,w:5,h:3},{kind:'wall',x:17,y:2,w:4,h:3},{kind:'willow',x:5,y:9},{kind:'bamboo',x:20,y:11},{kind:'lantern',x:9,y:11},{kind:'flowers',x:16,y:12},{kind:'bench',x:4,y:14}
  ],spots:[{id:'well_spirit',name:'井边冤魂',hint:'俯身听井声',x:12,y:9,kind:'object'},{id:'inn_door',name:'客舍东厢',hint:'返回客舍',x:11,y:18,kind:'door',destination:'inn',arrival:[3,12]}]},
  theatre:{ id:'theatre', name:'无面茶楼',width:26,height:20,interior:true,spawn:[13,14],solids:[...boundary(26,20),R(3,2,20,3),R(4,7,3,2),R(9,7,4,1),R(18,7,4,2),R(2,11,3,3),R(22,11,2,3)],objects:[
    {kind:'stage',x:3,y:2,w:20,h:3,title:'无面戏台'}, {kind:'table',x:9,y:7,w:4,h:1}, {kind:'mirror',x:5,y:7}, {kind:'shelf',x:19,y:7,w:3,h:2,title:'面谱'}, {kind:'shelf',x:2,y:11,w:2,h:3}, {kind:'pot',x:22,y:12}, {kind:'lantern',x:6,y:5}, {kind:'lantern',x:20,y:5}, {kind:'lantern',x:4,y:15}, {kind:'lantern',x:22,y:15}, {kind:'bench',x:5,y:11}, {kind:'bench',x:19,y:11},
  ],spots:[{id:'faceless',name:'无面娘',hint:'交谈',x:12,y:8,kind:'npc',character:'faceless'},{id:'mirror',name:'旧铜镜',hint:'照镜',x:6,y:9,kind:'object'},{id:'skin',name:'画师的面皮',hint:'查看',x:19,y:9.5,kind:'object'},{id:'exit',name:'未闻县南街',hint:'离开戏楼',x:13,y:18,kind:'door',destination:'street',arrival:[8,29]}]},
  theatre_upper:{id:'theatre_upper',name:'无面茶楼 · 二楼客房',width:22,height:17,interior:true,spawn:[4,10.5],solids:[...boundary(22,17),R(7,1,.4,7),R(13,1,.4,7),R(1,8,14,.4),R(18,8,3,.4),R(2,2,3,1.5),R(8,2,3,1.5),R(1,14,20,.4)],objects:[
    {kind:'wall',x:7,y:1,w:.4,h:7},{kind:'wall',x:13,y:1,w:.4,h:7},
    {kind:'wall',x:1,y:8,w:14,h:.4},{kind:'wall',x:18,y:8,w:3,h:.4},
    {kind:'bed',x:2,y:2,w:3,h:1.5},{kind:'bed',x:8,y:2,w:3,h:1.5},
    {kind:'stairs',x:2.8,y:11,w:2.4,h:2.5,direction:'down'},
    {kind:'bench',x:8,y:12,w:3},{kind:'pot',x:19.5,y:12},
    {kind:'lantern',x:7,y:10},{kind:'lantern',x:13,y:10},{kind:'lantern',x:20,y:10},
    {kind:'wall',x:1,y:14,w:20,h:.4}
  ],spots:[]},
  street:{id:'street',name:'未闻县南街',width:42,height:32,interior:false,spawn:[20,16],solids:[...boundary(42,32),R(3,3,10,7),R(29,3,10,7),R(3,22,10,6),R(29,23,10,5),R(1,20,17,2),R(23,20,18,2),R(25,12,4,2),R(2,13,4,3)],objects:[
    {kind:'house',x:3,y:3,w:10,h:7,title:'县 衙',color:'#616b65'},{kind:'house',x:29,y:3,w:10,h:7,title:'戚 家',color:'#657069'},{kind:'house',x:3,y:22,w:10,h:6,title:'无面茶楼',color:'#744d42'},{kind:'house',x:29,y:23,w:10,h:5,title:'沈记纸铺',color:'#606760'},
    {kind:'table',x:25,y:12,w:4,h:2,title:'茶'},{kind:'bench',x:25,y:15},{kind:'table',x:3,y:13,w:3,h:2,title:'香'},{kind:'lantern',x:7,y:10},{kind:'lantern',x:35,y:10},{kind:'lantern',x:7,y:28},{kind:'lantern',x:34,y:28},{kind:'lantern',x:17,y:19},{kind:'lantern',x:24,y:19},
    ...trees([[16,4],[24,4],[3,18],[10,17],[34,17],[39,15],[15,26],[25,27],[17,10],[24,10],[39,29],[3,29]])
  ],spots:[{id:'mother_street',name:'戚婆婆',hint:'交谈',x:21,y:15,kind:'npc',character:'mother'}, {id:'han_street',name:'韩七',hint:'交谈',x:18,y:16,kind:'npc',character:'han'}, {id:'tea',name:'茶摊老板',hint:'打听旧事',x:27,y:14.5,kind:'npc',character:'tea'}, {id:'home_door',name:'戚家小院',hint:'叩门入院',x:34,y:10.8,kind:'door',destination:'home',arrival:[13,17]}, {id:'yamen_door',name:'县衙值房',hint:'进入县衙',x:8,y:10.8,kind:'door',destination:'yamen',arrival:[12,15]}, {id:'theatre_door',name:'无面茶楼',hint:'推门而入',x:8,y:28.7,kind:'door',destination:'theatre',arrival:[13,16]}, {id:'notice',name:'告示牌',hint:'阅读告示',x:17,y:13,kind:'object'}, {id:'rest',name:'街边长凳',hint:'歇脚候时',x:24,y:17.5,kind:'object'}]},
  home:{id:'home',name:'戚家小院',width:28,height:22,interior:false,spawn:[14,18],solids:[...boundary(28,22),R(3,2,6,6),R(18,2,7,6),R(10,8,3,1),R(19,9,3,1),R(3,11,4,1),R(21,13,3,1)],objects:[
    {kind:'house',x:3,y:2,w:6,h:6,title:'东厢',color:'#657069'}, {kind:'house',x:18,y:2,w:7,h:6,title:'旧画室',color:'#657069'}, {kind:'table',x:10,y:8,w:3,h:1},{kind:'table',x:19,y:9,w:3,h:1,title:'画'}, {kind:'bench',x:3,y:11,w:4}, {kind:'flowers',x:4,y:14}, {kind:'flowers',x:5,y:15}, {kind:'pot',x:21,y:13},{kind:'lantern',x:9,y:8},{kind:'lantern',x:17,y:8},{kind:'willow',x:5,y:16},{kind:'tree',x:24,y:17},{kind:'bamboo',x:3,y:8},{kind:'bamboo',x:25,y:8}
  ],spots:[{id:'mother',name:'戚婆婆',hint:'交谈 / 吃一碗面',x:12,y:10,kind:'npc',character:'mother'},{id:'relic',name:'沈砚遗物',hint:'整理旧画',x:20,y:11,kind:'object'},{id:'well_door',name:'戚家后井',hint:'去后院',x:14,y:2,kind:'door',destination:'well',arrival:[13,17]},{id:'street_door',name:'未闻县南街',hint:'出院',x:14,y:20,kind:'door',destination:'street',arrival:[34,12]},{id:'home_rest',name:'石凳',hint:'歇脚候时',x:6,y:12,kind:'object'}]},
  yamen:{id:'yamen',name:'县衙值房',width:26,height:20,interior:true,spawn:[13,16],solids:[...boundary(26,20),R(3,2,20,3),R(6,7,5,2),R(18,6,4,3)],objects:[{kind:'shelf',x:3,y:2,w:20,h:3},{kind:'table',x:6,y:7,w:5,h:2,title:'案'},{kind:'shelf',x:18,y:6,w:4,h:3,title:'封存卷'},{kind:'bench',x:5,y:12},{kind:'bench',x:20,y:12},{kind:'lantern',x:5,y:5},{kind:'lantern',x:21,y:5},{kind:'pot',x:3,y:15},{kind:'pot',x:23,y:15}],spots:[{id:'han',name:'韩七',hint:'查问旧案',x:13,y:8,kind:'npc',character:'han'},{id:'archive',name:'封存卷宗',hint:'查阅',x:19,y:10,kind:'object'},{id:'exit',name:'未闻县南街',hint:'离开县衙',x:13,y:18,kind:'door',destination:'street',arrival:[8,12]}]},
  well:{id:'well',name:'戚家后井',width:28,height:22,interior:false,spawn:[14,18],solids:[...boundary(28,22),R(12,7,4,3),R(3,3,6,3),R(20,4,5,3)],objects:[{kind:'well',x:12,y:7,w:4,h:3},{kind:'wall',x:3,y:3,w:6,h:3},{kind:'wall',x:20,y:4,w:5,h:3},{kind:'willow',x:6,y:10},{kind:'tree',x:23,y:13},{kind:'pine',x:5,y:17},{kind:'bamboo',x:24,y:17},{kind:'lantern',x:11,y:12},{kind:'flowers',x:18,y:14}],spots:[{id:'well',name:'旧井',hint:'俯身查看',x:14,y:11,kind:'object'},{id:'child',name:'井中童影',hint:'倾听',x:17,y:10.5,kind:'npc',character:'child'},{id:'exit',name:'戚家小院',hint:'返回前院',x:14,y:20,kind:'door',destination:'home',arrival:[14,4]}]},
  mansion:{id:'mansion',name:'王宅残梦',width:26,height:20,interior:true,spawn:[13,15],solids:[...boundary(26,20),R(8,3,10,3)],objects:[{kind:'stage',x:3,y:2,w:20,h:3,title:'旧梦未醒'},{kind:'mirror',x:13,y:7},{kind:'lantern',x:5,y:6},{kind:'lantern',x:21,y:6}],spots:[{id:'echo',name:'镜中残影',hint:'凝望',x:13,y:10,kind:'npc',character:'chen'}]},
}
export function worldSpawn(map: Location, position?: [number,number]): WorldState {const [x,y]=position??worldMaps[map].spawn;return {map,x:x*TILE,y:y*TILE,facing:'down'}}
export function collides(map:WorldMap,x:number,y:number,radius=8) {
  return map.solids.some(r=>x+radius>r.x&&x-radius<r.x+r.w&&y+radius>r.y&&y-radius<r.y+r.h)
    || map.objects.some(o=>['tree','pine','willow','bamboo'].includes(o.kind)&&Math.hypot(x-o.x*TILE,y-o.y*TILE)<14)
}
export function movePlayer(map:WorldMap,point:{x:number;y:number},dx:number,dy:number){
  let {x,y}=point
  // Sweep small strides so faster movement and delayed frames cannot skip a thin obstacle.
  const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/4))
  const strideX=dx/steps,strideY=dy/steps
  for(let i=0;i<steps;i++){
    if(!collides(map,x+strideX,y))x+=strideX
    if(!collides(map,x,y+strideY))y+=strideY
  }
  return {x,y}
}
export function nearestSpot(map:WorldMap,x:number,y:number,range=66):WorldSpot|undefined {
  return map.spots.map(spot=>({spot,d:Math.hypot(spot.x*TILE-x,spot.y*TILE-y)})).filter(p=>p.d<range).sort((a,b)=>a.d-b.d)[0]?.spot
}
export function findPath(map:WorldMap,start:{x:number;y:number},end:{x:number;y:number}):{x:number;y:number}[]{
  const sx=Math.floor(start.x/TILE),sy=Math.floor(start.y/TILE),ex=Math.floor(end.x/TILE),ey=Math.floor(end.y/TILE)
  if(ex<1||ey<1||ex>=map.width-1||ey>=map.height-1||collides(map,(ex+.5)*TILE,(ey+.5)*TILE))return []
  const key=(x:number,y:number)=>`${x},${y}`
  const queue=[{x:sx,y:sy}],seen=new Set([key(sx,sy)]),parents=new Map<string,{x:number;y:number}>()
  for(let i=0;i<queue.length;i++){
    const p=queue[i]
    if(p.x===ex&&p.y===ey){const path:{x:number;y:number}[]=[];let point=p;while(point.x!==sx||point.y!==sy){path.unshift({x:(point.x+.5)*TILE,y:(point.y+.5)*TILE});point=parents.get(key(point.x,point.y))!}return path}
    for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,k=key(x,y);if(x<1||y<1||x>=map.width-1||y>=map.height-1||seen.has(k)||collides(map,(x+.5)*TILE,(y+.5)*TILE))continue;seen.add(k);parents.set(k,p);queue.push({x,y})}
  }
  return []
}
