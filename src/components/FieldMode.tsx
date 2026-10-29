import {useMemo,useState} from 'react';
import {ArrowRight,Check,ChevronDown,CircuitBoard,ClipboardCheck,Eye,MapPin,Search,Maximize2} from 'lucide-react';
import type {Project} from '../lib/model';
import {downstream,sourcePath} from '../lib/graph';
import {wiringSequence} from '../lib/wiringGuide';
import {InstallationGuide} from './InstallationGuide';
import './fieldMode.css';

type Props={project:Project;onLocate:(id:string)=>void;onTaskChange:(id:string,done:boolean)=>void;onEdit:()=>void;onExplore?:()=>void;};
export function FieldMode({project,onLocate,onTaskChange,onEdit,onExplore}:Props){
 const outlets=project.nodes.filter(n=>n.kind==='outlet');
 const [outlet,setOutlet]=useState(outlets[0]?.id||'all');
 const [search,setSearch]=useState('');
 const target=outlets.find(n=>n.id===outlet);
 const scope=useMemo(()=>target?new Set([target.id,...downstream(target.id,project.edges)]):new Set(project.nodes.map(n=>n.id)),[project,target]);
 const label=target?.name||'Whole system';
 const steps=useMemo(()=>wiringSequence(project,scope),[project,scope]);
 const done=steps.filter(step=>!!project.checklist[step.id]?.done).length;
 const next=steps.find(step=>!project.checklist[step.id]?.done);
 const matches=search.trim().length<2?[]:project.nodes.filter(n=>(n.name+' '+n.id+' '+n.notes+' '+n.inventory?.storage).toLowerCase().includes(search.trim().toLowerCase())).slice(0,12);
 const nextComponent=project.nodes.find(n=>n.id===next?.nodeId);
 const nextPhoto=next?.id?project.checklist[next.id]?.photo||nextComponent?.photo:undefined;
 return <section className="field-mode" aria-label="Field Mode installation companion">
  <div className="field-head">
   <div><span className="eyebrow">FIELD MODE · {project.season.toUpperCase()} {project.year}</span>
    <h2>Set up your display</h2>
    <p>Pick a power source, see what connects to it, and check off steps as you go.</p>
   </div>
   <div className="field-head-actions">{onExplore&&<button className="field-advanced" onClick={onExplore}><Maximize2 size={17}/> Fullscreen diagram</button>}<button className="field-advanced" onClick={onEdit}><CircuitBoard size={17}/> Edit wiring</button></div>
  </div>
  {project.example&&<p className="field-example">Example plan only — select the real master before using this as an installation reference.</p>}
  <div className="field-outlets" role="group" aria-label="Choose field circuit">
   <button className={outlet==='all'?'active':''} aria-pressed={outlet==='all'} onClick={()=>setOutlet('all')}>Whole system</button>
   {outlets.map(o=><button key={o.id} className={outlet===o.id?'active':''} aria-pressed={outlet===o.id} onClick={()=>setOutlet(o.id)}>{o.name.match(/\bO\d+\b/i)?.[0]||o.name.slice(0,22)}<small>{o.name}</small></button>)}
  </div>
  <div className="field-progress">
   <div><strong>{done} of {steps.length}</strong><span>installation steps complete · {label}</span></div>
   <strong className="field-percent">{steps.length?Math.round(done/steps.length*100):0}%</strong>
  </div>
  <div className="field-progress-track"><span style={{width:`${steps.length?done/steps.length*100:0}%`}}/></div>
  {next?<div className="field-next">
    <div className="field-next-title"><ClipboardCheck size={19}/><div><strong>Continue installation</strong><span>Step {next.number} · {next.phase}</span></div></div>
    <p>{next.label}</p>
    {nextPhoto&&<img className="field-next-photo" src={nextPhoto} alt={`Reference for ${nextComponent?.name||next.label}`}/>}
    {nextComponent?.notes&&<p className="field-next-note">Equipment note: {nextComponent.notes}</p>}
    {nextComponent?.inventory?.storage&&<p className="field-next-note"><MapPin size={14}/> Stored in {nextComponent.inventory.storage}</p>}
    <div className="field-next-actions">
     <button className="field-complete" onClick={()=>onTaskChange(next.id,true)}><Check size={18}/> Mark step complete</button>
     {next.nodeId&&<button className="field-locate" onClick={()=>onLocate(next.nodeId!)}><Eye size={16}/> Show wiring</button>}
    </div>
   </div>:<div className="field-finished"><Check size={22}/> All recorded setup steps for this circuit are checked. Verify the real installation and electrical protections manually before energizing.</div>}
  <div className="field-search">
   <label><Search size={18}/><input aria-label="Find any device in the entire project" placeholder="Find a decoration, cord or splitter…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
   {search.trim().length>1&&<div className="field-search-results" role="list">
    {matches.map(n=><button role="listitem" key={n.id} onClick={()=>{onLocate(n.id);setSearch('')}}>
      <span><strong>{n.name}</strong><small>{n.zone} · {sourcePath(n.id,project).map(p=>p.name).join(' → ')}</small></span>
      <ArrowRight size={17}/>
    </button>)}
    {!matches.length&&<p>No matching equipment. Try another name, cord ID or storage label.</p>}
   </div>}
  </div>
  <details className="field-guide" open>
   <summary><ChevronDown size={17}/> Connection tree and setup checklist <small>Includes notes, photos, and checkboxes</small></summary>
   <InstallationGuide project={project} scope={scope} scopeLabel={label} onLocate={onLocate} onTaskChange={onTaskChange}/>
  </details>
  <p className="field-safety">Field Mode documents your plan; it does not verify GFCI protection, cable condition, circuit capacity, or electrical safety. Disconnect power before changing wiring.</p>
 </section>;
}
