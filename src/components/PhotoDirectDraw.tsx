import type {DirectRouteDraft,DirectRouteKind} from '../lib/photoDirectDraw';
import type {Zone} from '../lib/model';
import './photoDirectDraw.css';

type Props={value:DirectRouteDraft|null;onChange:(value:DirectRouteDraft|null)=>void;onSave:(draft:DirectRouteDraft)=>boolean};
const zones:Zone[]=['Front porch','Garage & driveway','Backyard','Other'];

/** Controlled starter and accessible controls; taps on the photo are owned by the parent. */
export function PhotoDirectDraw({value,onChange,onSave}:Props){
 const start=(kind:DirectRouteKind)=>onChange({kind,zone:'',points:[],cursor:{x:.5,y:.5}});
 const cancel=()=>{if(value?.points.length&&!window.confirm('Discard this unfinished route?'))return;onChange(null);};
 const move=(dx:number,dy:number)=>{if(!value)return;onChange({...value,cursor:{x:Math.max(0,Math.min(1,value.cursor.x+dx)),y:Math.max(0,Math.min(1,value.cursor.y+dy))}});};
 const valid=value&&value.zone&&value.points.length>=2&&value.points.some(p=>p.x!==value.points[0].x||p.y!==value.points[0].y);
 return <section className="photo-direct-draw" aria-label="Draw new equipment">
  {!value?<><strong>Draw a new run</strong><p>Trace a light strand or extension cord directly on the photo.</p><div className="photo-direct-actions"><button type="button" onClick={()=>start('lights')}>Draw lights</button><button type="button" onClick={()=>start('cord')}>Draw cord</button></div></>:<>
   <div className="photo-direct-heading"><strong>Draw {value.kind==='lights'?'lights':'cord'}</strong><button type="button" onClick={cancel}>Cancel</button></div>
   <label>Area <select aria-label="Area for drawn equipment" value={value.zone} onChange={event=>onChange({...value,zone:event.target.value as Zone|''})}><option value="">Choose an area…</option>{zones.map(zone=><option key={zone} value={zone}>{zone}</option>)}</select></label>
   <p role="status">{value.zone?`Tap the photo to add points (${value.points.length} added). Add at least two different points, then save.`:'Choose an area, then tap the photo to trace the route.'}</p>
   <div className="photo-direct-actions"><button type="button" onClick={()=>onChange({...value,points:value.points.slice(0,-1)})} disabled={!value.points.length}>Undo point</button><button type="button" disabled={!valid} onClick={()=>{if(onSave(value))onChange(null);}}>Save route and item</button></div>
   <details><summary>Use keyboard to add points</summary><p>Cursor: {Math.round(value.cursor.x*100)}% across, {Math.round(value.cursor.y*100)}% down</p><div className="photo-direct-actions"><button type="button" aria-label="Move new route cursor up" onClick={()=>move(0,-.05)}>↑</button><button type="button" aria-label="Move new route cursor left" onClick={()=>move(-.05,0)}>←</button><button type="button" aria-label="Move new route cursor right" onClick={()=>move(.05,0)}>→</button><button type="button" aria-label="Move new route cursor down" onClick={()=>move(0,.05)}>↓</button><button type="button" disabled={!value.zone||value.points.length>=500} onClick={()=>onChange({...value,points:[...value.points,{...value.cursor}]})}>Add point at cursor</button></div></details>
   <small>Creates one unconnected item. The route is a visual guide, not a power connection or measured length.</small>
  </>}
 </section>;
}
