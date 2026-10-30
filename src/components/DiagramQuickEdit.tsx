import {useEffect,useRef,useState} from 'react';
import {Check,Image,Type,X} from 'lucide-react';
import type {Component,Season} from '../lib/model';
import {VisualIconPicker} from './VisualIconPicker';
import {VisualIconArtwork} from './VisualIconArtwork';
import {getVisualIcon} from '../lib/visualIcons';
import './diagramQuickEdit.css';

export type DiagramQuickEditState={id:string;left:number;top:number;mode:'name'|'icon'};
type Props={item:Component;season:Season;position:DiagramQuickEditState;onClose:()=>void;onRename:(name:string)=>void;onIcon:(icon:string|undefined)=>void};
export const tidyComponentName=(value:string)=>value.trim().replace(/\s+/g,' ').slice(0,100);
export function DiagramQuickEdit({item,season,position,onClose,onRename,onIcon}:Props){
 const [name,setName]=useState(item.name);
 const [mode,setMode]=useState(position.mode);
 const input=useRef<HTMLInputElement>(null);
 useEffect(()=>{setName(item.name);setMode(position.mode);},[item.id,position.mode]);
 useEffect(()=>{if(mode==='name')input.current?.focus();},[mode,item.id]);
 const save=()=>{const clean=tidyComponentName(name);if(clean&&clean!==item.name)onRename(clean);else setName(item.name);};
 return <section className="diagram-quick-editor nodrag nopan nowheel" style={{left:position.left,top:position.top}} aria-label={'Quick edit '+item.name} onPointerDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()} onContextMenu={e=>e.preventDefault()} onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();onClose();}if(e.key==='Enter'&&mode==='name'&&e.target===input.current){e.preventDefault();save();onClose();}}}>
  <header><div><strong>{item.name}</strong><small>{item.kind.replace(/-/g,' ')} · save a name with Done; choose an icon to apply</small></div><button type="button" aria-label="Close quick editor" onClick={onClose}><X size={17}/></button></header>
  <div className="diagram-quick-tabs" role="group" aria-label="Quick edit mode">
   <button type="button" className={mode==='name'?'active':''} aria-pressed={mode==='name'} onClick={()=>setMode('name')}><Type size={15}/> Rename</button>
   <button type="button" className={mode==='icon'?'active':''} aria-pressed={mode==='icon'} onClick={()=>{save();setMode('icon')}}><Image size={15}/> Icon</button>
  </div>
  {mode==='name'?<div className="diagram-quick-name">
    <label htmlFor={'quick-name-'+item.id}>Item name</label>
    <input ref={input} id={'quick-name-'+item.id} aria-label="Rename diagram item" maxLength={100} value={name} onChange={e=>setName(e.target.value)} onFocus={e=>e.currentTarget.select()}/>
    <button type="button" onClick={()=>{save();onClose()}}><Check size={16}/> Done</button>
    <small>Done / Enter saves · Esc / close cancels a draft · Wiring is unchanged.</small>
  </div>:<div className="diagram-quick-icons">
   <span className="diagram-current-icon"><VisualIconArtwork id={item.visualIcon}/>{getVisualIcon(item.visualIcon)?.label||'Default icon'}</span>
   <VisualIconPicker compact season={season} kind={item.kind} value={item.visualIcon} onChange={value=>{onIcon(value);onClose();}}/>
  </div>}
 </section>;
}
