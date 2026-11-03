/** Positions refer to the property image, independently of the wiring diagram. */
export type PhotoPoint={x:number;y:number};
/** A route is a photo annotation for one item, not a power connection or measurement. */
export type PhotoRoute={kind:'lights'|'cord';points:PhotoPoint[]};
export type PropertyPhoto={photo:string;placements:Record<string,PhotoPoint>;routes?:Record<string,PhotoRoute>};

const isPoint=(point:unknown):point is PhotoPoint=>{
 if(!point||typeof point!=='object')return false;
 const p=point as {x?:unknown;y?:unknown};
 return typeof p.x==='number'&&Number.isFinite(p.x)&&p.x>=0&&p.x<=1&&typeof p.y==='number'&&Number.isFinite(p.y)&&p.y>=0&&p.y<=1;
};

/** Permit absent legacy data while rejecting damaged photo layouts on import. */
export function isPropertyPhoto(value:unknown):value is PropertyPhoto{
 if(!value||typeof value!=='object')return false;
 const candidate=value as {photo?:unknown;placements?:unknown;routes?:unknown};
 if(typeof candidate.photo!=='string'||!candidate.placements||typeof candidate.placements!=='object'||Array.isArray(candidate.placements))return false;
 if(!Object.values(candidate.placements).every(isPoint))return false;
 if(candidate.routes===undefined)return true;
 if(!candidate.routes||typeof candidate.routes!=='object'||Array.isArray(candidate.routes))return false;
 return Object.values(candidate.routes).every(route=>{
  if(!route||typeof route!=='object')return false;
  const r=route as {kind?:unknown;points?:unknown};
  return (r.kind==='lights'||r.kind==='cord')&&Array.isArray(r.points)&&r.points.length>=2&&r.points.length<=500&&r.points.every(isPoint);
 });
}

/** Store relative image coordinates so markers stay in place as the photo resizes. */
export function propertyPhotoPoint(clientX:number,clientY:number,rect:Pick<DOMRect,'left'|'top'|'width'|'height'>){
 if(rect.width<=0||rect.height<=0)return undefined;
 return {x:Math.max(0,Math.min(1,(clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(clientY-rect.top)/rect.height))};
}
