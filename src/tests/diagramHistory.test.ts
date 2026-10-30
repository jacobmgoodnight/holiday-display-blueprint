import {describe,it,expect} from 'vitest';
import {exampleProjects} from '../fixtures/examples';
import {editPowerFeed} from '../lib/wiringEdits';
import {emptyGraphHistory,graphFingerprint,recordGraphStep,redoGraphStep,undoGraphStep} from '../lib/diagramHistory';
import {validateGraph} from '../lib/graph';

describe('session diagram history is guarded and preserves field evidence safely',()=>{
 it('reverses and reapplies a changed power feed without restoring old field checks',()=>{
  const original=exampleProjects()[0];
  const old=original.edges.find(e=>e.target==='h-light')!;
  const withChecks={...original,status:'verified' as const,nodes:original.nodes.map(n=>({...n,verified:true})),checklist:{
   ['wire:'+old.id]:{done:true},'place:h-light':{done:true},'place:h-o03':{done:true},'place:h-prop':{done:true},'personal-note':{done:true}
  }};
  const changed=editPowerFeed(withChecks,'h-light','h-o03',0);
  const history=recordGraphStep(emptyGraphHistory(),withChecks,changed,'rewire light');
  expect(history.past).toHaveLength(1);
  const undone=undoGraphStep(history,changed);
  expect(undone.project.edges.map(e=>[e.source,e.sourcePort,e.target])).toEqual(withChecks.edges.map(e=>[e.source,e.sourcePort,e.target]));
  expect(undone.project.status).toBe('draft');
  expect(undone.project.nodes.find(n=>n.id==='h-light')?.verified).toBe(false);
  expect(undone.project.checklist['wire:'+old.id]).toBeUndefined();
  expect(undone.project.checklist['place:h-light']).toBeUndefined();
  expect(undone.project.checklist['place:h-prop']).toEqual({done:true});
  expect(undone.project.checklist['personal-note']).toEqual({done:true});
  expect(validateGraph(undone.project.nodes,undone.project.edges)).toEqual([]);
  const redone=redoGraphStep(undone.history,undone.project);
  expect(graphFingerprint(redone.project)).toBe(graphFingerprint(changed));
  expect(redone.project.nodes.find(n=>n.id==='h-light')?.verified).toBe(false);
  expect(redone.project.checklist['wire:'+old.id]).toBeUndefined();
  expect(redone.history.future).toHaveLength(0);
  expect(redone.history.past).toHaveLength(1);
 });
 it('refuses to overwrite a graph changed elsewhere and refuses cross-project replay',()=>{
  const [original,other]=exampleProjects();
  const changed=editPowerFeed(original,'h-light','h-o03',0);
  const history=recordGraphStep(emptyGraphHistory(),original,changed,'rewire');
  expect(()=>undoGraphStep(history,{...changed,nodes:changed.nodes.map(n=>n.id==='h-light'?{...n,name:'Newer change'}:n)})).toThrow(/changed since/);
  expect(()=>undoGraphStep(history,other)).toThrow(/changed since/);
 });
 it('a new change drops the redo branch and a cosmetic rename keeps field checks',()=>{
  const project=exampleProjects()[0];
  const renamed={...project,nodes:project.nodes.map(n=>n.id==='h-light'?{...n,name:'New label'}:n)};
  const history=recordGraphStep(emptyGraphHistory(),project,renamed,'rename');
  const undone=undoGraphStep(history,renamed);
  expect(undone.project.status).toBe(project.status);
  expect(graphFingerprint(undone.project)).toBe(graphFingerprint(project));
  const changed=recordGraphStep(undone.history,undone.project,renamed,'rename again');
  expect(changed.future).toHaveLength(0);
 });
 it('refuses invalid target wiring on history replay',()=>{
  const p=exampleProjects()[0];
  const next={...p,edges:[...p.edges,{id:'duplicate-port',source:p.edges[0].source,sourcePort:p.edges[0].sourcePort,target:'h-o03'}]};
  expect(()=>recordGraphStep(emptyGraphHistory(),p,next,'invalid')).toThrow(/invalid wiring/);
 });
});
