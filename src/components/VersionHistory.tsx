import {useEffect,useState} from 'react';
import {Clock,Download,History,RotateCcw,Save,X} from 'lucide-react';
import type {Project} from '../lib/model';
import type {SavedVersion} from '../lib/storage';
import {createBackup,downloadText} from '../lib/storage';
import {compareRestorePoint,createRestorePoint,listRestorePoints,restoreAsDraft} from '../lib/projectHistory';
import './versionHistory.css';
type Props={project:Project;onClose:()=>void;onRestore:(project:Project)=>void};
export function VersionHistory({project,onClose,onRestore}:Props){
 const [versions,setVersions]=useState<SavedVersion[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const load=async()=>{try{setVersions(await listRestorePoints(project.id));}catch(e){setError(String(e));}};
 useEffect(()=>{void load();},[project.id]);
 const save=async()=>{
  const label=prompt('Name this restore point (kept on this device):','Before changing wiring')?.trim();if(label===undefined)return;
  setBusy(true);setError('');try{await createRestorePoint(project,label||'Manual checkpoint');await load();}catch(e){setError(String(e));}finally{setBusy(false)}
 };
 const restore=async(version:SavedVersion)=>{
  if(!confirm('Restore "'+version.label+'"? Current wiring, notes and photos will be replaced. A before-restore checkpoint will be saved automatically. All setup checks and field verification will reset.'))return;
  setBusy(true);setError('');try{
   const current=structuredClone(project);
   await createRestorePoint(current,'Before restore of '+version.label);
   const updated=restoreAsDraft(project,version);
   onRestore(updated);onClose();
  }catch(e){setError(String(e));}finally{setBusy(false)}
 };
 return <div className="history-overlay" onClick={onClose}><section role="dialog" aria-modal="true" aria-label="Local project restore points" className="history-card" onClick={e=>e.stopPropagation()}>
  <header><div><h2><History size={20}/> Restore points</h2><p>{project.season} {project.year} · This browser only. Private snapshots are not cloud-synced.</p></div><button aria-label="Close restore points" onClick={onClose}><X size={20}/></button></header>
  <div className="history-body">
   <div className="history-intro"><p>Save a complete checkpoint before rearranging a wiring branch. Each includes the current project, photos and notes. Older automatic snapshots are not provided yet; create a point before major edits.</p><button disabled={busy} className="history-create" onClick={()=>void save()}><Save size={16}/> Save restore point</button></div>
   {error&&<p className="history-error" role="alert">{error}</p>}
   {!versions.length&&<p className="history-empty">No local restore points yet. Start by saving your current plan.</p>}
   {versions.map(item=>{
    const diff=compareRestorePoint(project,item.snapshot);
    return <article key={item.id} className="history-entry">
     <div><strong>{item.label}</strong><small><Clock size={13}/> {new Date(item.createdAt).toLocaleString()} · {(item.bytes/1024).toFixed(0)} KB</small><p>Since this point: {diff.nodesAdded} added / {diff.nodesRemoved} removed items; {diff.linksAdded} added / {diff.linksRemoved} removed / {diff.linksChanged} altered connections.</p></div>
     <div className="history-actions">
      <button disabled={busy} onClick={()=>downloadText('Blueprint-'+project.season+'-'+project.year+'-checkpoint.json',JSON.stringify(createBackup([item.snapshot]),null,2))}><Download size={15}/> Backup</button>
      <button disabled={busy} className="history-restore" onClick={()=>void restore(item)}><RotateCcw size={15}/> Restore as Draft</button>
     </div>
    </article>;
   })}
   <p className="history-caveat">Only the newest 8 manual points are retained on this device (up to 8 MB each). A local restore does not replace other devices' synced snapshots without cloud conflict handling. Always export a complete private JSON backup before major changes.</p>
  </div>
 </section></div>;
}
