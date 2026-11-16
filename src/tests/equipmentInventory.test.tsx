import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,expect,it,vi} from 'vitest';
import {EquipmentInventory} from '../components/EquipmentInventory';
import {createBlankDisplay} from '../lib/newDisplay';
import {makeNode} from '../lib/model';
import type {Project} from '../lib/model';

const button=(host:HTMLElement,text:string)=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent?.includes(text))!;
function sample():Project{
 const outlet=makeNode('outlet','Front porch',{x:0,y:0}),plug=makeNode('smart-plug','Front porch',{x:0,y:0}),ghost=makeNode('decoration','Backyard',{x:0,y:0});
 outlet.name='Porch outlet';plug.name='Kasa plug';ghost.name='Ghost';ghost.inventory={storage:'Attic bin 3',condition:'repair'};
 return {...createBlankDisplay({name:'Test',year:2027,season:'Halloween'}),nodes:[outlet,plug,ghost]};
}
async function mount(project:Project,onPatch=vi.fn(),onShow=vi.fn(),onExport=vi.fn()){
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 await act(async()=>root.render(<EquipmentInventory project={project} onPatch={onPatch} onShow={onShow} onExport={onExport}/>));
 return {host,onPatch,onShow,onExport,done:async()=>{await act(async()=>root.unmount());host.remove();}};
}
const type=async(el:HTMLInputElement|HTMLSelectElement,value:string)=>{await act(async()=>{const proto=el instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value')!.set!.call(el,value);el.dispatchEvent(new Event(el instanceof HTMLSelectElement?'change':'input',{bubbles:true}));});};

describe('equipment inventory',()=>{
 it('lists owned equipment with plain type names and leaves house outlets out',async()=>{
  const view=await mount(sample());
  expect(view.host.querySelectorAll('.equipment-row')).toHaveLength(2);
  expect(view.host.textContent).toContain('Smart plug · Front porch');
  expect(view.host.textContent).not.toContain('smart-plug');
  expect(view.host.querySelector('.equipment-list')!.textContent).not.toContain('Porch outlet');
  expect(view.host.textContent).toContain('2 items · 1 without a storage spot · 1 needing attention');
  expect(view.host.textContent).toContain('House outlets are power sources');
  await view.done();
 });
 it('records storage without inventing a condition and never touches wiring fields',async()=>{
  const project=sample();const view=await mount(project);
  await act(async()=>button(view.host,'Kasa plug').click());
  const storage=view.host.querySelector<HTMLInputElement>('input[aria-label="Storage location for Kasa plug"]')!;
  expect(view.host.querySelector<HTMLSelectElement>('select[aria-label="Condition of Kasa plug"]')!.value).toBe('');
  await type(storage,'Garage bin A');
  expect(view.onPatch).toHaveBeenCalledWith(project.nodes[1].id,{inventory:{storage:'Garage bin A'}});
  const fields=view.onPatch.mock.calls.flatMap(call=>Object.keys(call[1]));
  expect(fields.every(key=>key==='inventory'||key==='notes')).toBe(true);
  await act(async()=>button(view.host,'Show on wiring diagram').click());
  expect(view.onShow).toHaveBeenCalledWith(project.nodes[1].id);
  await view.done();
 });
 it('keeps existing inventory details when one field changes',async()=>{
  const project=sample();const view=await mount(project);
  await act(async()=>button(view.host,'Ghost').click());
  await type(view.host.querySelector<HTMLSelectElement>('select[aria-label="Condition of Ghost"]')!,'good');
  expect(view.onPatch).toHaveBeenCalledWith(project.nodes[2].id,{inventory:{storage:'Attic bin 3',condition:'good'}});
  await view.done();
 });
 it('filters by search, area and missing storage, and exports on request only',async()=>{
  const view=await mount(sample());
  await type(view.host.querySelector<HTMLInputElement>('input[aria-label="Search inventory"]')!,'attic');
  expect(view.host.querySelectorAll('.equipment-row')).toHaveLength(1);
  await type(view.host.querySelector<HTMLInputElement>('input[aria-label="Search inventory"]')!,'');
  await type(view.host.querySelector<HTMLSelectElement>('select[aria-label="Filter equipment by area"]')!,'Garage & driveway');
  expect(view.host.textContent).toContain('Nothing matches');
  await type(view.host.querySelector<HTMLSelectElement>('select[aria-label="Filter equipment by area"]')!,'');
  await act(async()=>view.host.querySelector<HTMLInputElement>('.equipment-toggle input')!.click());
  expect(view.host.querySelectorAll('.equipment-row')).toHaveLength(1);
  expect(view.host.querySelector('.equipment-list')!.textContent).toContain('Kasa plug');
  expect(view.onExport).not.toHaveBeenCalled();
  await act(async()=>button(view.host,'Download list').click());
  expect(view.onExport).toHaveBeenCalledOnce();
  await view.done();
 });
});
