import 'fake-indexeddb/auto';
import {describe,it,expect,afterEach} from 'vitest';
import {BlueprintDB,createBackup,parseBackup,restoreBackup,initialize,saveProject} from '../lib/storage';
import {exampleProjects} from '../fixtures/examples';
let sequence=0;let db:BlueprintDB;
afterEach(async()=>{if(db){db.close();await DexieCleanup();}});
async function DexieCleanup(){await (await import('dexie')).default.delete(db.name);}
describe('persistence and backup',()=>{
 it('initializes sample projects and persists edits',async()=>{db=new BlueprintDB(`test-${++sequence}`);const seed=await initialize(db);seed[0].nodes[0].notes='Edited locally';await saveProject(seed[0],db);expect((await db.projects.get(seed[0].id))?.nodes[0].notes).toBe('Edited locally');});
 it('round trips a JSON backup',async()=>{db=new BlueprintDB(`test-${++sequence}`);const seed=exampleProjects();const json=JSON.parse(JSON.stringify(createBackup(seed)));expect(parseBackup(json)).toHaveLength(2);await restoreBackup(json,db);expect(await db.projects.count()).toBe(2);});
 it('rejects invalid backup atomically',async()=>{db=new BlueprintDB(`test-${++sequence}`);const seed=exampleProjects();const backup=createBackup(seed);backup.projects[1].edges.push({id:'wrong',source:'absent',sourcePort:0,target:'c-o01'});await expect(restoreBackup(backup,db)).rejects.toThrow();expect(await db.projects.count()).toBe(0);});
});
