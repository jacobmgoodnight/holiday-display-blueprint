import {useMemo,useState} from 'react';
import {Camera,Check,ChevronRight,Eye,MapPin} from 'lucide-react';
import type {Project,Zone} from '../lib/model';
import {buildTaskPhases} from '../lib/taskPhases';
import {readPhoto} from '../lib/photos';
import './seasonTasks.css';
type Props={project:Project;mode:'setup'|'teardown';onLocate:(id:string)=>void;onTaskChange:(id:string,fields:{done?:boolean;notes?:string;photo?:string})=>void;onError:(msg:string)=>void};
const locations:Zone[]=['Front porch','Garage & driveway','Backyard','Other'];
export function SeasonTasks({project,mode,onLocate,onTaskChange,onError}:Props){
 const [zone,setZone]=useState('all');
 const phases=useMemo(()=>buildTaskPhases(project,mode),[project,mode]);
 // Keep the user's current phase open during checklist autosaves.
 const [expandedPhase,setExpandedPhase]=useState(()=>phases.find(p=>p.done<p.tasks.length)?.id||phases[0]?.id||'');
 const [expandedZone,setExpandedZone]=useState(()=>phases.find(p=>p.done<p.tasks.length)?.sections.find(s=>s.done<s.tasks.length)?.zone||'');
 const [expandedNotes,setExpandedNotes]=useState<string|null>(null);
 const all=phases.reduce((n,p)=>n+p.tasks.length,0),done=phases.reduce((n,p)=>n+p.done,0);
 const visibleTasks=phases.flatMap(p=>p.tasks).filter(t=>zone==='all'||project.nodes.find(n=>n.id===t.nodeId)?.zone===zone);
 const current=visibleTasks.find(t=>!project.checklist[t.id]?.done);
 const choosePhoto=async(taskId:string,file?:File)=>{if(!file)return;try{onTaskChange(taskId,{photo:await readPhoto(file)})}catch(e){onError(String(e))}};
 const showStep=(id:string)=>{
  const phase=phases.find(p=>p.tasks.some(t=>t.id===id));
  const section=phase?.sections.find(s=>s.tasks.some(t=>t.id===id));
  if(phase)setExpandedPhase(phase.id);
  if(section)setExpandedZone(section.zone);
  setTimeout(()=>document.getElementById('task-'+id)?.scrollIntoView({behavior:'smooth',block:'center'}),90);
 };
 return <section className="season-tasks" aria-label={mode==='setup'?'Installation checklist':'Teardown checklist'}>
  <header className="season-tasks-hero"><div><span className="eyebrow">{project.season.toUpperCase()} {project.year} · {mode==='setup'?'INSTALL':'TEARDOWN'}</span><h2>{mode==='setup'?'Install in clear phases':'Take down and store by phase'}</h2><p>{mode==='setup'?'Start with placement, follow your saved wiring, and test last. Work through one area at a time.':'Power off first, then unplug and pack each section for next year.'}</p></div><div className="season-tasks-total"><strong>{done} / {all}</strong><span>steps completed</span><div className="season-tasks-track"><span style={{width:`${all?done/all*100:0}%`}}/></div></div></header>
  {project.example&&<p className="season-tasks-warning">Example plan only. Open your real seasonal project before using these steps in the yard.</p>}
  <div className="season-tasks-filter"><label>Working in <select value={zone} onChange={e=>setZone(e.target.value)}><option value="all">All areas</option>{locations.map(z=><option key={z} value={z}>{z}</option>)}</select></label><span>Auto-saved checklist · {zone==='all'?'All areas':zone}</span></div>
  {current&&<div className="season-tasks-next"><strong><ChevronRight size={17}/> Up next {zone==='all'?'':'in '+zone}</strong><p>{current.label}</p><div><button onClick={()=>onTaskChange(current.id,{done:true})}><Check size={16}/> Mark complete</button><button onClick={()=>showStep(current.id)}><ChevronRight size={16}/> Find in checklist</button>{current.nodeId&&<button onClick={()=>onLocate(current.nodeId!)}><Eye size={16}/> Diagram</button>}</div></div>}
  <div className="season-phases">{phases.map((phase,i)=>{
   const visibleSections=zone==='all'?phase.sections:phase.sections.filter(s=>s.zone===zone);
   if(!visibleSections.length)return null;
   return <section className="season-phase" key={phase.id}>
    <button type="button" className="season-phase-heading" aria-expanded={expandedPhase===phase.id} onClick={()=>setExpandedPhase(v=>v===phase.id?'':phase.id)}>
     <span className="season-phase-number">{i+1}</span><span className="season-phase-name"><strong>{phase.title}</strong><small>{phase.instruction}</small></span><span className="season-phase-progress">{phase.done}/{phase.tasks.length}</span><ChevronRight className={expandedPhase===phase.id?'season-chevron-open':''} size={18}/>
    </button>
    {expandedPhase===phase.id&&<div className="season-phase-sections">{visibleSections.map(section=><section key={section.zone} className="season-task-zone">
     <button type="button" className="season-zone-heading" aria-expanded={expandedZone===section.zone} onClick={()=>setExpandedZone(v=>v===section.zone?'':section.zone)}>
      <span><MapPin size={15}/> {section.zone}</span><small>{section.done}/{section.tasks.length} complete</small><ChevronRight className={expandedZone===section.zone?'season-chevron-open':''} size={16}/>
     </button>
     {expandedZone===section.zone&&<div className="season-task-list">{section.tasks.map(task=>{
      const state=project.checklist[task.id],node=project.nodes.find(n=>n.id===task.nodeId),checked=!!state?.done;
      const picture=state?.photo||node?.photo,showNotes=expandedNotes===task.id;
      return <article id={'task-'+task.id} key={task.id} className={checked?'season-task done':'season-task'}>
       <label className="season-task-check"><input type="checkbox" checked={checked} onChange={e=>onTaskChange(task.id,{done:e.target.checked})}/><span>{task.label}</span></label>
       <div className="season-task-actions">{task.nodeId&&<button onClick={()=>onLocate(task.nodeId!)} aria-label={`Show ${task.label} on diagram`}><Eye size={16}/> Diagram</button>}
        <button type="button" aria-expanded={showNotes} onClick={()=>setExpandedNotes(v=>v===task.id?null:task.id)}><Camera size={15}/> {state?.notes||picture?'Notes / photo · saved':'Notes / photo'}</button>
       </div>
       {showNotes&&<div className="season-task-extra">{node?.inventory?.storage&&<small>Storage: {node.inventory.storage}</small>}
        {node?.notes&&<p>{node.notes}</p>}
        <textarea aria-label={`Notes for ${task.label}`} rows={2} placeholder="Details, exceptions or next-year reminder…" value={state?.notes||''} onChange={e=>onTaskChange(task.id,{notes:e.target.value})}/>
        {picture&&<img src={picture} alt={'Reference for '+task.label}/>}
        <label className="season-task-photo"><Camera size={15}/> {state?.photo?'Replace step photo':'Attach step photo'}<input type="file" accept="image/*" capture="environment" onChange={e=>{void choosePhoto(task.id,e.target.files?.[0]);e.target.value='';}}/></label>
       </div>}
      </article>;
     })}</div>}
    </section>)}</div>}
   </section>;
  })}</div>
  {!all&&<p className="season-tasks-warning">Add equipment and recorded connections to populate installation steps. Nothing is invented for missing wiring.</p>}
  {!current&&all>0&&<p className="season-tasks-warning">All steps for {zone==='all'?'this plan':zone} are checked. Review physical wiring and equipment condition separately.</p>}
  <p className="season-tasks-footnote">Checklist steps document the plan. A checkmark does not electrically certify a connection, load or circuit.</p>
 </section>;
}
