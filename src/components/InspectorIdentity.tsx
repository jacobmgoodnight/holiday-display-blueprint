import {useEffect,useRef,useState} from 'react';
import {ImagePlus,Pencil} from 'lucide-react';
import type {Component,Season,Zone} from '../lib/model';
import {VisualIconPicker} from './VisualIconPicker';
import {VisualIconArtwork} from './VisualIconArtwork';
import {defaultVisualIcon} from '../lib/visualIcons';
import {tidyComponentName} from './DiagramQuickEdit';
import './inspectorIdentity.css';

const zones:Zone[]=['Front porch','Garage & driveway','Backyard','Other'];
type Props={component:Component;season:Season;onName:(name:string)=>void;onIcon:(value:string|undefined)=>void;onZone:(zone:Zone)=>void;onPhotos:()=>void};
export function InspectorIdentity({component,season,onName,onIcon,onZone,onPhotos}:Props){
 const [draft,setDraft]=useState(component.name);
 const [showIcons,setShowIcons]=useState(false);
 const input=useRef<HTMLInputElement>(null);
 const cancelBlur=useRef(false);
 useEffect(()=>{setDraft(component.name);setShowIcons(false);},[component.id]);
 useEffect(()=>{if(document.activeElement!==input.current)setDraft(component.name);},[component.name]);
 const save=()=>{const clean=tidyComponentName(draft);if(clean&&clean!==component.name)onName(clean);else setDraft(component.name);};
 return <section className="inspector-identity" aria-label={'Selected item '+component.name}>
  <div className="inspector-identity-top">
   <button type="button" className="inspector-identity-icon" aria-label={'Change icon for '+component.name} aria-expanded={showIcons} title="Choose diagram icon" onClick={()=>setShowIcons(x=>!x)}><VisualIconArtwork id={component.visualIcon||defaultVisualIcon(season,component.kind)}/><Pencil size={12} className="inspector-icon-pencil"/></button>
   <div className="inspector-identity-main">
    <small>SELECTED · {component.kind.replace(/-/g,' ')}</small>
    <label htmlFor={'inspector-name-'+component.id}>Item name <Pencil size={12}/></label>
    <input ref={input} id={'inspector-name-'+component.id} aria-label="Rename selected component" maxLength={100} value={draft} onChange={e=>setDraft(e.target.value)} onBlur={()=>{if(cancelBlur.current){cancelBlur.current=false;return;}save();}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}if(e.key==='Escape'){e.preventDefault();cancelBlur.current=true;setDraft(component.name);e.currentTarget.blur();}}}/>
   </div>
  </div>
  <div className="inspector-identity-actions"><label>Zone <select aria-label="Selected component zone" value={component.zone} onChange={e=>onZone(e.target.value as Zone)}>{zones.map(z=><option key={z}>{z}</option>)}</select></label><button type="button" onClick={onPhotos}><ImagePlus size={15}/> Photos</button></div>
  {showIcons&&<div className="inspector-identity-palette"><VisualIconPicker compact season={season} kind={component.kind} value={component.visualIcon} onChange={v=>{onIcon(v);setShowIcons(false)}}/></div>}
  <p className="inspector-identity-help">Rename above or click its icon. Double-click, right-click, or select the item and press F2 to edit on the diagram.</p>
 </section>;
}
