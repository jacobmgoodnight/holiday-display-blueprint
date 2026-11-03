/** Positions refer to the property image, independently of the wiring diagram. */
export type PropertyPhoto={photo:string;placements:Record<string,{x:number;y:number}>};

/** Permit absent legacy data while rejecting damaged photo layouts on import. */
export function isPropertyPhoto(value:unknown):value is PropertyPhoto{
 if(!value||typeof value!=='object')return false;
 const candidate=value as {photo?:unknown;placements?:unknown};
 if(typeof candidate.photo!=='string'||!candidate.placements||typeof candidate.placements!=='object'||Array.isArray(candidate.placements))return false;
 return Object.values(candidate.placements).every(point=>{
  if(!point||typeof point!=='object')return false;
  const p=point as {x?:unknown;y?:unknown};
  return typeof p.x==='number'&&Number.isFinite(p.x)&&p.x>=0&&p.x<=1&&typeof p.y==='number'&&Number.isFinite(p.y)&&p.y>=0&&p.y<=1;
 });
}

/** Store relative image coordinates so markers stay in place as the photo resizes. */
export function propertyPhotoPoint(clientX:number,clientY:number,rect:Pick<DOMRect,'left'|'top'|'width'|'height'>){
 if(rect.width<=0||rect.height<=0)return undefined;
 return {x:Math.max(0,Math.min(1,(clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(clientY-rect.top)/rect.height))};
}
