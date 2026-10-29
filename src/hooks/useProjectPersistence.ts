import {useEffect,useRef,useState} from 'react';
import type {Project} from '../lib/model';
import {ProjectSaveQueue,type SaveState} from '../lib/projectSaveQueue';
/** Watches *all* projects, not just active; a project switch cannot cancel pending data. */
export function useProjectPersistence(projects:Project[],active:string,loaded:boolean,storageReady:boolean){
 const queue=useRef<ProjectSaveQueue>(new ProjectSaveQueue());
 const savedReferences=useRef<Map<string,Project>>(new Map());
 const previousActive=useRef<string>('');
 const [revision,setRevision]=useState(0);
 useEffect(()=>queue.current.subscribe(()=>setRevision(x=>x+1)),[]);
 useEffect(()=>{
  if(!loaded||!storageReady)return;
  const seen=new Set<string>();
  for(const project of projects){
   seen.add(project.id);
   if(savedReferences.current.get(project.id)!==project){
    savedReferences.current.set(project.id,project);
    queue.current.queue(project);
   }
  }
  for(const id of savedReferences.current.keys())if(!seen.has(id))savedReferences.current.delete(id);
 },[projects,loaded,storageReady]);
 useEffect(()=>{
  if(!loaded||!storageReady)return;
  const old=previousActive.current;previousActive.current=active;
  if(old&&old!==active)void queue.current.flush(old);
 },[active,loaded,storageReady]);
 useEffect(()=>{
  if(!loaded||!storageReady)return;
  const flush=()=>{if(document.visibilityState==='hidden')void queue.current.flushAll();};
  const pagehide=()=>{void queue.current.flushAll();};
  document.addEventListener('visibilitychange',flush);
  window.addEventListener('pagehide',pagehide);
  return()=>{document.removeEventListener('visibilitychange',flush);window.removeEventListener('pagehide',pagehide);};
 },[loaded,storageReady]);
 void revision;
 const current:SaveState=!storageReady?{phase:'failed',message:'Browser storage unavailable'}:queue.current.getState(active);
 return {saveState:current,flushAll:()=>queue.current.flushAll(),flushProject:(id:string)=>queue.current.flush(id),discardProject:(id:string)=>queue.current.discard(id)};
}
