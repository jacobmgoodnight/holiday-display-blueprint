import type {Project} from './model';
/** Explore is deliberately non-mutating. Embedded diagram retains its existing editing behavior. */
export function workspaceCanEdit(fullscreen:boolean,mode:'explore'|'builder'):boolean{return !fullscreen||mode==='builder';}
export function freeOutputPorts(project:Project,sourceId:string,targetId?:string):number[]{
 const node=project.nodes.find(n=>n.id===sourceId);
 if(!node)return [];
 const taken=new Set(project.edges.filter(e=>e.source===sourceId&&e.target!==targetId).map(e=>e.sourcePort));
 return Array.from({length:node.outputs},(_,i)=>i).filter(port=>!taken.has(port));
}
/** A complete scan ignores the current circuit filter. */
export function searchComponents(project:Project,query:string,max=12){
 const q=query.toLocaleLowerCase().trim();
 if(q.length<2)return [];
 return project.nodes.filter(n=>[n.id,n.name,n.kind,n.zone,n.notes,n.inventory?.storage].some(v=>String(v||'').toLocaleLowerCase().includes(q))).slice(0,max);
}
