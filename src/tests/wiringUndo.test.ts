import {describe,it,expect} from 'vitest';
import {exampleProjects} from '../fixtures/examples';
import {editPowerFeed,undoLastWiringChange} from '../lib/wiringEdits';
describe('safe reverse of the last guided feed edit',()=>{
 const initial=exampleProjects()[0];
 it('reverses a rewire without re-verifying equipment or restoring old checklist progress',()=>{
  const p={...initial,nodes:initial.nodes.map(n=>({...n,verified:true})),checklist:{'wire:he5':{done:true,notes:'Old test'}}};
  const edited=editPowerFeed(p,'h-light','h-o03',0);
  const undone=undoLastWiringChange(edited);
  expect(undone.edges.find(e=>e.target==='h-light')?.source).toBe('h-split');
  expect(undone.edges.find(e=>e.target==='h-light')?.sourcePort).toBe(1);
  expect(undone.nodes.find(n=>n.id==='h-light')?.verified).toBe(false);
  expect(undone.status).toBe('draft');
  expect(undone.checklist['wire:he5']).toBeUndefined();
  expect(undone.wiringHistory?.length).toBe(2);
 });
 it('reverses a disconnect only if the previous output is still available',()=>{
  const edited=editPowerFeed(initial,'h-light',null);
  const undone=undoLastWiringChange(edited);
  expect(undone.edges.some(e=>e.target==='h-light')).toBe(true);
 });
 it('reverses a newly added feed by disconnecting it',()=>{
  const p={...initial,edges:initial.edges.filter(e=>e.target!=='h-light')};
  const edited=editPowerFeed(p,'h-light','h-o03',0);
  const undone=undoLastWiringChange(edited);
  expect(undone.edges.find(e=>e.target==='h-light')).toBeUndefined();
 });
 it('rejects reversing when another editor has changed the target connection',()=>{
  const edited=editPowerFeed(initial,'h-light','h-o03',0);
  const changed={...edited,edges:edited.edges.map(e=>e.target==='h-light'?{...e,source:'h-split',sourcePort:1}:e)};
  expect(()=>undoLastWiringChange(changed)).toThrow(/changed since/);
 });
 it('rejects unavailable old output and cannot undo a missing history',()=>{
  const edited=editPowerFeed(initial,'h-light','h-o03',0);
  const changed={...edited,edges:[...edited.edges,{id:'foreign',source:'h-split',sourcePort:1,target:'h-o03'}]};
  expect(()=>undoLastWiringChange(changed)).toThrow();
  expect(()=>undoLastWiringChange(initial)).toThrow(/No recorded/);
 });
});
