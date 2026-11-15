import {useEffect,useState} from 'react';
import {ArrowDownToLine,ArrowUpFromLine,Plus,Unplug} from 'lucide-react';
import type {Component,Project} from '../lib/model';
import {portName} from '../lib/portLabels';
import {outputRows} from '../lib/wiringPanel';

type InProps={project:Project;node:Component;onPlugInto:()=>void;onUnplug:()=>void;onOpenItem:(id:string)=>void};

/** Where this item gets power. Changing it always goes through the explicit source + output picker. */
export function PowerInSection({project,node,onPlugInto,onUnplug,onOpenItem}:InProps){
 const feed=project.edges.find(e=>e.target===node.id);
 const source=project.nodes.find(n=>n.id===feed?.source);
 return <section className="power-section" aria-label={`Power in for ${node.name}`}>
  <h4><ArrowDownToLine size={15}/> Power in</h4>
  {node.kind==='outlet'?<p className="power-plain">This is a power source. Nothing plugs into it on the diagram.</p>
  :feed?<>
   <p className="power-plain">Plugged into <button type="button" className="power-link" onClick={()=>source&&onOpenItem(source.id)}>{source?.name||'a missing item'}</button> · {source?portName(source,feed.sourcePort):`Output ${feed.sourcePort+1}`}</p>
   <div className="power-actions"><button type="button" onClick={onPlugInto}>Change…</button><button type="button" onClick={onUnplug}><Unplug size={14}/> Unplug</button></div>
  </>:<>
   <p className="power-plain power-missing">Not plugged in yet.</p>
   <div className="power-actions"><button type="button" className="panel-primary" onClick={onPlugInto}>Plug into…</button></div>
  </>}
 </section>;
}

type OutProps={project:Project;node:Component;onPlugIn:(port:number)=>void;onOpenItem:(id:string)=>void;onSetOutputs:(count:number)=>boolean};

/** One row per physical output. A free row is the only place a new downstream connection starts. */
export function PowerOutSection({project,node,onPlugIn,onOpenItem,onSetOutputs}:OutProps){
 const [count,setCount]=useState('');
 useEffect(()=>setCount(''),[node.id]);
 if(!node.outputsUnknown&&node.outputs===0)return null;
 const rows=outputRows(project,node);
 const free=rows.filter(r=>!r.edge).length;
 return <section className="power-section" aria-label={`Power out for ${node.name}`}>
  <h4><ArrowUpFromLine size={15}/> Power out {!node.outputsUnknown&&<small>{free} of {rows.length} free</small>}</h4>
  {node.outputsUnknown?<div className="power-unknown">
   <p className="power-plain power-missing">How many outputs does it have? Count the real sockets before plugging anything in.</p>
   <label>Outputs <select aria-label={`Actual number of outputs on ${node.name}`} value={count} onChange={e=>setCount(e.target.value)}><option value="">Choose a number…</option>{node.kind!=='outlet'&&<option value="0">0</option>}{Array.from({length:16},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label>
   <button type="button" disabled={count===''} onClick={()=>{if(count!==''&&onSetOutputs(Number(count)))setCount('');}}>Save count</button>
  </div>:<ul className="power-outputs">{rows.map(row=><li key={row.index}>
   <span className="power-output-name">{row.label}</span>
   {row.edge?<button type="button" className="power-link" onClick={()=>row.occupant&&onOpenItem(row.occupant.id)} aria-label={`${row.label}: ${row.occupant?.name||'unknown item'}. Show it.`}>{row.occupant?.name||'Unknown item'}</button>
   :<button type="button" className="power-plug-in" onClick={()=>onPlugIn(row.index)} aria-label={`Plug something into ${row.label} of ${node.name}`}><Plus size={14}/> Plug something in</button>}
  </li>)}</ul>}
 </section>;
}
