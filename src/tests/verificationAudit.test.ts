import {describe,it,expect} from 'vitest';
import {exampleProjects} from '../fixtures/examples';
import {auditCounts,getVerificationIssues} from '../lib/verificationAudit';
describe('field verification audit',()=>{
 const halloween=exampleProjects()[0];
 it('flags missing power feeds in an unconnected accessory',()=>{
  const found=getVerificationIssues(halloween);
  expect(found.some(i=>i.nodeId==='h-light'&&i.kind==='feed')).toBe(false);
  expect(found.some(i=>i.nodeId==='h-o03'&&i.kind==='feed')).toBe(false);
  const orphan={...halloween,edges:halloween.edges.filter(e=>e.target!=='h-light')};
  expect(getVerificationIssues(orphan).some(i=>i.nodeId==='h-light'&&i.severity==='critical'&&i.kind==='feed')).toBe(true);
 });
 it('uses the entire wiring graph when filtering to an outlet',()=>{
  const only=new Set(['h-split','h-light']);
  const issues=getVerificationIssues(halloween,only);
  expect(issues.some(i=>i.kind==='feed')).toBe(false);
  expect(issues.every(i=>['h-light','h-split',''].includes(i.nodeId))).toBe(true);
 });
 it('detects disconnected source trees even with a parent edge',()=>{
  const p={...halloween,edges:halloween.edges.filter(e=>e.target!=='h-kasa')};
  expect(getVerificationIssues(p).some(i=>i.nodeId==='h-light'&&i.kind==='feed')).toBe(true);
 });
 it('distinguishes must-review issues from optional photos',()=>{
  const issues=getVerificationIssues(halloween);
  const count=auditCounts(issues);
  expect(count.attention).toBeGreaterThan(0);
  expect(count.optional).toBeGreaterThan(0);
  expect(count.critical).toBe(0);
 });
 it('ignores missing cord lengths on non-cords but flags an unknown actual feeder',()=>{
  const issues=getVerificationIssues(halloween);
  expect(issues.some(i=>i.nodeId==='h-prop'&&i.kind==='cord')).toBe(false);
  const p={...halloween,nodes:halloween.nodes.map(n=>n.id==='h-cord'?{...n,lengthFt:undefined}:n)};
  expect(getVerificationIssues(p).some(i=>i.nodeId==='h-cord'&&i.kind==='cord')).toBe(true);
 });
 it('resolves field-check reminder when marked verified without hiding other gaps',()=>{
  const p={...halloween,nodes:halloween.nodes.map(n=>n.id==='h-prop'?{...n,verified:true}:n)};
  const found=getVerificationIssues(p).filter(i=>i.nodeId==='h-prop');
  expect(found.some(i=>i.kind==='verification')).toBe(false);
  expect(found.some(i=>i.kind==='photo')).toBe(true);
 });
});
