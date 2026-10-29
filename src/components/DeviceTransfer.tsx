import {useEffect} from 'react';
import {Download,FileJson,LockKeyhole,Smartphone,Upload,X} from 'lucide-react';

type Props={
 hasRealPlans:boolean;
 projectCount:number;
 onExport:()=>void;
 onImport:(file:File|undefined)=>Promise<void>;
 onClose:()=>void;
};
export function DeviceTransfer({hasRealPlans,projectCount,onExport,onImport,onClose}:Props){
 useEffect(()=>{
  const close=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};
  document.addEventListener('keydown',close);
  return()=>document.removeEventListener('keydown',close);
 },[onClose]);
 return <div className="transfer-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
  <section className="transfer-dialog" role="dialog" aria-modal="true" aria-labelledby="transfer-title">
   <header className="transfer-header">
    <div><span className="eyebrow">PRIVATE DEVICE TRANSFER</span><h2 id="transfer-title">See your master plans on your phone</h2></div>
    <button className="icon-button" aria-label="Close transfer instructions" onClick={onClose}><X size={20}/></button>
   </header>
   <p className="transfer-intro">{hasRealPlans?`This browser currently has ${projectCount} project(s).`:'This browser only has example projects.'} Each device stores plans locally, so the phone needs its own imported copy. No account or cloud sync is required.</p>
   <div className="transfer-steps">
    <section><div className="transfer-step-title"><span>1</span><Download size={19}/><strong>On the device with your real plans</strong></div>
     <p>Download a private JSON backup containing your Halloween and Christmas projects, checklist progress and any photos attached in Blueprint.</p>
     <button className="button secondary" onClick={onExport}><Download size={16}/> Back up projects on this device</button>
    </section>
    <section><div className="transfer-step-title"><span>2</span><Smartphone size={19}/><strong>Move the file to your phone</strong></div>
     <p>Use your private OneDrive, iCloud Drive, Google Drive, AirDrop or another trusted file-transfer method. Do not upload it to a public GitHub repository.</p>
    </section>
    <section><div className="transfer-step-title"><span>3</span><Upload size={19}/><strong>On the phone, import the backup</strong></div>
     <p>Choose the transferred JSON file from Files or your cloud-drive app. This adds its projects to the phone's browser storage. Matching project IDs will be replaced after confirmation.</p>
     <label className="transfer-file-button"><FileJson size={17}/> Choose private JSON backup<input type="file" accept=".json,application/json" onChange={e=>{const file=e.target.files?.[0];if(file)void onImport(file);e.target.value='';}}/></label>
    </section>
   </div>
   <p className="transfer-warning"><LockKeyhole size={16}/> Backups can contain house photos, wiring information, and notes. This is a manual snapshot, not continuous sync. Before switching devices again, export a fresh backup from the device with your latest changes.</p>
  </section>
 </div>;
}
