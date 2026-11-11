import type {Component,Project} from '../lib/model';
import {portName} from '../lib/portLabels';
import './connectionOverview.css';

type Props={project:Project;onConnect:(targetId:string)=>void;onLocate?:(id:string)=>void};

/** A read-only overview. Starting a connection always delegates to the explicit editor. */
export function ConnectionOverview({project,onConnect,onLocate}:Props){
 const nodes=new Map(project.nodes.map(node=>[node.id,node]));
 const incoming=new Set(project.edges.map(edge=>edge.target));
 const unconnected=project.nodes.filter(node=>node.kind!=='outlet'&&!incoming.has(node.id));
 const sources=project.nodes.filter(node=>node.kind==='outlet'||node.outputsUnknown||node.outputs>0||project.edges.some(edge=>edge.source===node.id));
 const sourceName=(node:Component)=>onLocate?<button type="button" className="connection-overview-name" onClick={()=>onLocate(node.id)} aria-label={`Show ${node.name} in diagram`}>{node.name}</button>:<strong>{node.name}</strong>;
 return <details className="connection-overview">
  <summary><span><strong>Connection overview</strong><small>See recorded outputs and items without a power source</small></span><span className="connection-overview-count">{unconnected.length} unconnected</span></summary>
  <div className="connection-overview-content">
   <p>Review what is recorded. Choose an unconnected item to select its actual source and output; nothing connects automatically.</p>
   <section aria-label="Items without a recorded source" className="connection-overview-unconnected">
    <h3>Items without a recorded source <span>{unconnected.length}</span></h3>
    {unconnected.length?<ul>{unconnected.map(node=><li key={node.id}><span>{sourceName(node)}<small>{node.zone}</small></span><button type="button" className="connection-overview-connect" onClick={()=>onConnect(node.id)} aria-label={`Connect ${node.name}`}>Connect</button></li>)}</ul>:<p>All receiving items have a recorded source.</p>}
   </section>
   <section aria-label="Recorded power outputs" className="connection-overview-sources">
    <h3>Recorded outputs <span>{sources.length}</span></h3>
    {sources.length?<div className="connection-overview-grid">{sources.map(node=>{
     const edges=project.edges.filter(edge=>edge.source===node.id);
     const indexes=node.outputsUnknown?Array.from(new Set(edges.map(edge=>edge.sourcePort))).sort((a,b)=>a-b):Array.from({length:node.outputs},(_,index)=>index);
     return <article key={node.id} className="connection-overview-card">
      <div className="connection-overview-card-heading"><div>{sourceName(node)}<small>{node.zone}</small></div>{node.outputsUnknown&&<span className="connection-overview-unknown">Count unknown</span>}</div>
      {node.kind!=='outlet'&&!incoming.has(node.id)&&<p className="connection-overview-unfed">No recorded upstream source</p>}
      {node.outputsUnknown&&<p className="connection-overview-note">Output count unknown. Available outputs cannot be determined.</p>}
      {indexes.length?<ul className="connection-overview-ports">{indexes.map(index=>{
       const occupants=edges.filter(edge=>edge.sourcePort===index);
       return <li key={index}><span>{portName(node,index)}</span>{occupants.length?<span className="connection-overview-occupied">Occupied by {occupants.map((edge,i)=><span key={edge.id}>{i>0?', ':''}{nodes.get(edge.target)?.name||'unknown item'}</span>)}</span>:<span className="connection-overview-available">Available</span>}</li>;
      })}</ul>:!node.outputsUnknown&&<p className="connection-overview-note">No recorded outputs.</p>}
     </article>;
    })}</div>:<p>No sources or recorded outputs yet.</p>}
   </section>
   <small className="connection-overview-footnote">Availability reflects recorded connections, not physical condition or electrical capacity.</small>
  </div>
 </details>;
}
