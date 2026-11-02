import test from 'node:test'
import assert from 'node:assert/strict'
import { TILE, collides, findPath, movePlayer, nearestSpot, worldMaps, worldSpawn } from '../src/game/world'
import type { Location } from '../src/game/types'

test('六幅地图的初始位置和全部门口的抵达位置都没有碰撞',()=>{
  for(const map of Object.values(worldMaps)){
    const spawn=worldSpawn(map.id);assert.equal(collides(map,spawn.x,spawn.y),false,`${map.id}出生位置`)
    for(const spot of map.spots.filter(p=>p.destination)){
      const arrival=worldSpawn(spot.destination!,spot.arrival)
      assert.equal(collides(worldMaps[spot.destination!],arrival.x,arrival.y),false,`${map.id} → ${spot.destination} 的抵达位置`)
    }
  }
})
test('每幅地图的重要人物、物件和出口至少有一条可步行的接近路线',()=>{
  for(const map of Object.values(worldMaps))for(const spot of map.spots){
    const candidates=[[spot.x,spot.y+1],[spot.x+1,spot.y],[spot.x-1,spot.y],[spot.x,spot.y-1]]
    assert.ok(candidates.some(([x,y])=>findPath(map,worldSpawn(map.id),{x:x*TILE,y:y*TILE}).length>0),`${map.id} 中无法接近 ${spot.name}`)
  }
})
test('碰撞检测阻止穿过房屋、边界和河水，石桥可以通行',()=>{
  const map=worldMaps.street
  assert.equal(collides(map,5*TILE,5*TILE),true)
  assert.equal(collides(map,2*TILE,21*TILE),true)
  assert.equal(collides(map,20*TILE,21*TILE),false)
  assert.equal(collides(map,2,15*TILE),true)
  const point={x:8*TILE,y:10*TILE+10};const next=movePlayer(map,point,0,-8)
  assert.equal(next.y,point.y)
})
test('点击寻路绕过障碍，并且不会把目标放在屋内或水面',()=>{
  const map=worldMaps.street,start={x:20*TILE,y:16*TILE}
  assert.deepEqual(findPath(map,start,{x:5*TILE,y:5*TILE}),[])
  assert.deepEqual(findPath(map,start,{x:3*TILE,y:21*TILE}),[])
  const path=findPath(map,start,{x:8*TILE,y:29*TILE})
  assert.ok(path.length>12)
  for(const point of path)assert.equal(collides(map,point.x,point.y),false)
})

test('快速移动和延迟帧的大位移不能穿过薄墙，沿墙移动仍可继续',()=>{
  const map={...worldMaps.theatre,objects:[],solids:[{x:128,y:64,w:4,h:160}]}
  const point={x:100,y:100}
  const stopped=movePlayer(map,point,100,0)
  assert.ok(stopped.x<=120)
  assert.equal(collides(map,stopped.x,stopped.y),false)
  const sliding=movePlayer(map,point,100,40)
  assert.ok(sliding.x<=120)
  assert.ok(Math.abs(sliding.y-140)<.001)
})
test('交互只能作用于附近目标，远处 NPC 不会隔空说话',()=>{
  const map=worldMaps.theatre
  assert.equal(nearestSpot(map,12*TILE,9*TILE)?.id,'faceless')
  assert.equal(nearestSpot(map,13*TILE,14*TILE),undefined)
})
