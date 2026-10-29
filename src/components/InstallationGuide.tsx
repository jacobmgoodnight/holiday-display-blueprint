import {useEffect,useMemo,useState,type ReactNode} from 'react';
import {flushSync} from 'react-dom';
import {ChevronDown,ChevronRight,Eye,Layers,PlugZap,Printer} from 'lucide-react';
import type {Project} from '../lib/model';
import {buildWiringForest,wireDescription,wiringSequence,type WiringBranch} from '../lib/wiringGuide';
import './installationGuide.css';

type Props={project:Project;scope:ReadonlySet<string>;scopeLabel:string;onLocate:(id:string)=>void;onTaskChange:(id:string,done:boolean)=>void};
export function InstallationGuide({project,scope,scopeLabel,onLocate,onTaskChange}:Props){
 const [collapsed,setCollapsed]=useState<Set<string>>(()=>new Set());
 const [showSteps,setShowSteps]=useState(true);
 useEffect(()=>{setCollapsed(new Set());setShowSteps(true);},[project.id]);
 const forest=useMemo(()=>buildWiringForest(project,scope),[project,scope]);
 const steps=useMemo(()=>wiringSequence(project,scope),[project,scope]);
 const complete=steps.filter(t=>project.checklist[t.id]?.done).length;
 const expandables=forest.roots.flatMap(function all(b:WiringBranch):WiringBranch[]{return [b,...b.children.flatMap(all)];}).filter(b=>b.children.length>0);
 const toggle=(id:string)=>setCollapsed(prev=>{const next=new Set(prev);if(next.has(id))next.delete(id);else next.add(id);return next;});
 const printGuide=()=>{flushSync(()=>{setCollapsed(new Set());setShowSteps(true);});window.print();};
 const renderBranch=(branch:WiringBranch):ReactNode=>{
  const {component:n,children,via}=branch,foldable=children.length>0,isFolded=collapsed.has(n.id);
  const label=wireDescription(n,true);
  return <li className="ig-branch" key={n.id}>
   <div className={`ig-item ${n.kind==='outlet'?'ig-outlet':''}`}>
    {foldable?<button className="ig-fold" onClick={()=>toggle(n.id)} aria-expanded={!isFolded} aria-label={`${isFolded?'Expand':'Collapse'} ${n.name}`}>{isFolded?<ChevronRight size={18}/>:<ChevronDown size={18}/>}</button>:<span className="ig-no-fold"/>}
    <button className="ig-item-name" onClick={()=>onLocate(n.id)} title={`Show ${n.name} on diagram`}>
     <strong>{n.name}</strong><small>{n.kind==='outlet'?'Power source':via?`Connect to upstream output ${via.sourcePort+1}`:'No recorded upstream power connection'}</small>
    </button>
    {label&&<span className="ig-wire-label">{label}</span>}
    {isFolded&&<span className="ig-count">{branch.descendants} hidden</span>}
    <button className="ig-locate" aria-label={`Locate ${n.name} on diagram`} onClick={()=>onLocate(n.id)}><Eye size={16}/></button>
   </div>
   {n.notes&&<p className="ig-component-notes">Notes: {n.notes}</p>}
   {foldable&&!isFolded&&<ul className="ig-children">{children.map(renderBranch)}</ul>}
  </li>;
 };
 let previousPhase='';
 return <div className="install-guide" aria-label="Simplified wiring installation guide">
  <div className="ig-intro">
   <div><span className="eyebrow">IN THE YARD · INSTALLATION VIEW</span><h2>Follow each power branch</h2><p>Use the outlet shortcuts above, collapse busy splitter branches, or tap an item to see it on the wiring diagram.</p><p className="ig-print-heading">{project.season} {project.year} · {scopeLabel} · {project.status==='draft'?'Draft; verify wiring':'As-installed; electrical safety unverified'}</p></div>
   <span className="ig-status">{project.status==='verified'?'As-installed label · safety unverified':'Draft wiring · verify on site'}</span>
  </div>
  <div className="ig-grid">
   <section className="ig-section">
    <div className="ig-heading"><h3><Layers size={18}/> Power-connection branches</h3><div className="ig-actions"><button onClick={()=>setCollapsed(new Set(expandables.map(b=>b.component.id)))}>Collapse all</button><button onClick={()=>setCollapsed(new Set())}>Expand all</button><button className="ig-print-button" onClick={printGuide} aria-label={`Print installation guide for ${scopeLabel}`}><Printer size={16}/> Print this view</button></div></div>
    {forest.unconnected>0&&<p className="ig-warning">{forest.unconnected} source-less component(s) appear in this view. Check their power feed before setup; the app will not guess.</p>}
    {forest.roots.length?<ul className="ig-roots">{forest.roots.map(renderBranch)}</ul>:<p className="ig-empty">No components in this view. Choose another outlet or use the diagram editor.</p>}
   </section>
   <section className="ig-section">
    <div className="ig-heading"><h3><PlugZap size={18}/> Numbered installation sequence</h3><button onClick={()=>setShowSteps(x=>!x)} aria-expanded={showSteps}>{showSteps?'Hide steps':'Show steps'}</button></div>
    <p className="ig-progress">{complete} / {steps.length} complete · also updates Installation steps</p>
    <div className="ig-progress-track"><span style={{width:`${steps.length?complete/steps.length*100:0}%`}}/></div>
    <p className="ig-note">Place equipment, connect downstream first, attach upstream feeds last, and perform attended testing. Verify loads, connectors, weather protection, and GFCI separately.</p>
    {showSteps&&<ol className="ig-steps">{steps.map(t=>{
      const newPhase=previousPhase!==t.phase;previousPhase=t.phase;
      const component=project.nodes.find(n=>n.id===t.nodeId);
      const photo=project.checklist[t.id]?.photo||component?.photo;
      return <li key={t.id} className={project.checklist[t.id]?.done?'ig-complete':''}>
        {newPhase&&<h4 className="ig-phase">{t.phase}</h4>}
        <div className="ig-step">
         <span className="ig-number">{t.number}</span>
         <label><input type="checkbox" checked={!!project.checklist[t.id]?.done} onChange={e=>onTaskChange(t.id,e.target.checked)}/><span>{t.label}</span></label>
         {t.nodeId&&<button onClick={()=>onLocate(t.nodeId!)} aria-label={`Locate step ${t.number} on diagram`}><Eye size={16}/></button>}
        </div>
        {project.checklist[t.id]?.notes&&<p className="ig-step-note">Note: {project.checklist[t.id].notes}</p>}
        {photo&&<img className="ig-step-photo" src={photo} alt={`Installation reference for ${component?.name||t.label}`}/>}
        {component?.notes&&<p className="ig-step-note">Equipment note: {component.notes}</p>}
      </li>;
    })}</ol>}
    {!steps.length&&<p className="ig-empty">No installation steps for this circuit.</p>}
   </section>
  </div>
 </div>;
}
