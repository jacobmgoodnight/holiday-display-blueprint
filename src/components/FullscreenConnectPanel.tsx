import {Link2,Trash2,Unplug} from 'lucide-react';
import type {Component,Project} from '../lib/model';
import {freeOutputPorts} from '../lib/canvasWorkspace';
import {portName} from '../lib/portLabels';
import './fullscreenConnectPanel.css';

export type FullscreenConnectPanelProps={
 project:Project;
 selectedNode?:Component;
 sourceId:string|null;
 sourcePort:number|null;
 layoutMode:'auto'|'manual';
 onLayoutChange:(mode:'auto'|'manual')=>void;
 onBeginSource:(id:string)=>void;
 onPortChange:(port:number|null)=>void;
 onCancel:()=>void;
 onDisconnect:()=>void;
 onRemove:()=>void;
};

function sourceStatus(project:Project,node:Component){
 if(node.outputsUnknown)return 'outputs unknown';
 if(!node.outputs)return 'no outputs';
 if(!freeOutputPorts(project,node.id).length)return 'all outputs occupied';
 return '';
}

/** Select the physical source and socket explicitly; the parent validates the final connection. */
export function FullscreenConnectPanel({project,selectedNode,sourceId,sourcePort,layoutMode,onLayoutChange,onBeginSource,onPortChange,onCancel,onDisconnect,onRemove}:FullscreenConnectPanelProps){
 const source=project.nodes.find(node=>node.id===sourceId);
 const ports=source&&!sourceStatus(project,source)?freeOutputPorts(project,source.id):[];
 const selectedStatus=selectedNode?sourceStatus(project,selectedNode):'';
 const guidance=sourceId
  ?!source?'Source is no longer available. Cancel and choose a different source.'
   :!ports.length?'This source has no available confirmed outputs. Cancel and choose a different source.'
   :sourcePort===null||!ports.includes(sourcePort)?'2. Choose the actual output on the source.'
   :'3. Tap the item receiving power on the diagram.'
  :!selectedNode?'1. Choose the item that provides power, or tap it on the diagram.'
  :selectedNode.outputsUnknown?'This item’s output count is unknown. Use Quick edit to record the actual count first.'
  :selectedNode.outputs===0?'This item has no recorded outputs. Choose a source with an available output.'
  :selectedStatus?'All outputs on this item are occupied. Choose another source.'
  :`1. ${selectedNode.name} selected. Choose Connect from selected, or pick another source.`;
 return <div className="builder-edit-row fullscreen-connect-panel">
  <p className="builder-step-guide" role="status">{guidance}</p>
  <label>Layout <select aria-label="Builder diagram layout" value={layoutMode} onChange={e=>onLayoutChange(e.target.value as 'auto'|'manual')}><option value="auto">Auto flow</option><option value="manual">Move items manually</option></select></label>
  {!sourceId&&<>
   <label className="connect-source-picker">Choose a source
    <select aria-label="Choose a power source" value="" onChange={e=>{if(e.target.value)onBeginSource(e.target.value);}}>
     <option value="">Choose a source…</option>
     {project.nodes.map(node=>{const status=sourceStatus(project,node);return <option key={node.id} value={node.id} disabled={!!status}>{node.name} · {node.zone}{status?` — ${status}`:''}</option>;})}
    </select>
   </label>
   {selectedNode&&<span className="builder-help">Selected on diagram: {selectedNode.name}</span>}
   <button disabled={!selectedNode||!!selectedStatus} onClick={()=>{if(selectedNode)onBeginSource(selectedNode.id);}}><Link2 size={15}/> Connect from selected</button>
  </>}
  {sourceId&&<>
   <span className="builder-help">Source: {source?.name||'Unavailable'}</span>
   <label>Source output <select aria-label="Builder source output" value={sourcePort??''} disabled={!ports.length} onChange={e=>onPortChange(e.target.value===''?null:Number(e.target.value))}><option value="">Choose an output…</option>{ports.map(port=><option key={port} value={port}>{portName(source!,port)}</option>)}</select></label>
   <button onClick={onCancel}>Cancel connection</button>
  </>}
  {!sourceId&&selectedNode&&<details className="connect-other-actions"><summary>More actions for {selectedNode.name}</summary><div>
   <button disabled={!project.edges.some(edge=>edge.target===selectedNode.id)} onClick={onDisconnect}><Unplug size={15}/> Disconnect selected</button>
   <button className="builder-danger" onClick={onRemove}><Trash2 size={15}/> Remove selected item</button>
  </div></details>}
 </div>;
}
