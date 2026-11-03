import {useEffect,useId,useRef,useState} from 'react';
import type {Component,Kind,Project,Zone} from '../lib/model';
import {categories} from '../lib/model';
import {portName} from '../lib/portLabels';
import {downstream} from '../lib/graph';
import './guidedAdd.css';

export type GuidedAddOptions={kind:Kind;name:string;zone:Zone;outputs?:number;outputsUnknown?:boolean;sourceId?:string;port?:number;color?:string;lengthFt?:number};
export type ReusableEquipment=Component & {from:string};
type Props={project:Project;reusable:ReusableEquipment[];onAdd:(options:GuidedAddOptions)=>boolean;onReuse:(assetId:string,zone:Zone)=>boolean;onConnect:(targetId:string,sourceId:string,port:number)=>boolean;onClose:()=>void;initialKind?:Kind;error?:string;onClearError?:()=>void};
const outputKinds:Kind[]=['outlet','smart-plug','cord','spt-1','splitter','inline-tap','light-strand'];
const zones:Zone[]=['Front porch','Garage & driveway','Backyard','Other'];
const featured:{kind:Kind;label:string;symbol:string}[]=[
 {kind:'outlet',label:'Outlet',symbol:'🔌'},{kind:'cord',label:'Extension cord',symbol:'〰️'},
 {kind:'light-strand',label:'Lights',symbol:'✨'},{kind:'decoration',label:'Decoration',symbol:'🎄'},
 {kind:'splitter',label:'Splitter',symbol:'⑂'},{kind:'smart-plug',label:'Smart plug',symbol:'⏱️'}
];
/** Empty outputs are only offered as choices; none are selected on the user's behalf. */
export function availableSources(project:Project){
 return project.nodes.map(node=>({node,ports:Array.from({length:node.outputs},(_,i)=>i).filter(i=>!project.edges.some(edge=>edge.source===node.id&&edge.sourcePort===i))})).filter(source=>source.ports.length>0);
}
export function GuidedAdd({project,reusable,onAdd,onReuse,onConnect,onClose,initialKind,error,onClearError}:Props){
 const dialog=useRef<HTMLElement>(null),heading=useRef<HTMLHeadingElement>(null),closeRef=useRef(onClose),titleId=useId();
 closeRef.current=onClose;
 useEffect(()=>{
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  heading.current?.focus();
  function keydown(e:KeyboardEvent){
   if(e.key==='Escape'){e.preventDefault();closeRef.current();return;}
   if(e.key!=='Tab'||!dialog.current)return;
   const controls=Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])')).filter(el=>!el.closest('details:not([open])')||el.tagName==='SUMMARY');
   if(!controls.length){e.preventDefault();heading.current?.focus();return;}
   const first=controls[0],last=controls[controls.length-1];
   if(e.shiftKey&&(document.activeElement===first||!controls.includes(document.activeElement as HTMLElement))){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&(document.activeElement===last||!controls.includes(document.activeElement as HTMLElement))){e.preventDefault();first.focus();}
  }
  document.addEventListener('keydown',keydown);
  return()=>{document.removeEventListener('keydown',keydown);if(previous?.isConnected)previous.focus();else document.getElementById('projects')?.focus();};
 },[]);
 const [kind,setKind]=useState<Kind|null>(initialKind||null),[name,setName]=useState(''),[zone,setZone]=useState<Zone|''>('');
 const [outletOutputs,setOutletOutputs]=useState(''),[connection,setConnection]=useState<'later'|'now'>('later');
 const [sourceId,setSourceId]=useState(''),[port,setPort]=useState(''),[color,setColor]=useState(''),[length,setLength]=useState(''),[reuseId,setReuseId]=useState(''),[connectTarget,setConnectTarget]=useState(''),[connectSource,setConnectSource]=useState(''),[connectPort,setConnectPort]=useState(''),[added,setAdded]=useState('');
 const sources=availableSources(project),source=sources.find(s=>s.node.id===sourceId);
 const targets=project.nodes.filter(n=>n.kind!=='outlet'&&!project.edges.some(edge=>edge.target===n.id));
 const target=targets.find(n=>n.id===connectTarget),descendants=downstream(connectTarget,project.edges),connectSources=sources.filter(s=>s.node.id!==connectTarget&&!descendants.has(s.node.id)),chosenSource=connectSources.find(s=>s.node.id===connectSource);
 const selectKind=(next:Kind)=>{onClearError?.();setKind(next);setConnection('later');setSourceId('');setPort('');setOutletOutputs('');setAdded('');};
 const canAdd=!!kind&&!!zone&&(!outputKinds.includes(kind)||outletOutputs!=='')&&(connection==='later'||(!!source&&port!==''&&source.ports.includes(Number(port))));
 function submit(e:React.FormEvent){
  e.preventDefault();if(!kind||!zone||!canAdd)return;
  const options:GuidedAddOptions={kind,name,zone};
  if(outputKinds.includes(kind)){options.outputs=outletOutputs==='unknown'?0:Number(outletOutputs);if(outletOutputs==='unknown')options.outputsUnknown=true;}
  if(kind!=='outlet'&&connection==='now'){options.sourceId=sourceId;options.port=Number(port);}
  if(['cord','spt-1','light-strand'].includes(kind)){if(color.trim())options.color=color.trim();if(length!=='')options.lengthFt=Number(length);}
  if(onAdd(options)){
   setAdded(`${name.trim()||categories.find(c=>c.kind===kind)?.label||'Item'} added. Add another item or finish.`);
   setKind(null);setName('');setColor('');setLength('');setOutletOutputs('');setConnection('later');setSourceId('');setPort('');
   dialog.current?.scrollTo?.({top:0,behavior:'smooth'});
  }else dialog.current?.scrollTo?.({top:0,behavior:'smooth'});
 }
 function connectExisting(){
  if(!target||!chosenSource||connectPort===''||!chosenSource.ports.includes(Number(connectPort)))return;
  if(onConnect(target.id,chosenSource.node.id,Number(connectPort))){setAdded(`${target.name} connected to ${chosenSource.node.name}. Verify the connection in the field.`);setConnectTarget('');setConnectSource('');setConnectPort('');}dialog.current?.scrollTo?.({top:0,behavior:'smooth'});
 }
 function reuse(){
  if(!reuseId||!zone)return;
  const item=reusable.find(n=>(n.assetId||n.id)===reuseId);
  if(item&&onReuse(reuseId,zone)){setAdded(`${item.name} added without a power connection. Add another item or finish.`);setReuseId('');}dialog.current?.scrollTo?.({top:0,behavior:'smooth'});
 }
 return <section ref={dialog} className="guided-add" role="dialog" aria-modal="true" aria-labelledby={titleId}>
  <div className="guided-add-heading"><div><h2 id={titleId} ref={heading} tabIndex={-1}>Build your display</h2><p>Add items one at a time. You can connect them now or later.</p></div><button type="button" onClick={onClose}>Done</button></div>
  {added&&<p className="guided-add-success" role="status">{added}</p>}
  {error&&<p className="guided-add-error" role="alert">{error}</p>}
  <form onSubmit={submit} onChange={()=>onClearError?.()}>
   <fieldset><legend>1. What are you adding?</legend><div className="guided-add-types">{featured.map(item=><button key={item.kind} type="button" aria-pressed={kind===item.kind} className={kind===item.kind?'selected':''} onClick={()=>selectKind(item.kind)}><span aria-hidden="true">{item.symbol}</span>{item.label}</button>)}</div>
    <label className="guided-add-more">Another type <select aria-label="Another item type" value={kind&&!featured.some(item=>item.kind===kind)?kind:''} onChange={e=>{if(e.target.value)selectKind(e.target.value as Kind)}}><option value="">Choose another type…</option>{categories.filter(c=>!featured.some(f=>f.kind===c.kind)).map(c=><option value={c.kind} key={c.kind}>{c.label}</option>)}</select></label>
   </fieldset>
   {kind&&<fieldset><legend>2. Describe it</legend>
    <label>Name <input aria-label="Item name" maxLength={100} value={name} placeholder={categories.find(c=>c.kind===kind)?.label} onChange={e=>setName(e.target.value)}/><small>Optional: use a name you will recognize.</small></label>
    <label>Area <select aria-label="Item area" value={zone} onChange={e=>setZone(e.target.value as Zone|'')}><option value="">Choose an area…</option>{zones.map(z=><option key={z} value={z}>{z}</option>)}</select></label>
    {outputKinds.includes(kind)&&<label>How many outputs can other items plug into? <select aria-label="Number of known outputs" value={outletOutputs} onChange={e=>setOutletOutputs(e.target.value)}><option value="">Choose an answer…</option><option value="unknown">Not sure yet — set later</option>{kind!=='outlet'&&<option value="0">None</option>}{Array.from({length:16},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select><small>Count the physical outputs you know. If unsure, you can add this item and set the count later; it cannot supply another item until then.</small></label>}
    {['cord','spt-1','light-strand'].includes(kind)&&<><label>Color <input aria-label="Item color" value={color} maxLength={60} placeholder="Optional" onChange={e=>setColor(e.target.value)}/></label><label>Length in feet <input aria-label="Item length in feet" type="number" min="0" max="100000" step="any" value={length} placeholder="Optional" onChange={e=>setLength(e.target.value)}/></label></>}
   </fieldset>}
   {kind&&kind!=='outlet'&&<fieldset><legend>3. Where does it plug in?</legend>
    <label className="guided-add-radio"><input type="radio" name="guided-connection" checked={connection==='later'} onChange={()=>setConnection('later')}/> Decide later — leave unconnected</label>
    <label className="guided-add-radio"><input type="radio" name="guided-connection" checked={connection==='now'} onChange={()=>setConnection('now')}/> Choose a source and output</label>
    {connection==='now'&&<div className="guided-add-connection">
     {sources.length? <><label>Plugs into <select aria-label="Power source" value={sourceId} onChange={e=>{setSourceId(e.target.value);setPort('')}}><option value="">Choose an item…</option>{sources.map(s=><option value={s.node.id} key={s.node.id}>{s.node.name} · {s.node.zone}</option>)}</select></label>
      {source&&<label>Which output? <select aria-label="Source output" value={port} onChange={e=>setPort(e.target.value)}><option value="">Choose an output…</option>{source.ports.map(p=><option value={p} key={p}>{portName(source.node,p)}</option>)}</select></label>}</>:<p>No available outputs yet. Add an outlet or leave this item unconnected.</p>}
     <small>Choose the actual physical output. Connections are saved as unverified.</small>
    </div>}
   </fieldset>}
   {kind&&<button className="guided-add-primary" type="submit" disabled={!canAdd}>Add {categories.find(c=>c.kind===kind)?.label.toLowerCase()||'item'}</button>}
  </form>
  {targets.length>0&&<details className="guided-add-reuse" onChange={()=>onClearError?.()}><summary>Connect an existing item</summary><p>Choose the item and its actual power source and output.</p>
   <label>Item to connect <select aria-label="Existing item to connect" value={connectTarget} onChange={e=>{setConnectTarget(e.target.value);setConnectSource('');setConnectPort('')}}><option value="">Choose an item…</option>{targets.map(item=><option key={item.id} value={item.id}>{item.name} · {item.zone}</option>)}</select></label>
   {target&&<label>Plugs into <select aria-label="Existing item power source" value={connectSource} onChange={e=>{setConnectSource(e.target.value);setConnectPort('')}}><option value="">Choose a source…</option>{connectSources.map(s=><option key={s.node.id} value={s.node.id}>{s.node.name} · {s.node.zone}</option>)}</select>{!connectSources.length&&<small>No available outputs yet. Add a source or update its known outputs.</small>}</label>}
   {chosenSource&&<label>Which output? <select aria-label="Existing item source output" value={connectPort} onChange={e=>setConnectPort(e.target.value)}><option value="">Choose an output…</option>{chosenSource.ports.map(p=><option key={p} value={p}>{portName(chosenSource.node,p)}</option>)}</select></label>}
   <button type="button" disabled={!target||!chosenSource||connectPort===''||!chosenSource.ports.includes(Number(connectPort))} onClick={connectExisting}>Connect item</button>
  </details>}
  {reusable.length>0&&<details className="guided-add-reuse" onChange={()=>onClearError?.()}><summary>Use equipment from another display</summary><p>Bring an existing item into this display. Its power connection will be left blank for you to review.</p>
   <label>Equipment <select aria-label="Equipment to reuse" value={reuseId} onChange={e=>setReuseId(e.target.value)}><option value="">Choose equipment…</option>{reusable.map(item=><option key={item.assetId||item.id} value={item.assetId||item.id}>{item.name} · {item.from}</option>)}</select></label>
   <label>Area <select aria-label="Area for reused equipment" value={zone} onChange={e=>setZone(e.target.value as Zone|'')}><option value="">Choose an area…</option>{zones.map(z=><option key={z} value={z}>{z}</option>)}</select></label>
   <button type="button" disabled={!zone||!reuseId} onClick={reuse}>Add existing equipment</button>
  </details>}
 </section>;
}
