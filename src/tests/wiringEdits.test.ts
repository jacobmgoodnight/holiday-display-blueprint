import {describe,it,expect} from 'vitest';
import {editPowerFeed} from '../lib/wiringEdits';
import {exampleProjects} from '../fixtures/examples';

describe('safe rewiring and field verification',()=>{
 const example=exampleProjects()[0];
 it('reconnects the selected target without altering other branches or positions',()=>{
  const target='h-light';
  const orig=example.edges.find(e=>e.target===target)!;
  const next=editPowerFeed(example,target,'h-o03',0);
  expect(next.edges.find(e=>e.target===target)?.source).toBe('h-o03');
  expect(next.edges.find(e=>e.target==='h-prop')).toEqual(example.edges.find(e=>e.target==='h-prop'));
  expect(next.nodes.find(n=>n.id===target)?.position).toEqual(example.nodes.find(n=>n.id===target)?.position);
  expect(next.wiringHistory?.at(-1)?.fromId).toBe(orig.source);
  expect(next.status).toBe('draft');
 });
 it('invalidates verification and the completed old wire checkbox',()=>{
  const p={...example,checklist:{...example.checklist}};
  const wire=example.edges.find(e=>e.target==='h-light')!;
  p.checklist['wire:'+wire.id]={done:true,notes:'Previously checked'};
  p.nodes=example.nodes.map(n=>({...n,verified:true}));
  p.status='verified';
  const next=editPowerFeed(p,'h-light','h-o03',0);
  expect(next.checklist['wire:'+wire.id]).toBeUndefined();
  expect(next.nodes.find(n=>n.id==='h-light')?.verified).toBe(false);
  expect(next.status).toBe('draft');
 });
 it('removes a feed only for the selected target and records a disconnect',()=>{
  const next=editPowerFeed(example,'h-light',null);
  expect(next.edges.find(e=>e.target==='h-light')).toBeUndefined();
  expect(next.wiringHistory?.at(-1)?.action).toBe('disconnected');
 });
 it('does nothing for an unchanged source/port',()=>{
  const link=example.edges.find(e=>e.target==='h-light')!;
  expect(editPowerFeed(example,link.target,link.source,link.sourcePort)).toBe(example);
 });
 it('never creates a power cycle or a connection to an outlet',()=>{
  expect(()=>editPowerFeed(example,'h-o01','h-split',0)).toThrow(/House outlets/);
  expect(()=>editPowerFeed(example,'h-kasa','h-light',0)).toThrow();
 });
 it('rejects ports already occupied by a different branch',()=>{
  const edge=example.edges.find(e=>e.target==='h-prop')!;
  expect(()=>editPowerFeed(example,'h-light',edge.source,edge.sourcePort)).toThrow(/occupied/i);
 });
});
