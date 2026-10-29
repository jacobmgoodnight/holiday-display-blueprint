export const kinds = ['outlet','smart-plug','cord','spt-1','splitter','inline-tap','light-strand','decoration','projector','spotlight','controller','accessory'] as const;
export type Kind = typeof kinds[number];
export type Season = 'Halloween'|'Christmas';
export type Zone = 'Front porch'|'Garage & driveway'|'Backyard'|'Other';
export type Position = {x:number,y:number};
export type Inventory = {quantity?:number;storage?:string;purchaseDate?:string;price?:number;condition?:'good'|'missing'|'damaged'|'repair';repairHistory?:string};
export type Component = {
  id:string; assetId?:string; name:string; kind:Kind; zone:Zone; position:Position;
  outputs:number; inputGender?:'male'|'female'; outputGender?:'male'|'female'; color?:string; lengthFt?:number; cordType?:string;
  ratedWatts?:number; expectedWatts?:number; notes?:string; photo?:string;
  verified?:boolean; inventory?:Inventory; metadata?:Record<string, unknown>;
};
export type Connection = {id:string;source:string;sourcePort:number;target:string;notes?:string;metadata?:Record<string,unknown>};
export type ChecklistState = Record<string,{done:boolean;notes?:string;photo?:string}>;
export type WiringEdit={
 id:string;at:string;action:'connected'|'rewired'|'disconnected';targetId:string;targetName:string;
 fromId?:string;fromPort?:number;toId?:string;toPort?:number;
};
export type Project = {
  id:string;season:Season;year:number;name:string;status:'draft'|'verified';
  nodes:Component[];edges:Connection[];checklist:ChecklistState;
  backgroundPhoto?:string;createdAt:string;updatedAt:string;example?:boolean;wiringHistory?:WiringEdit[];verificationReview?:{reviewedAt:string;notes:string;exceptions:string[]};
};
export const outputCount = (kind:Kind):number => ({outlet:2,'smart-plug':2,cord:1,'spt-1':1,splitter:4,'inline-tap':2,'light-strand':1,decoration:0,projector:0,spotlight:0,controller:0,accessory:0})[kind];
export const categories:{kind:Kind;label:string}[] = [
 {kind:'outlet',label:'Outdoor outlet'},{kind:'smart-plug',label:'Smart plug'},{kind:'cord',label:'Extension cord'},{kind:'spt-1',label:'SPT-1 feeder'},
 {kind:'splitter',label:'Splitter'},{kind:'inline-tap',label:'Inline female tap'},{kind:'light-strand',label:'Light strand'},
 {kind:'decoration',label:'Decoration'},{kind:'projector',label:'Projector'},{kind:'spotlight',label:'Spotlight'},
 {kind:'controller',label:'Controller'},{kind:'accessory',label:'Accessory'}
];
export const now = () => new Date().toISOString();
export const makeNode=(kind:Kind,zone:Zone,position:Position):Component=>{const id=crypto.randomUUID();return {id,assetId:id,name:categories.find(c=>c.kind===kind)?.label||kind,kind,zone,position,outputs:outputCount(kind),inputGender:kind==='outlet'?undefined:'male',outputGender:outputCount(kind)?'female':undefined};};
