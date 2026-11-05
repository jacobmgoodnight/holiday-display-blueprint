import {useEffect,useState} from 'react';
import type {Project} from '../lib/model';
import {downstream} from '../lib/graph';
import {portName} from '../lib/portLabels';
import './photoConnect.css';

type Props={project:Project;targetId:string;sourceId:string;onSourceChange:(id:string)=>void;onConnect:(sourceId:string,port:number)=>boolean;onSetOutputs?:(id:string,count:number)=>boolean;onCancel:()=>void;error?:string;surface?:'photo'|'diagram'};

/** Explain ineligible sources instead of silently changing the user's choice. */
export function photoConnectionSourceReason(project:Project,targetId:string,sourceId:string):string|undefined{
 const source=project.nodes.find(n=>n.id===sourceId);
 if(!source)return 'Choose an existing item as the power source.';
 if(sourceId===targetId)return 'An item cannot plug into itself.';
 if(downstream(targetId,project.edges).has(sourceId))return 'This source is downstream of the item and would create a power loop.';
 if(source.outputsUnknown)return 'This item’s number of outputs is unknown. Record its actual output count below before connecting.';
 if(source.outputs===0)return 'This item has no recorded outputs.';
 if(Array.from({length:source.outputs},(_,i)=>i).every(i=>project.edges.some(e=>e.source===sourceId&&e.sourcePort===i)))return 'All outputs on this item are already occupied.';
 return undefined;
}

/** The graph is only changed after an explicit source, free output, and confirmation. */
export function PhotoConnect({project,targetId,sourceId,onSourceChange,onConnect,onSetOutputs,onCancel,error,surface='photo'}:Props){
 const [port,setPort]=useState<number|undefined>();
 const [outputCount,setOutputCount]=useState('');
 useEffect(()=>{setPort(undefined);setOutputCount('');},[targetId,sourceId]);
 const target=project.nodes.find(n=>n.id===targetId),source=project.nodes.find(n=>n.id===sourceId);
 const existing=project.edges.find(e=>e.target===targetId);
 const reason=sourceId?photoConnectionSourceReason(project,targetId,sourceId):undefined;
 const ports=source?Array.from({length:source.outputs},(_,index)=>({index,edge:project.edges.find(e=>e.source===source.id&&e.sourcePort===index)})):[];
 const selectedPort=ports.find(p=>p.index===port&&!p.edge);
 const canConnect=!!target&&target.kind!=='outlet'&&!existing&&!!source&&!reason&&!!selectedPort;
 return <section className="photo-connect" aria-label="Connect equipment">
  <div className="photo-connect-heading"><h4>Connect {target?.name||'item'}</h4><button type="button" onClick={onCancel}>Cancel</button></div>
  {!target?<p role="alert">This item is no longer in the display.</p>:target.kind==='outlet'?<p>An outlet cannot receive a power connection.</p>:existing?<p>This item already has a recorded connection. Use item details to change it.</p>:<>
   <p>Tap its power source on the {surface}, or choose one below. Then select the actual output.</p>
   <label>Power source <select aria-label={surface==='photo'?'Photo connection power source':'Diagram connection power source'} value={sourceId} onChange={e=>onSourceChange(e.target.value)}><option value="">Choose a source…</option>{project.nodes.map(n=>{const why=photoConnectionSourceReason(project,targetId,n.id);return <option key={n.id} value={n.id}>{n.name} · {n.zone}{why?' — unavailable':''}</option>;})}</select></label>
   {reason&&<p className="photo-connect-reason" role="status">{reason}</p>}
   {source?.outputsUnknown&&onSetOutputs&&<div className="photo-connect-count"><label>Record actual outputs <select aria-label="Actual number of outputs" value={outputCount} onChange={e=>setOutputCount(e.target.value)}><option value="">Choose a number…</option>{source.kind!=='outlet'&&<option value="0">0</option>}{Array.from({length:16},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label><small>Count the physical outputs on this item. You will still choose a specific output for the connection.</small><button type="button" disabled={outputCount===''} onClick={()=>{if(outputCount!==''&&onSetOutputs(source.id,Number(outputCount))){setOutputCount('');setPort(undefined);}}}>Save output count</button></div>}
   {source&&ports.length>0&&<fieldset><legend>Which output on {source.name}?</legend><div className="photo-connect-ports">{ports.map(({index,edge})=>{const occupant=edge&&project.nodes.find(n=>n.id===edge.target);return <button type="button" key={index} disabled={!!edge||!!reason} aria-pressed={port===index&&!edge&&!reason} onClick={()=>setPort(index)}>{portName(source,index)}<small>{edge?`Occupied${occupant?` by ${occupant.name}`:''}`:'Available'}</small></button>;})}</div></fieldset>}
   {error&&<p className="photo-connect-reason" role="alert">{error}</p>}
   <button type="button" className="photo-connect-submit" disabled={!canConnect} onClick={()=>{if(canConnect&&port!==undefined)onConnect(sourceId,port);}}>Save connection</button>
   <small className="photo-connect-note">Choose the physical output you will use. This connection is saved as unverified.</small>
  </>}
 </section>;
}
