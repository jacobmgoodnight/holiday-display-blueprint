import {addGuidedEquipment} from './guidedEquipment';
import type {Project,Zone} from './model';
import type {PhotoPoint,PropertyPhoto} from './propertyPhoto';

export type DirectRouteKind='lights'|'cord';
export type DirectRouteDraft={kind:DirectRouteKind;zone:Zone|'';points:PhotoPoint[];cursor:PhotoPoint};
const zones:Zone[]=['Front porch','Garage & driveway','Backyard','Other'];

/** Create a new unconnected item and a visual route, without guessing physical specs. */
export function createPhotoDirectRoute(project:Project,layout:PropertyPhoto,draft:DirectRouteDraft){
 if(!layout?.photo)throw Error('Choose a property photo first.');
 if(draft.kind!=='lights'&&draft.kind!=='cord')throw Error('Choose lights or cord.');
 if(!zones.includes(draft.zone as Zone))throw Error('Choose an area.');
 if(!Array.isArray(draft.points)||draft.points.length<2||draft.points.length>500||draft.points.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1))throw Error('Draw at least two valid points.');
 if(draft.points.every(p=>p.x===draft.points[0].x&&p.y===draft.points[0].y))throw Error('Choose two different points.');
 const points=draft.points.map(point=>({...point}));
 const result=addGuidedEquipment(project,{kind:draft.kind==='lights'?'light-strand':'cord',name:'',zone:draft.zone as Zone,outputs:0,outputsUnknown:true});
 const applyLayout=(current:PropertyPhoto|undefined):PropertyPhoto|undefined=>current?{...current,placements:{...current.placements,[result.nodeId]:{...points[0]}},routes:{...current.routes,[result.nodeId]:{kind:draft.kind,points}}}:current;
 return {...result,applyLayout};
}
