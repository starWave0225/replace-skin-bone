export interface DreamObstacle { x: number; z: number; w: number; d: number }
export const dreamObstacles: DreamObstacle[] = [
  { x: -5.7, z: -1.7, w: 2.4, d: 1.2 }, { x: 3.8, z: -6.1, w: 2.1, d: 1.3 },
  { x: -.65, z: 3.35, w: 1.3, d: 1.3 }, { x: -6.8, z: -11, w: 1, d: 2 },
  { x:-6.1,z:7.1,w:1,d:1 },{x:5.1,z:2.7,w:1,d:1},
  { x:-6.1,z:-6,w:.8,d:2 },{x:5.3,z:-11,w:.8,d:2},
  { x:5.3,z:-15.3,w:1.3,d:1.6 },
  ...[7, 2, -3, -8, -13, -17].flatMap(z => [{x:-6.9,z:z-.3,w:.6,d:.6},{x:6.3,z:z-.3,w:.6,d:.6}]),
]
export function dreamBlocked(x: number, z: number) {
  return x < -6.9 || x > 6.9 || z < -16.8 || z > 9.2 || dreamObstacles.some(o => x > o.x - .3 && x < o.x + o.w + .3 && z > o.z - .3 && z < o.z + o.d + .3)
}
export function moveInDream(position: {x:number;z:number}, dx: number, dz: number) {
  let { x, z } = position
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / .08))
  for (let i = 0; i < steps; i++) { if (!dreamBlocked(x + dx / steps, z)) x += dx / steps; if (!dreamBlocked(x, z + dz / steps)) z += dz / steps }
  return { x, z }
}
export function dreamPath(start: {x:number;z:number}, end: {x:number;z:number}): {x:number;z:number}[] {
  const unit=.5, cell=(n:number)=>Math.round(n/unit), key=(x:number,z:number)=>`${x},${z}`
  const s={x:cell(start.x),z:cell(start.z)}, target={x:cell(end.x),z:cell(end.z)}
  const queue=[s], seen=new Set([key(s.x,s.z)]), parent=new Map<string,typeof s>()
  for(let i=0;i<queue.length;i++){
    const at=queue[i]
    if(at.x===target.x&&at.z===target.z){const result=[{x:end.x,z:end.z}];let p=at;while(p.x!==s.x||p.z!==s.z){result.unshift({x:p.x*unit,z:p.z*unit});p=parent.get(key(p.x,p.z))!}return result}
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const next={x:at.x+dx,z:at.z+dz},k=key(next.x,next.z);if(seen.has(k)||dreamBlocked(next.x*unit,next.z*unit))continue;seen.add(k);parent.set(k,at);queue.push(next)}
  }
  return []
}
