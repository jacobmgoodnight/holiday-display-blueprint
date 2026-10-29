import {describe,it,expect} from 'vitest';
import {exampleProjects} from '../fixtures/examples';
import {planMerge} from '../lib/cloudSync';
import type {Project} from '../lib/model';

const master=(id:string,notes:string):Project=>({...exampleProjects()[0],id,name:id,example:false,nodes:exampleProjects()[0].nodes.map(n=>({...n,notes}))});
const baseline='a'.repeat(64),changed='b'.repeat(64),later='c'.repeat(64);
describe('privacy-preserving cross-device merge',()=>{
 it('downloads remote-only masters to an example-only device',()=>{
  const r=master('h-master','from cloud');
  const result=planMerge(exampleProjects(),[r],{},{},{'h-master':changed});
  expect(result.conflicts).toEqual([]);
  expect(result.projects.map(p=>p.id)).toEqual(['h-master']);
  expect(result.download).toBe(true);
  expect(result.upload).toBe(false);
 });
 it('uploads a local edit when the remote equals the previous baseline',()=>{
  const l=master('h-master','updated on phone'),r=master('h-master','old');
  const result=planMerge([l],[r],{'h-master':baseline},{'h-master':changed},{'h-master':baseline});
  expect(result.conflicts).toEqual([]);
  expect(result.projects[0].nodes[0].notes).toBe('updated on phone');
  expect(result.upload).toBe(true);
 });
 it('pulls a desktop edit when phone remains at baseline',()=>{
  const l=master('h-master','old'),r=master('h-master','updated on desktop');
  const result=planMerge([l],[r],{'h-master':baseline},{'h-master':baseline},{'h-master':changed});
  expect(result.projects[0].nodes[0].notes).toBe('updated on desktop');
  expect(result.download).toBe(true);
 });
 it('never silently chooses between two independently edited records',()=>{
  const l=master('h-master','phone edit'),r=master('h-master','desktop edit');
  const result=planMerge([l],[r],{'h-master':baseline},{'h-master':changed},{'h-master':later});
  expect(result.conflicts).toEqual(['h-master']);
  expect(result.upload).toBe(false);
  expect(result.download).toBe(false);
 });
 it('allows an explicit conflict decision without affecting other projects',()=>{
  const l=master('h-master','phone edit'),r=master('h-master','desktop edit');
  const local=planMerge([l],[r],{'h-master':baseline},{'h-master':changed},{'h-master':later},'local');
  const remote=planMerge([l],[r],{'h-master':baseline},{'h-master':changed},{'h-master':later},'remote');
  expect(local.projects[0].nodes[0].notes).toBe('phone edit');
  expect(remote.projects[0].nodes[0].notes).toBe('desktop edit');
 });
 it('preserves unrelated project changes from both devices',()=>{
  const l=master('local-only','new local'),r=master('remote-only','new cloud');
  const result=planMerge([l],[r],{}, {'local-only':changed},{'remote-only':later});
  expect(result.projects.map(p=>p.id)).toEqual(['local-only','remote-only']);
  expect(result.upload).toBe(true);
  expect(result.download).toBe(true);
 });
});
