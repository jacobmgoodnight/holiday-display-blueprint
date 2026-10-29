import {describe,it,expect} from 'vitest';
import {exampleProjects} from '../fixtures/examples';
import {buildWiringForest,wireDescription,wiringSequence} from '../lib/wiringGuide';
describe('simplified read-only installation guide',()=>{
 const p=exampleProjects()[0],all=new Set(p.nodes.map(n=>n.id));
 it('preserves source-port sequence of splitter branches',()=>{
  const forest=buildWiringForest(p,all);
  const outlet=forest.roots.find(r=>r.component.id==='h-o01')!;
  const splitter=outlet.children[0].children[0].children[0];
  expect(splitter.component.id).toBe('h-split');
  expect(splitter.children.map(n=>n.component.id)).toEqual(['h-prop','h-light']);
  expect(splitter.descendants).toBe(2);
 });
 it('focuses an outlet without dragging unrelated branches',()=>{
  const roots=buildWiringForest(p,new Set(['h-o01','h-kasa','h-cord','h-split','h-prop','h-light','h-o03'])).roots;
  expect(roots.map(r=>r.component.id)).toEqual(['h-o01','h-o03']);
 });
 it('flags disconnected equipment rather than inventing power feeds',()=>{
  const forest=buildWiringForest(p,new Set(['h-prop']));
  expect(forest.unconnected).toBe(1);
  expect(forest.roots[0].via).toBeUndefined();
 });
 it('shows recorded cord lengths and distinguishes missing data',()=>{
  const cord=p.nodes.find(n=>n.id==='h-cord')!;
  expect(wireDescription(cord)).toContain('10 ft');
  expect(wireDescription({...cord,lengthFt:undefined},true)).toContain('Length not recorded');
  expect(wireDescription(p.nodes.find(n=>n.id==='h-prop')!)).toBeUndefined();
 });
 it('numbers the same downstream-first installation tasks',()=>{
  const steps=wiringSequence(p,all);
  expect(steps.map(x=>x.number)).toEqual(steps.map((_,i)=>i+1));
  expect(steps.filter(x=>x.id.startsWith('wire:')).at(-1)?.label).toContain('O01');
 });
 it('preserves the entire imported graph unchanged',()=>{
  const before=JSON.stringify(p);buildWiringForest(p,all);wiringSequence(p,all);expect(JSON.stringify(p)).toBe(before);
 });
 it('can render malformed cycles without recurring forever',()=>{
  const cp=exampleProjects()[1];const edges=[...cp.edges,{id:'cycle',source:'c-roof',target:'c-cord',sourcePort:0}];
  expect(buildWiringForest({...cp,edges},new Set(cp.nodes.map(n=>n.id))).roots.length).toBeGreaterThan(0);
 });
});
