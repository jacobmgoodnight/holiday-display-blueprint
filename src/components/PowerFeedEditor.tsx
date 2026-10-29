import {useEffect,useMemo,useState} from 'react';
import {Link2,Unplug} from 'lucide-react';
import type {Component,Project} from '../lib/model';

type Props={project:Project;target:Component;onConnect:(source:string,port:number)=>void;onDisconnect:()=>void};
export function PowerFeedEditor({project,target,onConnect,onDisconnect}:Props){
 const incoming=project.edges.find(e=>e.target===target.id);
 const [source,setSource]=useState(incoming?.source||'');
 const [port,setPort]=useState(incoming?.sourcePort||0);
 useEffect(()=>{setSource(incoming?.source||'');setPort(incoming?.sourcePort||0);},[target.id,incoming?.source,incoming?.sourcePort]);
 const sourceNode=project.nodes.find(n=>n.id===source);
 const candidates=useMemo(()=>project.nodes.filter(n=>n.id!==target.id&&n.outputs>0).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})),[project,target.id]);
 const occupied=(index:number)=>project.edges.some(e=>e.source===source&&e.sourcePort===index&&e.target!==target.id);
 const options=sourceNode?Array.from({length:sourceNode.outputs},(_,index)=>({index,occupied:occupied(index)})):[];
 const current=project.nodes.find(n=>n.id===incoming?.source);
 const identical=incoming?.source===source&&incoming?.sourcePort===port;
 return <section className="power-feed-editor" aria-label={`Power connection for ${target.name}`}>
  <div className="feed-heading"><Link2 size={17}/><strong>Where does this plug in?</strong></div>
  <p className="feed-current">{incoming?<>Currently fed by <strong>{current?.name||incoming.source}</strong> · output {incoming.sourcePort+1}</>:<strong>No upstream power feed recorded</strong>}</p>
  <div className="feed-controls">
   <label>Plug into
    <select aria-label={`Upstream power source for ${target.name}`} value={source} onChange={e=>{
      const next=e.target.value;setSource(next);
      const first=project.nodes.find(n=>n.id===next);
      const firstFree=Array.from({length:first?.outputs||0},(_,i)=>i).find(i=>!project.edges.some(link=>link.source===next&&link.sourcePort===i&&link.target!==target.id));
      setPort(firstFree??0);
    }}>
     <option value="">Choose an existing cord, splitter, or outlet</option>
     {candidates.map(n=><option key={n.id} value={n.id}>{n.name} ({n.id})</option>)}
    </select>
   </label>
   <label>Output
    <select aria-label="Upstream output number" value={port} disabled={!sourceNode} onChange={e=>setPort(Number(e.target.value))}>
     {options.map(o=><option key={o.index} value={o.index} disabled={o.occupied}>Output {o.index+1}{o.occupied?' · already used':''}</option>)}
    </select>
   </label>
  </div>
  <div className="feed-actions">
   <button className="button primary" disabled={!sourceNode||occupied(port)||identical} onClick={()=>onConnect(source,port)}><Link2 size={15}/> {incoming?'Update connection':'Save connection'}</button>
   {incoming&&<button className="button secondary" onClick={onDisconnect}><Unplug size={15}/> Disconnect</button>}
  </div>
  <p className="feed-caution">Changing a feed marks this branch as <strong>Draft / needs re-verification</strong> and clears its old connection checkbox. Do not move an energized cord.</p>
 </section>;
}
