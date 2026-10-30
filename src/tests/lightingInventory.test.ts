import {describe,it,expect} from 'vitest';
import {addChristmasSectionPrompts,addLightEntry,computedBulbs,newLightingEntry,summarizeByType,summarizeLighting,updateLightEntry} from '../lib/lightingInventory';
import {exampleProjects} from '../fixtures/examples';
import {createBackup,parseBackup} from '../lib/storage';
describe('Christmas lighting inventory as measured physical strands, not AC graph',()=>{
 it('counts known bulbs and explicitly tracks unknown inventory amounts',()=>{
  let entries=addLightEntry([],{...newLightingEntry('C9'),label:'First floor',strandCount:1,totalBulbs:72});
  entries=addLightEntry(entries,{...newLightingEntry('C9','Second-floor roofline'),label:'Second floor'});
  entries=addLightEntry(entries,{...newLightingEntry('Mini','Bushes'),strandCount:4,bulbsPerStrand:100});
  const total=summarizeLighting(entries);
  expect(total.knownBulbs).toBe(472);
  expect(total.unknownBulbRows).toBe(1);
  expect(total.knownStrands).toBe(5);
  expect(total.unknownStrandRows).toBe(1);
  expect(computedBulbs(entries[0])).toBe(72);
  expect(summarizeByType(entries).Mini.knownBulbs).toBe(400);
 });
 it('counts spares separately and avoids inferred counts',()=>{
  const planned=addLightEntry([],{...newLightingEntry('Mini','Fence'),bulbsPerStrand:100});
  const withSpare=addLightEntry(planned,{...newLightingEntry('Mini','Storage / spare'),strandCount:2,bulbsPerStrand:50,status:'spare'});
  expect(summarizeByType(withSpare).Mini.knownBulbs).toBe(0);
  expect(summarizeByType(withSpare).Mini.unknownBulbRows).toBe(1);
  expect(summarizeByType(withSpare,'spare').Mini.knownBulbs).toBe(100);
 });
 it('prepopulates only named blank Christmas sections on explicit action and does not duplicate prompts',()=>{
  const first=addChristmasSectionPrompts([]);
  const second=addChristmasSectionPrompts(first);
  expect(first.length).toBeGreaterThan(9);
  expect(second.length).toBe(first.length);
  expect(first.every(e=>e.strandCount===undefined&&e.bulbsPerStrand===undefined&&e.totalBulbs===undefined&&e.status==='planned')).toBe(true);
  expect(first.some(e=>e.area==='First-floor roofline')).toBe(true);
  expect(first.some(e=>e.area==='Second-floor roofline')).toBe(true);
 });
 it('never rewires or modifies existing components and persists through private backup schema',()=>{
  const original=exampleProjects()[0];
  const list=addLightEntry([],{...newLightingEntry('Mini'),strandCount:3,bulbsPerStrand:100,componentId:original.nodes[0].id});
  const update={...original,lightingInventory:list};
  const backup=parseBackup(createBackup([update]))[0];
  expect(backup.lightingInventory).toEqual(list);
  expect(backup.nodes).toEqual(original.nodes);
  expect(backup.edges).toEqual(original.edges);
  expect(updateLightEntry(list,list[0].id,{bulbsPerStrand:150})[0].bulbsPerStrand).toBe(150);
  expect(()=>updateLightEntry(list,list[0].id,{bulbsPerStrand:-5})).toThrow(/non-negative/);
 });
});
