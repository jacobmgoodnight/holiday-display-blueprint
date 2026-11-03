import type {Kind,Zone} from '../lib/model';
import './photoAddPalette.css';

/** A draft is active only after both a type and an area have been chosen. */
export type PhotoAddDraft={kind:Kind|null;zone:Zone|''};
const choices:{kind:Kind;label:string;symbol:string}[]=[
 {kind:'outlet',label:'Outlet',symbol:'🔌'},
 {kind:'cord',label:'Cord',symbol:'〰️'},
 {kind:'light-strand',label:'Lights',symbol:'✨'},
 {kind:'decoration',label:'Decoration',symbol:'🎄'},
 {kind:'splitter',label:'Splitter',symbol:'⑂'},
 {kind:'smart-plug',label:'Smart plug',symbol:'⏱️'}
];
const zones:Zone[]=['Front porch','Garage & driveway','Backyard','Other'];

type Props={value:PhotoAddDraft;onChange:(value:PhotoAddDraft)=>void};
/** Choose a type and an area once, then place as many items as needed. */
export function PhotoAddPalette({value,onChange}:Props){
 const active=!!value.kind&&!!value.zone;
 return <section className="photo-add-palette" aria-label="Add equipment on photo">
  <div className="photo-add-header"><div><h3>Add items on the photo</h3><p>Choose a type and area, then tap the photo for each item. Connections and output counts can be added later.</p></div>{value.kind&&<button type="button" onClick={()=>onChange({...value,kind:null})}>Stop adding</button>}</div>
  <div className="photo-add-types" role="group" aria-label="Equipment type">{choices.map(item=><button type="button" key={item.kind} aria-pressed={value.kind===item.kind} className={value.kind===item.kind?'selected':''} onClick={()=>onChange({...value,kind:item.kind})}><span aria-hidden="true">{item.symbol}</span>{item.label}</button>)}</div>
  {value.kind&&<label className="photo-add-zone">Area <select aria-label="Area for photo additions" value={value.zone} onChange={e=>onChange({...value,zone:e.target.value as Zone|''})}><option value="">Choose an area…</option>{zones.map(zone=><option key={zone} value={zone}>{zone}</option>)}</select></label>}
  {active&&<p className="photo-add-instruction" role="status">Tap the photo to add {choices.find(c=>c.kind===value.kind)?.label.toLowerCase()}. Keep tapping to add more, or choose Stop adding.</p>}
 </section>;
}
