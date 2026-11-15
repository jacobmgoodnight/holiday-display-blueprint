import type {Component,Connection,Project} from './model';
import {downstream} from './graph';
import {portName} from './portLabels';

export type OutputRow={index:number;label:string;edge?:Connection;occupant?:Component};

/** One row per recorded physical output. Unknown counts yield no rows: nothing is inferred. */
export function outputRows(project:Project,node:Component):OutputRow[]{
 if(node.outputsUnknown)return [];
 return Array.from({length:node.outputs},(_,index)=>{
  const edge=project.edges.find(e=>e.source===node.id&&e.sourcePort===index);
  return {index,label:portName(node,index),edge,occupant:edge?project.nodes.find(n=>n.id===edge.target):undefined};
 });
}

/** Existing items that could plug into this source without replacing a feed or creating a loop. */
export function plugInTargets(project:Project,sourceId:string):Component[]{
 const fed=new Set(project.edges.map(e=>e.target));
 return project.nodes.filter(n=>n.kind!=='outlet'&&n.id!==sourceId&&!fed.has(n.id)&&!downstream(n.id,project.edges).has(sourceId));
}

/** Items that still have no recorded power source. Outlets are sources and never listed. */
export function unpluggedItems(project:Project):Component[]{
 const fed=new Set(project.edges.map(e=>e.target));
 return project.nodes.filter(n=>n.kind!=='outlet'&&!fed.has(n.id));
}

/** True only when the exact output exists, its count is known, and nothing is recorded on it. */
export function outputIsFree(project:Project,sourceId:string,port:number):boolean{
 const source=project.nodes.find(n=>n.id===sourceId);
 if(!source||source.outputsUnknown||!Number.isInteger(port)||port<0||port>=source.outputs)return false;
 return !project.edges.some(e=>e.source===sourceId&&e.sourcePort===port);
}
