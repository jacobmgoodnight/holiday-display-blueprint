import {describe,expect,it} from 'vitest';
import {exampleProjects} from '../fixtures/examples';
import {quickAddConnected} from '../lib/quickAdd';
import {validateGraph} from '../lib/graph';
import {defaultVisualIcon,getVisualIcon,suggestedIcons} from '../lib/visualIcons';
describe('Quick Add at a physical output',()=>{
 const original=exampleProjects()[0];
 it('adds a decoration to explicitly chosen empty port without changing other links',()=>{
  const source=original.nodes.find(n=>n.id==='h-split')!;
  const taken=new Set(original.edges.filter(e=>e.source===source.id).map(e=>e.sourcePort));
  const port=Array.from({length:source.outputs},(_,i)=>i).find(i=>!taken.has(i));
  if(port===undefined)throw Error('fixture has no free splitter port');
  const next=quickAddConnected(original,{sourceId:source.id,port,kind:'decoration',name:'New pumpkin',visualIcon:'pumpkin'});
  expect(next.nodes.length).toBe(original.nodes.length+1);
  expect(next.edges.length).toBe(original.edges.length+1);
  expect(next.edges.slice(0,-1)).toEqual(original.edges);
  expect(next.nodes.at(-1)?.visualIcon).toBe('pumpkin');
  expect(next.nodes.at(-1)?.verified).toBe(false);
  expect(next.status).toBe('draft');
  expect(validateGraph(next.nodes,next.edges)).toEqual([]);
  expect(original.nodes.some(n=>n.name==='New pumpkin')).toBe(false);
 });
 it('rejects occupied, invalid or outlet-to-outlet connections atomically',()=>{
  const occupied=original.edges[0];
  expect(()=>quickAddConnected(original,{sourceId:occupied.source,port:occupied.sourcePort,kind:'cord'})).toThrow(/occupied/);
  expect(()=>quickAddConnected(original,{sourceId:occupied.source,port:999,kind:'cord'})).toThrow(/real output/);
  expect(()=>quickAddConnected(original,{sourceId:occupied.source,port:1,kind:'outlet'})).toThrow();
 });
 it('suggests seasonal icons without changing electrical kinds',()=>{
  expect(getVisualIcon('skelly')?.emoji).toBe('💀');
  expect(getVisualIcon('roof-c9')?.label).toContain('Roofline');
  expect(defaultVisualIcon('Christmas','light-strand')).toBeUndefined();
  expect(suggestedIcons('Christmas','light-strand').some(i=>i.id==='roof-c9')).toBe(true);
  expect(suggestedIcons('Halloween','decoration')[0].group).toBe('Halloween');
 });
});
