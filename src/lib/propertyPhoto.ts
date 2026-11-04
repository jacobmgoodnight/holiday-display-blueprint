/** Positions refer to the property image, independently of the wiring diagram. */
export type PhotoPoint={x:number;y:number};
/** A route is a visual annotation, not a power connection; measured length is optional and entered separately. */
export type PhotoRoute={kind:'lights'|'cord';points:PhotoPoint[];measuredFeet?:number};
export type PhotoCalibration={start:PhotoPoint;end:PhotoPoint;knownFeet:number;aspectRatio:number};
export type PropertyPhoto={photo:string;placements:Record<string,PhotoPoint>;routes?:Record<string,PhotoRoute>;calibration?:PhotoCalibration};
/** The original photo remains the main view, preserving legacy projects and backups. */
export type AdditionalPropertyPhotoView={id:string;name:string;layout?:PropertyPhoto};
export type PropertyPhotoView={id:string;name:string;layout?:PropertyPhoto};
export const MAIN_PROPERTY_PHOTO_ID='main';
export const MAX_PROPERTY_PHOTO_VIEWS=8;
type PhotoProject={propertyPhoto?:PropertyPhoto;propertyPhotoName?:string;propertyPhotoViews?:AdditionalPropertyPhotoView[]};
export function getPropertyPhotoViews(project:PhotoProject):PropertyPhotoView[]{
 return [{id:MAIN_PROPERTY_PHOTO_ID,name:project.propertyPhotoName||'Main view',layout:project.propertyPhoto},...(project.propertyPhotoViews||[])];
}
/** Updates only the specified view, preserving concurrent edits to other views. */
export function setPropertyPhotoLayout<T extends PhotoProject>(project:T,id:string,layout:PropertyPhoto|undefined):T{
 if(id===MAIN_PROPERTY_PHOTO_ID)return {...project,propertyPhoto:layout};
 if(!project.propertyPhotoViews?.some(view=>view.id===id))return project;
 return {...project,propertyPhotoViews:project.propertyPhotoViews.map(view=>view.id===id?{...view,layout}:view)};
}

const isPoint=(point:unknown):point is PhotoPoint=>{
 if(!point||typeof point!=='object')return false;
 const p=point as {x?:unknown;y?:unknown};
 return typeof p.x==='number'&&Number.isFinite(p.x)&&p.x>=0&&p.x<=1&&typeof p.y==='number'&&Number.isFinite(p.y)&&p.y>=0&&p.y<=1;
};

/** Permit absent legacy data while rejecting damaged photo layouts on import. */
export function isPropertyPhoto(value:unknown):value is PropertyPhoto{
 if(!value||typeof value!=='object')return false;
 const candidate=value as {photo?:unknown;placements?:unknown;routes?:unknown;calibration?:unknown};
 if(typeof candidate.photo!=='string'||!candidate.placements||typeof candidate.placements!=='object'||Array.isArray(candidate.placements))return false;
 if(!Object.values(candidate.placements).every(isPoint))return false;
 if(candidate.calibration!==undefined){
  if(!candidate.calibration||typeof candidate.calibration!=='object')return false;
  const c=candidate.calibration as {start?:unknown;end?:unknown;knownFeet?:unknown;aspectRatio?:unknown};
  if(!isPoint(c.start)||!isPoint(c.end)||(c.start.x===c.end.x&&c.start.y===c.end.y)||typeof c.knownFeet!=='number'||!Number.isFinite(c.knownFeet)||c.knownFeet<=0||c.knownFeet>100000||typeof c.aspectRatio!=='number'||!Number.isFinite(c.aspectRatio)||c.aspectRatio<.01||c.aspectRatio>100)return false;
 }
 if(candidate.routes===undefined)return true;
 if(!candidate.routes||typeof candidate.routes!=='object'||Array.isArray(candidate.routes))return false;
 return Object.values(candidate.routes).every(route=>{
  if(!route||typeof route!=='object')return false;
  const r=route as {kind?:unknown;points?:unknown;measuredFeet?:unknown};
  return (r.kind==='lights'||r.kind==='cord')&&Array.isArray(r.points)&&r.points.length>=2&&r.points.length<=500&&r.points.every(isPoint)&&(r.measuredFeet===undefined||(typeof r.measuredFeet==='number'&&Number.isFinite(r.measuredFeet)&&r.measuredFeet>0&&r.measuredFeet<=100000));
 });
}

/** Validate all imported views, including unique IDs, without requiring new fields in legacy data. */
export function isAdditionalPropertyPhotoViews(value:unknown):value is AdditionalPropertyPhotoView[]{
 if(!Array.isArray(value)||value.length>=MAX_PROPERTY_PHOTO_VIEWS)return false;
 const ids=new Set<string>([MAIN_PROPERTY_PHOTO_ID]);
 for(const view of value){
  if(!view||typeof view!=='object'||typeof view.id!=='string'||!view.id.trim()||view.id.length>100||ids.has(view.id)||typeof view.name!=='string'||!view.name.trim()||view.name.length>80||(view.layout!==undefined&&!isPropertyPhoto(view.layout)))return false;
  ids.add(view.id);
 }
 return true;
}

/** Store relative image coordinates so markers stay in place as the photo resizes. */
export function propertyPhotoPoint(clientX:number,clientY:number,rect:Pick<DOMRect,'left'|'top'|'width'|'height'>){
 if(rect.width<=0||rect.height<=0)return undefined;
 return {x:Math.max(0,Math.min(1,(clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(clientY-rect.top)/rect.height))};
}
