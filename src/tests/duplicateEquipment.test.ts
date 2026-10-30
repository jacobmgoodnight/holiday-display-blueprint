import {describe,it,expect} from 'vitest';
import {duplicateEquipment} from '../lib/duplicateEquipment';
import {exampleProjects} from '../fixtures/examples';
import {validateGraph} from '../lib/graph';

describe('Builder duplicate as an unconnected, unverified new item',()=>{
 const source=exampleProjects()[0];
 it('copies reusable equipment presentation/notes but never the physical asset identity or installed state',()=>{
  const chosen=source.nodes.find(n=>n.id==='h-split')!;
  const augmented={...source,
   nodes:source.nodes.map(n=>n.id===chosen.id?{
    ...n,verified:true,visualIcon:'splitter',color:'green',cordType:'Outdoor',
    notes:'Splitter near porch',lengthFt:15,photo:'data:image/jpeg;base64,/9j/',
    photoGallery:[{id:'p1',src:'data:image/jpeg;base64,/9j/',role:'installed' as const}],
    portLabels:{'0':'Actual Skelly socket'},metadata:{sourceRow:13},
    inventory:{storage:'Garage bin A',quantity:2,purchaseDate:'2024-10-01',condition:'good' as const}
   }:n),status:'verified' as const};
  const {project:next,copy}=duplicateEquipment(augmented,chosen.id);
  const original=augmented.nodes.find(n=>n.id===chosen.id)!;
  expect(copy.kind).toBe(original.kind);
  expect(copy.outputs).toBe(original.outputs);
  expect(copy.visualIcon).toBe('splitter');
  expect(copy.color).toBe('green');
  expect(copy.notes).toBe('Splitter near porch');
  expect(copy.inventory?.storage).toBe('Garage bin A');
  expect(copy.inventory?.quantity).toBeUndefined();
  expect(copy.id).not.toBe(original.id);
  expect(copy.assetId).not.toBe(original.assetId);
  expect(copy.photo).toBeUndefined();
  expect(copy.photoGallery).toBeUndefined();
  expect(copy.portLabels).toBeUndefined();
  expect(copy.lengthFt).toBeUndefined();
  expect(copy.metadata).toBeUndefined();
  expect(copy.verified).toBe(false);
  expect(copy.position).not.toEqual(original.position);
  expect(next.status).toBe('draft');
  expect(next.nodes.length).toBe(augmented.nodes.length+1);
  expect(next.edges).toBe(augmented.edges);
  expect(next.checklist).toBe(augmented.checklist);
  expect(next.edges.some(e=>e.source===copy.id||e.target===copy.id)).toBe(false);
  expect(validateGraph(next.nodes,next.edges)).toEqual([]);
  expect(augmented.nodes.length).toBe(source.nodes.length);
 });
 it('makes unique readable names for repeated copies without changing original names',()=>{
  const original=source.nodes[0]!;
  const first=duplicateEquipment(source,original.id);
  const second=duplicateEquipment(first.project,original.id);
  expect(first.copy.name).toBe(original.name+' (copy)');
  expect(second.copy.name).toBe(original.name+' (copy 2)');
  expect(source.nodes[0].name).toBe(original.name);
 });
 it('refuses missing IDs, and clones outlets without fabricating a power feed',()=>{
  expect(()=>duplicateEquipment(source,'missing')).toThrow(/missing/);
  const o=source.nodes.find(n=>n.kind==='outlet')!;
  const result=duplicateEquipment(source,o.id);
  expect(result.copy.kind).toBe('outlet');
  expect(result.copy.verified).toBe(false);
  expect(result.project.edges.length).toBe(source.edges.length);
 });
});
