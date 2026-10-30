import Dexie,{type EntityTable} from 'dexie';
import type {Project} from './model';
import {kinds} from './model';
import {validateGraph} from './graph';
import {exampleProjects} from '../fixtures/examples';
export const DB_NAME='holiday-display-blueprint-v1';
export type SavedVersion={id:string;projectId:string;createdAt:string;label:string;bytes:number;snapshot:Project};
export class BlueprintDB extends Dexie{
 projects!:EntityTable<Project,'id'>;
 versions!:EntityTable<SavedVersion,'id'>;
 constructor(name=DB_NAME){super(name);this.version(1).stores({projects:'id,season,year,updatedAt'});this.version(2).stores({projects:'id,season,year,updatedAt',versions:'id,projectId,createdAt'});}
}
export const db=new BlueprintDB();
export async function initialize(dbInstance:BlueprintDB=db):Promise<Project[]>{
 const projects=await dbInstance.projects.toArray();
 if(projects.length)return projects;
 const seed=exampleProjects();await dbInstance.projects.bulkPut(seed);return seed;
}
export async function saveProject(project:Project,dbInstance:BlueprintDB=db):Promise<void>{
 const errors=validateGraph(project.nodes,project.edges);if(errors.length)throw Error(errors[0].message);
 await dbInstance.projects.put({...project,updatedAt:new Date().toISOString()});
}
export type Backup={format:'holiday-display-blueprint';version:1;exportedAt:string;projects:Project[]};
export function createBackup(projects:Project[]):Backup{return {format:'holiday-display-blueprint',version:1,exportedAt:new Date().toISOString(),projects};}
export function parseBackup(input:unknown):Project[]{
 if(typeof input!=='object'||input===null)throw Error('Invalid backup file');
 const data=input as Partial<Backup>;
 if(data.format!=='holiday-display-blueprint'||data.version!==1||!Array.isArray(data.projects))throw Error('Unsupported backup format/version');
 const seen=new Set<string>();
 for(const p of data.projects){if(!p||typeof p.id!=='string'||!Array.isArray(p.nodes)||!Array.isArray(p.edges)||!['Halloween','Christmas'].includes(p.season)||!['draft','verified'].includes(p.status)||!Number.isInteger(p.year)||!p.checklist||typeof p.checklist!=='object'||!p.nodes.every(n=>n&&typeof n.id==='string'&&typeof n.name==='string'&&kinds.includes(n.kind)&&Number.isInteger(n.outputs)&&n.outputs>=0&&n.outputs<=16&&n.position&&Number.isFinite(n.position.x)&&Number.isFinite(n.position.y))||!p.edges.every(e=>e&&typeof e.id==='string'&&typeof e.source==='string'&&typeof e.target==='string'&&Number.isInteger(e.sourcePort)))throw Error('Malformed project/component/connection');
  if(seen.has(p.id))throw Error('Duplicate project');seen.add(p.id);
  const errs=validateGraph(p.nodes,p.edges);if(errs.length)throw Error(errs[0].message);
 }
 return data.projects;
}
export async function restoreBackup(data:unknown,instance:BlueprintDB=db):Promise<number>{
 const projects=parseBackup(data);
 // Transaction prevents half-imported backups. Existing projects with different IDs stay intact.
 await instance.transaction('rw',instance.projects,async()=>{for(const p of projects)await instance.projects.put(p);});
 return projects.length;
}
export function downloadText(filename:string,text:string,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
