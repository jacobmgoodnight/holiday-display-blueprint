import {describe,expect,it} from 'vitest';
import {exampleProjects} from '../fixtures/examples';
import {insertIntoConnection,portName,renameOutputPort,insertableKinds} from '../lib/wiringBuilder';
import {validateGraph} from '../lib/graph';

describe('custom output port labels',()=>{
 const p=exampleProjects()[0];
 it('retains numbered ports and allows meaningful names without moving wires',()=>{
  const source=p.nodes.find(n=>n.id==='h-split')!;
  const changed=renameOutputPort(p,source.id,0,'Kasa left');
  expect(portName(changed.nodes.find(n=>n.id===source.id)!,0)).toBe('Kasa left');
  expect(portName(changed.nodes.find(n=>n.id===source.id)!,1)).toBe('Output 2');
  expect(changed.edges).toBe(p.edges);
  expect(renameOutputPort(changed,source.id,0,'').nodes.find(n=>n.id===source.id)?.portLabels?.['0']).toBeUndefined();
  expect(p.nodes.find(n=>n.id===source.id)?.portLabels).toBeUndefined();
 });
 it('rejects nonexisting ports and overly long labels',()=>{
  expect(()=>renameOutputPort(p,'h-split',40,'Porch')).toThrow(/existing/);
  expect(()=>renameOutputPort(p,'h-split',0,'a'.repeat(41))).toThrow(/40/);
 });
});
describe('insert a cord or splitter into an existing link',()=>{
 const p=exampleProjects()[0];
 it.each(['cord','splitter','spt-1','inline-tap','light-strand'] as const)('validates atomic insertion of %s',kind=>{
  const old=p.edges.find(e=>e.target==='h-light')!;
  const result=insertIntoConnection(p,old.id,kind,'New branch');
  expect(validateGraph(result.nodes,result.edges)).toEqual([]);
  expect(result.nodes.length).toBe(p.nodes.length+1);
  expect(result.edges.length).toBe(p.edges.length+1);
  expect(result.edges.find(e=>e.id===old.id)).toBeUndefined();
  const added=result.nodes.find(n=>n.name==='New branch')!;
  expect(result.edges.some(e=>e.source===old.source&&e.sourcePort===old.sourcePort&&e.target===added.id)).toBe(true);
  expect(result.edges.some(e=>e.source===added.id&&e.sourcePort===0&&e.target===old.target)).toBe(true);
  expect(result.edges.filter(e=>e.id!==old.id&&e.source!==added.id&&e.target!==added.id)).toEqual(p.edges.filter(e=>e.id!==old.id));
  expect(result.nodes.find(n=>n.id===old.target)?.verified).toBe(false);
  expect(result.status).toBe('draft');
  expect(result.wiringHistory?.length).toBe(2);
 });
 it('preserves prior edge metadata and notes for review after insertion',()=>{
  const edge=p.edges.find(e=>e.target==='h-light')!;
  const changed={...p,edges:p.edges.map(e=>e.id===edge.id?{...e,notes:'Recorded green cord, verify length',metadata:{source:'field notes'}}:e)};
  const next=insertIntoConnection(changed,edge.id,'splitter','S05');
  const insertedNode=next.nodes.find(n=>n.name==='S05')!;
  const upstreamEdge=next.edges.find(e=>e.target===insertedNode.id)!;
  expect(upstreamEdge.notes).toBe('Recorded green cord, verify length');
  expect(upstreamEdge.metadata).toEqual({source:'field notes'});
 });
 it('removes a completed old link task but preserves unrelated checklist',()=>{
  const old=p.edges.find(e=>e.target==='h-light')!;
  const modified={...p,checklist:{...p.checklist,['wire:'+old.id]:{done:true,notes:'Old verified'},['place:h-light']:{done:true}}};
  const updated=insertIntoConnection(modified,old.id,'splitter');
  expect(updated.checklist['wire:'+old.id]).toBeUndefined();
  expect(updated.checklist['place:h-light']).toEqual({done:true});
 });
 it('does not mutate original plan and refuses adding a non-inline item',()=>{
  const old=p.edges[0];
  expect(()=>insertIntoConnection(p,old.id,'decoration')).toThrow(/inline/);
  expect(()=>insertIntoConnection(p,'missing','splitter')).toThrow(/existing/);
  expect(insertableKinds).toContain('cord');
 });
});
