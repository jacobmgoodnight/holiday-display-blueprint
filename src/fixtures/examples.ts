import type {Project,Component,Connection,Kind,Zone} from '../lib/model';
import {outputCount,now} from '../lib/model';
const node=(id:string,name:string,kind:Kind,zone:Zone,x:number,y:number,extra:Partial<Component>={}):Component=>({id,name,kind,zone,position:{x,y},outputs:outputCount(kind),inputGender:kind==='outlet'?undefined:'male',outputGender:outputCount(kind)?'female':undefined,...extra});
const edge=(id:string,source:string,sourcePort:number,target:string):Connection=>({id,source,sourcePort,target});
/** No actual addresses, photos, wattages, personal inventories or verified wiring in source fixtures. */
export function exampleProjects():Project[]{const stamp=now();return [
 {id:'example-halloween',season:'Halloween',year:2026,name:'Halloween · starter example',status:'draft',example:true,createdAt:stamp,updatedAt:stamp,checklist:{},nodes:[
  node('h-o01','O01 · Front porch outlet','outlet','Front porch',30,150,{notes:'Illustrative outlet ID; consult imported master before building.'}),
  node('h-kasa','Example Kasa smart plug','smart-plug','Front porch',300,150),
  node('h-cord','Example 10 ft extension cord','cord','Front porch',570,150,{color:'Black',lengthFt:10}),
  node('h-split','Example 4-way splitter','splitter','Front porch',840,150),
  node('h-prop','Example decoration','decoration','Front porch',1120,80),
  node('h-light','Example spotlight','spotlight','Front porch',1120,240),
  node('h-o02','O02 · Left garage outlet','outlet','Garage & driveway',30,460),
  node('h-o03','O03 · Back porch outlet','outlet','Backyard',30,700)
 ],edges:[edge('he1','h-o01',0,'h-kasa'),edge('he2','h-kasa',0,'h-cord'),edge('he3','h-cord',0,'h-split'),edge('he4','h-split',0,'h-prop'),edge('he5','h-split',1,'h-light')]},
 {id:'example-christmas',season:'Christmas',year:2026,name:'Christmas · O03 connection example',status:'draft',example:true,createdAt:stamp,updatedAt:stamp,checklist:{},nodes:[
  node('c-o01','O01 · Front porch outlet','outlet','Front porch',30,500),
  node('c-o02','O02 · Left garage outlet','outlet','Garage & driveway',30,730),
  node('c-o03','O03 · Back porch outlet','outlet','Backyard',30,170),
  node('c-cord','Example back-porch feeder','spt-1','Backyard',300,170,{color:'Green'}),
  node('c-c9','Covered-porch C9 strand (female end)','light-strand','Backyard',570,170,{notes:'Example preserves confirmed logical topology. Exact strand, cord specs and installed status unverified.'}),
  node('c-morning','Short green SPT-1 to morning room','spt-1','Backyard',840,170,{color:'Green',notes:'Plugs into female connection ON covered-porch C9 strand, not on white SPT-1 feeder.'}),
  node('c-roof','Morning-room roof C9','light-strand','Backyard',1110,170)
 ],edges:[edge('ce1','c-o03',0,'c-cord'),edge('ce2','c-cord',0,'c-c9'),edge('ce3','c-c9',0,'c-morning'),edge('ce4','c-morning',0,'c-roof')]}
 ];}
