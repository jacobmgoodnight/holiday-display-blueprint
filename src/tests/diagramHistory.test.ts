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
 it('undoes and redoes a photo marker move without changing the graph',()=>{
  const base=exampleProjects()[0],photo={photo:'image',placements:{'h-light':{x:.1,y:.2}}};
  const before={...base,propertyPhoto:photo};
  const moved={...photo,placements:{'h-light':{x:.8,y:.4}}};
  const after={...before,propertyPhoto:moved};
  const history=recordGraphStep(emptyGraphHistory(),before,after,'move marker',{viewId:'main',before:photo,after:moved});
  const undo=undoGraphStep(history,after);expect(undo.project.propertyPhoto).toEqual(photo);expect(undo.project.edges).toEqual(before.edges);
  expect(redoGraphStep(undo.history,undo.project).project.propertyPhoto).toEqual(moved);
  expect(()=>undoGraphStep(history,{...after,propertyPhoto:{...moved,placements:{}}})).toThrow(/Photo changed/);
 });
 it('undoes an item and its photo route atomically and redoes both',()=>{
  const base=exampleProjects()[0],photo={photo:'image',placements:{}};
  const before={...base,propertyPhoto:photo};
  const node={...base.nodes[0],id:'new-test-item',kind:'decoration' as const,outputs:0,verified:false};
  const nextPhoto={...photo,placements:{[node.id]:{x:.2,y:.3}},routes:{[node.id]:{kind:'lights' as const,points:[{x:.2,y:.3},{x:.6,y:.7}]}}};
  const after={...before,nodes:[...before.nodes,node],propertyPhoto:nextPhoto};
  const history=recordGraphStep(emptyGraphHistory(),before,after,'draw new item',{viewId:'main',before:photo,after:nextPhoto});
  const undo=undoGraphStep(history,after);expect(undo.project.nodes.some(n=>n.id===node.id)).toBe(false);expect(undo.project.propertyPhoto).toEqual(photo);
  const redo=redoGraphStep(undo.history,undo.project);expect(redo.project.nodes.some(n=>n.id===node.id)).toBe(true);expect(redo.project.propertyPhoto).toEqual(nextPhoto);
 });
 it('keeps photo history isolated to its selected view and refuses replaced photos',()=>{
  const base=exampleProjects()[0],photo={photo:'side-image',placements:{}},changed={...photo,placements:{'h-light':{x:.5,y:.5}}};
  const before={...base,propertyPhotoViews:[{id:'side',name:'Side',layout:photo}]};
  const after={...before,propertyPhotoViews:[{id:'side',name:'Side',layout:changed}]};
  const history=recordGraphStep(emptyGraphHistory(),before,after,'side edit',{viewId:'side',before:photo,after:changed});
  const undo=undoGraphStep(history,after);expect(undo.project.propertyPhotoViews?.[0].layout).toEqual(photo);expect(undo.project.propertyPhoto).toEqual(base.propertyPhoto);
  expect(()=>undoGraphStep(history,{...after,propertyPhotoViews:[{id:'side',name:'Side',layout:{...changed,photo:'new'}}]})).toThrow(/Photo changed/);
 });
});
