import {useState} from 'react';
import {Camera,Check,ImagePlus,MapPin,Trash2,X,ZoomIn} from 'lucide-react';
import type {Component,Project} from '../lib/model';
import {getVisualIcon} from '../lib/visualIcons';
import {VisualIconArtwork} from './VisualIconArtwork';
import {MAX_COMPONENT_PHOTOS,photoCount,photoRoles,type PhotoRole} from '../lib/componentPhotos';
import {sourcePath} from '../lib/graph';
import './visualExtras.css';
type Props={project:Project;component:Component;canEdit:boolean;onClose:()=>void;onAdd:(file:File,role:PhotoRole)=>Promise<void>;onPromote:(id:string)=>void;onRemove:(id:string)=>void;onEdit?:()=>void};
export function ComponentPhotoGallery({project,component:n,canEdit,onClose,onAdd,onPromote,onRemove,onEdit}:Props){
 const [role,setRole]=useState<PhotoRole>('installed');
 const [active,setActive]=useState('primary');
 const [busy,setBusy]=useState(false);
 const [large,setLarge]=useState(false);
 const photos=[...(n.photo?[{id:'primary',src:n.photo,role:'primary'}]:[]),...(n.photoGallery||[])];
 const current=photos.find(p=>p.id===active)||photos[0];
 const path=sourcePath(n.id,project).map(x=>x.name).join(' → ');
 const icon=getVisualIcon(n.visualIcon);
 const upload=async(file?:File)=>{if(!file||!canEdit)return;setBusy(true);try{await onAdd(file,role);}finally{setBusy(false);}};
 return <div className="component-photo-backdrop" onClick={onClose}>
  <section className="component-photo-card" role="dialog" aria-modal="true" aria-label={'Photos and details for '+n.name} onClick={e=>e.stopPropagation()}>
   <header><div className="photo-card-title"><span className="photo-card-emoji">{icon?<VisualIconArtwork id={icon.id}/>: '📷'}</span><div><strong>{n.name}</strong><small>{n.kind} · {n.zone}</small></div></div><button aria-label="Close equipment details" onClick={onClose}><X size={21}/></button></header>
   <div className="photo-card-content">
    {current?<button className="photo-hero" onClick={()=>setLarge(true)} aria-label="View photo larger"><img src={current.src} alt={n.name+' photo'}/><span><ZoomIn size={15}/> Expand photo</span></button>:<div className="photo-empty"><Camera size={28}/><p>No photos yet. Add a real installation, plug, or storage photo to recognize this equipment next year.</p></div>}
    {photos.length>1&&<div className="photo-thumb-row" aria-label="Equipment photo thumbnails">{photos.map(p=><button key={p.id} className={p.id===current?.id?'active':''} onClick={()=>setActive(p.id)} title={p.role}><img src={p.src} alt={p.role+' view'}/><small>{p.role}</small></button>)}</div>}
    <div className="photo-info">
     <p><strong>Power path</strong><span>{path||'No recorded upstream source'}</span></p>
     {n.lengthFt!==undefined&&<p><strong>Length</strong><span>{n.lengthFt} ft</span></p>}
     {n.inventory?.storage&&<p><strong><MapPin size={13}/> Storage</strong><span>{n.inventory.storage}</span></p>}
     {n.notes&&<p><strong>Notes</strong><span>{n.notes}</span></p>}
    </div>
    {canEdit&&<div className="photo-edit">
     <div className="photo-edit-title"><strong>Photos ({photoCount(n.photo,n.photoGallery)}/{MAX_COMPONENT_PHOTOS})</strong><select aria-label="New photo purpose" value={role} onChange={e=>setRole(e.target.value as PhotoRole)}>{photoRoles.map(r=><option key={r} value={r}>{r==='installed'?'Installed view':r==='connector'?'Plug / connector':r==='storage'?'Storage / bin':'Detail'}</option>)}</select></div>
     <div className="photo-edit-actions">
      <label className={busy?'disabled':''}><Camera size={16}/> Take photo<input disabled={busy||photos.length>=MAX_COMPONENT_PHOTOS} type="file" accept="image/*" capture="environment" onChange={async e=>{const file=e.target.files?.[0];e.target.value='';await upload(file);}}/></label>
      <label className={busy?'disabled':''}><ImagePlus size={16}/> Upload photo<input disabled={busy||photos.length>=MAX_COMPONENT_PHOTOS} type="file" accept="image/*" onChange={async e=>{const file=e.target.files?.[0];e.target.value='';await upload(file);}}/></label>
      {current?.id!=='primary'&&current&&<button onClick={()=>{onPromote(current.id);setActive('primary')}}><Check size={15}/> Use as cover</button>}
      {current&&<button className="photo-remove" onClick={()=>{if(confirm('Remove this reference photo from the project?')){onRemove(current.id);setActive('primary');setLarge(false);}}}><Trash2 size={15}/> Remove photo</button>}
     </div>
     <small>Photos are compressed and stored locally; linked devices sync within cloud upload limits. A photo alone does not verify electrical wiring.</small>
    </div>}
    {onEdit&&<button className="photo-open-editor" onClick={onEdit}>Edit item and diagram icon</button>}
   </div>
  </section>
  {large&&current&&<div className="photo-lightbox" role="dialog" aria-label="Enlarged equipment photo" onClick={e=>{e.stopPropagation();setLarge(false)}}><button aria-label="Close enlarged photo"><X size={22}/></button><img src={current.src} alt={n.name+' reference'}/></div>}
 </div>;
}
