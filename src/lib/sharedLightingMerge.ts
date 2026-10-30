import type {Project,LightPlacement,LightStock,SharedLighting} from './model';
import {isSharedLightingRecord} from './sharedLighting';
type Hashes=Record<string,string>;
const key=(kind:'stock'|'placement',id:string)=>kind+':'+id;
/** Only merge independent changes with a shared per-item baseline. Deletions remain conflict-protected.
 * No guessed last-write-wins decisions and no unencrypted private inventory snapshots. */
export function mergeConcurrentLighting(local:Project,remote:Project,baseline:Hashes,lHash:Hashes,rHash:Hashes):Project|null{
 if(!isSharedLightingRecord(local)||!isSharedLightingRecord(remote))return null;
 const ls=local.sharedLighting||{stock:[],placements:[]};
 const rs=remote.sharedLighting||{stock:[],placements:[]};
 function merge<T extends {id:string}>(kind:'stock'|'placement',left:T[],right:T[]):T[]|null{
  const l=new Map(left.map(v=>[v.id,v])),r=new Map(right.map(v=>[v.id,v]));
  const result:T[]=[];
  for(const id of new Set([...l.keys(),...r.keys()])){
   const a=l.get(id),b=r.get(id),k=key(kind,id),base=baseline[k],lh=lHash[k],rh=rHash[k];
   if(a&&b){
    if(lh===rh){result.push(a);continue;}
    if(base&&base===lh){result.push(b);continue;}
    if(base&&base===rh){result.push(a);continue;}
    return null;
   }
   // Unknown deletion vs addition: only safely combine rows absent from the
   // last common baseline. Previously recorded rows require manual resolution.
   if(base)return null;
   result.push((a||b)!);
  }
  return result;
 }
 const stock=merge<LightStock>('stock',ls.stock,rs.stock);if(!stock)return null;
 const placements=merge<LightPlacement>('placement',ls.placements,rs.placements);if(!placements)return null;
 if(placements.some(p=>!stock.some(s=>s.id===p.stockId)))return null;
 const changeMap=new Map([...ls.changes||[],...rs.changes||[]].map(c=>[c.at+'|'+c.summary,c]));
 const sharedLighting:SharedLighting={stock,placements,changes:[...changeMap.values()].sort((a,b)=>a.at.localeCompare(b.at)).slice(-100)};
 return {...local,sharedLighting};
}
