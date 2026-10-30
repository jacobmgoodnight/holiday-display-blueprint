import {describe,it,expect} from 'vitest';
import {addStock,addPlacement,availableStock,createSharedLightingRecord,importLegacyLighting,isSharedLightingRecord,repeatLastYearAssignments,SHARED_LIGHTING_ID,stockCsv,totals,updatePlacement,updateStock} from '../lib/sharedLighting';
import {exampleProjects} from '../fixtures/examples';
import {createBackup,parseBackup} from '../lib/storage';

describe('count once, reuse lighting stock across Christmas years',()=>{
 it('stores one physical quantity with independent years and locations',()=>{
  let stock=addStock({stock:[],placements:[]},'Mini');
  const id=stock.stock[0].id;
  stock=updateStock(stock,id,{name:'Sun warm white, 100 LEDs',owned:8,bulbsPerStrand:100,storage:'Garage bin 4'});
  stock=addPlacement(stock,id,'Christmas',2026,'Bushes',5);
  stock=addPlacement(stock,id,'Christmas',2027,'Fence',3);
  const y2026=totals(stock.stock,stock.placements,'Christmas',2026,'Mini');
  const y2027=totals(stock.stock,stock.placements,'Christmas',2027,'Mini');
  expect(y2026.ownedKnown).toBe(8);expect(y2027.ownedKnown).toBe(8);
  expect(y2026.plannedKnown).toBe(5);expect(y2027.plannedKnown).toBe(3);
  expect(stock.stock).toHaveLength(1);
  expect(stock.placements).toHaveLength(2);
  expect(stockCsv(stock,'Christmas',2027)).toContain('Fence');
 });
 it('does not count planned as installed, reuse requires no recount and resets installation status',()=>{
  let stock=addStock({stock:[],placements:[]},'C9');
  stock=updateStock(stock,stock.stock[0].id,{owned:150});
  stock=addPlacement(stock,stock.stock[0].id,'Christmas',2026,'First-floor roofline',75);
  stock=updatePlacement(stock,stock.placements[0].id,{status:'installed'});
  const next=repeatLastYearAssignments(stock,'Christmas',2027);
  expect(next.stock).toEqual(stock.stock);
  expect(next.placements.filter(p=>p.year===2027)).toHaveLength(1);
  expect(next.placements.find(p=>p.year===2027)?.status).toBe('planned');
  expect(totals(next.stock,next.placements,'Christmas',2026,'C9').installedKnown).toBe(75);
  expect(totals(next.stock,next.placements,'Christmas',2027,'C9').installedKnown).toBe(0);
  expect(repeatLastYearAssignments(next,'Christmas',2027).placements).toHaveLength(2);
 });
 it('keeps one private stock photo and records every physical count change without annual recount',()=>{
  let x=addStock({stock:[],placements:[]},'Mini');const id=x.stock[0].id;
  x=updateStock(x,id,{owned:3,bulbsPerStrand:100,photo:'data:image/jpeg;base64,AAAA'});
  x=updateStock(x,id,{owned:5});
  expect(x.changes?.some(c=>c.summary.includes('from 3 to 5 strands'))).toBe(true);
  expect(x.stock[0].photo).toContain('data:image');
  x=addPlacement(x,id,'Christmas',2026,'Bushes',4);
  x=repeatLastYearAssignments(x,'Christmas',2027);
  expect(x.stock[0].owned).toBe(5);
  expect(x.stock[0].photo).toContain('data:image');
  const record={...createSharedLightingRecord(),sharedLighting:x};
  expect(parseBackup(createBackup([record]))[0].sharedLighting?.stock[0].photo).toEqual(x.stock[0].photo);
 });
 it('never invents quantities, flags known shortages and excludes damaged items from available stock',()=>{
  let stock=addStock({stock:[],placements:[]},'Mini');
  stock=addPlacement(stock,stock.stock[0].id,'Christmas',2026,'Fence',8);
  expect(totals(stock.stock,stock.placements,'Christmas',2026,'Mini').needsReview).toBe(1);
  expect(totals(stock.stock,stock.placements,'Christmas',2026,'Mini').shortKnown).toBe(0);
  stock=updateStock(stock,stock.stock[0].id,{owned:5});
  expect(totals(stock.stock,stock.placements,'Christmas',2026,'Mini').shortKnown).toBe(3);
  stock=updateStock(stock,stock.stock[0].id,{condition:'repair'});
  expect(totals(stock.stock,stock.placements,'Christmas',2026,'Mini').ownedKnown).toBe(0);
 });
 it('imports legacy records explicitly once and never deletes the original annual project',()=>{
  const project=exampleProjects()[1];
  const legacy={id:'known-run',label:'First floor C9',type:'C9' as const,area:'First-floor roofline' as const,status:'installed' as const,totalBulbs:80};
  const stock=importLegacyLighting({stock:[],placements:[]},[legacy],project.season,project.year);
  expect(stock.stock[0].owned).toBe(80);
  expect(stock.placements[0].quantity).toBe(80);
  expect(importLegacyLighting(stock,[legacy],project.season,project.year).stock).toHaveLength(1);
  const record={...createSharedLightingRecord(),sharedLighting:stock};
  const restored=parseBackup(createBackup([project,record]));
  expect(isSharedLightingRecord(restored[1])).toBe(true);
  expect(restored[1].id).toBe(SHARED_LIGHTING_ID);
  expect(availableStock(restored).stock[0].owned).toBe(80);
  expect(restored[0].nodes).toEqual(project.nodes);
 });
});
