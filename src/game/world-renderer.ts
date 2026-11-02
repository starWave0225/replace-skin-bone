import { TILE, worldMaps } from './world'
import type { WorldMap, WorldObject, WorldSpot } from './world'
import type { WorldState } from './types'
import { drawDisguisedPlayer } from './player-sprite'
import type { DisguiseFrame, PlayerAppearance } from './player-sprite'
import { fillWorldTexture } from './world-art'
import type { WorldArt } from './world-art'

type Ctx = CanvasRenderingContext2D
const palette={floor:'#414a3b',grass:'#5b6851',stone:'#949782',ink:'#26392e',roof:'#455658',roofLight:'#728079',red:'#7e4f3d',wood:'#726044',gold:'#baa16a',paper:'#dbd0a8'}
function rect(c:Ctx,x:number,y:number,w:number,h:number,color:string){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function line(c:Ctx,points:number[],color:string,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(points[0],points[1]);for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);c.stroke()}
function ellipse(c:Ctx,x:number,y:number,w:number,h:number,color:string){c.fillStyle=color;c.beginPath();c.ellipse(x,y,w,h,0,0,Math.PI*2);c.fill()}
function label(c:Ctx,text:string,x:number,y:number,size=12,color=palette.paper){c.fillStyle=color;c.font=`${size+4}px NotoSerif,SimSun,serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,x,y)}
function tile(c:Ctx,atlas:HTMLImageElement|undefined,sx:number,sy:number,x:number,y:number,w=32,h=32){if(atlas?.complete&&atlas.naturalWidth)c.drawImage(atlas,sx*16,sy*16,16,16,x,y,w,h)}
const noise=(x:number,y:number)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)}
export function makeBackground(map:WorldMap,atlas?:HTMLImageElement,art?:WorldArt):HTMLCanvasElement{
  const surface=document.createElement('canvas');surface.width=map.width*TILE;surface.height=map.height*TILE;const c=surface.getContext('2d')!;c.imageSmoothingEnabled=false
  const textured=fillWorldTexture(c,art,map.interior?(map.id==='yamen'?'stone':'floor'):'earth',0,0,surface.width,surface.height)
  if(!textured)for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++){
    const px=x*TILE,py=y*TILE,n=noise(x,y)
    if(map.interior){
      rect(c,px,py,TILE,TILE,map.id==='yamen'?'#555c50':n>.5?'#655940':'#685c43');rect(c,px,py,1,32,'#242e2633');rect(c,px,py+31,32,1,'#b09b7133')
      for(let k=0;k<14;k++){const xx=px+2+noise(x*17+k,y)*27,yy=py+noise(k+y,x)*31;rect(c,xx,yy,noise(k,x)>0.6?12:5,1,noise(k,y)>.5?'#bc9e7022':'#322e251f')}
      if(n>.8){rect(c,px+3,py+3,1,2,'#c2b18c55');rect(c,px+27,py+28,1,2,'#242e2688')}
    }else{
      rect(c,px,py,TILE,TILE,n>.75?'#59604b':n>.4?'#565d49':'#535b47')
      if(n>.84){c.globalAlpha=.1;tile(c,atlas,1,0,px,py);c.globalAlpha=1}
      for(let k=0;k<27;k++){const xx=px+noise(k+x*19,y)*32,yy=py+noise(k+y*13,x)*32;rect(c,xx,yy,1+noise(k,y)*3,1+noise(x,k)*2,k%3?'#85906b35':'#293f3044');if(k%7===0){rect(c,xx,yy-3,1,4,'#8f97714a');rect(c,xx+2,yy-1,1,3,'#3c503466')}}
    }
  }
  if(textured&&!map.interior){
    // Damp, uneven vegetation sits over the seamless soil, below roads and buildings.
    for(let k=0;k<90;k++){
      const x=noise(k,14)*surface.width,y=noise(k,29)*surface.height,r=18+noise(k,41)*60
      const patch=c.createRadialGradient(x,y,0,x,y,r);patch.addColorStop(0,k%3?'#586d3f66':'#283f2e66');patch.addColorStop(1,'#4d654000');c.fillStyle=patch;c.fillRect(x-r,y-r,r*2,r*2)
    }
  }
  if(map.id==='street'){
    road(c,2,15,38,4,art);road(c,18,2,5,28,art);road(c,6,10,4,6,art);road(c,32,10,4,7,art);road(c,6,27,15,3,art);road(c,20,26,17,3,art)
    // A river with a walkable stone bridge. No stepping across water.
    rect(c,32,20*TILE,40*TILE,2*TILE,'#344e4b');rect(c,32,20*TILE,40*TILE,4,'#768577');rect(c,32,22*TILE-4,40*TILE,4,'#293d35');fillWorldTexture(c,art,'brick',32,20*TILE-6,40*TILE,7);fillWorldTexture(c,art,'brick',32,22*TILE-1,40*TILE,7)
    for(let n=0;n<85;n++){const x=40+noise(n,2)*1240,y=20*TILE+7+noise(n,6)*47;rect(c,x,y,9+noise(n,8)*13,1,'#82938455')}
    road(c,18,19.7,5,2.7,art);for(const x of [18,22.8]){rect(c,x*TILE,19.8*TILE,4,2.7*TILE,'#535e4c');for(let y=20;y<22.5;y+=.8)rect(c,x*TILE-2,y*TILE,8,9,'#b0ae8c')}
    // Stalls, banners and a standing noticeboard.
    rect(c,16.5*TILE,12.4*TILE,31,30,'#594b35');rect(c,16.7*TILE,12.6*TILE,19,18,'#c4b68c');line(c,[17*TILE,13*TILE,17*TILE,14*TILE],'#3d4232',3);label(c,'告',17*TILE,12.9*TILE,11,'#745a40')
    rect(c,24*TILE,17.5*TILE,42,8,'#85704b');rect(c,24*TILE+3,17.5*TILE+8,3,10,'#4c4c35');rect(c,24*TILE+35,17.5*TILE+8,3,10,'#4c4c35')
  }else if(!map.interior){
    road(c,11,3,6,map.height-5,art);road(c,7,10,map.width-13,4,art)
    if(map.id==='home'&&!fillWorldTexture(c,art,'stone',8*TILE,3*TILE,10*TILE,5*TILE)){rect(c,8*TILE,3*TILE,10*TILE,5*TILE,'#aaa287');for(let x=8;x<18;x++)for(let y=3;y<8;y++){rect(c,x*TILE+1,y*TILE+1,30,30,'#999b81');rect(c,x*TILE+4,y*TILE+4,24,24,'#a6a58a')}}
  }
  // Stains, fallen leaves and shallow puddles break the repeated ground.
  if(!map.interior)for(let k=0;k<map.width*map.height/3;k++){
    const x=(1+noise(k,27)*(map.width-2))*TILE,y=(1+noise(k,53)*(map.height-2))*TILE
    if(k%8===0){ellipse(c,x,y,7+noise(k,5)*10,2,'#273d3326');line(c,[x-4,y,x+6,y],'#aeb49a24')}
    else{rect(c,x,y,2,1,k%3?'#b1a57255':'#4c432a66');rect(c,x+1,y-1,1,2,'#b1a57222')}
  }
  // Boundary walls and their brickwork.
  for(let x=0;x<map.width;x++){wall(c,x*TILE,0,32,32,art);wall(c,x*TILE,(map.height-1)*TILE,32,32,art)}
  for(let y=1;y<map.height-1;y++){wall(c,0,y*TILE,32,32,art);wall(c,(map.width-1)*TILE,y*TILE,32,32,art)}
  if(map.interior){for(const x of [2,map.width-3])for(let y=3;y<map.height-2;y+=5){rect(c,x*TILE-3,y*TILE-13,11,36,'#784c38');rect(c,x*TILE-5,y*TILE+20,15,5,'#3b3d2d')}}
  return surface
}
function road(c:Ctx,x:number,y:number,w:number,h:number,art?:WorldArt){
  if(fillWorldTexture(c,art,'stone',x*TILE,y*TILE,w*TILE,h*TILE)){
    rect(c,x*TILE,y*TILE,w*TILE,2,'#d1d0ad22');rect(c,x*TILE,(y+h)*TILE-3,w*TILE,3,'#243d3355')
    for(let k=0;k<w*2;k++){const px=(x+noise(k,y)*w)*TILE;rect(c,px,y*TILE-1,3,3,'#7c8a5155');rect(c,px,(y+h)*TILE-2,4,3,'#5b704d77')}
    return
  }
  rect(c,x*TILE,y*TILE,w*TILE,h*TILE,'#606959');c.save();c.beginPath();c.rect(x*TILE,y*TILE,w*TILE,h*TILE);c.clip()
  for(let yy=y;yy<y+h;yy+=.5)for(let xx=x-1;xx<x+w;xx++){
    const offset=Math.round(yy*2)%2?.45:0,px=(xx+offset)*TILE,py=yy*TILE,n=noise(xx,yy)
    rect(c,px,py,31,15,n>.7?'#8e9381':n>.35?'#858d7d':'#7f8877');rect(c,px+2,py+1,27,1,'#c4c3aa40');rect(c,px+2,py+13,27,1,'#4b5e493d')
    for(let k=0;k<5;k++)rect(c,px+noise(k+xx,yy)*29,py+noise(k+yy,xx)*13,2+noise(xx,k)*5,1,'#c8c9b021')
    if(n>.74)line(c,[px+14,py,px+11,py+6,px+15,py+10,px+13,py+14],'#4b5a4a66')
    if(n<.25){rect(c,px+2,py+12,7,2,'#63744e66');rect(c,px+21,py+14,9,1,'#81905a88')}
  }c.restore()
}
function wall(c:Ctx,x:number,y:number,w:number,h:number,art?:WorldArt){if(fillWorldTexture(c,art,'brick',x,y,w,h)){rect(c,x,y,w,3,'#aeb49a77');rect(c,x,y+h-3,w,3,'#203a3255');return}rect(c,x,y,w,h,'#687162');for(let yy=0;yy<h;yy+=8){rect(c,x,y+yy,w,1,'#394d3b66');for(let xx=(yy%16?8:0);xx<w;xx+=16)rect(c,x+xx,y+yy,1,8,'#394d3b66')}rect(c,x,y,w,3,'#9a9e80')}
export function drawObject(c:Ctx,o:WorldObject,atlas?:HTMLImageElement,art?:WorldArt){
  const x=o.x*TILE,y=o.y*TILE,w=(o.w??1)*TILE,h=(o.h??1)*TILE
  if(o.kind==='house'){
    ellipse(c,x+w*.53,y+h+5,w*.56,16,'#162a244d');rect(c,x+8,y+h*.4,w-16,h*.6,'#a49e7e');rect(c,x+14,y+h*.45,w-28,h*.5,'#c6b38c');rect(c,x+8,y+h-9,w-16,12,'#615f49')
    fillWorldTexture(c,art,'plaster',x+14,y+h*.45,w-28,h*.5)
    for(let k=0;k<(art?20:90);k++){const xx=x+12+noise(k,x)*(w-24),yy=y+h*.48+noise(k,y)*h*.48;rect(c,xx,yy,1+noise(k,w)*6,1+noise(k,h)*4,k%3?'#e0d4af22':'#646d4c38');if(k<12)line(c,[xx,yy,xx+2,yy+8,xx,yy+13],'#535c3e22')}
    rect(c,x+10,y+h-17,w-20,8,'#59674855')
    for(let k=0;k<Math.floor(w/45);k++){const xx=x+20+k*45;rect(c,xx-2,y+h*.53-2,28,32,'#5f5e47');rect(c,xx,y+h*.53,24,28,'#394b41');rect(c,xx+2,y+h*.53+2,20,23,'#ad9e7288');rect(c,xx+3,y+h*.53+4,18,19,'#d2b77d55');for(let q=0;q<3;q++){rect(c,xx+4+q*6,y+h*.53+2,1,23,'#514e3c');rect(c,xx+2,y+h*.53+6+q*7,20,1,'#514e3c')}rect(c,xx-3,y+h*.53+28,30,3,'#8e8061')}
    rect(c,x+w/2-16,y+h-52,32,45,'#483e2d');rect(c,x+w/2-13,y+h-50,26,42,'#5e4832');fillWorldTexture(c,art,'wood',x+w/2-13,y+h-50,26,42);rect(c,x+w/2-1,y+h-50,2,42,'#302f25');rect(c,x+w/2-19,y+h-57,38,7,'#88704b');rect(c,x+w/2-23,y+h-5,46,6,'#969478');rect(c,x+w/2-27,y+h+1,54,6,'#b6ad89')
    for(const xx of [x+11,x+w-17]){rect(c,xx,y+h*.42,6,h*.56,'#714e38');fillWorldTexture(c,art,'wood',xx,y+h*.42,6,h*.56)}
    // Upturned eaves and layered grey tiles; no western gables.
    c.fillStyle=o.color??palette.roof;c.beginPath();c.moveTo(x+12,y+5);c.lineTo(x+w-12,y+5);c.lineTo(x+w+12,y+h*.48);c.lineTo(x+w+20,y+h*.42);c.lineTo(x+w+15,y+h*.57);c.lineTo(x-15,y+h*.57);c.lineTo(x-20,y+h*.42);c.lineTo(x-12,y+h*.48);c.closePath();c.fill()
    c.save();c.clip()
    const roofTextured=fillWorldTexture(c,art,'roof',x-20,y,w+40,h*.58)
    if(roofTextured)c.globalAlpha=.32
    for(let yy=10;yy<h*.54;yy+=7){const inset=8-yy*.17;line(c,[x+inset,y+yy,x+w-inset,y+yy],'#263c3d88',2);for(let xx=inset+3;xx<w-inset;xx+=9){const n=noise(xx,yy);rect(c,x+xx,y+yy-5,7,5,n>.7?'#7b8580':n>.3?'#64746f':'#526762');rect(c,x+xx,y+yy-5,1,5,'#a7ab922c');rect(c,x+xx+6,y+yy-4,1,5,'#2a444066');if(n>.9)rect(c,x+xx,y+yy-4,3,2,'#8c9a6788')}}c.restore()
    rect(c,x-13,y+h*.55,w+26,4,'#263d37');for(let xx=0;xx<w;xx+=13){rect(c,x+xx,y+h*.56,3,6,'#8d8060');rect(c,x+xx+3,y+h*.56,5,3,'#35463a')}
    line(c,[x+5,y+5,x+w-5,y+5],'#969d86',5);line(c,[x-17,y+h*.5,x-23,y+h*.36],'#7d8875',4);line(c,[x+w+17,y+h*.5,x+w+23,y+h*.36],'#7d8875',4)
    const signW=Math.min(w-40,100);rect(c,x+w/2-signW/2,y+h*.58,signW,24,'#3b4434');rect(c,x+w/2-signW/2+2,y+h*.58+2,signW-4,20,'#5b5140');label(c,o.title??'',x+w/2,y+h*.58+12,12,'#d7c18c')
  }else if(['tree','pine','willow'].includes(o.kind)){
    ellipse(c,x+14,y+8,38,12,'#172d2655');line(c,[x,y,x-5,y-52,x+4,y-91],'#4c4e37',8);line(c,[x+2,y,x-1,y-52,x+6,y-85],'#837955',3);line(c,[x-3,y-45,x-24,y-72,x-43,y-78],'#4b5038',5);line(c,[x-1,y-54,x+26,y-76,x+48,y-74],'#55573b',4)
    if(o.kind==='pine'){
      // Irregular needle clusters and exposed boughs give the pine an older silhouette.
      for(let layer=0;layer<5;layer++){
        const yy=y-96+layer*14,spread=15+layer*5,cx=x+Math.sin(layer*2.5)*7
        line(c,[x,y-39-layer*9,cx-spread,yy+12,cx+spread,yy+7],'#4a5139',3)
        for(let k=0;k<36;k++){
          const xx=cx+(noise(k+layer*39,x)*2-1)*spread,leafY=yy+noise(k+layer*61,y)*16
          rect(c,xx,leafY,5+noise(k,layer)*8,2+noise(layer,k)*4,k%5===0?'#7c8a61':k%3===0?'#526b4a':k%2?'#3b5940':'#2b4736')
          if(k%4===0)line(c,[xx,leafY+2,xx+4,leafY-2],'#98a37555')
        }
      }
    }
    else{for(let k=0;k<250;k++){
      const angle=noise(k,x)*Math.PI*2,r=Math.sqrt(noise(k,y))*49,xx=x+Math.cos(angle)*r,yy=y-73+Math.sin(angle)*r*.58
      const leafColor=k%6===0?'#8a946b':k%4===0?'#687d54':k%3===0?'#4d6b48':k%2===0?'#3a5840':'#304e3b'
      rect(c,xx,yy,3+noise(k,15)*9,2+noise(k,32)*6,leafColor);if(k%5===0)rect(c,xx,yy,3,1,'#a9aa773d')
    }
      if(o.kind==='willow'){for(let k=0;k<23;k++){const xx=x-45+k*4,drop=39+noise(k,x)*47;line(c,[xx,y-75,xx-2,y-75+drop*.5,xx-8,y-75+drop],k%3?'#8b9a6477':'#b2b47a66',1);for(let j=8;j<drop;j+=7)rect(c,xx-4-j*.06,y-75+j,2,4,k%2?'#7c9564aa':'#a0a76e88')}}
    }
    if(atlas?.complete&&o.kind==='tree'){c.globalAlpha=.15;tile(c,atlas,5,0,x-16,y-75,32,32);c.globalAlpha=1}
  }else if(o.kind==='wall'){wall(c,x,y,w,h,art);rect(c,x-4,y-4,w+8,7,'#3e5550');for(let xx=x-4;xx<x+w+4;xx+=8){ellipse(c,xx+4,y-3,4,3,'#7f8d7c');rect(c,xx+1,y-2,5,4,'#334d45')}line(c,[x-5,y-6,x+w+5,y-6],'#acb09666',1)}
  else if(o.kind==='stage'){
    rect(c,x,y,w,h,'#493b2d');fillWorldTexture(c,art,'floor',x,y,w,h);rect(c,x-5,y+h,w+10,8,'#9c7950');rect(c,x-9,y+h+8,w+18,5,'#b3945e');for(let xx=0;xx<w;xx+=16)rect(c,x+xx,y,1,h,'#87724733')
    rect(c,x,y,22,h,'#704c3d');rect(c,x+w-22,y,22,h,'#704c3d');for(let i=0;i<4;i++){rect(c,x+i*6,y,2,h,'#aa6d4644');rect(c,x+w-22+i*6,y,2,h,'#aa6d4644')}
    rect(c,x+w/2-68,y+9,136,26,'#2e392b');label(c,o.title??'',x+w/2,y+22,15,'#c8b17c');for(let k=0;k<5;k++){const xx=x+80+k*93;line(c,[xx,y+40,xx,y+65],'#c1b28b66');ellipse(c,xx,y+70,10,14,'#c9be98');rect(c,xx-5,y+68,3,1,'#394534');rect(c,xx+3,y+68,3,1,'#394534')}
  }else if(o.kind==='bed'){
    ellipse(c,x+w/2,y+h+6,w*.54,10,'#182a2344');rect(c,x,y,w,h,'#564b36');fillWorldTexture(c,art,'wood',x,y,w,h)
    rect(c,x+10,y+8,w-20,h-19,'#a09775');rect(c,x+13,y+11,w-26,26,'#c1b99b');rect(c,x+14,y+40,w-28,h-54,'#677c73')
    for(let k=0;k<5;k++)line(c,[x+20+k*22,y+42,x+18+k*22,y+h-16],'#d3c59d20',2)
    rect(c,x+3,y-8,w-6,14,'#4c4835');rect(c,x+3,y+h-7,w-6,9,'#493e2d');for(const xx of [x+2,x+w-8]){rect(c,xx,y-9,6,h+14,'#6b543b');rect(c,xx,y-11,6,3,'#b29a68')}
  }else if(o.kind==='table'){
    ellipse(c,x+w/2,y+h+7,w*.52,8,'#20332733');rect(c,x+4,y+8,w-8,h,'#5f4d32');rect(c,x,y,w,h-5,'#92784e');fillWorldTexture(c,art,'wood',x,y,w,h-5);rect(c,x+3,y+3,w-6,3,'#bea27566');rect(c,x+4,y+h,5,10,'#574b32');rect(c,x+w-9,y+h,5,10,'#574b32');rect(c,x+10,y+7,20,12,'#ddd1ac');rect(c,x+13,y+10,12,1,'#83764f');ellipse(c,x+w-15,y+13,7,4,'#c3b48a');ellipse(c,x+w-15,y+13,4,2,'#625438');if(o.title)label(c,o.title,x+w/2,y+14,11,'#503e2c')
  }else if(o.kind==='shelf'){
    rect(c,x,y,w,h,'#4f4932');rect(c,x+3,y+3,w-6,h-6,'#7c6742');fillWorldTexture(c,art,'wood',x+3,y+3,w-6,h-6);for(let yy=5;yy<h-5;yy+=21){for(let xx=6;xx<w-7;xx+=10){rect(c,x+xx,y+yy,6,14,noise(xx,yy)>.5?'#c3b68e':'#9a8055');rect(c,x+xx+1,y+yy+2,4,1,'#4d4d3633')}rect(c,x,y+yy+16,w,4,'#4e4932')}if(o.title){rect(c,x+w/2-27,y+2,54,17,'#4b5037');label(c,o.title,x+w/2,y+10,9,'#d5c197')}
  }else if(o.kind==='well'){
    ellipse(c,x+w/2,y+h*.62+7,w*.6,h*.41,'#203d343d');rect(c,x-3,y+18,w+6,h*.5,'#667567');fillWorldTexture(c,art,'brick',x-3,y+18,w+6,h*.5);ellipse(c,x+w/2,y+18,w*.6,h*.4,'#a3a88b');c.save();c.clip();fillWorldTexture(c,art,'brick',x-w*.1,y-24,w*1.2,h);c.restore();ellipse(c,x+w/2,y+16,w*.45,h*.29,'#344b46');ellipse(c,x+w/2,y+17,w*.3,h*.19,'#26423f');line(c,[x+16,y+15,x+29,y+19],'#a7c4aa55',2);for(let xx=8;xx<w;xx+=23)rect(c,x+xx,y+40,1,17,'#354f4366')
  }else if(o.kind==='mirror'){
    rect(c,x-3,y+13,6,26,'#8d7547');rect(c,x-17,y+35,34,6,'#a18a58');ellipse(c,x,y,23,29,'#796844');ellipse(c,x,y,20,26,'#b6a16b');ellipse(c,x,y,16,22,'#52665d');ellipse(c,x-3,y-4,10,17,'#81918155');line(c,[x-10,y+9,x+7,y-13],'#b4b99966',2)
  }else if(o.kind==='pot'){ellipse(c,x+14,y+25,15,7,'#35433355');rect(c,x+4,y+3,20,20,'#806346');ellipse(c,x+14,y+2,13,5,'#a18a58');ellipse(c,x+14,y+2,8,3,'#4d4930');rect(c,x+5,y+22,18,4,'#5b5437')}
  else if(o.kind==='bench'){rect(c,x,y,w,7,'#98805a');rect(c,x+3,y+7,4,9,'#645b3d');rect(c,x+w-7,y+7,4,9,'#645b3d')}
  else if(o.kind==='bamboo'){for(let k=0;k<5;k++){const xx=x+k*5;line(c,[xx,y+5,xx+2,y-50-k%2*9],'#507344',3);for(let yy=0;yy<50;yy+=10){rect(c,xx-1,y-yy,6,2,'#a5ab5e66');line(c,[xx,y-yy,xx+12,y-yy-9],'#547a4744',3)}}}
  else if(o.kind==='flowers'){for(let k=0;k<5;k++){const xx=x+k*5,yy=y+noise(k,x)*17;rect(c,xx,yy,2,8,'#829453');rect(c,xx-2,yy-2,5,4,'#b5aa6d')}}
}
export function drawLantern(c:Ctx,x:number,y:number,time:number,night:boolean){
  const sway=Math.sin(time*.0015+x)*2
  line(c,[x,y-48,x+sway,y-31],'#63583d',2);ellipse(c,x+sway,y-17,10,14,'#ad7940');ellipse(c,x+sway,y-18,7,12,'#d2aa5c');rect(c,x+sway-7,y-31,14,3,'#544a30');rect(c,x+sway-7,y-5,14,3,'#6d4b2b');line(c,[x+sway,y-3,x+sway,y+10],'#9c6240',2)
  const gradient=c.createRadialGradient(x,y-16,2,x,y-16,night?100:45);gradient.addColorStop(0,night?'#f5bd5530':'#f5bd5518');gradient.addColorStop(1,'#eab24f00');c.fillStyle=gradient;c.fillRect(x-100,y-116,200,200)
}
export function drawCharacter(c:Ctx,x:number,y:number,type:string,facing='down',frame=0){
  const step=Math.sin(frame)*2,bob=Math.abs(Math.sin(frame))*.7
  ellipse(c,x+3,y+2,11,4,'#172d2470')
  if(type==='child')c.globalAlpha=.58
  const short=type==='child'?0.77:1
  c.save();c.translate(x,y);c.scale(short,short);x=0;y=0
  const robe=type==='mother'?'#85808b':type==='woman'?'#7d4c43':type==='han'?'#4b6266':type==='tea'?'#8e8161':type==='child'?'#91aca0':'#c3c2ae'
  const shade=type==='mother'?'#5b5c66':type==='woman'?'#523d38':type==='han'?'#293e43':type==='tea'?'#605b46':type==='child'?'#657f72':'#7e9083'
  rect(c,x-6+step,y-9,4,10,'#333f35');rect(c,x+3-step,y-9,4,10,'#333f35');rect(c,x-7+step,y-1,6,3,'#23382f');rect(c,x+2-step,y-1,6,3,'#23382f')
  // Long coats and narrow shoulders use adult rather than chibi proportions.
  c.fillStyle=shade;c.beginPath();c.moveTo(x-7,y-43-bob);c.lineTo(x+8,y-43-bob);c.lineTo(x+11,y-7);c.lineTo(x-10,y-7);c.closePath();c.fill()
  c.fillStyle=robe;c.beginPath();c.moveTo(x-5,y-43-bob);c.lineTo(x+5,y-43-bob);c.lineTo(x+7,y-8);c.lineTo(x-7,y-8);c.closePath();c.fill()
  rect(c,x-11,y-41-bob,5,23,robe);rect(c,x+8,y-41-bob,5,23,shade);rect(c,x-11,y-19-bob,3,5,'#c8b18b');rect(c,x+9,y-19-bob,3,5,'#b7a17d')
  line(c,[x-4,y-41-bob,x+1,y-30-bob,x+5,y-41-bob],'#dbceaa',1);rect(c,x-7,y-29-bob,15,3,type==='woman'?'#aa8e5b':'#6d7157');rect(c,x+1,y-28,1,18,'#4b5e4533')
  for(let k=0;k<3;k++)line(c,[x-5+k*4,y-26-bob,x-7+k*6,y-9],'#3e55432e',1)
  rect(c,x-5,y-57-bob,11,14,'#28382e');rect(c,x-4,y-54-bob,9,11,'#c6b38e');rect(c,x-5,y-58-bob,11,5,type==='mother'?'#a5a798':'#2c3b32');rect(c,x-2,y-62-bob,5,4,type==='mother'?'#aaa99b':'#2b3931')
  if(facing==='up'){rect(c,x-5,y-56-bob,11,13,'#2e3e34');rect(c,x,y-44-bob,2,20,'#293c32')}
  else if(type==='woman'){rect(c,x-4,y-53-bob,9,11,'#cfccb1');rect(c,x-2,y-51-bob,1,1,'#445043');rect(c,x+2,y-51-bob,1,1,'#445043')}
  else{rect(c,x+(facing==='left'?-3:-2),y-50-bob,1,1,'#3d4536');if(facing!=='left')rect(c,x+2,y-50-bob,1,1,'#3d4536');rect(c,x,y-45-bob,2,1,'#997c61')}
  if(type==='han'){rect(c,x-9,y-57-bob,19,3,'#293c3d');rect(c,x-5,y-64-bob,11,8,'#354e4e');rect(c,x+10,y-36,2,30,'#807454');rect(c,x+8,y-39,7,2,'#b29b69')}
  if(type==='mother'){line(c,[x-7,y-40,x-13,y-20],'#615e57',2);rect(c,x-14,y-22,2,23,'#86794e')}
  c.restore();c.globalAlpha=1
}
const spriteCache=new Map<string,{surface:HTMLCanvasElement;x:number;y:number}>()
function objectSprite(o:WorldObject,atlas?:HTMLImageElement,art?:WorldArt){
  const key=JSON.stringify(o)+(atlas?.naturalWidth?'atlas':'plain')+(art?Object.keys(art.surfaces).join(','):'')
  let cached=spriteCache.get(key)
  if(!cached){const padding=140,surface=document.createElement('canvas');surface.width=(o.w??1)*TILE+padding*2;surface.height=(o.h??1)*TILE+padding*2;const ctx=surface.getContext('2d')!;ctx.imageSmoothingEnabled=false;ctx.translate(padding-o.x*TILE,padding-o.y*TILE);drawObject(ctx,o,atlas,art);cached={surface,x:o.x*TILE-padding,y:o.y*TILE-padding};spriteCache.set(key,cached)}
  return cached
}
export function renderWorld(c:Ctx,background:HTMLCanvasElement,map:WorldMap,p:WorldState,atlas:HTMLImageElement|undefined,time:number,walkFrame:number,night:boolean,appearance:PlayerAppearance,nearest:WorldSpot|undefined,disguise?:DisguiseFrame,art?:WorldArt){
  c.drawImage(background,0,0)
  // Depth sorting allows walking in front of and behind scenery.
  const objects=map.objects.filter(o=>o.kind!=='lantern').map(o=>({y:(o.y+(o.h??0))*TILE,draw:()=>{const sprite=objectSprite(o,atlas,art);c.drawImage(sprite.surface,sprite.x,sprite.y)}}))
  for(const spot of map.spots){
    if(spot.kind==='npc'){objects.push({y:spot.y*TILE,draw:()=>{drawCharacter(c,spot.x*TILE,spot.y*TILE,spot.character??'tea','down',0);label(c,spot.name,spot.x*TILE,spot.y*TILE-77,10,'#e0d6b3');if(spot.id===nearest?.id){label(c,'◆',spot.x*TILE,spot.y*TILE-91,10,'#d6b875')}}})}
    if(spot.kind==='door'){ellipse(c,spot.x*TILE,spot.y*TILE,15,7,'#d0c19833');line(c,[spot.x*TILE-6,spot.y*TILE+2,spot.x*TILE,spot.y*TILE+6,spot.x*TILE+6,spot.y*TILE+2],'#e0c88888',2);label(c,spot.name,spot.x*TILE,spot.y*TILE+22,10,'#ddd4b1')}
  }
  objects.push({y:p.y,draw:()=>drawDisguisedPlayer(c,p.x,p.y,appearance,p.facing,walkFrame,disguise)})
  objects.sort((a,b)=>a.y-b.y).forEach(o=>o.draw())
  if(night){rect(c,0,0,map.width*TILE,map.height*TILE,'#182d3b50')}
  if(!map.interior){
    for(let i=0;i<115;i++){const xx=noise(i,17)*map.width*TILE+(time*.012)%47,yy=(noise(i,59)*map.height*TILE+time*.22)%(map.height*TILE);line(c,[xx,yy,xx-3,yy+11],night?'#c2d4ca26':'#c9d6bd20',.7)}
    for(let i=0;i<3;i++){const xx=(time*.006+i*340)%(map.width*TILE+250)-125,yy=map.height*TILE*(.32+i*.19),fog=c.createRadialGradient(xx,yy,5,xx,yy,240);fog.addColorStop(0,night?'#b6c6b313':'#c7d0b00b');fog.addColorStop(1,'#c0cab000');c.fillStyle=fog;c.fillRect(xx-240,yy-240,480,480)}
  }
  for(const o of map.objects.filter(o=>o.kind==='lantern'))drawLantern(c,o.x*TILE,o.y*TILE,time,night)
  const vignette=c.createRadialGradient(p.x,p.y,90,p.x,p.y,600);vignette.addColorStop(0,'#182c1600');vignette.addColorStop(1,'#14251d77');c.fillStyle=vignette;c.fillRect(0,0,map.width*TILE,map.height*TILE)
}
