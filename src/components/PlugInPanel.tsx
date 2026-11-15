import {useEffect,useState} from 'react';
import {Plus} from 'lucide-react';
import type {Kind,Project} from '../lib/model';
import {categories} from '../lib/model';
import {portName} from '../lib/portLabels';
import {outputIsFree,plugInTargets} from '../lib/wiringPanel';

type Props={
 project:Project;sourceId:string;port:number;
 onAddNew:(kind:Kind,name:string)=>boolean;
 onConnectExisting:(targetId:string)=>boolean;
 onCancel:()=>void;error?:string;
};
const featured:{kind:Kind;label:string;symbol:string}[]=[
 {kind:'cord',label:'Extension cord',symbol:'〰️'},{kind:'splitter',label:'Splitter',symbol:'⑂'},
 {kind:'smart-plug',label:'Smart plug',symbol:'⏱️'},{kind:'light-strand',label:'Lights',symbol:'✨'},
 {kind:'decoration',label:'Decoration',symbol:'🎄'},{kind:'spotlight',label:'Spotlight',symbol:'🔦'}
];
const otherKinds=categories.filter(c=>c.kind!=='outlet'&&!featured.some(f=>f.kind===c.kind));

/**
 * Plug exactly one item into the one output the user picked. The output is never
 * chosen here: it arrives from an explicit tap on that output's own row.
 */
export function PlugInPanel({project,sourceId,port,onAddNew,onConnectExisting,onCancel,error}:Props){
 const source=project.nodes.find(n=>n.id===sourceId);
 const existing=plugInTargets(project,sourceId);
 const [mode,setMode]=useState<'new'|'existing'>('new');
 const [kind,setKind]=useState<Kind|null>(null),[name,setName]=useState(''),[targetId,setTargetId]=useState('');
 useEffect(()=>{setMode('new');setKind(null);setName('');setTargetId('');},[sourceId,port]);
 if(!source||!outputIsFree(project,sourceId,port))return <section className="plug-in-panel" aria-label="Plug something in">
  <p role="alert">This output is no longer available. Pick another free output.</p>
  <button type="button" className="panel-secondary" onClick={onCancel}>Back</button>
 </section>;
 const target=existing.find(n=>n.id===targetId);
 return <section className="plug-in-panel" aria-label={`Plug something into ${source.name}`}>
  <p className="plug-in-where">Into <strong>{source.name}</strong> · <strong>{portName(source,port)}</strong></p>
  {existing.length>0&&<div className="panel-segments" role="group" aria-label="What plugs in">
   <button type="button" aria-pressed={mode==='new'} className={mode==='new'?'active':''} onClick={()=>setMode('new')}>Something new</button>
   <button type="button" aria-pressed={mode==='existing'} className={mode==='existing'?'active':''} onClick={()=>setMode('existing')}>Already on the diagram ({existing.length})</button>
  </div>}
  {mode==='new'?<>
   <fieldset><legend>What are you plugging in?</legend>
    <div className="plug-in-types">{featured.map(item=><button type="button" key={item.kind} aria-pressed={kind===item.kind} className={kind===item.kind?'selected':''} onClick={()=>setKind(item.kind)}><span aria-hidden="true">{item.symbol}</span>{item.label}</button>)}</div>
    <label className="plug-in-other">Another type <select aria-label="Another type to plug in" value={kind&&!featured.some(f=>f.kind===kind)?kind:''} onChange={e=>setKind(e.target.value?e.target.value as Kind:null)}><option value="">Choose…</option>{otherKinds.map(c=><option key={c.kind} value={c.kind}>{c.label}</option>)}</select></label>
   </fieldset>
   {kind&&<label className="plug-in-name">Name <input aria-label="Name of the new item" maxLength={100} value={name} placeholder={categories.find(c=>c.kind===kind)?.label} onChange={e=>setName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();if(onAddNew(kind,name)){setKind(null);setName('');}}}}/><small>Optional. You can rename it any time.</small></label>}
   {error&&<p className="panel-error" role="alert">{error}</p>}
   <div className="panel-actions">
    <button type="button" className="panel-primary" disabled={!kind} onClick={()=>{if(kind&&onAddNew(kind,name)){setKind(null);setName('');}}}><Plus size={16}/> Add and plug in</button>
    <button type="button" className="panel-secondary" onClick={onCancel}>Cancel</button>
   </div>
  </>:<>
   <fieldset><legend>Which item plugs in here?</legend>
    <div className="plug-in-existing" role="list">{existing.map(item=><div role="listitem" key={item.id}><button type="button" aria-pressed={targetId===item.id} className={targetId===item.id?'selected':''} onClick={()=>setTargetId(item.id)}><strong>{item.name}</strong><small>{item.zone}</small></button></div>)}</div>
   </fieldset>
   {error&&<p className="panel-error" role="alert">{error}</p>}
   <div className="panel-actions">
    <button type="button" className="panel-primary" disabled={!target} onClick={()=>{if(target&&onConnectExisting(target.id))setTargetId('');}}>Plug in {target?.name||'item'}</button>
    <button type="button" className="panel-secondary" onClick={onCancel}>Cancel</button>
   </div>
  </>}
  <small className="panel-note">Recorded as unverified. Check the real connection in the yard.</small>
 </section>;
}
