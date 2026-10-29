import {connect,reconnect,downstream} from './graph';
import {now} from './model';
import type {Project,WiringEdit} from './model';

/** Only models an explicitly recorded AC power feed; never invents a cable. */
export type ProjectWithWiringHistory=Project;
/** Source IDs/port indexes are kept exactly as documented in the master project.
 * Edits return new objects, invalidate downstream verification, and preserve old
 * history without changing anyone else's connection or manually arranged positions. */
export function editPowerFeed(project:Project,targetId:string,sourceId:string|null,port?:number):ProjectWithWiringHistory{
 const target=project.nodes.find(n=>n.id===targetId);
 if(!target)throw Error('The selected component no longer exists');
 if(target.kind==='outlet')throw Error('House outlets cannot receive another power feed');
 const previous=project.edges.find(e=>e.target===targetId);
 if(sourceId!==null&&(!Number.isInteger(port)||port===undefined||port<0))throw Error('Choose a valid output number');
 if(sourceId===null&&!previous)return project;
 if(previous&&previous.source===sourceId&&previous.sourcePort===port)return project;
 const edges=sourceId===null
  ?project.edges.filter(e=>e.target!==targetId)
  :previous?reconnect(project.nodes,project.edges,sourceId,targetId,port):connect(project.nodes,project.edges,sourceId,targetId,port);
 // Treat any affected downstream component as unverified until inspected in the yard.
 const impacted=new Set([targetId,...downstream(targetId,project.edges)]);
 const updatedNodes=project.nodes.map(n=>impacted.has(n.id)?{...n,verified:false}:n);
 const nextChecklist={...project.checklist};
 if(previous)delete nextChecklist['wire:'+previous.id];
 const history:WiringEdit={
  id:crypto.randomUUID(),at:now(),
  action:sourceId===null?'disconnected':previous?'rewired':'connected',
  targetId,targetName:target.name,
  fromId:previous?.source,fromPort:previous?.sourcePort,
  toId:sourceId??undefined,toPort:sourceId!==null?port:undefined
 };
 return {...project,nodes:updatedNodes,edges,checklist:nextChecklist,status:'draft',updatedAt:history.at,
  wiringHistory:[...(project as ProjectWithWiringHistory).wiringHistory||[],history].slice(-200)};
}
