import {useEffect, useRef, useState} from 'react';
import {X} from 'lucide-react';
import type {Season} from '../lib/model';
import './newDisplay.css';

export type NewDisplayDetails = {name:string; season:Season; year:number};
type Props = {initialSeason:Season; initialYear:number; onCreate:(details:NewDisplayDetails)=>void; onClose:()=>void};

/** Collect project details without creating a project until the user submits. */
export function NewDisplay({initialSeason,initialYear,onCreate,onClose}:Props){
 const [name,setName]=useState('');
 const [season,setSeason]=useState<Season>(initialSeason);
 const [year,setYear]=useState(String(initialYear));
 const [error,setError]=useState('');
 const dialog=useRef<HTMLDivElement>(null);
 const nameInput=useRef<HTMLInputElement>(null);
 useEffect(()=>{
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  nameInput.current?.focus();
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();onClose();return;}
   if(event.key!=='Tab'||!dialog.current)return;
   const controls=Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'));
   if(!controls.length)return;
   const first=controls[0],last=controls[controls.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };
  document.addEventListener('keydown',onKey);
  return()=>{document.removeEventListener('keydown',onKey);previous?.focus();};
 },[onClose]);
 function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();
  const clean=name.trim();
  if(!clean){setError('Enter a name for your display.');nameInput.current?.focus();return;}
  if(!/^\d{4}$/.test(year)||Number(year)<1000){setError('Enter a four-digit year.');dialog.current?.querySelector<HTMLInputElement>('#new-display-year')?.focus();return;}
  setError('');onCreate({name:clean,season,year:Number(year)});
 }
 return <div className="modal-backdrop new-display-backdrop" role="presentation">
  <div className="modal new-display-dialog" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="new-display-title" aria-describedby="new-display-intro">
   <div className="modal-heading"><div><span className="eyebrow">START FROM SCRATCH</span><h2 id="new-display-title">Create a new display</h2></div><button type="button" className="icon-button" aria-label="Close new display" onClick={onClose}><X size={20}/></button></div>
   <p id="new-display-intro">Start with an empty plan, then add your power sources and the items connected to them.</p>
   <form onSubmit={submit} noValidate>
    <label htmlFor="new-display-name">Display name<input ref={nameInput} id="new-display-name" value={name} onChange={e=>setName(e.target.value)} maxLength={100} placeholder="e.g. Our front yard" autoComplete="off"/></label>
    <div className="new-display-row">
     <label htmlFor="new-display-season">Season<select id="new-display-season" value={season} onChange={e=>setSeason(e.target.value as Season)}><option value="Halloween">Halloween</option><option value="Christmas">Christmas</option></select></label>
     <label htmlFor="new-display-year">Year<input id="new-display-year" inputMode="numeric" value={year} onChange={e=>setYear(e.target.value)} maxLength={4} placeholder="2026"/></label>
    </div>
    {error&&<p className="new-display-error" role="alert">{error}</p>}
    <p className="new-display-note">Your new plan starts as a draft and is saved on this device.</p>
    <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button type="submit" className="button primary">Create display</button></div>
   </form>
  </div>
 </div>;
}
