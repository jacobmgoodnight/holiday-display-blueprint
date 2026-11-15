import {useMemo,useState} from 'react';
import {ChevronDown,Download,Map as MapIcon,Package,Search} from 'lucide-react';
import type {Component,Project,Zone} from '../lib/model';
import {categories} from '../lib/model';
import './equipmentInventory.css';

type Props={project:Project;onPatch:(id:string,fields:Partial<Component>)=>void;onShow:(id:string)=>void;onExport:()=>void};
const zones:Zone[]=['Front porch','Garage & driveway','Backyard','Other'];
const conditions:{value:NonNullable<NonNullable<Component['inventory']>['condition']>;label:string}[]=[
 {value:'good',label:'Good'},{value:'repair',label:'Needs repair'},{value:'damaged',label:'Damaged'},{value:'missing',label:'Missing'}
];
export const kindLabel=(kind:Component['kind'])=>categories.find(c=>c.kind===kind)?.label||kind;

/**
 * What you own and where it is stored. House outlets are power sources, not stored
 * equipment, so they are left out. Edits here only touch storage records and notes;
 * they never change wiring, outputs or field-check status.
 */
export function EquipmentInventory({project,onPatch,onShow,onExport}:Props){
 const [search,setSearch]=useState(''),[zone,setZone]=useState<Zone|''>(''),[missingOnly,setMissingOnly]=useState(false),[open,setOpen]=useState<string|null>(null);
 const owned=useMemo(()=>project.nodes.filter(n=>n.kind!=='outlet'),[project.nodes]);
 const needle=search.trim().toLowerCase();
 const shown=owned.filter(n=>(!zone||n.zone===zone)&&(!missingOnly||!n.inventory?.storage?.trim())&&(!needle||[n.name,kindLabel(n.kind),n.zone,n.inventory?.storage,n.notes].some(v=>String(v||'').toLowerCase().includes(needle))));
 const unstored=owned.filter(n=>!n.inventory?.storage?.trim()).length;
 const attention=owned.filter(n=>n.inventory?.condition&&n.inventory.condition!=='good').length;
 const patchInventory=(n:Component,fields:Partial<NonNullable<Component['inventory']>>)=>onPatch(n.id,{inventory:{...n.inventory,...fields}});
 return <section className="equipment-inventory" aria-label="Equipment inventory">
  <div className="equipment-head">
   <div><h2>Equipment</h2><p>{owned.length} {owned.length===1?'item':'items'}{unstored>0?` · ${unstored} without a storage spot`:''}{attention>0?` · ${attention} needing attention`:''}</p></div>
   <button type="button" className="button secondary" onClick={onExport}><Download size={16}/> Download list (CSV)</button>
  </div>
  <div className="equipment-filters">
   <label className="equipment-search"><Search size={16}/><span className="visually-hidden">Search equipment</span><input type="search" aria-label="Search inventory" placeholder="Search by name, bin or note…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
   <label>Area <select aria-label="Filter equipment by area" value={zone} onChange={e=>setZone(e.target.value as Zone|'')}><option value="">All areas</option>{zones.map(z=><option key={z} value={z}>{z}</option>)}</select></label>
   <label className="equipment-toggle"><input type="checkbox" checked={missingOnly} onChange={e=>setMissingOnly(e.target.checked)}/> Only items without a storage spot</label>
  </div>
  {!owned.length?<p className="equipment-empty">No equipment yet. Add items on the Wiring diagram and they will appear here.</p>
  :!shown.length?<p className="equipment-empty">Nothing matches. Clear the search or filters to see everything.</p>
  :<ul className="equipment-list">{shown.map(n=>{
   const expanded=open===n.id,condition=conditions.find(c=>c.value===n.inventory?.condition);
   return <li key={n.id} className={expanded?'open':''}>
    <button type="button" className="equipment-row" aria-expanded={expanded} aria-controls={'equipment-edit-'+n.id} onClick={()=>setOpen(expanded?null:n.id)}>
     {n.photo?<img src={n.photo} alt=""/>:<span className="equipment-blank"><Package size={20}/></span>}
     <span className="equipment-name"><strong>{n.name}</strong><small>{kindLabel(n.kind)} · {n.zone}</small></span>
     <span className={'equipment-storage'+(n.inventory?.storage?.trim()?'':' unset')}>{n.inventory?.storage?.trim()||'No storage spot yet'}<small className={condition&&condition.value!=='good'?'attention':''}>{condition?condition.label:'Condition not recorded'}</small></span>
     <ChevronDown size={18} className="equipment-chevron" aria-hidden="true"/>
    </button>
    {expanded&&<div className="equipment-edit" id={'equipment-edit-'+n.id}>
     <label className="wide">Where is it stored?<input aria-label={`Storage location for ${n.name}`} value={n.inventory?.storage||''} placeholder="e.g. Garage bin A" maxLength={120} onChange={e=>patchInventory(n,{storage:e.target.value})}/></label>
     <label>Condition<select aria-label={`Condition of ${n.name}`} value={n.inventory?.condition||''} onChange={e=>patchInventory(n,{condition:(e.target.value||undefined) as typeof conditions[number]['value']|undefined})}><option value="">Not recorded</option>{conditions.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
     <label>How many<input aria-label={`Quantity of ${n.name}`} type="number" min={0} value={n.inventory?.quantity??''} placeholder="1" onChange={e=>patchInventory(n,{quantity:e.target.value===''?undefined:Math.max(0,Number(e.target.value))})}/></label>
     <label className="wide">Notes<textarea aria-label={`Notes for ${n.name}`} rows={2} value={n.notes||''} placeholder="Setup tips, quirks, what to buy next year…" onChange={e=>onPatch(n.id,{notes:e.target.value})}/></label>
     <label className="wide">Repair history<textarea aria-label={`Repair history for ${n.name}`} rows={2} value={n.inventory?.repairHistory||''} onChange={e=>patchInventory(n,{repairHistory:e.target.value})}/></label>
     <div className="equipment-edit-actions"><button type="button" onClick={()=>onShow(n.id)}><MapIcon size={15}/> Show on wiring diagram</button><small>Saved as you type. Wiring is not changed here.</small></div>
    </div>}
   </li>;})}</ul>}
  {project.nodes.some(n=>n.kind==='outlet')&&<p className="equipment-footnote">House outlets are power sources, so they are not listed as stored equipment. They are still included in the downloaded list.</p>}
 </section>;
}
