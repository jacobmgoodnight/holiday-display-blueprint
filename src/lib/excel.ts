import * as XLSX from 'xlsx';
import type {Project,Kind,Zone} from './model';
import {kinds,outputCount} from './model';
import {connect} from './graph';
export type WorkbookPreview={name:string;rows:string[][];imageWarning:string};
export type ImportMode='components'|'connections';
export type Mapping={id:string;name:string;kind:string;zone:string;source:string;target:string;port:string};
export const emptyMapping:Mapping={id:'',name:'',kind:'',zone:'',source:'',target:'',port:''};
export async function readWorkbook(file:File):Promise<WorkbookPreview[]>{
 const data=await file.arrayBuffer(); const workbook=XLSX.read(data,{type:'array',cellDates:true,bookVBA:false});
 // SheetJS community XLSX parsing does not reliably expose anchored embedded photos.
 const asText=new TextDecoder('latin1').decode(data);const embedded=/xl\/media\//i.test(asText);
 return workbook.SheetNames.map(name=>{const rawRows=XLSX.utils.sheet_to_json(workbook.Sheets[name],{header:1,defval:'',raw:false,blankrows:true}) as (string|number)[][];return {name,rows:rawRows.slice(0,2000).map(row=>row.map(v=>String(v??''))),imageWarning:(embedded?'Embedded workbook images detected; image anchoring/import is unsupported. Photos remain in your original workbook.':'Embedded images are not imported or inspected; check original workbook for photos.')+(rawRows.length>2000?` Only the first 2000 of ${rawRows.length} rows are available for review; split this sheet before importing remaining rows.`:'')};});
}
export function suggestMapping(headers:string[]):Mapping{
 const find=(regex:RegExp)=>headers.findIndex(h=>regex.test(h.toLowerCase()));
 const key=(r:RegExp)=>{const ix=find(r);return ix<0?'':String(ix);};
 return {id:key(/^(id|component id|cord id|item id|device id|from id|connection id)$/),name:key(/^(name|description|item|component|decoration|device|fixture|item name)$/),kind:key(/^(type|category|kind)$/),zone:key(/^(zone|location|area)$/),source:key(/^(source|from|upstream|parent|from id)$/),target:key(/^(target|to|downstream|child|to id)$/),port:key(/^(port|output|source port|outlet number)$/)};
}
const field=(r:string[],key:string)=>key!==''?(r[Number(key)]||'').trim():'';
const kindFrom=(s:string):Kind=>{const k=s.toLowerCase();if(kinds.includes(k as Kind))return k as Kind;if(/smart|kasa/.test(k))return 'smart-plug';if(/outlet|receptacle/.test(k))return 'outlet';if(/spt/.test(k))return 'spt-1';if(/split|multi|3.way|4.way/.test(k))return 'splitter';if(/inline|tap/.test(k))return 'inline-tap';if(/projector/.test(k))return 'projector';if(/spot|flood|blacklight/.test(k))return 'spotlight';if(/cord|extension/.test(k))return 'cord';if(/strand|c9|mini light/.test(k))return 'light-strand';if(/control/.test(k))return 'controller';return 'decoration';};
const zoneFrom=(s:string):Zone=>/back|yard|fence/i.test(s)?'Backyard':/garage|drive/i.test(s)?'Garage & driveway':/porch|front/i.test(s)?'Front porch':'Other';
export type ImportResult={project:Project;added:number;skipped:string[]};
export function importMappedRows(p:Project,rows:string[][],headerIndex:number,mode:ImportMode,m:Mapping):ImportResult{
 let nodes=[...p.nodes],edges=[...p.edges];const skipped:string[]=[];let added=0;
 for(const [i,row] of rows.entries()){
  if(i<=headerIndex||!row.some(x=>x.trim()))continue;
  try{
   const metadata=Object.fromEntries(row.map((value,j)=>[rows[headerIndex]?.[j]||`Column ${j+1}`,value]));
   if(mode==='components'){
    const name=field(row,m.name);if(!name)throw Error('Missing name');
    const proposedId=field(row,m.id);const id=proposedId||crypto.randomUUID();if(nodes.some(n=>n.id===id))throw Error(`ID ${id} already exists`);
    const kind=kindFrom(field(row,m.kind));const zone=zoneFrom(field(row,m.zone));
    const zoneCount=nodes.filter(n=>n.zone===zone).length;
    nodes.push({id,assetId:id,name,kind,zone,outputs:outputCount(kind),inputGender:kind==='outlet'?undefined:'male',outputGender:outputCount(kind)?'female':undefined,position:{x:80+(zoneCount%4)*270,y:100+Math.floor(zoneCount/4)*160},metadata:{importedFields:metadata}});
   }else{
    const source=field(row,m.source),target=field(row,m.target);if(!source||!target)throw Error('Missing source or target ID');
    let port:number|undefined;const raw=field(row,m.port);
    if(raw){const number=Number(raw);if(!Number.isInteger(number)||number<1)throw Error('Output port must be a positive number');port=number-1;}
    const next=connect(nodes,edges,source,target,port);next[next.length-1]={...next[next.length-1],metadata:{importedFields:metadata}};edges=next;
   }
   added++;
  }catch(e){skipped.push(`Row ${i+1}: ${e instanceof Error?e.message:String(e)}`);}
 }
 return {project:{...p,nodes,edges,example:false,status:'draft'},added,skipped};
}
