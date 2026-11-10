import { verseDoors, type PrologueState } from './prologue'
import { TILE, worldMaps } from './world'
import type { Rect, WorldMap, WorldObject, WorldSpot } from './world'

const wall: WorldObject = { kind: 'wall', x: 13.4, y: 5, w: 7.6, h: 1 }
const wallSolid: Rect = { x: 13.4 * TILE, y: 5 * TILE, w: 7.6 * TILE, h: TILE }
const echoDoors: WorldSpot[] = [
  { id: 'echo_up', name: '正门', hint: '循声推门', x: 12, y: 4, kind: 'door' },
  { id: 'echo_left', name: '左门', hint: '循声推门', x: 3, y: 11, kind: 'door' },
  { id: 'echo_right', name: '右门', hint: '循声推门', x: 21, y: 11, kind: 'door' },
]

export function prologueMap(p: PrologueState): WorldMap {
  const map = worldMaps[p.world.map]
  const morning = p.phase === 'morning'
  if (map.id === 'inn') {
    const spots = map.spots.filter(spot => morning ? spot.id === 'backyard' : ['letter', 'ledger', 'tracks', 'owner'].includes(spot.id))
      .map(spot => ({ ...spot, name: spot.id === 'owner' ? '客舍掌柜' : spot.id === 'tracks' ? '镜前湿鞋印' : spot.name }))
    if (p.phase === 'search' || morning) spots.push({ id: 'inn_street', name: '未闻县街巷', hint: '离开客舍', x: 14, y: 20, kind: 'door', destination: 'street' })
    return { ...map, spots, objects: [...map.objects, { kind: 'mirror', x: 24, y: 15 }, { kind: 'tracks', x: 24.2, y: 6.8, w: 1, h: 8 }] }
  }
  if (map.id === 'street') {
    const spots: WorldSpot[] = [
      { id: 'street_inn', name: '栖雨客舍', hint: '进入客舍', x: 20, y: 13, kind: 'door', destination: 'inn' },
      { id: 'street_theatre', name: '无面茶楼', hint: '进茶楼', x: 8, y: 29, kind: 'door', destination: 'theatre' },
      { id: 'appeal', name: '卖灯人', hint: '听他喊冤', x: 16, y: 16, kind: 'npc', character: 'tea' },
    ]
    return { ...map, spots }
  }
  if (map.id === 'theatre') {
    const spots = map.spots.filter(spot => spot.id === 'exit' || (!morning && spot.id === 'faceless'))
    spots.push(
      { id: 'playbill', name: '旧曲牌', hint: '读戏台旁的词', x: 9, y: 5.5, kind: 'object' },
      { id: 'upstairs', name: '二楼转角', hint: '沿木梯上楼', x: 21, y: 11, kind: 'door', stairs:'up', destination: 'theatre_upper' },
    )
    return { ...map, spots, objects: [...map.objects.filter(o=>!(o.kind==='shelf'&&o.x===19)&&!(o.kind==='bench'&&o.x===19)), { kind: 'stairs', x: 19.5, y: 7, w: 3, h: 3, direction:'up' }] }
  }
  if (map.id === 'theatre_upper') {
    const spots: WorldSpot[] = [
      { id: 'downstairs', name: '下楼', hint: '返回茶楼前堂', x: 4, y: 12, kind: 'door', stairs:'down', destination: 'theatre' },
    ]
    if (morning) spots.push({ id: 'briefing', name: '无面娘', hint: '问起梦中借面', x: 10, y: 11, kind: 'npc', character: 'faceless' })
    else if (p.wallOpen) spots.push({ id: 'secret_box', name: '暗室木匣', hint: '补写匣上的残句', x: 16.5, y: 2.8, kind: 'object' })
    else if (!p.verseRoomFound) spots.push(...verseDoors.map(d=>({id:d.id,name:d.name,hint:'推门探看',x:d.x,y:9.2,kind:'object' as const})))
    else spots.push({ id: 'hidden_wall', name: '转角的墙板', hint: '摸索墙上的接缝', x: 16.5, y: 6.2, kind: 'object' })
    return {
      ...map, spots,
      solids: [...map.solids, ...(!p.wallOpen?[wallSolid]:[]), ...(!p.verseRoomFound&&!morning?[{x:15*TILE,y:8*TILE,w:3*TILE,h:.4*TILE}]:[])],
      objects: [...map.objects, ...(p.wallOpen?[{kind:'chest' as const,x:16,y:2,w:1.5,h:1}]:[wall]), ...verseDoors.map(d=>({kind:'door' as const,x:d.x-.75,y:4,w:1.5,h:4.3,title:d.name,couplet:d.lines,open:d.wrong&&!!p.verseRoomFound}))],
    }
  }
  const spots = map.spots.filter(spot => spot.id === 'well_spirit' || (!p.wellEncounter && spot.id === 'inn_door'))
    .map(spot => spot.id === 'well_spirit' ? { ...spot, name: '枯井口', hint: '轻叩井沿' } : spot)
  return p.echo ? {
    ...map,
    spots: [...spots, ...echoDoors],
    objects: [...map.objects, ...echoDoors.map(door => ({ kind: 'door' as const, x: door.x - .7, y: door.y - 1.65, w: 1.4, h: 1.8 }))],
  } : { ...map, spots }
}

