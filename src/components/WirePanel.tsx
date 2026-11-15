import {useEffect,useState} from 'react';
import {ArrowRight,Check,Unplug} from 'lucide-react';
import type {Kind,Project} from '../lib/model';
import {categories} from '../lib/model';
import {portName} from '../lib/portLabels';
import {insertableKinds} from '../lib/wiringBuilder';

type Props={project:Project;edgeId:string;onInsert:(kind:Kind,name:string)=>void;onUnplug:()=>void;onOpenItem:(id:string)=>void};

/** One recorded connection. Inserting always shows the exact before/after and needs a second confirmation. */
export function WirePanel({project,edgeId,onInsert,onUnplug,onOpenItem}:Props){
 const edge=project.edges.find(e=>e.id===edgeId);
 const [kind,setKind]=useState<Kind>('splitter'),[name,setName]=useState(''),[preview,setPreview]=useState(false);
 useEffect(()=>{setKind('splitter');setName('');setPreview(false);},[edgeId]);
 if(!edge)return <section className="wire-panel"><p role="alert">This connection is no longer on the diagram.</p></section>;
 const from=project.nodes.find(n=>n.id===edge.source),to=project.nodes.find(n=>n.id===edge.target);
 const output=from?portName(from,edge.sourcePort):`Output ${edge.sourcePort+1}`;
 const insertLabel=name.trim()||categories.find(c=>c.kind===kind)?.label||kind;
 return <section className="wire-panel" aria-label="Selected connection">
  <div className="wire-ends">
   <button type="button" onClick={()=>from&&onOpenItem(from.id)}><small>From · {output}</small><strong>{from?.name||'Missing source'}</strong></button>
   <ArrowRight size={16} aria-hidden="true"/>
   <button type="button" onClick={()=>to&&onOpenItem(to.id)}><small>To</small><strong>{to?.name||'Missing item'}</strong></button>
  </div>
  <p className="wire-step">{project.checklist['wire:'+edge.id]?.done?'Install step checked':'Install step not checked yet'}</p>
  <fieldset className="wire-insert"><legend>Put something in between</legend>
   <p>Add a cord, splitter or tap on this connection without redrawing the rest.</p>
   <label>Type <select aria-label="Type to insert" value={kind} onChange={e=>{setKind(e.target.value as Kind);setPreview(false);}}>{insertableKinds.map(k=><option key={k} value={k}>{categories.find(c=>c.kind===k)?.label||k}</option>)}</select></label>
   <label>Name <input aria-label="Inserted item name" maxLength={100} value={name} placeholder="Optional" onChange={e=>{setName(e.target.value);setPreview(false);}}/></label>
   {!preview?<button type="button" className="panel-secondary" onClick={()=>setPreview(true)}>Preview change</button>:<div className="wire-preview">
    <strong>Before</strong><span>{from?.name||'Source'} ({output}) → {to?.name||'Item'}</span>
    <strong>After</strong><span>{from?.name||'Source'} ({output}) → <b>{insertLabel}</b> → {to?.name||'Item'}</span>
    <small>The old install step is reset. The new item and everything after it need checking again. Other branches are untouched.</small>
    <button type="button" className="panel-primary" onClick={()=>onInsert(kind,name)}><Check size={16}/> Confirm insertion</button>
   </div>}
  </fieldset>
  <button type="button" className="panel-danger" onClick={onUnplug}><Unplug size={15}/> Unplug {to?.name||'this item'}</button>
 </section>;
}
