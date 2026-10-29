import {describe,it,expect} from 'vitest';
import {exampleProjects} from '../fixtures/examples';
import {deleteComponentSafely,undoComponentDeletion} from '../lib/graphDeletion';
describe('component removal integrity',()=>{
 const source=exampleProjects()[0];
 it('removes only incident links, invalidates descendants and stale tasks',()=>{
  const p={...source,checklist:{'wire:he3':{done:true},'wire:he4':{done:true},'place:h-split':{done:true},'pack:h-split':{done:true}},nodes:source.nodes.map(n=>({...n,verified:true})),status:'verified' as const};
  const {project,receipt}=deleteComponentSafely(p,'h-split');
  expect(receipt.edges.length).toBeGreaterThan(1);
  expect(project.edges.find(e=>e.source==='h-split'||e.target==='h-split')).toBeUndefined();
  expect(project.nodes.find(n=>n.id==='h-light')?.verified).toBe(false);
  expect(project.nodes.find(n=>n.id==='h-prop')?.verified).toBe(false);
  expect(project.status).toBe('draft');
  expect(project.checklist['wire:he4']).toBeUndefined();
  expect(project.checklist['place:h-split']).toBeUndefined();
  expect(source.nodes.find(n=>n.id==='h-split')).toBeDefined();
 });
 it('can restore a deleted component without restoring verification',()=>{
  const {project,receipt}=deleteComponentSafely(source,'h-split');
  const undo=undoComponentDeletion(project,receipt);
  expect(undo.nodes.length).toBe(source.nodes.length);
  expect(undo.edges.length).toBe(source.edges.length);
  expect(undo.nodes.find(n=>n.id==='h-split')?.verified).toBe(false);
  expect(undo.status).toBe('draft');
 });
 it('refuses restore if original socket was reused',()=>{
  const {project,receipt}=deleteComponentSafely(source,'h-split');
  const replacement={...project,edges:[...project.edges,{id:'new',source:'h-cord',sourcePort:0,target:'h-prop'}]};
  expect(()=>undoComponentDeletion(replacement,receipt)).toThrow(/Cannot restore/);
 });
 it('never deletes an unrelated project component',()=>{
  expect(()=>deleteComponentSafely(source,'nonexistent')).toThrow(/not found/);
 });
});
