import {useCallback,useEffect,useRef} from 'react';

/** Protect only temporary photo work, without interrupting ordinary navigation. */
export function useUnsavedPhotoGuard(dirty:boolean):()=>boolean{
 const current=useRef(dirty);
 current.current=dirty;
 useEffect(()=>{
  if(!dirty)return;
  const beforeUnload=(event:BeforeUnloadEvent)=>{
   event.preventDefault();
   event.returnValue='';
  };
  window.addEventListener('beforeunload',beforeUnload);
  return()=>window.removeEventListener('beforeunload',beforeUnload);
 },[dirty]);
 return useCallback(()=>!current.current||window.confirm('Leave the photo planner? Your unsaved photo edits will be discarded.'),[]);
}
