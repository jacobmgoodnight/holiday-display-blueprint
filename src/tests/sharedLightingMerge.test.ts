import {describe,it,expect} from 'vitest';
import {createSharedLightingRecord,addStock,updateStock,addPlacement} from '../lib/sharedLighting';
import {mergeConcurrentLighting} from '../lib/sharedLightingMerge';
import {planMerge} from '../lib/cloudSync';
const digest=(name:string)=>name;
describe('cross-device shared stock item reconciliation',()=>{
 const root=createSharedLightingRecord();
 const s0=addStock({stock:[],placements:[]},'Mini');
 const s1=addStock(s0,'C9');
 const base={...root,sharedLighting:s1};
 const two={...s1,stock:[...s1.stock],placements:[]};
 it('merges independent changes to different owned groups using item baselines',()=>{
  const a=updateStock(s1,s1.stock[0].id,{owned:8});
  const b=updateStock(two,s1.stock[1].id,{owned:150});
  const hashBase={'stock:'+s1.stock[0].id:'base0','stock:'+s1.stock[1].id:'base1'};
  const lHash={'stock:'+s1.stock[0].id:'changed0','stock:'+s1.stock[1].id:'base1'};
  const rHash={'stock:'+s1.stock[0].id:'base0','stock:'+s1.stock[1].id:'changed1'};
  const merged=mergeConcurrentLighting({...base,sharedLighting:a},{...base,sharedLighting:b},hashBase,lHash,rHash);
  expect(merged).not.toBeNull();
  expect(merged!.sharedLighting?.stock.map(x=>x.owned)).toEqual([8,150]);
 });
 it('never silently merges conflicting edits to the exact same stock quantity',()=>{
  const l=updateStock(s1,s1.stock[0].id,{owned:5});
  const r=updateStock(s1,s1.stock[0].id,{owned:9});
  const key='stock:'+s1.stock[0].id;
  const same={['stock:'+s1.stock[1].id]:'base1'};
  expect(mergeConcurrentLighting({...base,sharedLighting:l},{...base,sharedLighting:r},{...same,[key]:'base0'},{...same,[key]:'left'},{...same,[key]:'right'})).toBeNull();
 });
 it('cannot infer whether a missing baseline row was deleted on another device',()=>{
  const key='stock:'+s1.stock[1].id;
  const missing={...base,sharedLighting:{...s1,stock:[s1.stock[0]]}};
  expect(mergeConcurrentLighting(missing,base,{[key]:'base1'},{},{[key]:'base1'})).toBeNull();
 });
 it('merges fresh independent placement rows without copying stock or rewiring',()=>{
  const l=addPlacement(s1,s1.stock[0].id,'Christmas',2026,'Bushes',4);
  const r=addPlacement(s1,s1.stock[0].id,'Christmas',2026,'Fence',2);
  const baseline=Object.fromEntries(s1.stock.map(x=>['stock:'+x.id,'hash-'+x.id]));
  const merged=mergeConcurrentLighting({...base,sharedLighting:l},{...base,sharedLighting:r},baseline,baseline,baseline);
  expect(merged!.sharedLighting?.placements).toHaveLength(2);
  expect(merged?.sharedLighting?.stock).toHaveLength(2);
  expect(merged?.nodes).toHaveLength(0);
  expect(merged?.edges).toHaveLength(0);
 });
 it('planMerge protects unrelated project conflicts while merging stock rows',()=>{
  const a=updateStock(s1,s1.stock[0].id,{owned:8});
  const b=updateStock(s1,s1.stock[1].id,{owned:180});
  const key0='stock:'+s1.stock[0].id,key1='stock:'+s1.stock[1].id;
  const outcome=planMerge([{...base,sharedLighting:a}],[{...base,sharedLighting:b}],{[base.id]:'base'}, {[base.id]:'phone'},{[base.id]:'desktop'},undefined,
   {[key0]:'same0',[key1]:'same1'},{[key0]:'phone0',[key1]:'same1'},{[key0]:'same0',[key1]:'desktop1'});
  expect(outcome.conflicts).toEqual([]);
  expect(outcome.upload).toBe(true);
  expect(outcome.download).toBe(true);
  expect(outcome.projects[0].sharedLighting?.stock.map(x=>x.owned)).toEqual([8,180]);
  expect(digest('catalog')).toBe('catalog');
 });
});
