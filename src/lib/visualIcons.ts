import type {Kind,Season} from './model';
export type VisualIcon={id:string;label:string;emoji:string;group:'Halloween'|'Christmas'|'Electrical'|'General';kinds?:readonly Kind[]};
export const visualIcons:readonly VisualIcon[]=[
 {id:'skelly',label:'Skeleton / Skelly',emoji:'💀',group:'Halloween',kinds:['decoration']},
 {id:'bones',label:'Skeleton bones',emoji:'🦴',group:'Halloween',kinds:['decoration']},
 {id:'scarecrow',label:'Scarecrow',emoji:'🧟',group:'Halloween',kinds:['decoration']},
 {id:'pumpkin',label:'Carved pumpkin',emoji:'🎃',group:'Halloween',kinds:['decoration']},
 {id:'singing-pumpkins',label:'Singing pumpkins',emoji:'🎃',group:'Halloween',kinds:['decoration','projector']},
 {id:'skull-stack',label:'Skull stack',emoji:'☠️',group:'Halloween',kinds:['decoration']},
 {id:'tombstone',label:'Tombstone',emoji:'🪦',group:'Halloween',kinds:['decoration']},
 {id:'ghost',label:'Ghost',emoji:'👻',group:'Halloween',kinds:['decoration']},
 {id:'spider',label:'Spider',emoji:'🕷️',group:'Halloween',kinds:['decoration']},
 {id:'fog',label:'Fog machine',emoji:'🌫️',group:'Halloween',kinds:['decoration','accessory']},
 {id:'blacklight',label:'UV / blacklight',emoji:'🟣',group:'Halloween',kinds:['spotlight']},
 {id:'roof-c9',label:'Roofline C9 lights',emoji:'🏠',group:'Christmas',kinds:['light-strand']},
 {id:'c9-bulbs',label:'C9 bulbs',emoji:'💡',group:'Christmas',kinds:['light-strand']},
 {id:'mini-lights',label:'Mini lights',emoji:'✨',group:'Christmas',kinds:['light-strand']},
 {id:'tree-lights',label:'Tree lights',emoji:'🎄',group:'Christmas',kinds:['light-strand','decoration']},
 {id:'fence-lights',label:'Fence lights',emoji:'〰️',group:'Christmas',kinds:['light-strand']},
 {id:'snowman',label:'Snowman',emoji:'☃️',group:'Christmas',kinds:['decoration']},
 {id:'deer',label:'Reindeer / deer',emoji:'🦌',group:'Christmas',kinds:['decoration']},
 {id:'wreath',label:'Wreath',emoji:'🎀',group:'Christmas',kinds:['decoration']},
 {id:'gift',label:'Gift display',emoji:'🎁',group:'Christmas',kinds:['decoration']},
 {id:'outlet',label:'Outlet',emoji:'🔌',group:'Electrical',kinds:['outlet']},
 {id:'smart-plug',label:'Smart plug',emoji:'🔘',group:'Electrical',kinds:['smart-plug']},
 {id:'extension',label:'Extension cord',emoji:'🔌',group:'Electrical',kinds:['cord']},
 {id:'splitter',label:'Multiway splitter',emoji:'🔱',group:'Electrical',kinds:['splitter']},
 {id:'tap',label:'Female tap / splitter',emoji:'🔀',group:'Electrical',kinds:['inline-tap']},
 {id:'spt',label:'SPT-1 run',emoji:'➿',group:'Electrical',kinds:['spt-1']},
 {id:'controller',label:'Controller',emoji:'🎛️',group:'Electrical',kinds:['controller']},
 {id:'projector',label:'Projector',emoji:'📽️',group:'General',kinds:['projector']},
 {id:'spotlight',label:'Spotlight',emoji:'🔦',group:'General',kinds:['spotlight']},
 {id:'storage',label:'Equipment tote',emoji:'🧰',group:'General',kinds:['accessory']},
 {id:'speaker',label:'Speaker',emoji:'🔊',group:'General',kinds:['accessory']},
 {id:'star',label:'Star',emoji:'⭐',group:'General',kinds:['decoration']},
 {id:'light',label:'Lights',emoji:'💡',group:'General',kinds:['light-strand','spotlight']},
];
export function getVisualIcon(id?:string){return visualIcons.find(x=>x.id===id);}
export function suggestedIcons(season:Season,kind:Kind):VisualIcon[]{
 const group=season==='Halloween'?'Halloween':'Christmas';
 const score=(x:VisualIcon)=>((x.kinds?.includes(kind)?0:3)+(x.group===group?0:x.group==='Electrical'?1:x.group==='General'?2:4));
 return [...visualIcons].sort((a,b)=>score(a)-score(b));
}
export function defaultVisualIcon(_season:Season,kind:Kind):string|undefined{
 // A decoration or strand may be any prop; never assign a specific skeleton or roofline without confirmation.
 if(kind==='decoration'||kind==='light-strand')return undefined;
 const mapping:Partial<Record<Kind,string>>={outlet:'outlet','smart-plug':'smart-plug',cord:'extension','spt-1':'spt',splitter:'splitter','inline-tap':'tap',projector:'projector',spotlight:'spotlight',controller:'controller'};
 return mapping[kind];
}
