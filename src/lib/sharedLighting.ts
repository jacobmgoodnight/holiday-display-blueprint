import type {LightingArea,LightingEntry,LightingType,LightPlacement,LightStock,Project,Season,SharedLighting} from './model';
import {now} from './model';

export const SHARED_LIGHTING_ID='shared-lighting-inventory-v1';
export const isSharedLightingRecord=(project:Pick<Project,'id'>)=>project.id===SHARED_LIGHTING_ID;
export function createSharedLightingRecord():Project{
 const stamp=now();
 return {id:SHARED_LIGHTING_ID,season:'Christmas',year:0,name:'Private shared lighting stock · internal',status:'draft',nodes:[],edges:[],checklist:{},createdAt:stamp,updatedAt:stamp,sharedLighting:{stock:[],placements:[]}};
}
export const availableStock=(projects:readonly Project[]):SharedLighting=>{
 const record=projects.find(isSharedLightingRecord);
 return record?.sharedLighting||{stock:[],placements:[]};
};
export type StockTotals={ownedKnown:number;unknownOwned:number;plannedKnown:number;installedKnown:number;unknownPlaced:number;shortKnown:number;needsReview:number};
export function totals(stock:readonly LightStock[],placements:readonly LightPlacement[],season:Season,year:number,type:LightingType):StockTotals{
 const filtered=stock.filter(s=>s.type===type&&s.condition!=='repair');
 const assignment=placements.filter(p=>p.season===season&&p.year===year&&filtered.some(s=>s.id===p.stockId));
 const usedByStock=new Map<string,number>();
 for(const x of assignment)if(x.quantity!==undefined)usedByStock.set(x.stockId,(usedByStock.get(x.stockId)||0)+x.quantity);
 return {ownedKnown:filtered.reduce((t,s)=>t+(s.owned||0),0),
  unknownOwned:filtered.filter(s=>s.owned===undefined).length,
  plannedKnown:assignment.filter(p=>p.status==='planned').reduce((t,p)=>t+(p.quantity||0),0),
  installedKnown:assignment.filter(p=>p.status==='installed').reduce((t,p)=>t+(p.quantity||0),0),
  unknownPlaced:assignment.filter(p=>p.quantity===undefined).length,
  shortKnown:filtered.reduce((t,s)=>s.owned===undefined?t:t+Math.max(0,(usedByStock.get(s.id)||0)-s.owned),0),
  needsReview:filtered.filter(s=>s.owned===undefined&&usedByStock.has(s.id)).length
 };
}
export function validateStockCount(value:number|undefined):void{
 if(value!==undefined&&(!Number.isSafeInteger(value)||value<0))throw Error('Quantity must be a whole number, zero or blank');
}
export function addStock(x:SharedLighting,type:LightingType):SharedLighting{
 const row:LightStock={id:crypto.randomUUID(),type,name:type==='C9'?'C9 bulbs / run':'Mini-light string type',unit:type==='C9'?'bulbs':'strands',condition:'good'};
 return {...x,stock:[...x.stock,row],changes:[...(x.changes||[]),{at:now(),summary:'Added lighting stock: '+row.name}].slice(-100)};
}
export function updateStock(x:SharedLighting,id:string,patch:Partial<LightStock>):SharedLighting{
 const old=x.stock.find(s=>s.id===id);if(!old)throw Error('Lighting stock not found');
 validateStockCount(patch.owned);
 validateStockCount(patch.bulbsPerStrand);
 const row={...old,...patch,id:old.id};
 const qtyChanged='owned' in patch&&old.owned!==patch.owned;
 const changes=qtyChanged?[...(x.changes||[]),{at:now(),summary:'Updated '+old.name+' from '+(old.owned===undefined?'unknown':old.owned)+' to '+(row.owned===undefined?'unknown':row.owned)+' '+old.unit}].slice(-100):x.changes;
 return {...x,stock:x.stock.map(s=>s.id===id?row:s),changes};
}
export function addPlacement(x:SharedLighting,stockId:string,season:Season,year:number,area:LightingArea,qty?:number):SharedLighting{
 if(!x.stock.some(s=>s.id===stockId))throw Error('Select existing physical lighting stock');
 validateStockCount(qty);
 const p:LightPlacement={id:crypto.randomUUID(),stockId,season,year,area,quantity:qty,status:'planned'};
 return {...x,placements:[...x.placements,p]};
}
export function updatePlacement(x:SharedLighting,id:string,patch:Partial<LightPlacement>):SharedLighting{
 if(!x.placements.some(p=>p.id===id))throw Error('Placement not found');
 validateStockCount(patch.quantity);
 return {...x,placements:x.placements.map(p=>p.id===id?{...p,...patch,id:p.id,stockId:p.stockId,season:p.season,year:p.year}:p)};
}
export function repeatLastYearAssignments(x:SharedLighting,season:Season,year:number):SharedLighting{
 const priorYears=x.placements.filter(p=>p.season===season&&p.year<year).map(p=>p.year);
 if(!priorYears.length)return x;
 const prior=Math.max(...priorYears);
 const already=new Set(x.placements.filter(p=>p.year===year&&p.season===season).map(p=>p.stockId+'|'+p.area));
 const planned=x.placements.filter(p=>p.season===season&&p.year===prior&&!already.has(p.stockId+'|'+p.area)).map(p=>({...p,id:crypto.randomUUID(),year,status:'planned' as const,componentId:undefined}));
 return {...x,placements:[...x.placements,...planned],changes:[...(x.changes||[]),{at:now(),summary:'Reused '+planned.length+' placements from '+prior+' for '+year+'; light counts unchanged'}].slice(-100)};
}
/** Explicit one-time migration of a selected annual project; never delete legacy counts. */
export function importLegacyLighting(x:SharedLighting,rows:readonly LightingEntry[],season:Season,year:number):SharedLighting{
 const known=new Set(x.stock.map(s=>s.id));
 let next=x;
 for(const row of rows){
  if(known.has(row.id))continue;
  known.add(row.id);
  const mini=row.type==='Mini';
  const owned=mini?row.strandCount:row.totalBulbs??(row.strandCount!==undefined&&row.bulbsPerStrand!==undefined?row.strandCount*row.bulbsPerStrand:undefined);
  const stock:LightStock={id:row.id,name:row.label,type:row.type,unit:mini?'strands':'bulbs',owned,
   bulbsPerStrand:row.bulbsPerStrand,bulbTechnology:row.bulbTechnology,bulbColor:row.bulbColor,wireColor:row.wireColor,
   brand:row.brand,model:row.model,storage:row.storage,condition:row.status==='repair'?'repair':'good',notes:row.notes};
  const placement:LightPlacement={id:crypto.randomUUID(),stockId:stock.id,season,year,area:row.area,
   quantity:row.status==='spare'||row.status==='repair'?undefined:owned,status:row.status==='installed'?'installed':'planned',notes:row.notes,componentId:row.componentId};
  next={...next,stock:[...next.stock,stock],placements:row.status==='spare'||row.status==='repair'?next.placements:[...next.placements,placement]};
 }
 return {...next,changes:[...(next.changes||[]),{at:now(),summary:'Imported '+rows.length+' legacy rows from '+season+' '+year+' as permanent stock'}].slice(-100)};
}
export function safeYearStockRows(x:SharedLighting,season:Season,year:number):{stock:LightStock;placements:LightPlacement[]}[]{
 return x.stock.map(stock=>({stock,placements:x.placements.filter(p=>p.stockId===stock.id&&p.season===season&&p.year===year)}));
}
export function stockCsv(x:SharedLighting,season:Season,year:number):string{
 const quote=(v:unknown)=>'"'+String(v??'').replace(/"/g,'""')+'"';
 const lines:(string|number)[][]=[['Stock ID','Item','Type','Unit','Owned','Bulbs/strand','Condition','Color','Technology','Brand','Model','Storage','Year','Area','Quantity placed','Installed?','Notes']];
 for(const item of x.stock){const rows=x.placements.filter(p=>p.stockId===item.id&&p.season===season&&p.year===year);for(const p of rows.length?rows:[undefined])lines.push([item.id,item.name,item.type,item.unit,item.owned??'',item.bulbsPerStrand??'',item.condition,item.bulbColor||'',item.bulbTechnology||'',item.brand||'',item.model||'',item.storage||'',p?.year??'',p?.area||'',p?.quantity??'',p?.status==='installed'?'Yes':p?'No':'',item.notes||'']);}
 return lines.map(r=>r.map(quote).join(',')).join('\r\n');
}
