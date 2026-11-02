/** CC0 photographic materials, prepared once for the existing pixel world renderer. */
export const worldArtFiles = {
  earth:'/assets/world/earth.webp',stone:'/assets/world/stone.webp',roof:'/assets/world/roof.webp',
  plaster:'/assets/world/plaster.webp',brick:'/assets/world/brick.webp',floor:'/assets/world/floor.webp',wood:'/assets/world/wood.webp',
} as const
export type WorldMaterial=keyof typeof worldArtFiles
export interface WorldArt {surfaces:Partial<Record<WorldMaterial,HTMLCanvasElement>>;failed:string[]}
const treatments:Record<WorldMaterial,{w:number;h:number;filter:string;tint:string;opacity:number}>={
  earth:{w:192,h:192,filter:'saturate(.32) brightness(.87)',tint:'#4d5b3e',opacity:.35},
  stone:{w:256,h:256,filter:'saturate(.22) brightness(1.12)',tint:'#68786a',opacity:.16},
  roof:{w:192,h:128,filter:'saturate(.08) brightness(.92)',tint:'#405653',opacity:.2},
  plaster:{w:160,h:128,filter:'saturate(.15) brightness(1.15)',tint:'#c2bea3',opacity:.18},
  brick:{w:144,h:96,filter:'saturate(.2) brightness(1.12)',tint:'#6c7b65',opacity:.16},
  floor:{w:256,h:128,filter:'saturate(.5) brightness(1.16)',tint:'#716047',opacity:.13},
  wood:{w:128,h:128,filter:'saturate(.45) brightness(1.15)',tint:'#67563f',opacity:.15},
}
let loading:Promise<WorldArt>|undefined
export function loadWorldArt():Promise<WorldArt>{
  return loading??= (async()=>{
    const art:WorldArt={surfaces:{},failed:[]}
    await Promise.all(Object.entries(worldArtFiles).map(async([name,url])=>{
      const key=name as WorldMaterial,image=new Image()
      try{
        await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error(url));image.src=url})
        const t=treatments[key],surface=document.createElement('canvas');surface.width=t.w;surface.height=t.h
        const ctx=surface.getContext('2d')!;ctx.filter=t.filter;ctx.drawImage(image,0,0,t.w,t.h);ctx.filter='none'
        ctx.globalAlpha=t.opacity;ctx.fillStyle=t.tint;ctx.fillRect(0,0,t.w,t.h);ctx.globalAlpha=1
        art.surfaces[key]=surface
      }catch{art.failed.push(url)}
    }))
    return art
  })()
}
const patterns=new WeakMap<CanvasRenderingContext2D,Map<HTMLCanvasElement,CanvasPattern>>()
export function fillWorldTexture(ctx:CanvasRenderingContext2D,art:WorldArt|undefined,key:WorldMaterial,x:number,y:number,w:number,h:number):boolean{
  const surface=art?.surfaces[key];if(!surface)return false
  let cache=patterns.get(ctx);if(!cache){cache=new Map();patterns.set(ctx,cache)}
  let pattern=cache.get(surface)
  if(!pattern){const created=ctx.createPattern(surface,'repeat');if(!created)return false;pattern=created;cache.set(surface,pattern)}
  ctx.fillStyle=pattern;ctx.fillRect(x,y,w,h);return true
}
