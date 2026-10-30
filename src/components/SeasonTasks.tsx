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
 const all=phases.reduce((n,p)=>n+p.tasks.length,0),done=phases.reduce((n,p)=>n+p.done,0);
 const current=phases.flatMap(p=>p.tasks).find(t=>!project.checklist[t.id]?.done);
 const choosePhoto=async(taskId:string,file?:File)=>{if(!file)return;try{onTaskChange(taskId,{photo:await readPhoto(file)})}catch(e){onError(String(e))}};
 return <section className="season-tasks" aria-label={mode==='setup'?'Installation checklist':'Teardown checklist'}>
  <header className="season-tasks-hero"><div><span className="eyebrow">{project.season.toUpperCase()} {project.year} · {mode==='setup'?'INSTALL':'TEARDOWN'}</span><h2>{mode==='setup'?'Install in clear phases':'Take down and store by phase'}</h2><p>{mode==='setup'?'Work through placement, connections, then attended testing. Each section is grouped by the area where you will actually be working.':'Power off first. Then disconnect branches and pack everything where it belongs for next season.'}</p></div><div className="season-tasks-total"><strong>{done} / {all}</strong><span>steps completed</span><div className="season-tasks-track"><span style={{width:`${all?done/all*100:0}%`}}/></div></div></header>
  {project.example&&<p className="season-tasks-warning">Example plan only. Open your real seasonal project before using these steps in the yard.</p>}
  <div className="season-tasks-filter"><label>Show area <select value={zone} onChange={e=>setZone(e.target.value)}><option value="all">All areas</option>{locations.map(z=><option key={z} value={z}>{z}</option>)}</select></label><span>Checkmarks automatically save to your existing installation record.</span></div>
  {current&&<div className="season-tasks-next"><strong><ChevronRight size={17}/> Next unchecked step</strong><p>{current.label}</p><div><button onClick={()=>onTaskChange(current.id,{done:true})}><Check size={16}/> Mark complete</button>{current.nodeId&&<button onClick={()=>onLocate(current.nodeId!)}><Eye size={16}/> Show in diagram</button>}</div></div>}
  <div className="season-phases">{phases.map((phase,i)=>{
   const visibleSections=zone==='all'?phase.sections:phase.sections.filter(s=>s.zone===zone);
   const visibleCount=visibleSections.reduce((n,s)=>n+s.tasks.length,0);
   if(!visibleCount)return null;
   return <details className="season-phase" key={phase.id} open={i===0?true:undefined}>
    <summary><span className="season-phase-number">{i+1}</span><span className="season-phase-name"><strong>{phase.title}</strong><small>{phase.instruction}</small></span><span className="season-phase-progress">{phase.done}/{phase.tasks.length}</span></summary>
    <div className="season-phase-sections">{visibleSections.map(section=><details key={section.zone} className="season-task-zone" open>
     <summary><span><MapPin size={15}/> {section.zone}</span><small>{section.done}/{section.tasks.length} complete</small></summary>
     <div className="season-task-list">{section.tasks.map(task=>{
      const state=project.checklist[task.id],node=project.nodes.find(n=>n.id===task.nodeId),checked=!!state?.done;
      const picture=state?.photo||node?.photo;
      return <article key={task.id} className={checked?'season-task done':'season-task'}>
       <label className="season-task-check"><input type="checkbox" checked={checked} onChange={e=>onTaskChange(task.id,{done:e.target.checked})}/><span>{task.label}</span></label>
       <div className="season-task-actions">{task.nodeId&&<button onClick={()=>onLocate(task.nodeId!)} aria-label={`Show ${task.label} on diagram`}><Eye size={16}/> Diagram</button>}
        <details className="season-task-more"><summary>Notes & photo</summary>
         <div className="season-task-extra">{node?.inventory?.storage&&<small>Storage: {node.inventory.storage}</small>}
          {node?.notes&&<p>{node.notes}</p>}
          <textarea aria-label={`Notes for ${task.label}`} rows={2} placeholder="Details, exceptions or next-year reminder…" value={state?.notes||''} onChange={e=>onTaskChange(task.id,{notes:e.target.value})}/>
          {picture&&<img src={picture} alt={'Reference for '+task.label}/>}
          <label className="season-task-photo"><Camera size={15}/> {state?.photo?'Replace step photo':'Attach step photo'}<input type="file" accept="image/*" capture="environment" onChange={e=>{void choosePhoto(task.id,e.target.files?.[0]);e.target.value='';}}/></label>
         </div>
        </details></div>
      </article>;
     })}</div>
    </details>)}</div>
   </details>;
  })}</div>
  {!all&&<p className="season-tasks-warning">Add equipment and recorded connections to populate installation steps. Nothing is invented for missing wiring.</p>}
  <p className="season-tasks-footnote">Checklist steps reflect your saved plan only. Completing a step does not electrically certify a circuit or confirm the physical connection by itself.</p>
 </section>;
}
