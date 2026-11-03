import {useEffect,useRef,useState} from 'react';
import {Camera,ImagePlus,MapPin,Move,Trash2} from 'lucide-react';
import type {Project} from '../lib/model';
import type {PropertyPhoto} from '../lib/propertyPhoto';
import {propertyPhotoPoint} from '../lib/propertyPhoto';
import {readPhoto} from '../lib/photos';
import {sourcePath} from '../lib/graph';
import './propertyPhoto.css';

type Props={project:Project;value?:PropertyPhoto;onChange:(value:PropertyPhoto|undefined)=>void;onOpenItem?:(id:string)=>void;onAddItem?:()=>void;selectedItemId?:string|null};
export function PropertyPhotoView({project,value,onChange,onOpenItem,onAddItem,selectedItemId}:Props){
 const [selected,setSelected]=useState('');
 const [placing,setPlacing]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const photoArea=useRef<HTMLDivElement>(null);
 const current=useRef({project,value});current.current={project,value};
 const alive=useRef(true);
 useEffect(()=>{alive.current=true;return ()=>{alive.current=false;};},[]);
 useEffect(()=>{setSelected('');setPlacing(false);setBusy(false);setError('');},[project.id]);
 useEffect(()=>{if(selectedItemId&&project.nodes.some(n=>n.id===selectedItemId)){setSelected(selectedItemId);setPlacing(false);}},[project.id,selectedItemId]);
 useEffect(()=>{if(placing)photoArea.current?.scrollIntoView?.({behavior:'smooth',block:'center'});},[placing]);
 const node=project.nodes.find(n=>n.id===selected);
 const position=node&&value?.placements[node.id];
 const choose=(id:string)=>{setSelected(id);setPlacing(false);};
 const upload=async(file?:File)=>{
  if(!file||busy)return;
  if(value&&!window.confirm(Object.keys(value.placements).length?'Replacing the property photo clears its item locations. Continue?':'Replace the current property photo?'))return;
  const projectId=project.id,previousValue=value;setBusy(true);setError('');
  try{const photo=await readPhoto(file);if(alive.current&&current.current.project.id===projectId){if(current.current.value!==previousValue){setError('Photo locations changed while the image was loading. Please choose the photo again.');return;}onChange({photo,placements:{}});setPlacing(false);}}
  catch(e){if(alive.current&&current.current.project.id===projectId)setError(e instanceof Error?e.message:'Unable to read photo');}
  finally{if(alive.current&&current.current.project.id===projectId)setBusy(false);}
 };
 const put=(point:{x:number;y:number})=>{if(!value||!node)return;onChange({...value,placements:{...value.placements,[node.id]:point}});setPlacing(false);};
 const removeMarker=()=>{if(!value||!node)return;const placements={...value.placements};delete placements[node.id];onChange({...value,placements});setPlacing(false);};
 const nudge=(dx:number,dy:number)=>{if(position)put({x:Math.max(0,Math.min(1,position.x+dx)),y:Math.max(0,Math.min(1,position.y+dy))});};
 return <section className="property-view" aria-label="Property photo planner">
  <div className="property-heading"><div><span className="property-eyebrow">VISUAL PLANNER</span><h2>Plan on your property photo</h2><p>Place your equipment where it belongs. Photo locations do not create or change power connections.</p></div>
   <div className="property-upload"><label><Camera size={16}/>{value?'Replace photo':'Take a photo'}<input disabled={busy} type="file" accept="image/*" capture="environment" onChange={e=>{const file=e.target.files?.[0];e.target.value='';void upload(file);}}/></label><label><ImagePlus size={16}/>{value?'Choose another':'Choose photo'}<input disabled={busy} type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];e.target.value='';void upload(file);}}/></label>{onAddItem&&<button type="button" onClick={onAddItem}>Add equipment</button>}</div>
  </div>
  {busy&&<p role="status">Preparing photo…</p>}{error&&<p role="alert">{error}</p>}
  {!value?<div className="property-empty"><ImagePlus size={30}/><strong>Start with a photo of your house or yard</strong><p>Choose a photo, then select an item and tap where it goes. Photos are compressed and saved with this plan. They use device storage and count toward sync limits.</p></div>:<>
   <p className="property-help">{placing&&node?`Tap the photo to ${position?'move':'place'} ${node.name}.`:'Select an item below or tap a marker to see its details.'}</p>{placing&&node&&<button type="button" className="property-center" onClick={()=>put({x:.5,y:.5})}>Place in center, then fine tune</button>}
   <div ref={photoArea} className={'property-image'+(placing?' placing':'')} onClick={e=>{if(!placing)return;const point=propertyPhotoPoint(e.clientX,e.clientY,e.currentTarget.getBoundingClientRect());if(point)put(point);}}>
    <img src={value.photo} alt="Property for display planning" draggable={false}/>
    {project.nodes.map(n=>{const p=value.placements[n.id];if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return null;return <button type="button" key={n.id} className={'property-marker'+(selected===n.id?' active':'')} style={{left:`${Math.max(0,Math.min(1,p.x))*100}%`,top:`${Math.max(0,Math.min(1,p.y))*100}%`}} aria-label={'Select '+n.name} title={n.name} onClick={e=>{e.stopPropagation();choose(n.id);}}><MapPin size={18}/><span>{n.name}</span></button>;})}
   </div>
   <div className="property-layout"><div className="property-items"><h3>Equipment <small>{project.nodes.filter(n=>!!value.placements[n.id]).length} of {project.nodes.length} placed</small></h3>{project.nodes.length?<div className="property-item-list">{project.nodes.map(n=><button key={n.id} type="button" className={selected===n.id?'active':''} aria-pressed={selected===n.id} onClick={()=>choose(n.id)}><span>{n.name}<small>{n.zone}</small></span><small>{value.placements[n.id]?'Placed':'Not placed'}</small></button>)}</div>:<p>Add equipment to your display first, then place it here.</p>}</div>
    <div className="property-detail">{node?<><h3>{node.name}</h3><p>{node.zone} · {node.kind}</p>{node.notes&&<p>{node.notes}</p>}<p><strong>Recorded power path</strong><br/>{node.kind!=='outlet'&&!project.edges.some(edge=>edge.target===node.id)?'No recorded upstream connection':sourcePath(node.id,project).map(n=>n.name).join(' → ')}</p><div className="property-detail-actions"><button type="button" onClick={()=>setPlacing(!placing)}><Move size={16}/>{placing?'Cancel placement':position?'Move on photo':'Place on photo'}</button>{position&&<button type="button" onClick={removeMarker}><Trash2 size={16}/> Remove marker</button>}{onOpenItem&&<button type="button" onClick={()=>onOpenItem(node.id)}>Item details</button>}</div>{position&&<div className="property-nudge" aria-label="Adjust marker position"><span>Fine tune:</span><button type="button" onClick={()=>nudge(0,-0.01)} aria-label="Move marker up">↑</button><button type="button" onClick={()=>nudge(-0.01,0)} aria-label="Move marker left">←</button><button type="button" onClick={()=>nudge(0.01,0)} aria-label="Move marker right">→</button><button type="button" onClick={()=>nudge(0,0.01)} aria-label="Move marker down">↓</button></div>}</>:<p>Choose an item to place it or view its power path.</p>}</div>
   </div>
   <button type="button" className="property-remove-photo" onClick={()=>{if(window.confirm('Remove this property photo and its item locations?')){onChange(undefined);setPlacing(false);}}}>Remove property photo</button>
  </>}
 </section>;
}
