import {useEffect,useRef,useState,type ReactNode} from 'react';
import {Camera,ImagePlus,MapPin,Move,Trash2} from 'lucide-react';
import type {Project} from '../lib/model';
import type {PhotoPoint,PropertyPhoto} from '../lib/propertyPhoto';
import {propertyPhotoPoint} from '../lib/propertyPhoto';
import {readPhoto} from '../lib/photos';
import {sourcePath} from '../lib/graph';
import './propertyPhoto.css';

type Props={project:Project;value?:PropertyPhoto;onChange:(value:PropertyPhoto|undefined)=>void;onOpenItem?:(id:string)=>void;onAddItem?:()=>void;selectedItemId?:string|null;photoPlaceActive?:boolean;onPhotoPlace?:(point:PhotoPoint)=>void;onPhotoModeChange?:()=>void;connectTargetId?:string|null;onSelectConnectionSource?:(id:string)=>void;onSelectItem?:(id:string)=>void;onConnectItem?:(id:string)=>void;connectionPanel?:ReactNode;addPalette?:ReactNode};
export function PropertyPhotoView({project,value,onChange,onOpenItem,onAddItem,selectedItemId,photoPlaceActive,onPhotoPlace,onPhotoModeChange,connectTargetId,onSelectConnectionSource,onSelectItem,onConnectItem,connectionPanel,addPalette}:Props){
 const [selected,setSelected]=useState('');
 const [placing,setPlacing]=useState(false);
 const [drawing,setDrawing]=useState<PhotoPoint[]|null>(null);
 const [drawingItemId,setDrawingItemId]=useState('');
 const [routeDrafts,setRouteDrafts]=useState<Record<string,PhotoPoint[]>>({});
 const [cursor,setCursor]=useState<PhotoPoint>({x:.5,y:.5});
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const photoArea=useRef<HTMLDivElement>(null);
 const current=useRef({project,value,routeDrafts});current.current={project,value,routeDrafts};
 const alive=useRef(true);
 useEffect(()=>{alive.current=true;return ()=>{alive.current=false;};},[]);
 useEffect(()=>{setSelected('');setPlacing(false);setDrawing(null);setDrawingItemId('');setRouteDrafts({});setBusy(false);setError('');},[project.id]);
 useEffect(()=>{if(selectedItemId&&project.nodes.some(n=>n.id===selectedItemId)){setSelected(selectedItemId);setPlacing(false);setDrawing(null);}},[project.id,selectedItemId]);
 useEffect(()=>{if(photoPlaceActive||connectTargetId){setPlacing(false);setDrawing(null);}},[photoPlaceActive,connectTargetId]);
 useEffect(()=>{if(drawing&&drawingItemId)setRouteDrafts(drafts=>({...drafts,[drawingItemId]:drawing}));},[drawing,drawingItemId]);
 useEffect(()=>{if(placing||drawing)photoArea.current?.scrollIntoView?.({behavior:'smooth',block:'center'});},[placing,!!drawing]);
 const node=project.nodes.find(n=>n.id===selected);
 const position=node&&value?.placements[node.id];
 const route=node&&value?.routes?.[node.id];
 const routeKind=node?.kind==='light-strand'?'lights':node?.kind==='cord'||node?.kind==='spt-1'?'cord':undefined;
 const choose=(id:string)=>{if(connectTargetId&&onSelectConnectionSource){onSelectConnectionSource(id);return;}setSelected(id);setPlacing(false);setDrawing(null);onSelectItem?.(id);};
 const upload=async(file?:File)=>{
  if(!file||busy)return;
  if(value&&!window.confirm(Object.keys(value.placements).length||Object.keys(value.routes||{}).length||Object.values(routeDrafts).some(points=>points.length)?'Replacing the property photo clears its item locations and drawn routes. Continue?':'Replace the current property photo?'))return;
  const projectId=project.id,previousValue=value,previousDrafts=routeDrafts;setBusy(true);setError('');
  try{const photo=await readPhoto(file);if(alive.current&&current.current.project.id===projectId){if(current.current.value!==previousValue||current.current.routeDrafts!==previousDrafts){setError('Photo locations or route drafts changed while the image was loading. Please choose the photo again.');return;}onChange({photo,placements:{}});setPlacing(false);setDrawing(null);setRouteDrafts({});}}
  catch(e){if(alive.current&&current.current.project.id===projectId)setError(e instanceof Error?e.message:'Unable to read photo');}
  finally{if(alive.current&&current.current.project.id===projectId)setBusy(false);}
 };
 const put=(point:{x:number;y:number})=>{if(!value||!node)return;onChange({...value,placements:{...value.placements,[node.id]:point}});setPlacing(false);};
 const removeMarker=()=>{if(!value||!node)return;const placements={...value.placements};delete placements[node.id];onChange({...value,placements});setPlacing(false);};
 const nudge=(dx:number,dy:number)=>{if(position)put({x:Math.max(0,Math.min(1,position.x+dx)),y:Math.max(0,Math.min(1,position.y+dy))});};
 const startDrawing=()=>{if(!node)return;onPhotoModeChange?.();setPlacing(false);setCursor({x:.5,y:.5});setDrawingItemId(node.id);setDrawing(routeDrafts[node.id]||[]);};
 const moveCursor=(dx:number,dy:number)=>setCursor(p=>({x:Math.max(0,Math.min(1,p.x+dx)),y:Math.max(0,Math.min(1,p.y+dy))}));
 const clearDraft=(id:string)=>setRouteDrafts(drafts=>{const next={...drafts};delete next[id];return next;});
 const saveRoute=()=>{if(!value||!node||!routeKind||!drawing||drawing.length<2)return;onChange({...value,routes:{...value.routes,[node.id]:{kind:routeKind,points:drawing}}});setDrawing(null);clearDraft(node.id);};
 const removeRoute=()=>{if(!value||!node||!value.routes||!window.confirm(`Remove the drawn route for ${node.name}?`))return;const routes={...value.routes};delete routes[node.id];onChange({...value,routes});setDrawing(null);clearDraft(node.id);};
 return <section className="property-view" aria-label="Property photo planner">
  <div className="property-heading"><div><span className="property-eyebrow">VISUAL PLANNER</span><h2>Plan on your property photo</h2><p>Place your equipment where it belongs. Photo locations do not create or change power connections.</p></div>
   <div className="property-upload"><label><Camera size={16}/>{value?'Replace photo':'Take a photo'}<input disabled={busy} type="file" accept="image/*" capture="environment" onChange={e=>{const file=e.target.files?.[0];e.target.value='';void upload(file);}}/></label><label><ImagePlus size={16}/>{value?'Choose another':'Choose photo'}<input disabled={busy} type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];e.target.value='';void upload(file);}}/></label>{onAddItem&&<button type="button" onClick={onAddItem}>Add equipment</button>}</div>
  </div>
  {busy&&<p role="status">Preparing photo…</p>}{error&&<p role="alert">{error}</p>}
  {!value?<div className="property-empty"><ImagePlus size={30}/><strong>Start with a photo of your house or yard</strong><p>Choose a photo, then select an item and tap where it goes. Photos are compressed and saved with this plan. They use device storage and count toward sync limits.</p></div>:<>
   {addPalette}{connectionPanel}
   <p className="property-help">{connectTargetId?'Tap a marker or choose equipment below to select a power source.':drawing?`Tap the photo to trace ${node?.name}. Add at least two points, then save the route.`:placing&&node?`Tap the photo to ${position?'move':'place'} ${node.name}.`:photoPlaceActive?'Tap the photo to add equipment.':'Select an item below or tap a marker to see its details.'}</p>{placing&&node&&<button type="button" className="property-center" onClick={()=>put({x:.5,y:.5})}>Place in center, then fine tune</button>}{photoPlaceActive&&onPhotoPlace&&<button type="button" className="property-center" onClick={()=>onPhotoPlace({x:.5,y:.5})}>Add at center, then fine tune</button>}
   {drawing&&<div className="property-route-controls" role="group" aria-label="Draw route controls"><span>{drawing.length} {drawing.length===1?'point':'points'} · Drawing is a visual guide, not a connection or measurement. Save before leaving this screen.</span><button type="button" onClick={()=>setDrawing(drawing.slice(0,-1))} disabled={!drawing.length}>Undo point</button><button type="button" onClick={saveRoute} disabled={drawing.length<2}>Save route</button><button type="button" onClick={()=>{setDrawing(null);if(node)clearDraft(node.id);}}>Cancel drawing</button><details><summary>Use keyboard to place points</summary><div className="property-route-keyboard"><span>Cursor: {Math.round(cursor.x*100)}% across, {Math.round(cursor.y*100)}% down</span><button type="button" aria-label="Move route cursor up" onClick={()=>moveCursor(0,-.05)}>↑</button><button type="button" aria-label="Move route cursor left" onClick={()=>moveCursor(-.05,0)}>←</button><button type="button" aria-label="Move route cursor right" onClick={()=>moveCursor(.05,0)}>→</button><button type="button" aria-label="Move route cursor down" onClick={()=>moveCursor(0,.05)}>↓</button><button type="button" disabled={drawing.length>=500} onClick={()=>setDrawing([...drawing,cursor])}>Add point at cursor</button></div></details></div>}
   <div ref={photoArea} className={'property-image'+(placing||drawing||photoPlaceActive?' placing':'')+(drawing?' drawing':'')} onClick={e=>{const point=propertyPhotoPoint(e.clientX,e.clientY,e.currentTarget.getBoundingClientRect());if(!point||connectTargetId)return;if(drawing){if(drawing.length<500){setCursor(point);setDrawing([...drawing,point]);}return;}if(placing){put(point);return;}if(photoPlaceActive)onPhotoPlace?.(point);}}>
    <img src={value.photo} alt="Property for display planning" draggable={false}/>
    <svg className="property-routes" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">{Object.entries(value.routes||{}).map(([id,r])=>{if(!project.nodes.some(n=>n.id===id)||drawing&&id===node?.id)return null;return <polyline key={id} className={'property-route '+r.kind+(selected===id?' selected':'')} vectorEffect="non-scaling-stroke" points={r.points.map(p=>`${p.x*1000},${p.y*1000}`).join(' ')}/>;})}{drawing&&<><polyline className={'property-route '+routeKind+' selected'} vectorEffect="non-scaling-stroke" points={drawing.map(p=>`${p.x*1000},${p.y*1000}`).join(' ')}/><circle className="property-route-cursor" cx={cursor.x*1000} cy={cursor.y*1000} r="10" vectorEffect="non-scaling-stroke"/></>}</svg>
    {project.nodes.map(n=>{const p=value.placements[n.id];if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return null;return <button type="button" key={n.id} className={'property-marker'+(selected===n.id?' active':'')} style={{left:`${Math.max(0,Math.min(1,p.x))*100}%`,top:`${Math.max(0,Math.min(1,p.y))*100}%`}} aria-label={'Select '+n.name} title={n.name} onClick={e=>{e.stopPropagation();choose(n.id);}}><MapPin size={18}/><span>{n.name}</span></button>;})}
   </div>
   <div className="property-layout"><div className="property-items"><h3>Equipment <small>{project.nodes.filter(n=>!!value.placements[n.id]).length} of {project.nodes.length} placed</small></h3>{project.nodes.length?<div className="property-item-list">{project.nodes.map(n=><button key={n.id} type="button" className={selected===n.id?'active':''} aria-pressed={selected===n.id} onClick={()=>choose(n.id)}><span>{n.name}<small>{n.zone}</small></span><small>{value.placements[n.id]?'Placed':'Not placed'}</small></button>)}</div>:<p>Add equipment to your display first, then place it here.</p>}</div>
    <div className="property-detail">{node?<><h3>{node.name}</h3><p>{node.zone} · {node.kind}</p>{node.notes&&<p>{node.notes}</p>}<p><strong>Recorded power path</strong><br/>{node.kind!=='outlet'&&!project.edges.some(edge=>edge.target===node.id)?'No recorded upstream connection':sourcePath(node.id,project).map(n=>n.name).join(' → ')}</p><div className="property-detail-actions"><button type="button" onClick={()=>{if(!placing)onPhotoModeChange?.();setDrawing(null);setPlacing(!placing);}}><Move size={16}/>{placing?'Cancel placement':position?'Move on photo':'Place on photo'}</button>{position&&<button type="button" onClick={removeMarker}><Trash2 size={16}/> Remove marker</button>}{routeKind&&<button type="button" onClick={startDrawing}>{routeDrafts[node.id]?.length?'Continue drawing':route?'Redraw route':'Draw route'}</button>}{route&&<button type="button" onClick={removeRoute}><Trash2 size={16}/> Remove route</button>}{onConnectItem&&node.kind!=='outlet'&&!project.edges.some(edge=>edge.target===node.id)&&<button type="button" onClick={()=>{setDrawing(null);setPlacing(false);onConnectItem(node.id);}}>Connect</button>}{onOpenItem&&<button type="button" onClick={()=>onOpenItem(node.id)}>Item details</button>}</div>{routeKind&&<p>{route?'Route saved on photo.':'Draw a visual route for this item.'} Lines do not create power connections or estimate length.</p>}{position&&<div className="property-nudge" aria-label="Adjust marker position"><span>Fine tune:</span><button type="button" onClick={()=>nudge(0,-0.01)} aria-label="Move marker up">↑</button><button type="button" onClick={()=>nudge(-0.01,0)} aria-label="Move marker left">←</button><button type="button" onClick={()=>nudge(0.01,0)} aria-label="Move marker right">→</button><button type="button" onClick={()=>nudge(0,0.01)} aria-label="Move marker down">↓</button></div>}</>:<p>Choose an item to place it or view its power path.</p>}</div>
   </div>
   <button type="button" className="property-remove-photo" onClick={()=>{if(window.confirm('Remove this property photo, item locations and drawn routes?')){onChange(undefined);setPlacing(false);setDrawing(null);setRouteDrafts({});}}}>Remove property photo</button>
  </>}
 </section>;
}
