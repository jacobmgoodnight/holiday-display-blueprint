import type {Component,Connection,Project} from './model';
import {downstream,validateGraph} from './graph';
import {now} from './model';
export type DeletedComponent={projectId:string;node:Component;edges:Connection[]};
/** Delete a single component and only links incident to it.
 * Downstream children remain but must be inspected/reconnected. */
export function deleteComponentSafely(p:Project,id:string):{project:Project;receipt:DeletedComponent}{
 const node=p.nodes.find(n=>n.id===id);if(!node)throw Error('Component not found');
 const affected=downstream(id,p.edges);
 const removed=p.edges.filter(e=>e.source===id||e.target===id);
 const removedIDs=new Set(removed.map(e=>e.id));
 const checklist={...p.checklist};
 for(const edgeId of removedIDs){delete checklist['wire:'+edgeId];delete checklist['unwire:'+edgeId];}
 for(const suffix of ['place:','pack:','test:','off:'])delete checklist[suffix+id];
 const nodes=p.nodes.filter(n=>n.id!==id).map(n=>affected.has(n.id)?{...n,verified:false}:n);
 const project:Project={...p,nodes,edges:p.edges.filter(e=>!removedIDs.has(e.id)),checklist,status:'draft',updatedAt:now()};
 const errors=validateGraph(project.nodes,project.edges);if(errors.length)throw Error(errors[0].message);
 return {project,receipt:{projectId:p.id,node,edges:removed}};
}
/** Re-add a deleted component only while its old connections can be restored
 * safely. Previously completed electrical steps are deliberately not restored. */
export function undoComponentDeletion(p:Project,receipt:DeletedComponent):Project{
 if(p.id!==receipt.projectId)throw Error('Wrong project for this deleted component');
 if(p.nodes.some(n=>n.id===receipt.node.id))throw Error('The component is already present');
 const restored=receipt.node;
 const nodes=[...p.nodes,{...restored,verified:false}];
 const edges=[...p.edges,...receipt.edges];
 const errors=validateGraph(nodes,edges);if(errors.length)throw Error('Cannot restore connections: '+errors[0].message);
 const downstreamIds=downstream(restored.id,edges);
 return {...p,nodes:nodes.map(n=>downstreamIds.has(n.id)?{...n,verified:false}:n),edges,status:'draft',updatedAt:now()};
}
