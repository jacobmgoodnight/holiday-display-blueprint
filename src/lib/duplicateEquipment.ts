import type {Component,Project} from './model';
import {makeNode,now} from './model';
import {validateGraph} from './graph';

/** Duplicate an equipment description, never a confirmed installation or physical asset identity.
 * The new item has no incoming/outgoing AC wiring, photo or completed installation steps.
 * Output labels are intentionally omitted: they refer to the source's physical sockets. */
export function duplicateEquipment(project:Project,componentId:string):{project:Project;copy:Component}{
 const source=project.nodes.find(n=>n.id===componentId);
 if(!source)throw Error('The item to duplicate is missing');
 const base=(source.name.trim()||'Equipment').slice(0,85);
 const names=new Set(project.nodes.map(n=>n.name.toLocaleLowerCase()));
 let copyName=base+' (copy)';
 for(let i=2;names.has(copyName.toLocaleLowerCase());i++)copyName=base+` (copy ${i})`;
 const copy:Component={
  ...makeNode(source.kind,source.zone,{x:source.position.x+105,y:source.position.y+95}),
  name:copyName,
  outputs:source.outputs,
  visualIcon:source.visualIcon,
  color:source.color,
  cordType:source.cordType,
  inputGender:source.inputGender,
  outputGender:source.outputGender,
  ratedWatts:source.ratedWatts,
  expectedWatts:source.expectedWatts,
  notes:source.notes,
  inventory:source.inventory?.storage?{storage:source.inventory.storage}:undefined,
  // Deliberately do not clone photos, location-specific port names, importer
  // metadata, length measurement, purchase details, asset identity or validation.
  verified:false
 };
 const nodes=[...project.nodes,copy];
 const errors=validateGraph(nodes,project.edges);
 if(errors.length)throw Error('Cannot duplicate item: '+errors[0].message);
 return {copy,project:{...project,nodes,status:'draft',updatedAt:now()}};
}
