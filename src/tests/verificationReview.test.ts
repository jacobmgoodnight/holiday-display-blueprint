import {describe,it,expect} from 'vitest';
import {exampleProjects} from '../fixtures/examples';
import {reviewInstalledProject} from '../lib/verificationReview';
describe('field verification provenance',()=>{
 it('requires a real review note when known findings remain',()=>{
  const p=exampleProjects()[0];
  expect(()=>reviewInstalledProject(p,'yes')).toThrow(/specific review note/);
  const reviewed=reviewInstalledProject(p,'Checked setup against the installed items. Needs follow-up.');
  expect(reviewed.status).toBe('verified');
  expect(reviewed.verificationReview?.reviewedAt).toBeTruthy();
  expect(reviewed.verificationReview?.notes).toContain('Checked setup');
  expect(reviewed.verificationReview?.exceptions.length).toBeGreaterThan(0);
  expect(p.verificationReview).toBeUndefined();
 });
 it('refuses malformed and sourceless graphs regardless of review note',()=>{
  const p=exampleProjects()[0];
  const malformed={...p,edges:[...p.edges,{id:'illegal',source:'h-prop',target:'h-o01',sourcePort:0}]};
  expect(()=>reviewInstalledProject(malformed,'I looked at the diagram in the yard.')).toThrow(/malformed/);
  const outletless={...p,nodes:p.nodes.filter(n=>n.kind!=='outlet'),edges:[]};
  expect(()=>reviewInstalledProject(outletless,'I looked at every connection and confirmed the parts.')).toThrow(/no documented outlet/);
 });
});
