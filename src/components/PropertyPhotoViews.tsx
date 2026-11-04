import {useState} from 'react';
import type {Project} from '../lib/model';
import {getPropertyPhotoViews,MAIN_PROPERTY_PHOTO_ID,MAX_PROPERTY_PHOTO_VIEWS} from '../lib/propertyPhoto';
import './propertyPhotoViews.css';

type Props={project:Project;activeId:string;onSelect:(id:string)=>void;onUpdate:(fn:(current:Project)=>Project)=>void;hasUnsavedDraft?:boolean};

/** Views organize photos only; equipment remains shared across the project. */
export function PropertyPhotoViews({project,activeId,onSelect,onUpdate,hasUnsavedDraft=false}:Props){
 const [action,setAction]=useState<'add'|'rename'|null>(null);
 const [name,setName]=useState('');
 const views=getPropertyPhotoViews(project);
 const selected=views.find(view=>view.id===activeId)||views[0];
 const canLeave=()=>!hasUnsavedDraft||window.confirm('Switch photos? Unsaved photo and item edits will be discarded.');
 const select=(id:string)=>{if(id===selected.id)return;if(canLeave()){setAction(null);onSelect(id);}};
 const save=()=>{
  const clean=name.trim();if(!clean)return;
  if(action==='rename'){
   const id=selected.id;
   onUpdate(current=>id===MAIN_PROPERTY_PHOTO_ID?{...current,propertyPhotoName:clean}:{...current,propertyPhotoViews:current.propertyPhotoViews?.map(view=>view.id===id?{...view,name:clean}:view)});
  }else if(action==='add'){
   if(views.length>=MAX_PROPERTY_PHOTO_VIEWS||!canLeave())return;
   const id=crypto.randomUUID();
   onUpdate(current=>getPropertyPhotoViews(current).length>=MAX_PROPERTY_PHOTO_VIEWS?current:{...current,propertyPhotoViews:[...(current.propertyPhotoViews||[]),{id,name:clean}]});
   onSelect(id);
  }
  setAction(null);setName('');
 };
 const remove=()=>{
  if(selected.id===MAIN_PROPERTY_PHOTO_ID)return;
  if(!window.confirm(`Delete the ${selected.name} photo view, its photo, markers and drawn routes? Equipment and wiring will remain in the display.`))return;
  const id=selected.id;
  onUpdate(current=>({...current,propertyPhotoViews:current.propertyPhotoViews?.filter(view=>view.id!==id)}));
  setAction(null);onSelect(MAIN_PROPERTY_PHOTO_ID);
 };
 return <div className="property-views" aria-label="Property photo views">
  <div className="property-views-row"><label>Photo view <select value={selected.id} onChange={e=>select(e.target.value)}>{views.map(view=><option key={view.id} value={view.id}>{view.name}{view.layout?'':' (no photo)'}</option>)}</select></label>
   <button type="button" onClick={()=>{setName('');setAction('add');}} disabled={views.length>=MAX_PROPERTY_PHOTO_VIEWS}>Add view</button>
   <button type="button" onClick={()=>{setName(selected.name);setAction('rename');}}>Rename</button>
   {selected.id!==MAIN_PROPERTY_PHOTO_ID&&<button type="button" onClick={remove}>Delete view</button>}
  </div>
  {action&&<form className="property-views-edit" onSubmit={e=>{e.preventDefault();save();}}><label>{action==='add'?'New view name':'View name'} <input autoFocus maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Backyard" required/></label><button type="submit" disabled={!name.trim()}>{action==='add'?'Create view':'Save name'}</button><button type="button" onClick={()=>setAction(null)}>Cancel</button></form>}
  <small>{views.length} of {MAX_PROPERTY_PHOTO_VIEWS} views. Equipment is shared between views; photos, markers and routes are separate. Photos increase backup and sync storage.</small>
 </div>;
}
