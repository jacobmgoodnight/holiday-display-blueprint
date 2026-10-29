import {describe,it,expect} from 'vitest';
import {exampleProjects} from '../fixtures/examples';
import {connect,reconnect,downstream,upstream,validateGraph,generatedTasks} from '../lib/graph';
describe('typed wiring graph',()=>{
 const sample=exampleProjects()[0];
 it('accepts the example fixture',()=>expect(validateGraph(sample.nodes,sample.edges)).toEqual([]));
 it('traces upstream and outage downstream',()=>{expect(upstream('h-prop',sample.edges)).toContain('h-o01');expect(downstream('h-split',sample.edges)).toEqual(new Set(['h-prop','h-light']));});
 it('prevents cycles',()=>{expect(validateGraph(sample.nodes,[...sample.edges,{id:'bad',source:'h-prop',sourcePort:0,target:'h-o01'}]).length).toBeGreaterThan(0);});
 it('prevents duplicate incoming power',()=>expect(()=>connect(sample.nodes,sample.edges,'h-o02','h-prop')).toThrow());
 it('supports moving a component feed without altering its position',()=>{const next=reconnect(sample.nodes,sample.edges,'h-o02','h-prop');expect(next.find(e=>e.target==='h-prop')?.source).toBe('h-o02');expect(next).toHaveLength(sample.edges.length);});
 it('rejects incompatible explicit plug genders',()=>{const nodes=sample.nodes.map(n=>n.id==='h-prop'?{...n,inputGender:'female' as const}:n);expect(validateGraph(nodes,sample.edges).some(e=>e.code==='connector-gender')).toBe(true);});
 it('prevents more than one connection per output port',()=>expect(()=>connect(sample.nodes,sample.edges,'h-split','h-o03',0)).toThrow());
 it('prevents disconnected decoration as source',()=>expect(()=>connect(sample.nodes,sample.edges,'h-prop','h-light')).toThrow());
 it('generates connection steps with upstream energization last',()=>{const tasks=generatedTasks(sample,'setup');const links=tasks.filter(t=>t.id.startsWith('wire'));expect(links.at(-1)?.label).toContain('O01');});
 it('preserves O03 female strand topology',()=>{const c=exampleProjects()[1];expect(c.edges.find(e=>e.target==='c-morning')?.source).toBe('c-c9');});
});
