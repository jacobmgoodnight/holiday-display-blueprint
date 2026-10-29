import {describe,it,expect} from 'vitest';
import {workspaceCanEdit,freeOutputPorts,searchComponents} from '../lib/canvasWorkspace';
import {exampleProjects} from '../fixtures/examples';
describe('Fullscreen Explore and Builder invariants',()=>{
 const project=exampleProjects()[0];
 it('always disables destructive interactions in full-screen Explore',()=>{
  expect(workspaceCanEdit(true,'explore')).toBe(false);
  expect(workspaceCanEdit(true,'builder')).toBe(true);
  expect(workspaceCanEdit(false,'explore')).toBe(true);
 });
 it('finds free outputs without assuming occupied sockets are available',()=>{
  const first=project.nodes.find(n=>n.id==='h-split')!;
  const taken=new Set(project.edges.filter(e=>e.source===first.id).map(e=>e.sourcePort));
  const available=freeOutputPorts(project,first.id);
  expect(available.every(port=>!taken.has(port))).toBe(true);
  expect(available.length+taken.size).toBe(first.outputs);
  expect(freeOutputPorts(project,'missing')).toEqual([]);
 });
 it('can reuse the target’s existing output during reconnection',()=>{
  const edge=project.edges.find(e=>e.target==='h-light')!;
  expect(freeOutputPorts(project,edge.source,edge.target)).toContain(edge.sourcePort);
 });
 it('searches names and IDs across the whole project, independent of circuit focus',()=>{
  const found=searchComponents(project,'h-o03');
  expect(found.map(x=>x.id)).toContain('h-o03');
  expect(searchComponents(project,'h')).toEqual([]);
 });
});
