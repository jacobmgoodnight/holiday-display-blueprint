import 'fake-indexeddb/auto';
import {describe,it,expect,afterEach} from 'vitest';
import Dexie from 'dexie';
import {BlueprintDB,createBackup,parseBackup} from '../lib/storage';
import {exampleProjects} from '../fixtures/examples';
import {createRestorePoint,compareRestorePoint,listRestorePoints,restoreAsDraft} from '../lib/projectHistory';
let db:BlueprintDB;
afterEach(async()=>{if(db){const name=db.name;db.close();await Dexie.delete(name);}});
describe('manual private restore points',()=>{
 it('stores the full original project, including photos, separately from current data',async()=>{
  db=new BlueprintDB('history-'+crypto.randomUUID());
  const p=exampleProjects()[0];
  const original={...p,nodes:p.nodes.map(n=>({...n,photo:'data:image/png;base64,AAAA'}))};
  const save=await createRestorePoint(original,'Before rewiring',db);
  expect(save.bytes).toBeGreaterThan(100);
  expect((await listRestorePoints(original.id,db))[0].label).toBe('Before rewiring');
  expect((await db.versions.get(save.id))?.snapshot.nodes[0].photo).toContain('base64');
  expect(parseBackup(createBackup([save.snapshot]))[0].nodes).toEqual(original.nodes);
 });
 it('restores a previous wiring graph only as a fresh Draft, never historic verified checklist',async()=>{
  db=new BlueprintDB('history-'+crypto.randomUUID());
  const p=exampleProjects()[0];
  const checked={...p,status:'verified' as const,checklist:{'wire:test':{done:true}},nodes:p.nodes.map(n=>({...n,verified:true}))};
  const rev=await createRestorePoint(checked,'Verified reference',db);
  const changed={...p,name:'Changed project',edges:p.edges.slice(1)};
  const restored=restoreAsDraft(changed,rev);
  expect(restored.status).toBe('draft');
  expect(restored.checklist).toEqual({});
  expect(restored.nodes.every(n=>n.verified===false)).toBe(true);
  expect(restored.edges).toEqual(checked.edges);
  expect(restored.verificationReview).toBeUndefined();
  expect(compareRestorePoint(changed,rev.snapshot).linksRemoved).toBe(1);
 });
 it('never applies a restore point to another seasonal project',async()=>{
  db=new BlueprintDB('history-'+crypto.randomUUID());
  const [h,c]=exampleProjects();
  const v=await createRestorePoint(h,'Checkpoint',db);
  expect(()=>restoreAsDraft(c,v)).toThrow(/different/);
 });
});
