import type {Component,Connection,Project} from './model';
import {generatedTasks,type Task} from './graph';

/** Read-only projections. They never modify persisted graph links or node positions. */
export type WiringBranch={component:Component;via?:Connection;children:WiringBranch[];descendants:number};
export type WiringForest={roots:WiringBranch[];unconnected:number};
const wireKinds=new Set<Component['kind']>(['cord','spt-1','light-strand']);
const sortNodes=(a:Component,b:Component)=>a.name.localeCompare(b.name,undefined,{numeric:true})||a.id.localeCompare(b.id);
export function wireDescription(n:Component,showUnknown=false):string|undefined{
 if(!wireKinds.has(n.kind))return undefined;
 const length=typeof n.lengthFt==='number'&&Number.isFinite(n.lengthFt)&&n.lengthFt>=0?`${n.lengthFt} ft`:showUnknown?'Length not recorded':undefined;
 return [n.color?.trim(),length,n.cordType?.trim()||(n.kind==='spt-1'?'SPT-1':n.kind==='light-strand'?'lights':'extension cord')].filter(Boolean).join(' · ');
}
export function buildWiringForest(p:Project,scope:ReadonlySet<string>):WiringForest{
 const members=p.nodes.filter(n=>scope.has(n.id)),byId=new Map(members.map(n=>[n.id,n]));
 const children=new Map<string,Connection[]>(),inbound=new Set<string>();
 for(const e of p.edges)if(byId.has(e.source)&&byId.has(e.target)){
  children.set(e.source,[...(children.get(e.source)||[]),e]);inbound.add(e.target);
 }
 for(const edges of children.values())edges.sort((a,b)=>a.sourcePort-b.sourcePort||sortNodes(byId.get(a.target)!,byId.get(b.target)!));
 const seen=new Set<string>(),roots:WiringBranch[]=[];
 const visit=(id:string,via?:Connection):WiringBranch=>{
  seen.add(id);
  const descendants=(children.get(id)||[]).filter(e=>!seen.has(e.target)).map(e=>visit(e.target,e));
  return {component:byId.get(id)!,via,children:descendants,descendants:descendants.reduce((sum,c)=>sum+c.descendants+1,0)};
 };
 const sorted=[...members].sort((a,b)=>(a.kind==='outlet'?0:1)-(b.kind==='outlet'?0:1)||sortNodes(a,b));
 for(const n of sorted.filter(n=>!inbound.has(n.id)))if(!seen.has(n.id))roots.push(visit(n.id));
 for(const n of sorted)if(!seen.has(n.id))roots.push(visit(n.id)); // malformed import fallback
 return {roots,unconnected:roots.filter(r=>r.component.kind!=='outlet').length};
}
export type NumberedTask=Task&{number:number};
export function wiringSequence(p:Project,scope:ReadonlySet<string>):NumberedTask[]{
 return generatedTasks(p,'setup').filter(t=>t.nodeId!==undefined&&scope.has(t.nodeId)).map((t,i)=>({...t,number:i+1}));
}
