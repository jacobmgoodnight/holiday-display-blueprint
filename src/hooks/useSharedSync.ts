import {useCallback,useEffect,useRef,useState,type Dispatch,type SetStateAction} from 'react';
import type {Project} from '../lib/model';
import {db,restoreBackup,createBackup} from '../lib/storage';
import {syncCredentials,getDeviceSyncKey,forgetDeviceSyncKey,readBaseline,saveBaseline,hashProjects,planMerge,pullCloud,pushCloud,type CloudCredentials} from '../lib/cloudSync';

export type SyncStatus='off'|'connecting'|'synced'|'saving'|'offline'|'conflict';
type Props={
 loaded:boolean;
 storageReady:boolean;
 projects:Project[];
 setProjects:Dispatch<SetStateAction<Project[]>>;
 onImported:(project:Project)=>void;
};
export function useSharedSync({loaded,storageReady,projects,setProjects,onImported}:Props){
 const [status,setStatus]=useState<SyncStatus>('off');
 const [conflicts,setConflicts]=useState<string[]>([]);
 const [lastSynced,setLastSynced]=useState('');
 const [error,setError]=useState('');
 const credentials=useRef<CloudCredentials|null>(null);
 const started=useRef(false);
 const busy=useRef(false);
 const latest=useRef(projects);
 const callback=useRef(onImported);
 latest.current=projects;
 callback.current=onImported;

 const sync=useCallback(async(prefer?:'local'|'remote')=>{
  const creds=credentials.current;
  if(!creds||busy.current||!storageReady)return;
  busy.current=true;setStatus('saving');setError('');
  try{
   const remote=await pullCloud(creds);
   const local=latest.current;
   const base=readBaseline(creds.vaultId);
   const [localHashes,remoteHashes]=await Promise.all([hashProjects(local),hashProjects(remote.projects)]);
   const outcome=planMerge(local,remote.projects,base,localHashes,remoteHashes,prefer);
   if(outcome.conflicts.length){
    setConflicts(outcome.conflicts.map(id=>local.find(p=>p.id===id)?.name||id));
    setStatus('conflict');return;
   }
   if(latest.current!==local){setStatus('connecting');return;} // user edited during fetch
   const merged=outcome.projects;
   const mergedHashes=await hashProjects(merged);
   const changedCloud=merged.some(p=>mergedHashes[p.id]!==remoteHashes[p.id]);
   if(changedCloud)await pushCloud(creds,remote.revision,merged);
   if(latest.current!==local){saveBaseline(creds.vaultId,mergedHashes);setStatus('connecting');return;}
   const changedLocal=merged.some(p=>localHashes[p.id]!==mergedHashes[p.id]);
   if(changedLocal){
    // All merged records are already validated by decryption and parseBackup.
    await restoreBackup(createBackup(merged));
    const combined=[...local.filter(p=>p.example),...merged];
    latest.current=combined;
    setProjects(combined);
    if(local.every(p=>p.example)&&merged.length)callback.current(merged.find(p=>p.season==='Halloween')||merged[0]);
   }
   saveBaseline(creds.vaultId,mergedHashes);
   setConflicts([]);setStatus('synced');setLastSynced(new Date().toLocaleTimeString());
  }catch(e){
   const err=e as Error & {status?:number};
   setError(err.message||'Cloud temporarily unavailable');
   // 409 means another device saved first; a new pull will do a three-way merge.
   setStatus(err.status===409?'connecting':'offline');
  }finally{busy.current=false;}
 },[storageReady,setProjects]);

 useEffect(()=>{
  if(!loaded||!storageReady||started.current)return;
  started.current=true;
  const key=getDeviceSyncKey();
  if(!key){setStatus('off');return;}
  setStatus('connecting');
  void syncCredentials(key).then(c=>{credentials.current=c;return sync();}).catch(e=>{setError(String(e));setStatus('offline');});
 },[loaded,storageReady,sync]);

 useEffect(()=>{
  if(!loaded||!credentials.current)return;
  const timer=setTimeout(()=>{void sync();},1700);
  return()=>clearTimeout(timer);
 },[loaded,projects,sync]);

 useEffect(()=>{
  if(!loaded)return;
  const poll=setInterval(()=>{if(credentials.current&&document.visibilityState==='visible')void sync();},20000);
  const onFocus=()=>{if(credentials.current&&document.visibilityState==='visible')void sync();};
  window.addEventListener('focus',onFocus);
  window.addEventListener('online',onFocus);
  document.addEventListener('visibilitychange',onFocus);
  return()=>{clearInterval(poll);window.removeEventListener('focus',onFocus);window.removeEventListener('online',onFocus);document.removeEventListener('visibilitychange',onFocus);};
 },[loaded,sync]);

 const disconnect=useCallback(()=>{
  credentials.current=null;forgetDeviceSyncKey();setStatus('off');setConflicts([]);setError('');
 },[]);

 return {status,conflicts,lastSynced,error,enabled:status!=='off',syncNow:sync,disconnect};
}
