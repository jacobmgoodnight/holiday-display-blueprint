import {useEffect,useState} from 'react';
import type {Component,Zone} from '../lib/model';
import {visualIcons} from '../lib/visualIcons';
import './photoQuickEdit.css';

type Props={item:Component;onSave:(id:string,changes:Pick<Component,'name'|'zone'|'color'|'notes'|'visualIcon'>)=>boolean;onAddSimilar:()=>void;onDirtyChange?:(dirty:boolean)=>void};
const zones:Zone[]=['Front porch','Garage & driveway','Backyard','Other'];
const details=(item:Component)=>JSON.stringify([item.name,item.zone,item.color||'',item.notes||'',item.visualIcon||'']);

/** Edit descriptive fields deliberately, without touching an item's wiring. */
export function PhotoQuickEdit({item,onSave,onAddSimilar,onDirtyChange}:Props){
 const [editing,setEditing]=useState(false),[baseline,setBaseline]=useState('');
 const [name,setName]=useState(''),[zone,setZone]=useState<Zone>(item.zone),[color,setColor]=useState(''),[notes,setNotes]=useState(''),[icon,setIcon]=useState(''),[error,setError]=useState('');
 useEffect(()=>{onDirtyChange?.(editing&&JSON.stringify([name,zone,color,notes,icon])!==baseline);},[editing,name,zone,color,notes,icon,baseline,onDirtyChange]);
 useEffect(()=>()=>onDirtyChange?.(false),[onDirtyChange]);
 const begin=()=>{setName(item.name);setZone(item.zone);setColor(item.color||'');setNotes(item.notes||'');setIcon(item.visualIcon||'');setBaseline(details(item));setError('');setEditing(true);};
 const save=(event:React.FormEvent)=>{
  event.preventDefault();
  if(details(item)!==baseline){setError('This item changed while you were editing. Cancel and reopen to review the latest details.');return;}
  if(!name.trim()){setError('Enter a name for this item.');return;}
  if(onSave(item.id,{name:name.trim().slice(0,100),zone,color:color.trim().slice(0,60)||undefined,notes:notes.trim().slice(0,2000)||undefined,visualIcon:icon||undefined})){setError('');setEditing(false);}
 };
 return <div className="photo-quick-edit">
  {!editing?<div className="photo-quick-actions"><button type="button" onClick={begin}>Edit details here</button><button type="button" onClick={onAddSimilar}>Place another like this</button></div>:<form onSubmit={save}>
   <label>Name<input aria-label="Photo item name" maxLength={100} value={name} onChange={event=>setName(event.target.value)}/></label>
   <label>Area<select aria-label="Photo item area" value={zone} onChange={event=>setZone(event.target.value as Zone)}>{zones.map(z=><option key={z} value={z}>{z}</option>)}</select></label>
   <label>Color<input aria-label="Photo item color" maxLength={60} value={color} onChange={event=>setColor(event.target.value)}/></label>
   <label>Display icon<select aria-label="Photo item icon" value={icon} onChange={event=>setIcon(event.target.value)}><option value="">Default</option>{visualIcons.filter(i=>i.id===item.visualIcon||i.kinds?.includes(item.kind)).map(i=><option key={i.id} value={i.id}>{i.emoji} {i.label}</option>)}</select></label>
   <label>Notes<textarea aria-label="Photo item notes" maxLength={2000} value={notes} onChange={event=>setNotes(event.target.value)}/></label>
   {error&&<p role="alert">{error}</p>}
   <div className="photo-quick-actions"><button type="submit">Save details</button><button type="button" onClick={()=>setEditing(false)}>Cancel</button></div>
  </form>}
 </div>;
}
