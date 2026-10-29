import {describe,it,expect} from 'vitest';
import {exampleProjects} from '../fixtures/examples';
import {hasOnlyExamples} from '../lib/deviceTransfer';
import {createBackup,parseBackup} from '../lib/storage';
describe('phone transfer and private backup',()=>{
 it('recognizes a fresh example-only browser',()=>{
   const examples=exampleProjects();
   expect(hasOnlyExamples(examples)).toBe(true);
   expect(hasOnlyExamples([])).toBe(false);
   expect(hasOnlyExamples([...examples,{...examples[0],id:'master',name:'Halloween 2026 Master',example:false}])).toBe(false);
 });
 it('keeps attached component and checklist photos when exporting/importing JSON',()=>{
   const projects=exampleProjects();
   const photo='data:image/png;base64,dGVzdA==';
   projects[0].nodes[0].photo=photo;
   projects[0].checklist['place:h-kasa']={done:true,notes:'Test in yard',photo};
   const backup=JSON.parse(JSON.stringify(createBackup(projects)));
   const parsed=parseBackup(backup);
   expect(parsed[0].nodes[0].photo).toBe(photo);
   expect(parsed[0].checklist['place:h-kasa']).toEqual({done:true,notes:'Test in yard',photo});
 });
});
