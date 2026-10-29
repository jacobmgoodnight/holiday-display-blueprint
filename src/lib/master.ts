import type {WorkbookPreview} from './excel';
import type {Component,Connection,Kind,Project,Zone} from './model';
import {now,outputCount} from './model';
import {connect,validateGraph} from './graph';

/** Local-only, source-aware imports. Do not commit homeowner workbook data as fixtures. */
export type MasterImport={season:'Halloween'|'Christmas';project:Project;worksheet:string;scanned:number;linked:number;issues:string[];excluded:string[];provenance:'structured'|'narrative'};
const val=(x:unknown)=>String(x??'').trim();
export function detectMaster(sheets:WorkbookPreview[]):'Halloween'|'Christmas'|null{
 if(sheets.some(s=>s.name==='2026 Connections'&&s.rows.some(r=>r.some(x=>/upstream id/i.test(x)))))return 'Halloween';
 if(sheets.some(s=>s.name==='Cords & Connections'&&s.rows.some(r=>r.some(x=>/power zone/i.test(x)))))return 'Christmas';
 return null;
}
const zone=(s:string,parent=''):Zone=>{
 if(/back|rear|fog|fence|side.house|morning.room/i.test(s)||parent==='O03')return 'Backyard';
 if(/garage|scarecrow|roof|left.tree/i.test(s)||parent==='O02')return 'Garage & driveway';
 if(/front|porch|lawn|skelly|pumpkin|right.bed/i.test(s)||parent==='O01')return 'Front porch';
 return 'Other';
};
const kind=(id:string,t:string,name:string):Kind=>{
 const s=(t+' '+name).toLowerCase();
 if(/^[OI]\d/.test(id)||/^outlet$/i.test(t))return 'outlet';
 if(/^K\d/.test(id)||/kasa|smart.plug/.test(s))return 'smart-plug';
 if(/^C\d/.test(id)||/extension cord/.test(s))return 'cord';
 if(/^S\d/.test(id)||/splitter|distribution/.test(s))return 'splitter';
 if(/^L\d/.test(id)||/spotlight|blacklight|^light$/.test(s))return 'spotlight';
 if(/^P\d/.test(id)||/projector/.test(s))return 'projector';
 if(/^D\d/.test(id)||/decoration/.test(s))return 'decoration';
 if(/spt.?1/.test(s))return 'spt-1';
 if(/strand|c9|mini.light/.test(s))return 'light-strand';
 if(/controller|esp32/.test(s))return 'controller';
 return 'accessory';
};
const port=(s:string):number|undefined=>{
 if(/\bleft\b/i.test(s))return 0;
 if(/\bright\b/i.test(s))return 1;
 const m=s.match(/(?:port|output|socket)\s*#?\s*(\d+)/i);
 return m?Number(m[1])-1:undefined;
};
const numeric=(s:string):number|undefined=>/^\d+(\.\d+)?$/.test(s)?Number(s):undefined;
const make=(id:string,name:string,k:Kind,z:Zone,i:number,notes:string,metadata:Record<string,unknown>):Component=>({
 id,name,kind:k,zone:z,position:{x:70+(i%5)*250,y:90+Math.floor(i/5)*170},
 outputs:outputCount(k),inputGender:k==='outlet'?undefined:'male',outputGender:outputCount(k)?'female':undefined,
 assetId:id,verified:false,notes,metadata
});
export function buildMasterDraft(sheets:WorkbookPreview[],file:string):MasterImport{
 const season=detectMaster(sheets);if(!season)throw Error('Master workbook not recognized. Use manual column mapping.');
 const issues:string[]=[],excluded:string[]=[];
 const year=Number(file.match(/20\d\d/)?.[0]||'2026');
 const project:Project={id:crypto.randomUUID(),season,year,name:season+' '+year+' · master workbook import (review)',status:'draft',example:false,
  createdAt:now(),updatedAt:now(),nodes:[],edges:[],checklist:{}};
 if(season==='Halloween'){
  const sheet=sheets.find(s=>s.name==='2026 Connections');if(!sheet)throw Error('Missing 2026 Connections worksheet.');
  const head=sheet.rows.findIndex(r=>r.some(x=>val(x).toLowerCase()==='upstream id'));if(head<0)throw Error('Missing Upstream ID header.');
  const cols=sheet.rows[head].map(x=>val(x).toLowerCase());
  const col=(r:string[],name:string)=>val(r[cols.indexOf(name)]);
  const entries:{id:string;up:string;hint:string;row:number}[]=[];
  const cordSheet=sheets.find(s=>s.name==='2026 Cord Tags');
  const tags=new Map<string,string[]>();
  if(cordSheet){const h=cordSheet.rows.findIndex(r=>r.some(x=>val(x).toLowerCase()==='cord id'));
   if(h>=0)for(const r of cordSheet.rows.slice(h+1))if(/^C\d\d$/.test(val(r[0])))tags.set(val(r[0]),r);}
  for(let i=head+1;i<sheet.rows.length;i++){
   const r=sheet.rows[i];if(!r.some(x=>val(x)))continue;
   const id=col(r,'id'),up=col(r,'upstream id'),hint=col(r,'upstream port'),type=col(r,'type'),status=col(r,'status');
   if(!id){excluded.push('Row '+(i+1)+': missing ID');continue;}
   if(/^(LINK01|AV01|SPK01|S03-P3)$/.test(id)||/audio signal|ble control|battery.powered|^unused$/i.test(type)){
    excluded.push('Row '+(i+1)+' ('+id+'): not an AC power connection');continue;}
   if(project.nodes.some(n=>n.id===id)){issues.push('Row '+(i+1)+': duplicate '+id);continue;}
   const name=col(r,'device / connection'),loc=col(r,'location'),k=kind(id,type,name);
   const tag=tags.get(id);
   const notes=[col(r,'field notes'),'Workbook status: '+status,'Source port: '+hint,
    col(r,'switch / timer')?'Switch: '+col(r,'switch / timer'):'',
    tag?.[10]?'Cord note: '+val(tag[10]):''].filter(Boolean).join('\n');
   const n=make(id,id+' · '+name,k,zone(loc,/^O\d\d$/.test(id)?id:undefined),project.nodes.length,notes,
    {source:{workbook:file,worksheet:sheet.name,row:i+1},sourceStatus:status,sourcePortText:hint});
   const size=numeric(col(r,'cord ft est.'))??numeric(val(tag?.[4]));
   if(size!==undefined)n.lengthFt=size;
   const c=val(tag?.[3]);if(c&&c!=='Unknown')n.color=c;
   const storage=val(tag?.[8]);if(storage&&storage!=='Unknown')n.inventory={storage};
   if(id==='P01'){n.outputs=1;n.outputGender='female';}
   project.nodes.push(n);entries.push({id,up,hint,row:i+1});
  }
  // Output counts reflect recorded branches, rather than cord-type assumptions.
  for(const n of project.nodes){
   const children=entries.filter(e=>e.up===n.id);
   if(!children.length)continue;
   const maxPort=Math.max(0,...children.map(e=>port(e.hint)===undefined?0:port(e.hint)!+1));
   n.outputs=Math.max(n.outputs,children.length,maxPort);
   if(n.outputs>16){issues.push(n.id+': more than 16 connections');n.outputs=16;}
   if(n.outputs>0)n.outputGender='female';
  }
  for(const e of entries){
   if(!e.up||e.up==='—'||/^(TBD|N\/A)$/i.test(e.up)){
    if(!/^outlet$/.test(project.nodes.find(n=>n.id===e.id)?.kind||''))issues.push(e.id+': unconfirmed upstream at row '+e.row);
    continue;
   }
   if(!project.nodes.some(n=>n.id===e.up)){issues.push(e.id+': upstream '+e.up+' is missing/excluded');continue;}
   try{
    const next=connect(project.nodes,project.edges,e.up,e.id,port(e.hint));
    project.edges=next.map((item,i)=>i===next.length-1?{...item,metadata:{source:{workbook:file,worksheet:sheet.name,row:e.row},portLabel:e.hint}}:item);
   }catch(err){issues.push(e.id+' row '+e.row+': '+String(err));}
  }
 }else{
  const sheet=sheets.find(s=>s.name==='Cords & Connections');if(!sheet)throw Error('Missing Cords & Connections worksheet.');
  const head=sheet.rows.findIndex(r=>r.some(x=>val(x).toLowerCase()==='power zone'));if(head<0)throw Error('Missing Power zone header.');
  for(const [id,name] of [['O01','Front porch outlet'],['O02','Left garage outlet'],['O03','Back porch outlet']]){
   project.nodes.push(make(id,id+' · '+name,'outlet',zone('',id),project.nodes.length,
    'Described source only; installed wiring is unverified.',{sourceWorkbook:file}));
  }
  for(let i=head+1;i<sheet.rows.length;i++){
   const r=sheet.rows[i],group=val(r[0]),to=val(r[2]),from=val(r[1]);
   if(!/^O0[123](\b|\s)/.test(group)||!to)continue;
   const text=['Zone: '+group,'From: '+from,'To / load: '+to,'Cord or tap: '+val(r[3]),
    'Evidence: '+val(r[4]),'Check: '+val(r[5])].join('\n');
   const n=make('review-'+(i+1),'Review '+(i+1)+' · '+to,kind('',to,val(r[3])),zone('',group.slice(0,3)),project.nodes.length,
    text,{source:{workbook:file,worksheet:sheet.name,row:i+1},connectionNotVerified:true});
   n.outputs=0;n.outputGender=undefined;project.nodes.push(n);
  }
  issues.push('The Christmas workbook uses descriptive rows without stable component IDs. Review items remain intentionally unconnected to avoid fabricating electrical links.');
  issues.push('Check the morning-room SPT-1 feeder connects to a covered-porch C9 female, not directly to the white SPT-1 feeder.');
 }
 const errors=validateGraph(project.nodes,project.edges);if(errors.length)throw Error('Invalid imported graph: '+errors[0].message);
 return {season,project,worksheet:season==='Halloween'?'2026 Connections':'Cords & Connections',
  scanned:project.nodes.length,linked:project.edges.length,issues,excluded,provenance:season==='Halloween'?'structured':'narrative'};
}
