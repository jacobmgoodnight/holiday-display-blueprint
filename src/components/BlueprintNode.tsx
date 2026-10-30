import {Handle,Position,type Node, type NodeProps} from '@xyflow/react';
import type {MouseEvent} from 'react';
import {Cable,Plug,PlugZap,Split,Lightbulb,Boxes,Projector,Flashlight as Spotlight,Radio,Power,Workflow,CheckCircle2,Clock3} from 'lucide-react';
import type {Component} from '../lib/model';
import {portName} from '../lib/portLabels';
import {getVisualIcon} from '../lib/visualIcons';
import {VisualIconArtwork} from './VisualIconArtwork';
export type BlueprintFlowNode=Node<{component:Component;highlight:boolean;dim:boolean;canQuickEdit?:boolean;isExample?:boolean;onIconEdit?:(event:MouseEvent<HTMLButtonElement>)=>void},'blueprint'>;
const icons={outlet:Power,'smart-plug':PlugZap,cord:Cable,'spt-1':Cable,splitter:Split,'inline-tap':Workflow,'light-strand':Lightbulb,decoration:Boxes,projector:Projector,spotlight:Spotlight,controller:Radio,accessory:Plug};
const kindNames={'smart-plug':'Smart plug','spt-1':'SPT-1','light-strand':'Light strand','inline-tap':'Inline tap'} as Record<string,string>;
export function BlueprintNode({data,selected}:NodeProps<BlueprintFlowNode>){
 const {component:n,highlight,dim}=data;const Icon=icons[n.kind];const visual=getVisualIcon(n.visualIcon);
 return <div className={`flow-node kind-${n.kind} ${highlight?'flow-node-highlight':''} ${dim?'flow-node-dim':''} ${selected?'flow-node-selected':''}`}>
  {n.kind!=='outlet'&&<Handle type="target" position={Position.Left} id="input" className="node-handle"/>}
  <div className="node-main">{data.canQuickEdit?<button type="button" className="node-icon node-icon-action nodrag nopan" aria-label={`Change icon for ${n.name}`} title="Change diagram icon" onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();data.onIconEdit?.(e);}}>{visual?<span className="node-visual" role="img" aria-label={visual.label}><VisualIconArtwork id={visual.id}/></span>:<Icon size={18}/>}</button>:<div className="node-icon">{visual?<span className="node-visual" role="img" aria-label={visual.label}><VisualIconArtwork id={visual.id}/></span>:<Icon size={18}/>}</div>}<div className="node-copy"><span className="node-kind">{kindNames[n.kind]||n.kind}</span><strong title={n.name}>{n.name}</strong><span className="node-details">{[n.color,n.lengthFt?`${n.lengthFt} ft`:null].filter(Boolean).join(' · ')||n.zone}</span><span className={`node-verification ${data.isExample?'node-example':n.verified?'node-field-checked':'node-check-pending'}`} title={data.isExample?'Example, not a field record':n.verified?'On-site check recorded; not an electrical safety certification':'Needs an on-site check'}>{data.isExample?<Clock3 size={11}/>:n.verified?<CheckCircle2 size={11}/>:<Clock3 size={11}/>} {data.isExample?'Example only':n.verified?'Field checked':'Needs field check'}</span></div></div>
  {n.outputs>0&&<span className="node-port-count">{n.outputs} out</span>}
  {Array.from({length:n.outputs},(_,port)=><Handle key={port} type="source" position={Position.Right} id={`port-${port}`} className="node-handle" style={{top:`${(port+1)/(n.outputs+1)*100}%`}} title={portName(n,port)}/>)}
 </div>;
}
