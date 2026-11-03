import {describe,expect,it} from 'vitest';
import {addGuidedEquipment,connectGuidedEquipment} from '../lib/guidedEquipment';
import {createBlankDisplay} from '../lib/newDisplay';
import {validateGraph} from '../lib/graph';
import {createWiringReferenceWorkbook} from '../lib/wiringExport';
import {getVerificationIssues} from '../lib/verificationAudit';
import * as XLSX from 'xlsx';

describe('guided item additions',()=>{
 it('preserves explicit physical outputs and never creates a feed unless selected',()=>{
  const blank=createBlankDisplay({name:'Synthetic',season:'Halloween',year:2027});
  expect(()=>addGuidedEquipment(blank,{kind:'cord',name:'Cord',zone:'Other'})).toThrow('known outputs');
  const source=addGuidedEquipment(blank,{kind:'outlet',name:'Source',zone:'Front porch',outputs:1});
  const cord=addGuidedEquipment(source.project,{kind:'cord',name:'Cable',zone:'Backyard',outputs:1,color:'Black',lengthFt:25,sourceId:source.nodeId,port:0});
  expect(cord.project.nodes.find(n=>n.id===cord.nodeId)).toMatchObject({name:'Cable',zone:'Backyard',outputs:1,color:'Black',lengthFt:25});
  expect(cord.project.nodes.find(n=>n.id===cord.nodeId)?.inputGender).toBeUndefined();
  expect(source.project.nodes.find(n=>n.id===source.nodeId)?.outputGender).toBeUndefined();
  expect(cord.project.edges).toHaveLength(1);
  expect(validateGraph(cord.project.nodes,cord.project.edges)).toEqual([]);
  expect(()=>addGuidedEquipment(cord.project,{kind:'decoration',name:'Prop',zone:'Other',sourceId:source.nodeId,port:0})).toThrow('occupied');
  const prop=addGuidedEquipment(cord.project,{kind:'decoration',name:'Prop',zone:'Other'});
  expect(prop.project.edges).toEqual(cord.project.edges);
  expect(blank.nodes).toEqual([]);
 });
 it('retains existing photo, task and equipment records',()=>{
  const p={...createBlankDisplay({name:'Synthetic',season:'Christmas',year:2027}),propertyPhoto:{photo:'data:image/jpeg;base64,AA',placements:{}},checklist:{'legacy':{done:true,notes:'keep'}}};
  const added=addGuidedEquipment(p,{kind:'light-strand',name:'Lights',zone:'Other',outputs:0});
  expect(added.project.propertyPhoto).toEqual(p.propertyPhoto);
  expect(added.project.checklist).toEqual(p.checklist);
  expect(added.project.nodes[0].outputs).toBe(0);
 });
 it('records unknown outputs distinctly and prevents inferred connections',()=>{
  const p=createBlankDisplay({name:'Synthetic',season:'Christmas',year:2027});
  const source=addGuidedEquipment(p,{kind:'outlet',name:'Source',zone:'Other',outputs:0,outputsUnknown:true});
  const node=source.project.nodes[0];
  expect(node).toMatchObject({outputs:0,outputsUnknown:true});
  expect(getVerificationIssues(source.project).some(i=>i.summary==='Number of outputs unknown')).toBe(true);
  expect(()=>addGuidedEquipment(source.project,{kind:'decoration',name:'Prop',zone:'Other',sourceId:source.nodeId,port:0})).toThrow();
  const rows=XLSX.utils.sheet_to_json(createWiringReferenceWorkbook(source.project).Sheets['Components'],{header:1}) as (string|number)[][];
  expect(rows[1][5]).toBe('Unknown');
 });
 it('connects an existing unconnected item without overwriting an existing feed',()=>{
  const p=createBlankDisplay({name:'Synthetic',season:'Halloween',year:2027});
  const outlet=addGuidedEquipment(p,{kind:'outlet',name:'Source',zone:'Other',outputs:1});
  const prop=addGuidedEquipment(outlet.project,{kind:'decoration',name:'Prop',zone:'Other'});
  const connected=connectGuidedEquipment(prop.project,prop.nodeId,outlet.nodeId,0);
  expect(connected.edges).toHaveLength(1);
  expect(connected.nodes.find(n=>n.id===prop.nodeId)?.verified).toBe(false);
  expect(()=>connectGuidedEquipment(connected,prop.nodeId,outlet.nodeId,0)).toThrow('already has a recorded connection');
 });
});
