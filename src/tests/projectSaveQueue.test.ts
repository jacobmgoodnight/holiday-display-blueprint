import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {exampleProjects} from '../fixtures/examples';
import {ProjectSaveQueue} from '../lib/projectSaveQueue';
import type {Project} from '../lib/model';
describe('serialized, per-project saving',()=>{
 beforeEach(()=>vi.useFakeTimers());
 afterEach(()=>vi.useRealTimers());
 it('persists different projects even when switching before a debounce',async()=>{
  const writes:Project[]=[];const q=new ProjectSaveQueue(async p=>{writes.push(p);},450);
  const [h,c]=exampleProjects();
  q.queue({...h,name:'Halloween updated'});
  q.queue({...c,name:'Christmas updated'});
  await vi.runAllTimersAsync();await q.flushAll();
  expect(writes.map(x=>x.name)).toEqual(['Halloween updated','Christmas updated']);
  expect(q.getState(h.id).phase).toBe('saved');
 });
 it('coalesces rapid notes into the newest snapshot',async()=>{
  const writes:Project[]=[];const q=new ProjectSaveQueue(async p=>{writes.push(p);},450);
  const [p]=exampleProjects();
  q.queue({...p,name:'one'});q.queue({...p,name:'two'});q.queue({...p,name:'three'});
  await vi.advanceTimersByTimeAsync(450);
  expect(writes.map(x=>x.name)).toEqual(['three']);
 });
 it('serializes an old slow write before a newer write on the same project',async()=>{
  let unblock:()=>void=()=>{};
  const delayed=new Promise<void>(r=>{unblock=r;});
  const recorded:string[]=[];let count=0;
  const q=new ProjectSaveQueue(async p=>{count++;if(count===1)await delayed;recorded.push(p.name);},20);
  const [p]=exampleProjects();
  q.queue({...p,name:'old'});
  const wait=q.flush(p.id);
  q.queue({...p,name:'new'});
  unblock();await wait;await q.flush(p.id);
  expect(recorded).toEqual(['old','new']);
 });
 it('retains failed snapshots for retry instead of reporting saved',async()=>{
  let runs=0;const [p]=exampleProjects();
  const q=new ProjectSaveQueue(async()=>{if(++runs===1)throw Error('quota error');},30);
  q.queue(p);await q.flush(p.id);
  expect(q.getState(p.id)).toEqual({phase:'failed',message:'quota error'});
  expect(q.hasPending(p.id)).toBe(true);
  await vi.advanceTimersByTimeAsync(2000);
  expect(q.getState(p.id).phase).toBe('saved');
 });
 it('discard waits for an old write and prevents a queued deleted project from resurrecting',async()=>{
  const [p]=exampleProjects();
  let unblock:()=>void=()=>{};
  const first=new Promise<void>(r=>{unblock=r;});
  const output:string[]=[];let count=0;
  const q=new ProjectSaveQueue(async x=>{if(count++===0)await first;output.push(x.name);},15);
  q.queue({...p,name:'old'});
  const flushing=q.flush(p.id);
  q.queue({...p,name:'should never save'});
  const discarding=q.discard(p.id);
  unblock();await flushing;await discarding;
  expect(output).toEqual(['old']);
  expect(q.hasPending(p.id)).toBe(false);
 });
});
