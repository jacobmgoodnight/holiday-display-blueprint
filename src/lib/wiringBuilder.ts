import type {Component,Connection,Kind,Project} from './model';
import {makeNode,now} from './model';
import {downstream,validateGraph} from './graph';

export const portName=(n:Pick<Component,'portLabels'|'outputs'>,index:number)=>{
 const custom=n.portLabels?.[String(index)]?.trim();
 return custom||`Output ${index+1}`;
};
export function renameOutputPort(p:Project,nodeId:string,index:number,label:string):Project{
 const node=p.nodes.find(n=>n.id===nodeId);
 if(!node)throw Error('Component does not exist');
 if(!Number.isInteger(index)||index<0||index>=node.outputs)throw Error('Choose an existing output');
 const trimmed=label.trim();
 if(trimmed.length>40)throw Error('Port label must be 40 characters or fewer');
 const labels={...node.portLabels};
 if(trimmed)labels[String(index)]=trimmed;
 else delete labels[String(index)];
 if((node.portLabels?.[String(index)]||'')===(labels[String(index)]||''))return p;
 return {...p,nodes:p.nodes.map(n=>n.id===nodeId?{...n,portLabels:labels}:n),updatedAt:now()};
}
export const insertableKinds:readonly Kind[]=['cord','spt-1','splitter','inline-tap','light-strand'];
/** Atomic insertion: Source(port) -> inserted input; inserted output -> existing target.
 * Retains every unrelated connection and manual position. Clears old link steps.
 * The caller must present and confirm the exact preview before committing. */
export function insertIntoConnection(p:Project,edgeId:string,kind:Kind,name?:string):Project{
 const old=p.edges.find(e=>e.id===edgeId);
 if(!old)throw Error('Select an existing connection to insert into');
 if(!insertableKinds.includes(kind))throw Error('Choose an inline cord, light strand, splitter or tap');
 const source=p.nodes.find(n=>n.id===old.source),target=p.nodes.find(n=>n.id===old.target);
 if(!source||!target)throw Error('Connection references missing equipment');
 const position={x:(source.position.x+target.position.x)/2,y:(source.position.y+target.position.y)/2};
 const inserted=makeNode(kind,target.zone,position);
 inserted.name=name?.trim().slice(0,100)||inserted.name;
 inserted.verified=false;
 const a:Connection={id:crypto.randomUUID(),source:old.source,sourcePort:old.sourcePort,target:inserted.id};
 const b:Connection={id:crypto.randomUUID(),source:inserted.id,sourcePort:0,target:old.target};
 const edges=[...p.edges.filter(e=>e.id!==edgeId),a,b];
 const nodes=[...p.nodes,inserted].map(n=>n.id===inserted.id||n.id===old.target||downstream(old.target,p.edges).has(n.id)?{...n,verified:false}:n);
 const errors=validateGraph(nodes,edges);
 if(errors.length)throw Error('Cannot insert safely: '+errors[0].message);
 const checklist={...p.checklist};
 delete checklist['wire:'+edgeId];delete checklist['unwire:'+edgeId];
 const stamp=now();
 const history=[...(p.wiringHistory||[]),{
  id:crypto.randomUUID(),at:stamp,action:'connected' as const,targetId:inserted.id,targetName:inserted.name,
  toId:old.source,toPort:old.sourcePort
 },{
  id:crypto.randomUUID(),at:stamp,action:'rewired' as const,targetId:old.target,targetName:target.name,
  fromId:old.source,fromPort:old.sourcePort,toId:inserted.id,toPort:0
 }].slice(-200);
 return {...p,nodes,edges,checklist,wiringHistory:history,status:'draft',updatedAt:stamp};
}
