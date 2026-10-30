import type {Project} from './model';
import {now} from './model';
export type PhotoRole='installed'|'connector'|'storage'|'detail';
export const photoRoles:readonly PhotoRole[]=['installed','connector','storage','detail'];
export type PhotoAttachment={id:string;src:string;role:PhotoRole};
export const MAX_COMPONENT_PHOTOS=8;
const valid=(s:string)=>/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s)&&s.length<3_500_000;
export function photoCount(photo?:string,gallery?:readonly PhotoAttachment[]){return (photo?1:0)+(gallery?.length||0);}
export function addComponentPhoto(p:Project,id:string,src:string,role:PhotoRole='detail'):Project{
 if(!valid(src))throw Error('Photo must be a compressed image from this device');
 const node=p.nodes.find(n=>n.id===id);if(!node)throw Error('Equipment is no longer present');
 if(photoCount(node.photo,node.photoGallery)>=MAX_COMPONENT_PHOTOS)throw Error('Maximum eight photos per item');
 const change=node.photo?{photoGallery:[...(node.photoGallery||[]),{id:crypto.randomUUID(),src,role}]}:{photo:src};
 return {...p,nodes:p.nodes.map(n=>n.id===id?{...n,...change}:n),updatedAt:now()};
}
export function promoteComponentPhoto(p:Project,id:string,photoId:string):Project{
 const node=p.nodes.find(n=>n.id===id);if(!node)throw Error('Equipment is missing');
 const chosen=node.photoGallery?.find(x=>x.id===photoId);if(!chosen)throw Error('Photo not found');
 const next=[...(node.photoGallery||[]).filter(x=>x.id!==photoId)];
 if(node.photo)next.push({id:crypto.randomUUID(),src:node.photo,role:'detail'});
 return {...p,nodes:p.nodes.map(n=>n.id===id?{...n,photo:chosen.src,photoGallery:next}:n),updatedAt:now()};
}
export function removeComponentPhoto(p:Project,id:string,photoId:string):Project{
 const node=p.nodes.find(n=>n.id===id);if(!node)throw Error('Equipment is missing');
 const gallery=node.photoGallery||[];
 const change=photoId==='primary'?(gallery.length?{photo:gallery[0].src,photoGallery:gallery.slice(1)}:{photo:undefined,photoGallery:[]}):{photoGallery:gallery.filter(x=>x.id!==photoId)};
 if(photoId!=='primary'&&gallery.length===change.photoGallery.length)throw Error('Photo not found');
 return {...p,nodes:p.nodes.map(n=>n.id===id?{...n,...change}:n),updatedAt:now()};
}
