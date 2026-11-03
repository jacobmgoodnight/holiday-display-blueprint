import type {Kind,Project,Zone} from './model';
import {makeNode} from './model';
import {defaultVisualIcon} from './visualIcons';
import {validateGraph} from './graph';
import {quickAddConnected} from './quickAdd';
import {addUnconnectedItem} from './newDisplay';
import {editPowerFeed} from './wiringEdits';

export type GuidedEquipmentOptions={kind:Kind;name:string;zone:Zone;outputs?:number;outputsUnknown?:boolean;sourceId?:string;port?:number;color?:string;lengthFt?:number};
const outputKinds:Kind[]=['outlet','smart-plug','cord','spt-1','splitter','inline-tap','light-strand'];

/** Add exactly one new physical item; its feed is explicit or deliberately absent. */
export function addGuidedEquipment(project:Project,options:GuidedEquipmentOptions){
 if(options.outputsUnknown&&(!outputKinds.includes(options.kind)||options.outputs!==0))throw Error('Unknown outputs cannot be used for connections.');
 if(outputKinds.includes(options.kind)&&!options.outputsUnknown&&(!Number.isInteger(options.outputs)||options.outputs!<(options.kind==='outlet'?1:0)||options.outputs!>16))throw Error('Choose the number of known outputs.');
 if((options.sourceId===undefined)!==(options.port===undefined))throw Error('Choose both the source and its actual output.');
 if(options.kind==='outlet'&&options.sourceId!==undefined)throw Error('An outlet cannot receive a power connection.');
 if(options.lengthFt!==undefined&&(!Number.isFinite(options.lengthFt)||options.lengthFt<0||options.lengthFt>100000))throw Error('Enter a valid length in feet.');
 let next:Project,nodeId:string;
 if(options.sourceId!==undefined){
  next=quickAddConnected(project,{sourceId:options.sourceId,port:options.port!,kind:options.kind,name:options.name,connectorTypesUnknown:true});
  nodeId=next.nodes[next.nodes.length-1].id;
 }else if(options.outputsUnknown){
  const node=makeNode(options.kind,options.zone,{x:80+(project.nodes.length%5)*230,y:120+Math.floor(project.nodes.length/5)*150});
  node.outputs=0;node.outputGender=undefined;node.outputsUnknown=true;node.visualIcon=defaultVisualIcon(project.season,options.kind);
  if(options.name.trim())node.name=options.name.trim().slice(0,100);
  next={...project,nodes:[...project.nodes,node],status:'draft'};nodeId=node.id;
 }else{
  const item=addUnconnectedItem(project,{kind:options.kind,zone:options.zone,position:{x:80+(project.nodes.length%5)*230,y:120+Math.floor(project.nodes.length/5)*150},name:options.name,outletOutputs:options.kind==='outlet'?options.outputs:undefined});
  next=item.project;nodeId=item.node.id;
 }
 next={...next,nodes:next.nodes.map(n=>n.id!==nodeId?n:{...n,zone:options.zone,inputGender:undefined,outputGender:undefined,...(options.outputs!==undefined?{outputs:options.outputs,outputsUnknown:options.outputsUnknown||undefined}:{}),...(options.color?{color:options.color.trim().slice(0,60)}:{}),...(options.lengthFt!==undefined?{lengthFt:options.lengthFt}:{})})};
 const errors=validateGraph(next.nodes,next.edges);if(errors.length)throw Error(errors[0].message);
 return {project:next,nodeId};
}

/** Connect only a currently unconnected item; existing feeds require the deliberate rewire workflow. */
export function connectGuidedEquipment(project:Project,targetId:string,sourceId:string,port:number){
 if(project.edges.some(e=>e.target===targetId))throw Error('This item already has a recorded connection. Use its wiring details to change it.');
 if(!sourceId||!Number.isInteger(port))throw Error('Choose the source and its actual output.');
 return editPowerFeed(project,targetId,sourceId,port);
}
