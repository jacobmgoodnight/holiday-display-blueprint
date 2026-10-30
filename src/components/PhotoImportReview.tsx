import {useEffect,useMemo,useState} from 'react';
import {FileImage,Upload,X} from 'lucide-react';
import type {Project} from '../lib/model';
import {photoCount,type PhotoRole} from '../lib/componentPhotos';
import {readPhoto} from '../lib/photos';
import {extractWorkbookPhotos,releaseWorkbookPhotos,type WorkbookPhoto} from '../lib/workbookPhotos';
import './photoImportReview.css';
export type PhotoImportAddition={componentId:string;role:PhotoRole;src:string};
type Props={project:Project;onApply:(items:PhotoImportAddition[])=>void;onClose:()=>void};
type Match={componentId:string;role:PhotoRole};
const roles:PhotoRole[]=['installed','connector','storage','detail'];
export function PhotoImportReview({project,onApply,onClose}:Props){
 const [photos,setPhotos]=useState<WorkbookPhoto[]>([]);
 const [matches,setMatches]=useState<Record<string,Match>>({});
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [name,setName]=useState('');
 const [searchByPhoto,setSearchByPhoto]=useState<Record<string,string>>({});
 const [showOnly,setShowOnly]=useState<'all'|'unassigned'|'assigned'>('all');
 useEffect(()=>()=>releaseWorkbookPhotos(photos),[photos]);
 const nodes=useMemo(()=>[...project.nodes].sort((a,b)=>a.zone.localeCompare(b.zone)||a.name.localeCompare(b.name)),[project]);
 const assigned=photos.filter(p=>matches[p.id]?.componentId);
 const overfull=nodes.some(n=>photoCount(n.photo,n.photoGallery)+assigned.filter(p=>matches[p.id]?.componentId===n.id).length>8);
 const choose=(id:string,patch:Partial<Match>)=>setMatches(prev=>({...prev,[id]:{componentId:prev[id]?.componentId||'',role:prev[id]?.role||'detail',...patch}}));
 const load=async(file?:File)=>{
  if(!file)return;
  setBusy(true);setError('');setMatches({});setSearchByPhoto({});setShowOnly('all');
  try{const extracted=await extractWorkbookPhotos(file);setPhotos(extracted);setName(file.name);if(!extracted.length)setError('No supported embedded JPG, PNG or WebP pictures were found. The original workbook was not changed.');}
  catch(e){setPhotos([]);setError(e instanceof Error?e.message:String(e));}
  finally{setBusy(false);}
 };
 const apply=async()=>{
  if(!assigned.length||overfull)return;
  setBusy(true);setError('');
  try{
   const entries:PhotoImportAddition[]=[];
   for(const p of assigned){
    const selected=matches[p.id];
    const file=new File([p.blob],p.name,{type:p.blob.type});
    entries.push({componentId:selected.componentId,role:selected.role,src:await readPhoto(file)});
   }
   onApply(entries);onClose();
  }catch(e){setError('No photos were imported: '+(e instanceof Error?e.message:String(e)));}
  finally{setBusy(false);}
 };
 return <div className="photo-import-backdrop" role="presentation">
  <section className="photo-import-modal" role="dialog" aria-modal="true" aria-label="Review workbook photos before import">
   <header><div><span className="eyebrow">PRIVATE PHOTO REVIEW</span><h2>Match workbook photos</h2><p>Preview each embedded image, choose its destination, then import only the matches you approve. Nothing is auto-assigned or uploaded publicly.</p></div><button aria-label="Close photo import" onClick={onClose}><X size={20}/></button></header>
   <label className="photo-import-upload"><Upload size={18}/>{name||'Choose Halloween / Christmas Excel workbook (.xlsx)'}<input type="file" accept=".xlsx" disabled={busy} onChange={e=>{void load(e.target.files?.[0]);e.target.value='';}}/></label>
   {error&&<p className="photo-import-error" role="alert">{error}</p>}
   {!!photos.length&&<><div className="photo-import-summary"><strong>{photos.length} embedded photos found</strong><span>{assigned.length} selected · {photos.length-assigned.length} skipped</span><label>Show <select aria-label="Filter workbook pictures" value={showOnly} onChange={e=>setShowOnly(e.target.value as 'all'|'unassigned'|'assigned')}><option value="all">All photos</option><option value="unassigned">Not assigned</option><option value="assigned">Selected to import</option></select></label></div>
   <div className="photo-import-list">{photos.filter(p=>showOnly==='all'||(showOnly==='assigned'?!!matches[p.id]?.componentId:!matches[p.id]?.componentId)).map(p=><article key={p.id} className="photo-import-row">
    <img src={p.url} alt={'Workbook embedded '+p.name}/>
    <div className="photo-import-details"><strong>{p.name}</strong><small>{p.sheet?('Sheet: '+p.sheet+(p.row?' · near row '+p.row:'')):'Workbook image · no reliable worksheet anchor'}</small>
     <label>Find equipment<input type="search" aria-label={'Search components for '+p.name} placeholder="Name, equipment ID or location…" value={searchByPhoto[p.id]||''} onChange={e=>setSearchByPhoto(prev=>({...prev,[p.id]:e.target.value}))}/></label>
     <label>Attach to component<select aria-label={'Assign '+p.name+' to component'} value={matches[p.id]?.componentId||''} onChange={e=>choose(p.id,{componentId:e.target.value})}>
      <option value="">Skip this image (default)</option>
      {nodes.filter(n=>n.id===matches[p.id]?.componentId||(n.name+' '+n.id+' '+n.zone).toLowerCase().includes((searchByPhoto[p.id]||'').trim().toLowerCase())).map(n=><option key={n.id} value={n.id}>{n.zone} · {n.name} · {n.id}</option>)}
     </select></label>
     {matches[p.id]?.componentId&&<label>Photo purpose<select aria-label={'Purpose for '+p.name} value={matches[p.id]?.role||'detail'} onChange={e=>choose(p.id,{role:e.target.value as PhotoRole})}>{roles.map(role=><option key={role} value={role}>{({installed:'Installed view',connector:'Plug / connection',storage:'Storage / bin',detail:'Reference / detail'})[role]}</option>)}</select></label>}
    </div>
   </article>)}</div></>}
   <footer><p>{overfull?'A chosen component would exceed its eight-photo limit; reassign or skip some images.':'Existing photos, wiring, quantities and field records will not be overwritten. Imported images are compressed and added to private component galleries.'}</p><div><button disabled={busy} onClick={onClose}>Cancel</button><button className="photo-import-confirm" disabled={busy||!assigned.length||overfull} onClick={()=>void apply()}><FileImage size={17}/>{busy?'Processing…':`Import ${assigned.length} reviewed photo${assigned.length===1?'':'s'}`}</button></div></footer>
  </section>
 </div>;
}
