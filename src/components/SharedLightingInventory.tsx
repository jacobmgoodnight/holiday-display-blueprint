import {useMemo,useState} from 'react';
import {Box,Copy,Download,PackagePlus,Printer,Search,Trash2} from 'lucide-react';
import type {LightingArea,LightingType,LightPlacement,LightStock,Project,SharedLighting} from '../lib/model';
import {lightingAreas,lightingTypes} from '../lib/lightingInventory';
import {safeYearStockRows,totals} from '../lib/sharedLighting';
import './sharedLightingInventory.css';
type Props={project:Project;catalog:SharedLighting;legacyRows:number;onMigrate:()=>void;onCreate:(type:LightingType)=>void;onChangeStock:(id:string,change:Partial<LightStock>)=>void;onDeleteStock:(id:string)=>void;onPlace:(id:string,area:LightingArea)=>void;onChangePlacement:(id:string,patch:Partial<LightPlacement>)=>void;onRemovePlacement:(id:string)=>void;onCopyPrevious:()=>void;onExport:()=>void};
const count=(value:string)=>value.trim()===''?undefined:/^\d+$/.test(value)&&Number.isSafeInteger(Number(value))?Number(value):null;
export function SharedLightingInventory({project,catalog,legacyRows,onMigrate,onCreate,onChangeStock,onDeleteStock,onPlace,onChangePlacement,onRemovePlacement,onCopyPrevious,onExport}:Props){
 const [q,setQ]=useState(''),[mode,setMode]=useState<'placements'|'stock'>('placements'),[type,setType]=useState<LightingType>('Mini'),[expanded,setExpanded]=useState<string|null>(null),[area,setArea]=useState<LightingArea>('First-floor roofline');
 const rows=useMemo(()=>safeYearStockRows(catalog,project.season,project.year),[catalog,project.year,project.season]);
 const showing=rows.filter(({stock})=>[stock.name,stock.type,stock.storage,stock.brand].some(v=>String(v||'').toLowerCase().includes(q.toLowerCase()))&&(type==='Other'||mode==='stock'||true));
 const current=rows.filter(x=>x.placements.length);
 const c9=totals(catalog.stock,catalog.placements,project.season,project.year,'C9');
 const mini=totals(catalog.stock,catalog.placements,project.season,project.year,'Mini');
 const changeCount=(raw:string,onValid:(n:number|undefined)=>void)=>{const n=count(raw);if(n!==null)onValid(n)};
 const yearPlans=catalog.placements.filter(p=>p.season===project.season&&p.year===project.year);
 const shortages=[c9,mini].reduce((n,t)=>n+t.shortKnown,0);
 return <section className="shared-lighting" aria-label="Reusable Christmas lighting inventory">
  <header className="shared-lighting-header"><div><h2>Count your lights once</h2><p>Physical stock stays the same across years. Each year's roofline, bushes and fence placements are separate, reusable plans.</p></div><button className="button secondary" onClick={onExport} disabled={!catalog.stock.length}><Download size={16}/> Private CSV</button></header>
  {legacyRows>0&&<div className="shared-migration"><div><strong>Previous inventory entries found ({legacyRows})</strong><p>Convert these Christmas rows into reusable stock without removing the original records. Review duplicate rows first: importing multiple copies can overstate what you own.</p></div><button className="button secondary" onClick={onMigrate}>Review and import this year’s counts</button></div>}
  <div className="shared-metrics">
   <div><span>Owned, counted C9 bulbs</span><strong>{c9.ownedKnown.toLocaleString()}{c9.unknownOwned?' + ?':''}</strong><small>{c9.unknownOwned} stock group(s) uncounted</small></div>
   <div><span>Owned mini strands</span><strong>{mini.ownedKnown.toLocaleString()}{mini.unknownOwned?' + ?':''}</strong><small>{mini.unknownOwned} stock group(s) uncounted</small></div>
   <div><span>{project.year} planned / installed</span><strong>{c9.plannedKnown+mini.plannedKnown} / {c9.installedKnown+mini.installedKnown}</strong><small>Mixed bulbs and strands; open entries for units · {c9.unknownPlaced+mini.unknownPlaced} unknown placement(s)</small></div>
   <div><span>Confirmed shortages</span><strong>{shortages||'None calculated'}</strong><small>{c9.needsReview+mini.needsReview?'Some stock counts unknown; review before shopping':'Only compare like units (C9 bulbs / mini strands)'}</small></div>
  </div>
  <div className="shared-lighting-tabs" role="group" aria-label="Lighting inventory view">
   <button className={mode==='placements'?'active':''} aria-pressed={mode==='placements'} onClick={()=>setMode('placements')}>This year's placement</button>
   <button className={mode==='stock'?'active':''} aria-pressed={mode==='stock'} onClick={()=>setMode('stock')}>Owned inventory</button>
  </div>
  {mode==='placements'&&<div className="shared-placement-bar"><p>{project.year} · {yearPlans.length} placements. Use an existing stock item; do not recount bulbs. Reusing last year's placements marks them <strong>Planned</strong>, never installed.</p><button className="button secondary" onClick={onCopyPrevious}><Copy size={15}/> Reuse last year's layout</button></div>}
  <div className="shared-add-row">
   {mode==='stock'?<><label>New type<select value={type} aria-label="New stock type" onChange={e=>setType(e.target.value as LightingType)}>{lightingTypes.map(t=><option key={t}>{t}</option>)}</select></label><button className="button primary" onClick={()=>onCreate(type)}><PackagePlus size={16}/> Add purchased stock</button></>:
    <label>New placement area<select value={area} onChange={e=>setArea(e.target.value as LightingArea)} aria-label="Assignment area">{lightingAreas.map(a=><option key={a}>{a}</option>)}</select></label>}
   <label className="shared-search"><Search size={16}/><input aria-label="Find lighting stock" value={q} placeholder="Find C9, mini, bin…" onChange={e=>setQ(e.target.value)}/></label>
  </div>
  {!catalog.stock.length&&<div className="shared-empty">No permanent light inventory yet. Open <strong>Owned inventory</strong> to add your lights once, or import previous counted entries above.</div>}
  {mode==='placements'&&!current.length&&catalog.stock.length>0&&<div className="shared-empty">No lights assigned for {project.year} yet. Choose an owned item below or reuse last year's layout. Physical bulb counts won't change.</div>}
  <div className="shared-stock-list">{showing.map(({stock,placements})=>{
   if(mode==='placements'&&placements.length===0&&expanded!==stock.id){} // Still show available stock to assign
   const editing=expanded===stock.id;
   return <article key={stock.id} className={editing?'shared-stock-row expanded':'shared-stock-row'}>
    <button className="shared-stock-summary" onClick={()=>setExpanded(editing?null:stock.id)} aria-expanded={editing}>
     <span className="shared-stock-icon">{stock.type==='C9'?'💡':stock.type==='Mini'?'✨':'🔆'}</span>
     <span className="shared-stock-name"><strong>{stock.name}</strong><small>{stock.type} · {stock.storage||'Storage not recorded'} · {stock.condition==='repair'?'Needs repair':stock.unit==='bulbs'?'C9 bulbs':'strings'}</small></span>
     <span className="shared-stock-number"><strong>{stock.owned??'?'}</strong><small>owned {stock.unit}</small></span>
     <span className="shared-stock-toggle">{editing?'Close':'Edit'}</span>
    </button>
    {editing&&<div className="shared-stock-detail">
     <div className="shared-stock-fields">
      <label className="wide">Name<input aria-label="Stock name" maxLength={100} value={stock.name} onChange={e=>onChangeStock(stock.id,{name:e.target.value})}/></label>
      <label>How many do you own? ({stock.unit})<input aria-label="Owned quantity" type="number" min={0} step={1} value={stock.owned??''} placeholder="Unknown" onChange={e=>changeCount(e.target.value,owned=>onChangeStock(stock.id,{owned}))}/></label>
      <label>{stock.type==='Mini'?'Bulbs per string':'Bulbs per strand (optional)'}<input aria-label="Bulbs per strand" type="number" min={0} step={1} value={stock.bulbsPerStrand??''} onChange={e=>changeCount(e.target.value,bulbsPerStrand=>onChangeStock(stock.id,{bulbsPerStrand}))}/></label>
      <label>Storage bin<input aria-label="Light storage bin" value={stock.storage||''} placeholder="Bin X / roofline tote" onChange={e=>onChangeStock(stock.id,{storage:e.target.value})}/></label>
      <label>Condition<select value={stock.condition} aria-label="Stock condition" onChange={e=>onChangeStock(stock.id,{condition:e.target.value as 'good'|'repair'})}><option value="good">Available / good</option><option value="repair">Damaged / repair</option></select></label>
     </div>
     <details className="shared-advanced"><summary>More stock details · color, brand, notes</summary><div className="shared-stock-fields">
       <label>Bulb technology<select value={stock.bulbTechnology||'Unknown'} onChange={e=>onChangeStock(stock.id,{bulbTechnology:e.target.value as LightStock['bulbTechnology']})}><option>Unknown</option><option>LED</option><option>Incandescent</option></select></label>
       <label>Bulb color<input value={stock.bulbColor||''} onChange={e=>onChangeStock(stock.id,{bulbColor:e.target.value})}/></label>
       <label>Wire color<input value={stock.wireColor||''} onChange={e=>onChangeStock(stock.id,{wireColor:e.target.value})}/></label>
       <label>Brand<input value={stock.brand||''} onChange={e=>onChangeStock(stock.id,{brand:e.target.value})}/></label>
       <label>Model<input value={stock.model||''} onChange={e=>onChangeStock(stock.id,{model:e.target.value})}/></label>
       <label className="wide">Notes<input value={stock.notes||''} onChange={e=>onChangeStock(stock.id,{notes:e.target.value})}/></label>
      </div></details>
     {placements.length>0&&<section className="shared-placements"><h4>{project.year} placements</h4>{placements.map(place=><div className="shared-placement" key={place.id}>
      <label>Location<select value={place.area} onChange={e=>onChangePlacement(place.id,{area:e.target.value as LightingArea})}>{lightingAreas.map(a=><option key={a}>{a}</option>)}</select></label>
      <label>Quantity used ({stock.unit})<input aria-label="Placement quantity" type="number" min={0} step={1} value={place.quantity??''} onChange={e=>changeCount(e.target.value,quantity=>onChangePlacement(place.id,{quantity}))}/></label>
      <label>Status<select value={place.status} onChange={e=>onChangePlacement(place.id,{status:e.target.value as LightPlacement['status']})}><option value="planned">Planned</option><option value="installed">Installed</option></select></label>
      <button aria-label="Remove placement" onClick={()=>onRemovePlacement(place.id)}><Trash2 size={15}/></button>
     </div>)}</section>}
     <div className="shared-row-actions"><button onClick={()=>onPlace(stock.id,area)}><PackagePlus size={15}/> Place in {area}</button><button onClick={()=>{const code='HDB-'+stock.id.slice(0,8).toUpperCase();const child=window.open('','_blank');if(!child)return;child.document.write('<!doctype html><title>Storage label</title><div style="font-family:Arial;margin:30px;border:2px solid;padding:24px;width:320px"><h2>'+stock.name.replace(/[<>&]/g,'')+'</h2><p>'+code+'</p><p>Bin: '+(stock.storage||'Not set').replace(/[<>&]/g,'')+'</p></div>');child.document.close();child.focus();child.print();}}><Printer size={15}/> Storage label</button>{!placements.length&&<button className="destructive" onClick={()=>{if(confirm('Remove this owned stock record? This cannot be undone.'))onDeleteStock(stock.id)}}><Trash2 size={15}/> Remove stock</button>}</div>
     <p className="shared-stock-hint">Count once. New years reuse this record; only change owned quantity when purchasing, discarding or repairing lights.</p>
    </div>}
   </article>;
  })}</div>
 </section>;
}
