import type {Kind, Position, Project, Season, Zone} from './model';
import {makeNode, now} from './model';
import {defaultVisualIcon} from './visualIcons';

export function createBlankDisplay(details:{name:string;season:Season;year:number}):Project{
 const timestamp=now();
 return {id:crypto.randomUUID(),...details,status:'draft',nodes:[],edges:[],checklist:{},createdAt:timestamp,updatedAt:timestamp,example:false};
}

/** Prepare an unconnected draft item; an outlet's actual output count must be supplied. */
export function addUnconnectedItem(project:Project,options:{kind:Kind;zone:Zone;position:Position;name:string;visualIcon?:string;outletOutputs?:number}){
 if(options.kind==='outlet'&&(!Number.isInteger(options.outletOutputs)||options.outletOutputs!<1||options.outletOutputs!>16))throw Error('Choose the number of known outputs first.');
 const node=makeNode(options.kind,options.zone,options.position);
 if(options.kind==='outlet')node.outputs=options.outletOutputs!;
 node.visualIcon=options.visualIcon||defaultVisualIcon(project.season,options.kind);
 if(options.name.trim())node.name=options.name.trim().slice(0,100);
 return {project:{...project,nodes:[...project.nodes,node],status:'draft' as const},node};
}
