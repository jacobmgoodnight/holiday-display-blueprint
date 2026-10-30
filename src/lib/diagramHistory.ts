import type {Component,Connection,Project,WiringEdit} from './model';
import {now} from './model';
import {downstream,validateGraph} from './graph';

/** Bounded, browser-session-only graph undo/redo. Not a cloud version history. */
export type GraphFrame={nodes:Component[];edges:Connection[]};
export type GraphStep={projectId:string;label:string;before:GraphFrame;after:GraphFrame};
export type GraphHistory={past:GraphStep[];future:GraphStep[]};
export const emptyGraphHistory=():GraphHistory=>({past:[],future:[]});
const LIMIT=10;
const MAX_BYTES=8_000_000;
const frame=(p:GraphFrame):GraphFrame=>structuredClone({nodes:p.nodes,edges:p.edges});
/** Field-check evidence is intentionally not part of the structural guard. */
export const graphFingerprint=(p:GraphFrame)=>JSON.stringify({
 nodes:p.nodes.map(({verified:_verified,...n})=>n),edges:p.edges
});
export function recordGraphStep(history:GraphHistory,before:Project,after:Project,label:string):GraphHistory{
 if(before.id!==after.id)throw Error('Cannot combine different projects in diagram history');
 const oldFrame=frame(before),newFrame=frame(after);
 if(graphFingerprint(oldFrame)===graphFingerprint(newFrame))return history;
 const errors=validateGraph(newFrame.nodes,newFrame.edges);
 if(errors.length)throw Error('Cannot record invalid wiring: '+errors[0].message);
 if(JSON.stringify([oldFrame,newFrame]).length>MAX_BYTES)throw Error('This diagram exceeds the safe session undo limit. Save a private restore point before making a larger change.');
 const recent=history.past.at(-1);
 // Never attach a new action onto history of a remotely replaced or separately edited graph.
 const past=recent&&recent.projectId===before.id&&graphFingerprint(recent.after)===graphFingerprint(oldFrame)?history.past:[];
 return {past:[...past,{projectId:before.id,label,before:oldFrame,after:newFrame}].slice(-LIMIT),future:[]};
}
function changedTopology(a:GraphFrame,b:GraphFrame){
 const am=new Map(a.nodes.map(n=>[n.id,n])),bm=new Map(b.nodes.map(n=>[n.id,n]));
 const affected=new Set<string>(),changedEdges=new Set<string>();
 for(const id of new Set([...am.keys(),...bm.keys()])){
  const x=am.get(id),y=bm.get(id);
  if(!x||!y||x.kind!==y.kind||x.outputs!==y.outputs||x.inputGender!==y.inputGender||x.outputGender!==y.outputGender)affected.add(id);
 }
 const ae=new Map(a.edges.map(e=>[e.id,e])),be=new Map(b.edges.map(e=>[e.id,e]));
 for(const id of new Set([...ae.keys(),...be.keys()])){
  const x=ae.get(id),y=be.get(id);
  if(JSON.stringify(x)!==JSON.stringify(y)){
   changedEdges.add(id);
   // The receiver's feed changed. Do not invalidate sibling branches on the
   // same upstream outlet/splitter merely because they share the source.
   if(x)affected.add(x.target);
   if(y)affected.add(y.target);
  }
 }
 // Any existing descendants of a changed physical feed require a new field check.
 for(const id of [...affected]){for(const next of downstream(id,a.edges))affected.add(next);for(const next of downstream(id,b.edges))affected.add(next);}
 return {affected,changedEdges,topologyChanged:affected.size>0};
}
function restoreGraph(current:Project,target:GraphFrame):Project{
 const errors=validateGraph(target.nodes,target.edges);
 if(errors.length)throw Error('Undo would create an invalid graph: '+errors[0].message);
 const diff=changedTopology(current,target);
 const checklist={...current.checklist};
 if(diff.topologyChanged){
  for(const id of diff.changedEdges){delete checklist['wire:'+id];delete checklist['unwire:'+id];}
  for(const id of diff.affected)for(const prefix of ['place:','pack:','test:','off:'])delete checklist[prefix+id];
 }
 const currentNodes=new Map(current.nodes.map(n=>[n.id,n]));
 const nodes=target.nodes.map(n=>({
  ...n,
  verified:diff.affected.has(n.id)?false:(currentNodes.get(n.id)?.verified??false)
 }));
 const oldFeed=new Map(current.edges.map(e=>[e.target,e]));
 const newFeed=new Map(target.edges.map(e=>[e.target,e]));
 const changes:WiringEdit[]=[];
 if(diff.topologyChanged)for(const targetId of new Set([...oldFeed.keys(),...newFeed.keys()])){
  const from=oldFeed.get(targetId),to=newFeed.get(targetId);
  if(from?.source===to?.source&&from?.sourcePort===to?.sourcePort)continue;
  const node=nodes.find(n=>n.id===targetId);
  if(!node)continue;
  changes.push({
   id:crypto.randomUUID(),at:now(),targetId,targetName:node.name,
   action:to?(from?'rewired':'connected'):'disconnected',
   fromId:from?.source,fromPort:from?.sourcePort,toId:to?.source,toPort:to?.sourcePort
  });
 }
 return {...current,nodes,edges:frame(target).edges,checklist,
  status:diff.topologyChanged?'draft':current.status,
  verificationReview:diff.topologyChanged?undefined:current.verificationReview,
  wiringHistory:changes.length?[...(current.wiringHistory||[]),...changes].slice(-200):current.wiringHistory,
  updatedAt:now()};
}
export function undoGraphStep(history:GraphHistory,current:Project):{project:Project;history:GraphHistory;label:string}{
 const step=history.past.at(-1);
 if(!step)throw Error('No diagram change to undo in this browser session');
 if(step.projectId!==current.id||graphFingerprint(current)!==graphFingerprint(step.after))
  throw Error('Diagram changed since that edit, possibly from another device. Create a restore point or review the newer changes before undoing.');
 const project=restoreGraph(current,step.before);
 return {project,history:{past:history.past.slice(0,-1),future:[...history.future,step].slice(-LIMIT)},label:step.label};
}
export function redoGraphStep(history:GraphHistory,current:Project):{project:Project;history:GraphHistory;label:string}{
 const step=history.future.at(-1);
 if(!step)throw Error('No diagram change to redo in this browser session');
 if(step.projectId!==current.id||graphFingerprint(current)!==graphFingerprint(step.before))
  throw Error('Diagram changed since undo. Redo cannot replace newer changes.');
 const project=restoreGraph(current,step.after);
 return {project,history:{past:[...history.past,step].slice(-LIMIT),future:history.future.slice(0,-1)},label:step.label};
}
