import type {Component,Season,Zone} from '../lib/model';
import {Copy,ImagePlus} from 'lucide-react';
import {VisualIconPicker} from './VisualIconPicker';
import {getVisualIcon} from '../lib/visualIcons';
import {portName} from '../lib/portLabels';
import {photoCount} from '../lib/componentPhotos';
import './builderQuickEdit.css';

type Props={
 component?:Component;season:Season;
 onPatch:(fields:Partial<Component>)=>void;
 onPortLabel:(port:number,label:string)=>void;
 onPhotos:()=>void;
 onDuplicate:()=>void;
};
const zones:Zone[]=['Front porch','Garage & driveway','Backyard','Other'];
export function BuilderQuickEdit({component:n,season,onPatch,onPortLabel,onPhotos,onDuplicate}:Props){
 if(!n)return <div className="bqe-empty">Tap an item on the diagram to edit its name, appearance, location or notes.</div>;
 return <div className="builder-quick-edit" aria-label={`Quick edit ${n.name}`}>
  <div className="bqe-title"><strong>Quick Edit · {n.kind.replace(/-/g,' ')}</strong><span>Auto-saved</span></div>
  <div className="bqe-fields">
   <label className="bqe-wide">Name <input aria-label="Quick edit item name" maxLength={100} value={n.name} onChange={e=>onPatch({name:e.target.value})}/></label>
   <label>Zone <select aria-label="Quick edit zone" value={n.zone} onChange={e=>onPatch({zone:e.target.value as Zone})}>{zones.map(zone=><option key={zone} value={zone}>{zone}</option>)}</select></label>
   <label>Color / wire color <input aria-label="Quick edit wire color" value={n.color||''} placeholder="e.g. green" onChange={e=>onPatch({color:e.target.value})}/></label>
   <label>Storage / bin <input aria-label="Quick edit storage location" value={n.inventory?.storage||''} placeholder="e.g. garage bin A" onChange={e=>onPatch({inventory:{...n.inventory,storage:e.target.value}})}/></label>
   <label className="bqe-wide">Notes <textarea aria-label="Quick edit item notes" rows={2} value={n.notes||''} placeholder="Installation instructions, connector details…" onChange={e=>onPatch({notes:e.target.value})}/></label>
  </div>
  <div className="bqe-actions">
   <button onClick={onPhotos}><ImagePlus size={15}/> Photos ({photoCount(n.photo,n.photoGallery)})</button>
   <button className="bqe-duplicate" onClick={onDuplicate}><Copy size={15}/> Duplicate unconnected</button>
  </div>
  <details className="bqe-extra">
   <summary>Diagram icon and output labels · {getVisualIcon(n.visualIcon)?.label||'Default'}</summary>
   <VisualIconPicker compact season={season} kind={n.kind} value={n.visualIcon} onChange={visualIcon=>onPatch({visualIcon})}/>
   {n.outputs>0&&<div className="bqe-port-list">
    {Array.from({length:n.outputs},(_,index)=><label key={n.id+':'+index}>Output {index+1}
      <input key={n.id+':'+index} aria-label={`Rename ${n.name} output ${index+1}`} defaultValue={n.portLabels?.[String(index)]||''} maxLength={40} placeholder={portName({outputs:n.outputs},index)} onBlur={e=>onPortLabel(index,e.target.value)}/>
     </label>)}
    <small>Output labels describe physical sockets; renaming them never rewires equipment.</small>
   </div>}
  </details>
  <p className="bqe-hint">Duplicate creates a new Draft item with a new asset ID and no power feed, photos or completed steps. Confirm physical cord lengths and ratings before use.</p>
 </div>;
}
