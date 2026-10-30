import type {Project} from './model';
import {now} from './model';
import {db,type BlueprintDB,type SavedVersion,parseBackup,createBackup} from './storage';
import {validateGraph} from './graph';
const MAX_SNAPSHOTS=8;
const MAX_BYTES=8_000_000;
/** Local-only, complete restore points. A large photo payload may exceed the safe quota cap. */
export async function createRestorePoint(project:Project,label='Manual checkpoint',database:BlueprintDB=db):Promise<SavedVersion>{
 const bytes=new TextEncoder().encode(JSON.stringify(project)).byteLength;
 if(bytes>MAX_BYTES)throw Error('Project exceeds the restore-point size limit. Download a private JSON backup instead.');
 const item:SavedVersion={id:crypto.randomUUID(),projectId:project.id,createdAt:now(),label:label.slice(0,120),bytes,snapshot:structuredClone(project)};
 await database.transaction('rw',database.versions,async()=>{
  await database.versions.put(item);
  const versions=await database.versions.where('projectId').equals(project.id).sortBy('createdAt');
  for(const excess of versions.slice(0,Math.max(0,versions.length-MAX_SNAPSHOTS)))await database.versions.delete(excess.id);
 });
 return item;
}
export function listRestorePoints(projectId:string,database:BlueprintDB=db):Promise<SavedVersion[]>{
 return database.versions.where('projectId').equals(projectId).reverse().sortBy('createdAt').then(rows=>rows.reverse());
}
export function compareRestorePoint(current:Project,earlier:Project){
 const priorNodes=new Map(earlier.nodes.map(n=>[n.id,n])),latestNodes=new Map(current.nodes.map(n=>[n.id,n]));
 const priorEdges=new Map(earlier.edges.map(e=>[e.id,e])),latestEdges=new Map(current.edges.map(e=>[e.id,e]));
 let changedEquipment=0,changedConnections=0;
 for(const [id,p] of priorNodes){const n=latestNodes.get(id);if(n&&JSON.stringify(n)!==JSON.stringify(p))changedEquipment++;}
 for(const [id,p] of priorEdges){const n=latestEdges.get(id);if(n&&JSON.stringify(n)!==JSON.stringify(p))changedConnections++;}
 return {
  nodesAdded:[...latestNodes.keys()].filter(id=>!priorNodes.has(id)).length,
  nodesRemoved:[...priorNodes.keys()].filter(id=>!latestNodes.has(id)).length,
  nodesChanged:changedEquipment,
  linksAdded:[...latestEdges.keys()].filter(id=>!priorEdges.has(id)).length,
  linksRemoved:[...priorEdges.keys()].filter(id=>!latestEdges.has(id)).length,
  linksChanged:changedConnections
 };
}
export function restoreAsDraft(current:Project,version:SavedVersion):Project{
 if(version.projectId!==current.id||version.snapshot.id!==current.id)throw Error('Restore point belongs to a different seasonal plan');
 // Validate entire persisted snapshot before touching live project records.
 parseBackup(createBackup([version.snapshot]));
 const graphErrors=validateGraph(version.snapshot.nodes,version.snapshot.edges);
 if(graphErrors.length)throw Error('Saved wiring is invalid: '+graphErrors[0].message);
 return {...structuredClone(version.snapshot),status:'draft',verificationReview:undefined,
  nodes:version.snapshot.nodes.map(n=>({...n,verified:false})),checklist:{},updatedAt:now()};
}
