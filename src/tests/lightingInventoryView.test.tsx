import {describe,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {LightingInventory} from '../components/LightingInventory';
import {exampleProjects} from '../fixtures/examples';
import {addChristmasSectionPrompts,addLightEntry,lightingInventoryCsv,newLightingEntry} from '../lib/lightingInventory';
describe('Christmas strand inventory view',()=>{
 const project=exampleProjects()[1];
 const props={onAdd:vi.fn(),onAddChristmasSections:vi.fn(),onChange:vi.fn(),onRemove:vi.fn(),onLocate:vi.fn(),onExport:vi.fn()};
 it('renders first and second floor inventory with unknown counts and an explicit starter',()=>{
  const rendered=renderToStaticMarkup(<LightingInventory project={{...project,lightingInventory:addChristmasSectionPrompts([])}} {...props}/>);
  expect(rendered).toContain('First-floor roofline');
  expect(rendered).toContain('Second-floor roofline');
  expect(rendered).not.toContain('No matching lighting entries');
  expect(rendered).toContain('Needs bulb count');
  expect(rendered).toContain('Add missing sections');

 });
 it('shows known bulb count without treating missing as zero',()=>{
  let rows=addLightEntry([],{...newLightingEntry('C9'),label:'First floor custom C9',strandCount:1,totalBulbs:50});
  rows=addLightEntry(rows,{...newLightingEntry('C9','Second-floor roofline'),label:'Second floor'});
  const html=renderToStaticMarkup(<LightingInventory project={{...project,lightingInventory:rows}} {...props}/>);
  expect(html).toContain('50 known bulbs + 1 uncounted row');
  expect(html).toContain('Second floor');
  const csv=lightingInventoryCsv(rows);
  expect(csv).toContain('First floor custom C9');
  expect(csv).toContain('"50"');
  expect(csv).toContain('Second floor');
 });
});
