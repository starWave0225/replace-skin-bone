import type { WorldMap, WorldSpot } from './world'
import { worldMaps } from './world'
import type { ChapterOneState } from './chapter-one'

const object = (id:string,name:string,x:number,y:number,hint='细看'):WorldSpot => ({id,name,x,y,hint,kind:'object'})
const door = (id:string,name:string,x:number,y:number,destination:WorldSpot['destination'],arrival:[number,number]):WorldSpot => ({id,name,x,y,destination,arrival,hint:'前往',kind:'door'})
export function chapterOneMap(s:ChapterOneState):WorldMap {
  const base=worldMaps[s.world.map]
  let spots:WorldSpot[]=[]
  let objects=base.objects.map(o=>({...o}))
  switch(s.world.map){
    case 'theatre':
      spots=[{id:'faceless',name:'无面娘',x:12,y:8,hint:'问借面之事',kind:'npc',character:'faceless'},object('mirror','旧铜镜',6,9,'照镜换面'),door('exit','未闻县南街',13,18,'street',[8,29])];break
    case 'street':
      objects=objects.map(o=>o.title==='沈记纸铺'?{...o,title:'沈砚画舍'}:o)
      spots=[door('home','戚家小院',34,10.8,'home',[14,18]),door('theatre','无面茶楼',8,28.7,'theatre',[13,16]),door('studio','沈砚画舍',34,28.7,'studio',[14,18]),door('inn','北巷 · 栖雨客舍',5,18,'inn',[14,17]),{id:'han',name:'韩七',x:18,y:16,hint:'询问案情',kind:'npc',character:'han'},{id:'tea',name:'茶摊老板',x:27,y:14.5,hint:'打听街谈',kind:'npc',character:'tea'},object('notice','封缉告示',17,13)]
      break
    case 'home':
      objects=objects.map(o=>o.title==='旧画室'?{...o,title:'旧书房'}:o)
      objects.push({kind:'mirror',x:17,y:13})
      spots=[{id:'mother',name:'戚婆婆',x:12,y:10,hint:'交谈',kind:'npc',character:'mother'},object('table','饭桌与两双筷子',10,10),object('letter','压在砚下的托付书',20,11),object('mirror','妆匣铜镜',17,14,'照镜换面'),door('exit','未闻县南街',14,20,'street',[34,12])];break
    case 'studio':
      spots=[object('fragment-bridge','案头残画',6,11),object('fragment-tree','架上旧卷',8,6),object('fragment-well','匣底画纸',21,16),object('frame','褪色画框',14,6),object('painting','拼合残画',8,12),object('lamps','画中灯影',20,11),object('playbill','压纸旧戏单',17,11),object('pigment','松烟与胶矾',6,15),object('cache','画架夹层',19,6),object('mirror','画师铜镜',24,7,'照镜换面'),door('exit','未闻县南街',14,20,'street',[34,29])];break
    case 'inn':
      spots=[door('well','客舍后井',2,12,'inn_well',[11,16]),door('exit','未闻县南街',14,20,'street',[6,18]),{id:'owner',name:'客舍掌柜',x:11,y:11,hint:'交谈',kind:'npc',character:'tea'}];break
    case 'inn_well':
      objects=objects.filter(o=>o.kind!=='lantern')
      if(s.flags.lanternHung)objects.push({kind:'lantern',x:13,y:9})
      objects.push({kind:'mirror',x:18,y:14})
      spots=[object('well','井边挂灯',12,9),object('mirror','遗落的铜镜',18,15,'照镜换面'),door('exit','客舍东厢',11,18,'inn',[3,12])]
      if(s.flags.lanternHung)spots.push({id:'child',name:'小满',x:15,y:10,hint:'听他说话',kind:'npc',character:'child'});break
  }
  if(s.face==='shen'&&s.world.map==='studio')objects.push({kind:'tracks',x:12,y:6,w:3,h:1,title:'逆笔余墨'})
  return {...base,objects,spots}
}

export function chapterOneGuidance(s:ChapterOneState):string[] {
  const stage=s.stage,map=s.world.map
  if(map==='street')return [stage==='visit'?'home':stage==='borrow'?'theatre':stage==='meal'?'home':stage==='hang'?'inn':stage==='report'?'han':'studio']
  if(map==='theatre')return [stage==='borrow'?'faceless':'exit']
  if(map==='home')return [stage==='visit'?'mother':stage==='meal'?(s.flags.tableSeen?'mother':'table'):'exit']
  if(map==='inn')return [stage==='hang'?'well':'exit']
  if(map==='inn_well')return [stage==='hang'?'well':'exit']
  if(map==='studio'){
    if(stage==='painting')return [...['bridge','tree','well'].filter(id=>!s.evidence.includes(`fragment-${id}`)).map(id=>`fragment-${id}`),...(!s.flags.frameSeen?['frame']:[]),'painting']
    if(stage==='lamps')return ['playbill','lamps']
    if(stage==='cache')return ['cache']
    return ['exit']
  }
  return []
}
