import {useState} from 'react';
import {ArrowRight,Download,Lightbulb,Plus,Search,Trash2} from 'lucide-react';
import type {LightingArea,LightingEntry,LightingStatus,LightingType,Project} from '../lib/model';
import {computedBulbs,lightingAreas,lightingStatuses,lightingTypes,summarizeByType,summarizeLighting} from '../lib/lightingInventory';
import './lightingInventory.css';

type Props={
 project:Project;
 onAdd:(type:LightingType,area:LightingArea)=>void;
 onAddChristmasSections:()=>void;
 onChange:(id:string,changes:Partial<LightingEntry>)=>void;
 onRemove:(id:string)=>void;
 onLocate:(id:string)=>void;
 onExport:()=>void;
};
const readNumber=(value:string)=>value.trim()===''?undefined:Number(value);
const formatTotal=(n:number,unknown:number,unit:string)=>unknown?`${n.toLocaleString()} known ${unit} + ${unknown} uncounted row${unknown===1?'':'s'}`:`${n.toLocaleString()} ${unit}`;
export function LightingInventory({project,onAdd,onAddChristmasSections,onChange,onRemove,onLocate,onExport}:Props){
 const items=project.lightingInventory||[];
 const [type,setType]=useState<LightingType>('C9');
 const [area,setArea]=useState<LightingArea>('First-floor roofline');
 const [filter,setFilter]=useState<'All'|LightingType>('All');
 const [search,setSearch]=useState('');
 const [editId,setEditId]=useState<string|null>(null);
 const active=items.filter(e=>(filter==='All'||e.type===filter)&&[e.label,e.area,e.type,e.storage,e.bulbColor,e.brand].some(v=>String(v||'').toLowerCase().includes(search.toLowerCase())));
 const displayed=items.filter(e=>e.status==='planned'||e.status==='installed');
 const byType=summarizeByType(items),total=summarizeLighting(displayed),spares=summarizeLighting(items.filter(e=>e.status==='spare'));
 const nodes=project.nodes.filter(n=>['light-strand','spt-1','cord','decoration','accessory'].includes(n.kind));
 return <section className="lighting-inventory" aria-label="Lighting strand inventory">
  <div className="lighting-intro">
   <div><h2>Lighting counts by area & strand</h2><p>Track each physical C9 run or group of identical mini-light strands, separately from the power diagram. Counts are unknown until entered.</p></div>
   <button className="button secondary" onClick={onExport} disabled={!items.length}><Download size={15}/> Export lighting CSV</button>
  </div>
  <div className="lighting-summary">
   <div><span>Displayed C9</span><strong>{formatTotal(byType.C9.knownBulbs,byType.C9.unknownBulbRows,'bulbs')}</strong><small>{byType.C9.runs} run/group record(s)</small></div>
   <div><span>Displayed mini lights</span><strong>{formatTotal(byType.Mini.knownBulbs,byType.Mini.unknownBulbRows,'bulbs')}</strong><small>{formatTotal(byType.Mini.knownStrands,byType.Mini.unknownStrandRows,'strands')}</small></div>
   <div><span>All displayed lighting</span><strong>{formatTotal(total.knownBulbs,total.unknownBulbRows,'bulbs')}</strong><small>{total.runs} records · {spares.runs} spare group(s) tracked separately</small></div>
  </div>
  <div className="lighting-actions">
   <label>Type<select aria-label="New lighting type" value={type} onChange={e=>setType(e.target.value as LightingType)}>{lightingTypes.map(t=><option key={t} value={t}>{t==='Mini'?'Mini lights':t==='C9'?'C9 bulbs':'Other lights'}</option>)}</select></label>
   <label>Area<select aria-label="New lighting area" value={area} onChange={e=>setArea(e.target.value as LightingArea)}>{lightingAreas.map(a=><option key={a}>{a}</option>)}</select></label>
   <button className="button primary" onClick={()=>{onAdd(type,area);setFilter('All');setSearch('');}}><Plus size={15}/> Add run / strand group</button>
  </div>
  {project.season==='Christmas'&&<div className="lighting-starter">
   <div><strong>Christmas sections checklist</strong><span>First/second floor C9s, covered porch, morning room, mulch beds, bushes, trees, fence and columns. Blank measurements, Draft/planned only.</span></div>
   <button className="button secondary" onClick={onAddChristmasSections}>Add missing sections</button>
  </div>}
  <div className="lighting-filter">
   <div className="lighting-filter-buttons" role="group" aria-label="Filter light types">{(['All','C9','Mini','Other'] as const).map(t=><button key={t} className={filter===t?'active':''} aria-pressed={filter===t} onClick={()=>setFilter(t)}>{t==='Mini'?'Mini lights':t}</button>)}</div>
   <label className="lighting-search"><Search size={16}/><input aria-label="Search lighting runs" placeholder="Find roofline, bush, storage…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
  </div>
  {!items.length&&<div className="lighting-empty"><Lightbulb size={24}/><strong>No lighting counts entered</strong><span>Add a run or the optional Christmas sections to start recording strand and bulb totals. No numbers are inferred from the wiring diagram.</span></div>}
  {items.length>0&&!active.length&&<p className="lighting-no-matches">No matching lighting entries. Clear the filter or search.</p>}
  <div className="lighting-area-groups">{lightingAreas.filter(a=>active.some(e=>e.area===a)).map(a=>{
   const records=active.filter(e=>e.area===a),summary=summarizeLighting(records.filter(e=>e.status==='planned'||e.status==='installed'));
   return <section className="lighting-area" key={a}>
    <div className="lighting-area-heading"><h3>{a}</h3><span>{records.length} record(s) · {summary.knownBulbs.toLocaleString()} known bulbs{summary.unknownBulbRows?' · '+summary.unknownBulbRows+' to count':''}</span></div>
    {records.map(entry=>{
     const totalBulbs=computedBulbs(entry),editing=editId===entry.id;
     const patch=(changes:Partial<LightingEntry>)=>onChange(entry.id,changes);
     return <article key={entry.id} className={editing?'lighting-record open':'lighting-record'}>
      <button className="lighting-record-summary" aria-expanded={editing} onClick={()=>setEditId(editing?null:entry.id)}>
       <span className="lighting-record-type">{entry.type==='C9'?'💡':entry.type==='Mini'?'✨':'🔆'}</span>
       <span className="lighting-record-label"><strong>{entry.label||'Unnamed lighting run'}</strong><small>{entry.type==='Mini'?'Mini lights':entry.type} · {entry.status}{entry.strandCount===undefined?' · strand count unknown':' · '+entry.strandCount+' strand(s)'}</small></span>
       <span className="lighting-record-count"><strong>{totalBulbs===undefined?'—':totalBulbs.toLocaleString()}</strong><small>{totalBulbs===undefined?'Needs bulb count':'bulbs'}</small></span>
       <span className="lighting-record-edit">{editing?'Close':'Edit'}</span>
      </button>
      {editing&&<div className="lighting-edit">
       <div className="lighting-edit-grid">
        <label className="wide">Run or strand label<input aria-label="Lighting run name" value={entry.label} maxLength={100} onChange={e=>patch({label:e.target.value})}/></label>
        <label>Light type<select aria-label="Lighting run type" value={entry.type} onChange={e=>patch({type:e.target.value as LightingType})}>{lightingTypes.map(t=><option key={t}>{t}</option>)}</select></label>
        <label>Area<select aria-label="Lighting run area" value={entry.area} onChange={e=>patch({area:e.target.value as LightingArea})}>{lightingAreas.map(a=><option key={a}>{a}</option>)}</select></label>
        <label>Use / stock status<select aria-label="Lighting run status" value={entry.status} onChange={e=>patch({status:e.target.value as LightingStatus})}>{lightingStatuses.map(s=><option key={s} value={s}>{s==='spare'?'Spare / stored':s==='repair'?'Needs repair':s==='planned'?'Planned':'Installed / counted'}</option>)}</select></label>
        <label>Number of strands / runs<input aria-label="Number of strands" inputMode="numeric" min={0} step={1} type="number" value={entry.strandCount??''} placeholder="Unknown" onChange={e=>patch({strandCount:readNumber(e.target.value)})}/></label>
        <label>Bulbs per strand<input aria-label="Bulbs per strand" inputMode="numeric" min={0} step={1} type="number" value={entry.bulbsPerStrand??''} placeholder="Unknown" onChange={e=>patch({bulbsPerStrand:readNumber(e.target.value)})}/></label>
        <label>Custom total bulbs (overrides calculation)<input aria-label="Custom total bulbs" inputMode="numeric" min={0} step={1} type="number" value={entry.totalBulbs??''} placeholder="For irregular C9 run" onChange={e=>patch({totalBulbs:readNumber(e.target.value)})}/></label>
        <label>Length per strand (ft)<input aria-label="Length per strand" inputMode="decimal" min={0} step="any" type="number" value={entry.lengthPerStrandFt??''} placeholder="Not measured" onChange={e=>patch({lengthPerStrandFt:readNumber(e.target.value)})}/></label>
        <label>Technology<select aria-label="Bulb technology" value={entry.bulbTechnology||'Unknown'} onChange={e=>patch({bulbTechnology:e.target.value as LightingEntry['bulbTechnology']})}><option>Unknown</option><option>LED</option><option>Incandescent</option></select></label>
        <label>Bulb color / tone<input aria-label="Bulb color" value={entry.bulbColor||''} placeholder="Sun warm white, multicolor…" onChange={e=>patch({bulbColor:e.target.value})}/></label>
        <label>Wire color<input aria-label="Lighting wire color" value={entry.wireColor||''} placeholder="Green, white…" onChange={e=>patch({wireColor:e.target.value})}/></label>
        <label>Brand<input aria-label="Lighting brand" value={entry.brand||''} placeholder="Optional" onChange={e=>patch({brand:e.target.value})}/></label>
        <label>Model / SKU<input aria-label="Lighting model" value={entry.model||''} placeholder="Optional" onChange={e=>patch({model:e.target.value})}/></label>
        <label>Storage bin<input aria-label="Lighting storage" value={entry.storage||''} placeholder="Optional" onChange={e=>patch({storage:e.target.value})}/></label>
        <label className="wide">Associated wiring component (reference only)<select aria-label="Linked wiring component" value={entry.componentId||''} onChange={e=>patch({componentId:e.target.value||undefined})}><option value="">No associated diagram item</option>{nodes.map(n=><option key={n.id} value={n.id}>{n.name} · {n.zone}</option>)}</select></label>
        <label className="wide">Notes / exact placement<input aria-label="Lighting notes" value={entry.notes||''} onChange={e=>patch({notes:e.target.value})} placeholder="First strand, roof peak, extension points…" /></label>
       </div>
       <div className="lighting-record-actions">
        <span>Changes save automatically. Physical bulb counts are not estimated.</span>
        {entry.componentId&&<button className="button secondary" onClick={()=>onLocate(entry.componentId!)}><ArrowRight size={14}/> View wiring</button>}
        <button className="button secondary lighting-remove" onClick={()=>{if(confirm('Remove this lighting count record? The actual wiring will not be touched.')){onRemove(entry.id);setEditId(null);}}}><Trash2 size={14}/> Remove inventory row</button>
       </div>
      </div>}
     </article>;
    })}
   </section>;
  })}</div>
  <p className="lighting-disclaimer">Bulb totals use your entered custom total or strands × bulbs per strand. Unknown values remain uncounted, not zero. A link to a wiring item is only a reference; it never creates, modifies, or verifies an AC connection.</p>
 </section>;
}
