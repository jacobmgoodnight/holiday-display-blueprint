import {Handle,Position,type Node, type NodeProps} from '@xyflow/react';
import {Cable,Plug,PlugZap,Split,Lightbulb,Boxes,Projector,Spotlight,Radio,Power,Workflow} from 'lucide-react';
import type {Component} from '../lib/model';
export type BlueprintFlowNode=Node<{component:Component;highlight:boolean;dim:boolean},'blueprint'>;
const icons={outlet:Power,'smart-plug':PlugZap,cord:Cable,'spt-1':Cable,splitter:Split,'inline-tap':Workflow,'light-strand':Lightbulb,decoration:Boxes,projector:Projector,spotlight:Spotlight,controller:Radio,accessory:Plug};
const kindNames={'smart-plug':'Smart plug','spt-1':'SPT-1','light-strand':'Light strand','inline-tap':'Inline tap'} as Record<string,string>;
export function BlueprintNode({data,selected}:NodeProps<BlueprintFlowNode>){
 const {component:n,highlight,dim}=data;const Icon=icons[n.kind];
 return <div className={`flow-node kind-${n.kind} ${highlight?'flow-node-highlight':''} ${dim?'flow-node-dim':''} ${selected?'flow-node-selected':''}`}>
  {n.kind!=='outlet'&&<Handle type="target" position={Position.Left} id="input" className="node-handle"/>}
  <div className="node-main"><div className="node-icon"><Icon size={18}/></div><div className="node-copy"><span className="node-kind">{kindNames[n.kind]||n.kind}</span><strong title={n.name}>{n.name}</strong><span className="node-details">{[n.color,n.lengthFt?`${n.lengthFt} ft`:null].filter(Boolean).join(' · ')||n.zone}</span></div></div>
  {n.outputs>0&&<span className="node-port-count">{n.outputs} out</span>}
  {Array.from({length:n.outputs},(_,port)=><Handle key={port} type="source" position={Position.Right} id={`port-${port}`} className="node-handle" style={{top:`${(port+1)/(n.outputs+1)*100}%`}} title={`Output ${port+1}`}/>)}
 </div>;
}
