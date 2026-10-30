import type {LightingArea,LightingEntry,LightingStatus,LightingType} from './model';

export const lightingAreas:readonly LightingArea[]=[
 'First-floor roofline','Second-floor roofline','Covered porch','Morning-room roofline','Mulch beds','Bushes','Trees','Fence','Porch columns','Storage / spare','Other'
];
export const lightingTypes:readonly LightingType[]=['C9','Mini','Other'];
export const lightingStatuses:readonly LightingStatus[]=['planned','installed','spare','repair'];
export type LightingTotals={runs:number;knownStrands:number;unknownStrandRows:number;knownBulbs:number;unknownBulbRows:number};
export const emptyTotals=():LightingTotals=>({runs:0,knownStrands:0,unknownStrandRows:0,knownBulbs:0,unknownBulbRows:0});
export function computedBulbs(e:LightingEntry):number|undefined{
 if(e.totalBulbs!==undefined)return e.totalBulbs;
 if(e.strandCount!==undefined&&e.bulbsPerStrand!==undefined)return e.strandCount*e.bulbsPerStrand;
 return undefined;
}
export function summarizeLighting(rows:readonly LightingEntry[]):LightingTotals{
 return rows.reduce((t,r)=>{
  const bulbs=computedBulbs(r);
  t.runs++;
  if(r.strandCount===undefined)t.unknownStrandRows++;else t.knownStrands+=r.strandCount;
  if(bulbs===undefined)t.unknownBulbRows++;else t.knownBulbs+=bulbs;
  return t;
 },emptyTotals());
}
export function summarizeByType(rows:readonly LightingEntry[],status:LightingStatus|'display'='display'){
 const filtered=rows.filter(r=>status==='display'?(r.status==='planned'||r.status==='installed'):r.status===status);
 return Object.fromEntries(lightingTypes.map(type=>[type,summarizeLighting(filtered.filter(r=>r.type===type))])) as Record<LightingType,LightingTotals>;
}
export function addLightEntry(rows:readonly LightingEntry[],entry:Omit<LightingEntry,'id'>):LightingEntry[]{
 return [...rows,{...entry,id:crypto.randomUUID()}];
}
export function updateLightEntry(rows:readonly LightingEntry[],id:string,changes:Partial<LightingEntry>):LightingEntry[]{
 if(!rows.some(e=>e.id===id))throw Error('Light inventory entry missing');
 for(const key of ['strandCount','bulbsPerStrand','totalBulbs','lengthPerStrandFt'] as const){
  const v=changes[key];
  if(v!==undefined&&(!Number.isFinite(v)||v<0||(key!=='lengthPerStrandFt'&&!Number.isInteger(v))))throw Error(key+' must be a non-negative number');
 }
 return rows.map(r=>r.id===id?{...r,...changes,id:r.id}:r);
}
export function newLightingEntry(type:LightingType='C9',area:LightingArea='First-floor roofline'):Omit<LightingEntry,'id'>{
 return {label:type==='C9'?'C9 run':'Mini-light strand group',type,area,status:'planned',bulbTechnology:'Unknown'};
}
const christmasSections:readonly {label:string;type:LightingType;area:LightingArea}[]=[
 {label:'First-floor C9 roofline · run 1',type:'C9',area:'First-floor roofline'},
 {label:'Second-floor C9 roofline · run 1',type:'C9',area:'Second-floor roofline'},
 {label:'Covered-porch C9 roofline',type:'C9',area:'Covered porch'},
 {label:'Morning-room C9 roofline',type:'C9',area:'Morning-room roofline'},
 {label:'Left mulch-bed C9 outline',type:'C9',area:'Mulch beds'},
 {label:'Right mulch-bed C9 outline',type:'C9',area:'Mulch beds'},
 {label:'Left garage bush mini lights',type:'Mini',area:'Bushes'},
 {label:'Right-side bush mini lights',type:'Mini',area:'Bushes'},
 {label:'Left yard tree mini lights',type:'Mini',area:'Trees'},
 {label:'Right yard tree mini lights',type:'Mini',area:'Trees'},
 {label:'Fence mini lights',type:'Mini',area:'Fence'},
 {label:'Covered-porch column mini lights',type:'Mini',area:'Porch columns'}
];
/** Optional opt-in prompts from documented sections; never claim bulb counts or installation. */
export function addChristmasSectionPrompts(rows:readonly LightingEntry[]):LightingEntry[]{
 const existing=new Set(rows.map(x=>x.label.trim().toLocaleLowerCase()));
 let next=[...rows];
 for(const spec of christmasSections){
  if(existing.has(spec.label.toLocaleLowerCase()))continue;
  next=addLightEntry(next,{...newLightingEntry(spec.type,spec.area),label:spec.label});
 }
 return next;
}
