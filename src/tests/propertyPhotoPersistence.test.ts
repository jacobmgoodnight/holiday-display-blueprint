import 'fake-indexeddb/auto';
import {describe,expect,it} from 'vitest';
import {exampleProjects} from '../fixtures/examples';
import {createBackup,parseBackup} from '../lib/storage';
import {emptyGraphHistory,recordGraphStep,undoGraphStep} from '../lib/diagramHistory';
import {planMerge} from '../lib/cloudSync';

describe('property photo persistence and recovery',()=>{
 it('round trips a layout and leaves diagram coordinates and task keys unchanged',()=>{
  const base=exampleProjects()[0],id=base.nodes[0].id;
  const project={...base,example:false,propertyPhoto:{photo:'data:image/jpeg;base64,AA',placements:{[id]:{x:.2,y:.7}}},checklist:{...base.checklist,'legacy':{done:true}}};
  const restored=parseBackup(JSON.parse(JSON.stringify(createBackup([project]))))[0];
  expect(restored.propertyPhoto).toEqual(project.propertyPhoto);
  expect(restored.nodes).toEqual(project.nodes);expect(restored.edges).toEqual(project.edges);expect(restored.checklist).toEqual(project.checklist);
  expect(()=>parseBackup({...createBackup([project]),projects:[{...project,propertyPhoto:{photo:'x',placements:{[id]:{x:2,y:0}}}}]})).toThrow('Malformed property photo');
 });
 it('preserves a later photo edit through graph undo and flags concurrent sync edits',()=>{
  const base={...exampleProjects()[0],example:false};
  const changed={...base,nodes:base.nodes.map((n,i)=>i===0?{...n,name:'Renamed'}:n)};
  const history=recordGraphStep(emptyGraphHistory(),base,changed,'rename');
  const layout={photo:'data:image/jpeg;base64,AA',placements:{[base.nodes[0].id]:{x:.4,y:.5}}};
  expect(undoGraphStep(history,{...changed,propertyPhoto:layout}).project.propertyPhoto).toEqual(layout);
  const local={...base,propertyPhoto:layout},remote={...base,nodes:base.nodes.map((n,i)=>i? n:{...n,notes:'Other device'})};
  expect(planMerge([local],[remote],{[base.id]:'a'},{[base.id]:'b'},{[base.id]:'c'}).conflicts).toEqual([base.id]);
 });
});
