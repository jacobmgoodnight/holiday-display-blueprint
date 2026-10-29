import {describe,it,expect} from 'vitest';
import * as XLSX from 'xlsx';
import {exampleProjects} from '../fixtures/examples';
import {createWiringReferenceWorkbook} from '../lib/wiringExport';
import {editPowerFeed} from '../lib/wiringEdits';

describe('Excel wiring reference export',()=>{
 const project=exampleProjects()[0];
 it('provides a clear non-round-trip source-of-truth warning and useful sheets',()=>{
  const wb=createWiringReferenceWorkbook(project);
  expect(wb.SheetNames).toEqual(['Read Me','Components','Power Links','Setup Steps','Teardown Steps','Review Items','Wiring Changes']);
  const readme=XLSX.utils.sheet_to_json(wb.Sheets['Read Me'],{header:1}) as string[][];
  expect(readme.flat().join(' ')).toContain('NOT an import/merge template');
  expect(readme.flat().join(' ')).toContain('not electrical certification');
 });
 it('preserves link IDs, output port numbers and names',()=>{
  const wb=createWiringReferenceWorkbook(project);
  const links=XLSX.utils.sheet_to_json(wb.Sheets['Power Links'],{header:1}) as (string|number)[][];
  expect(links.length).toBe(project.edges.length+1);
  const example=links.find(row=>row[0]==='he4');
  expect(example?.[1]).toBe('h-split');
  expect(example?.[3]).toBe(1);
  expect(example?.[4]).toBe('h-prop');
 });
 it('contains documented rewiring history, excluding image blobs',()=>{
  const changed=editPowerFeed(project,'h-light','h-o03',0);
  const wb=createWiringReferenceWorkbook(changed);
  const log=XLSX.utils.sheet_to_json(wb.Sheets['Wiring Changes'],{header:1}) as string[][];
  expect(log.length).toBe(2);
  const names=wb.SheetNames.join(' ');
  expect(names).not.toContain('Photos');
  const data=XLSX.write(wb,{type:'array',bookType:'xlsx'});
  expect(data.byteLength).toBeGreaterThan(500);
 });
});
