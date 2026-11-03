import {describe,expect,it} from 'vitest';
import {addUnconnectedItem,createBlankDisplay,projectLabel} from '../lib/newDisplay';
import {quickAddConnected} from '../lib/quickAdd';
import {validateGraph} from '../lib/graph';

describe('starting a new display',()=>{
 it('keeps user-entered seasonal words in the project picker',()=>{
  expect(projectLabel({season:'Christmas',year:2027,name:'Christmas Lights'})).toBe('🎄 2027 · Christmas Lights');
  expect(projectLabel({season:'Christmas',year:2027,name:'Christmas'})).toBe('🎄 2027 · Christmas');
  expect(projectLabel({season:'Christmas',year:2027,name:'Christmas 2027 · copied plan'})).toBe('🎄 Christmas 2027 · copied plan');
 });
 it('creates an independent empty draft and requires the actual outlet count',()=>{
  const plan=createBlankDisplay({name:'Example display',season:'Halloween',year:2027});
  expect(plan).toMatchObject({name:'Example display',season:'Halloween',year:2027,status:'draft',nodes:[],edges:[],checklist:{}});
  const options={kind:'outlet' as const,zone:'Backyard' as const,position:{x:0,y:0},name:'Outlet'};
  expect(()=>addUnconnectedItem(plan,options)).toThrow('number of known outputs');
  const {project:withOutlet,node}=addUnconnectedItem(plan,{...options,outletOutputs:1});
  expect(node).toMatchObject({name:'Outlet',zone:'Backyard',outputs:1});
  expect(plan.nodes).toHaveLength(0);
  expect(withOutlet.edges).toEqual([]);
  const connected=quickAddConnected(withOutlet,{sourceId:node.id,port:0,kind:'decoration',name:'Example prop'});
  expect(connected.edges).toHaveLength(1);
  expect(validateGraph(connected.nodes,connected.edges)).toEqual([]);
  expect(()=>quickAddConnected(connected,{sourceId:node.id,port:0,kind:'decoration'})).toThrow('occupied');
 });
 it('allows a decoration to be recorded before its source is known',()=>{
  const plan=createBlankDisplay({name:'Example',season:'Christmas',year:2027});
  const {project,node}=addUnconnectedItem(plan,{kind:'decoration',zone:'Other',position:{x:0,y:0},name:'Unknown feed'});
  expect(project.nodes[0].id).toBe(node.id);
  expect(project.edges).toEqual([]);
  expect(project.checklist).toEqual({});
 });
});
