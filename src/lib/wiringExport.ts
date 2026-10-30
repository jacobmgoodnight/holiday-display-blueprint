import * as XLSX from 'xlsx';
import {generatedTasks,warningSummary} from './graph';
import {portName} from './portLabels';
import {computedBulbs} from './lightingInventory';
import type {Project} from './model';
import type {ProjectWithWiringHistory} from './wiringEdits';

/** Readable Excel snapshot for reference/archive. NOT an editable round-trip master. */
const rows=(headings:string[],records:(string|number|boolean)[][])=>{
 const sheet=XLSX.utils.aoa_to_sheet([headings,...records]);
 sheet['!cols']=headings.map((h,i)=>({wch:Math.min(42,Math.max(13,h.length+3,i===1?34:17))}));
 if(records.length)sheet['!autofilter']={ref:XLSX.utils.encode_range({s:{r:0,c:0},e:{r:records.length,c:headings.length-1}})};
 return sheet;
};
export function createWiringReferenceWorkbook(project:Project):XLSX.WorkBook{
 const wb=XLSX.utils.book_new();
 const current=new Map(project.nodes.map(n=>[n.id,n]));
 const notes=[
  ['Export type','Reference snapshot ONLY — not an import/merge template'],
  ['Project',project.name],['Season',project.season],['Year',project.year],
  ['Installation record',project.status==='verified'?'Marked as-installed (not electrical certification)':'Draft — needs on-site verification'],
  ['Exported',new Date().toISOString()],['Component count',project.nodes.length],['Connection count',project.edges.length],
  ['Source of truth','Make wiring changes in Holiday Display Blueprint; cloud sync is opt-in via private link'],
  ['Original master XLSX','Retain separately as historical source, do not use to overwrite a newer synced plan'],
  ['Editing this workbook','Does NOT update the app or its cloud vault. Reimport may create duplicates or a separate draft.'],
  ['Photos','Not included in this Excel export. Use a private JSON backup to retain photos.'],
  ['Privacy','This workbook includes private household equipment, layout and outlet data. Do not upload to public GitHub.'],
  ['Verification','Graph-valid does not mean electrical-safe; manually verify loads, cord gauge, outlets and GFCI.'],
 ];
 const intro=XLSX.utils.aoa_to_sheet([['Holiday Display Blueprint — Excel reference'],[],['Field','Details'],...notes]);
 intro['!cols']=[{wch:26},{wch:95}];
 XLSX.utils.book_append_sheet(wb,intro,'Read Me');
 const components=project.nodes.map(n=>[
  n.id,n.name,n.kind,n.zone,n.verified?'Yes':'No',n.outputs,n.color||'',n.lengthFt??'',n.cordType||'',
  n.expectedWatts??'',n.ratedWatts??'',n.inputGender||'',n.outputGender||'',n.inventory?.storage||'',n.notes||''
 ]);
 XLSX.utils.book_append_sheet(wb,rows(
  ['Component ID','Name','Type','Zone','Verified on site','Outputs','Cord color','Length (ft)','Cord construction','Expected W','Rated W','Input plug','Output socket','Storage','Notes'],components),'Components');
 const links=project.edges.map(e=>[
  e.id,e.source,current.get(e.source)?.name||'',e.sourcePort+1,
  e.target,current.get(e.target)?.name||'',current.get(e.target)?.zone||'',e.notes||'',
  project.checklist['wire:'+e.id]?.done?'Done':'Not done',portName(current.get(e.source)||{outputs:1},e.sourcePort)
 ]);
 XLSX.utils.book_append_sheet(wb,rows(
  ['Connection ID','From ID','From item','Output port (1-based)','To ID','To item','Zone','Connection notes','Setup complete','Output port name'],links),'Power Links');
 for(const mode of ['setup','teardown'] as const){
  const tasks=generatedTasks(project,mode);
  const records=tasks.map((t,i)=>[i+1,t.phase,t.label,t.nodeId||'',project.checklist[t.id]?.done?'Done':'Not done',project.checklist[t.id]?.notes||'']);
  XLSX.utils.book_append_sheet(wb,rows(['Step','Phase','Instructions','Component ID','Status','Notes'],records),mode==='setup'?'Setup Steps':'Teardown Steps');
 }
 const lighting=(project.lightingInventory||[]).map(x=>[
  x.label,x.type,x.area,x.status,x.strandCount??'',x.bulbsPerStrand??'',x.totalBulbs??'',computedBulbs(x)??'',x.lengthPerStrandFt??'',x.bulbTechnology||'',x.bulbColor||'',x.wireColor||'',x.brand||'',x.model||'',x.storage||'',x.componentId||'',x.notes||''
 ]);
 XLSX.utils.book_append_sheet(wb,rows(
  ['Run / group','Light type','Area','Status','Strands / runs','Bulbs per strand','Custom total bulbs','Calculated bulb total','Length per strand (ft)','LED / incandescent','Bulb color','Wire color','Brand','Model','Storage','Associated component ID','Notes'],
  lighting),'Lighting Inventory');
 const warnings=warningSummary(project);
 XLSX.utils.book_append_sheet(wb,rows(['#','Review or verify'],warnings.map((x,i)=>[i+1,x])),'Review Items');
 const log=(project as ProjectWithWiringHistory).wiringHistory||[];
 XLSX.utils.book_append_sheet(wb,rows(['Timestamp','Action','Target ID','Target','Old upstream ID','Old port','New upstream ID','New port'],
  log.map(x=>[x.at,x.action,x.targetId,x.targetName,x.fromId||'',x.fromPort!==undefined?x.fromPort+1:'',x.toId||'',x.toPort!==undefined?x.toPort+1:''])),'Wiring Changes');
 return wb;
}
export function downloadWiringReference(project:Project):void{
 const wb=createWiringReferenceWorkbook(project);
 const binary=XLSX.write(wb,{type:'array',bookType:'xlsx',compression:true});
 const blob=new Blob([binary],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
 const url=URL.createObjectURL(blob);
 try{
  const a=document.createElement('a');a.href=url;
  a.download=`Blueprint-${project.season}-${project.year}-wiring-reference.xlsx`;
  document.body.appendChild(a);a.click();a.remove();
 }finally{setTimeout(()=>URL.revokeObjectURL(url),1500);}
}
