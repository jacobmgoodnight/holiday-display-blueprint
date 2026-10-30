import type {Kind,Project,Position} from './model';
import {makeNode,now} from './model';
import {downstream,validateGraph} from './graph';
import {defaultVisualIcon} from './visualIcons';
export type QuickAddOptions={sourceId:string;port:number;kind:Kind;name?:string;visualIcon?:string;position?:Position};
/** Adds one new, explicitly selected load/cord/splitter to an unused output in one atomic operation. */
export function quickAddConnected(project:Project,options:QuickAddOptions):Project{
 const source=project.nodes.find(x=>x.id===options.sourceId);
 if(!source)throw Error('Select an existing power source');
 if(!Number.isInteger(options.port)||options.port<0||options.port>=source.outputs)throw Error('Select a real output on this source');
 if(project.edges.some(e=>e.source===source.id&&e.sourcePort===options.port))throw Error('This output is already occupied');
 if(options.kind==='outlet')throw Error('An outlet cannot receive another power feed');
 const n=makeNode(options.kind,source.zone,options.position||{x:source.position.x+245,y:source.position.y+options.port*130});
 n.name=options.name?.trim().slice(0,100)||n.name;
 n.visualIcon=options.visualIcon||defaultVisualIcon(project.season,options.kind);
 n.verified=false;
 const edge={id:crypto.randomUUID(),source:source.id,sourcePort:options.port,target:n.id};
 const nodes=[...project.nodes,n],edges=[...project.edges,edge];
 const errors=validateGraph(nodes,edges);if(errors.length)throw Error(errors[0].message);
 return {...project,nodes,edges,status:'draft',updatedAt:now()};
}
/** Optional reset for any downstream consumer touched by a wiring edit. */
export function affectedByConnection(project:Project,id:string){return new Set([id,...downstream(id,project.edges)]);}
