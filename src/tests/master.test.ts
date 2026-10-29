import {describe,it,expect} from 'vitest';
import {detectMaster,buildMasterDraft} from '../lib/master';
import {validateGraph,sourcePath} from '../lib/graph';
import type {WorkbookPreview} from '../lib/excel';
const make=(name:string,rows:string[][]):WorkbookPreview=>({name,rows,imageWarning:'Photos excluded'});
const halloween=[make('2026 Connections',[
 ['HALLOWEEN 2026'],['ID','Upstream ID','Upstream port','Device / connection','Type','Cord ft est.','Location','Switch / timer','Status','Field notes'],
 ['O01','—','Wall outlet','Outdoor outlet','Outlet','','Porch','','Confirmed',''],
 ['K01','O01','Wall plug','Kasa smart plug','Controller','','Porch','','Confirmed',''],
 ['C01','K01','Kasa left port','Multi-outlet extension cord','Cord','12','Porch','','Confirmed',''],
 ['L01','C01','Intermediate outlet','Spotlight 1','Light','','Porch','','Confirmed',''],
 ['L02','C01','Final outlet','Spotlight 2','Light','','Porch','','Confirmed',''],
 ['AV01','L02','audio','Signal cable','Audio signal cable (not AC)','','Porch','','Confirmed',''],
 ['D01','TBD','TBD','Planned prop','Planned decoration','','Porch','','Planned','']
]),make('2026 Cord Tags',[['Cord ID','Source','Connection','Color','Length ft','Purpose','Gauge','Rating','Storage bin','Status','Notes'],['C01','','','Green','12','','','','Bin C','','']])];
const christmas=[make('Cords & Connections',[['CHRISTMAS 2026'],['Power zone','From','To / load','Cord, connector, or tap','Evidence','Verify during setup'],['O03','Back porch','Roof C9s','Green SPT-1','Described','Inspect connections']])];
describe('source-aware master workbook import',()=>{
 it('identifies both seasonal formats',()=>{expect(detectMaster(halloween)).toBe('Halloween');expect(detectMaster(christmas)).toBe('Christmas');});
 it('preserves Halloween source links and excludes non-power records',()=>{
  const x=buildMasterDraft(halloween,'Halloween_2026_Master.xlsx');
  expect(x.project.status).toBe('draft');expect(x.project.nodes.length).toBe(6);expect(x.project.edges.length).toBe(4);
  expect(x.excluded.join(' ')).toContain('AV01');expect(x.issues.join(' ')).toContain('D01');
  expect(x.project.nodes.find(n=>n.id==='C01')?.lengthFt).toBe(12);
  expect(x.project.nodes.find(n=>n.id==='C01')?.color).toBe('Green');
  expect(sourcePath('L02',x.project).map(n=>n.id)).toEqual(['O01','K01','C01','L02']);
  expect(validateGraph(x.project.nodes,x.project.edges)).toEqual([]);
 });
 it('does not invent AC connections from Christmas prose',()=>{
  const x=buildMasterDraft(christmas,'Christmas_2026_Master.xlsx');
  expect(x.project.nodes.length).toBe(4);expect(x.project.edges).toHaveLength(0);
  expect(x.project.nodes.find(n=>n.id==='review-3')?.notes).toContain('Roof C9s');
  expect(validateGraph(x.project.nodes,x.project.edges)).toEqual([]);
 });
});
