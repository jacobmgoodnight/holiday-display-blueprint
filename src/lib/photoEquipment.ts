import type {Kind,Project,Zone} from './model';
import {categories} from './model';
import {addGuidedEquipment} from './guidedEquipment';

const outputKinds:Kind[]=['outlet','smart-plug','cord','spt-1','splitter','inline-tap','light-strand'];

/** Create an unconnected item and place it on the photo in one project update. */
export function addPhotoEquipment(project:Project,kind:Kind,zone:Zone,point:{x:number;y:number}){
 if(!project.propertyPhoto)throw Error('Choose a property photo first.');
 if(!Number.isFinite(point.x)||!Number.isFinite(point.y)||point.x<0||point.x>1||point.y<0||point.y>1)throw Error('Choose a location on the property photo.');
 const label=categories.find(category=>category.kind===kind)?.label||kind;
 const names=new Set(project.nodes.map(node=>node.name.trim().toLocaleLowerCase()));
 let name=label,index=2;while(names.has(name.toLocaleLowerCase()))name=`${label} ${index++}`;
 const added=addGuidedEquipment(project,{kind,zone,name,...(outputKinds.includes(kind)?{outputs:0,outputsUnknown:true}:{})});
 return {...added,project:{...added.project,propertyPhoto:{...project.propertyPhoto,placements:{...project.propertyPhoto.placements,[added.nodeId]:point}}}};
}
