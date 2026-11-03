import {act,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,expect,it,vi} from 'vitest';
import {PropertyPhotoView} from '../components/PropertyPhotoView';
import {propertyPhotoPoint,type PropertyPhoto} from '../lib/propertyPhoto';
import {exampleProjects} from '../fixtures/examples';

describe('property photo planner',()=>{
 it('stores bounded positions relative to the displayed image',()=>{
  const rect={left:20,top:50,width:200,height:100};
  expect(propertyPhotoPoint(70,125,rect)).toEqual({x:.25,y:.75});
  expect(propertyPhotoPoint(-10,200,rect)).toEqual({x:0,y:1});
  expect(propertyPhotoPoint(1,1,{...rect,width:0})).toBeUndefined();
 });
 it('places an existing item on a photo without changing its diagram or wiring',async()=>{
  const original=exampleProjects()[0];const snapshot=JSON.stringify(original);const item=original.nodes[0];
  const changes=vi.fn();
  function Harness(){const [value,setValue]=useState<PropertyPhoto|undefined>({photo:'data:image/jpeg;base64,AA',placements:{}});return <PropertyPhotoView project={original} value={value} onChange={next=>{changes(next);setValue(next);}}/>;}
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  await act(async()=>root.render(<Harness/>));
  const itemButton=Array.from(host.querySelectorAll<HTMLButtonElement>('.property-item-list button')).find(b=>b.textContent?.includes(item.name))!;
  await act(async()=>itemButton.click());
  expect(host.textContent).toContain('Recorded power path');
  await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent?.includes('Place on photo'))!.click());
  const image=host.querySelector<HTMLDivElement>('.property-image')!;
  image.getBoundingClientRect=()=>({left:10,top:20,width:200,height:100,right:210,bottom:120,x:10,y:20,toJSON(){}});
  await act(async()=>image.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:60,clientY:95})));
  expect(changes).toHaveBeenCalledWith(expect.objectContaining({placements:{[item.id]:{x:.25,y:.75}}}));
  expect(host.querySelector('[aria-label="Select '+item.name+'"]')).not.toBeNull();
  expect(JSON.stringify(original)).toBe(snapshot);
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="Move marker right"]')!.click());
  expect(changes).toHaveBeenLastCalledWith(expect.objectContaining({placements:{[item.id]:{x:.26,y:.75}}}));
  await act(async()=>root.unmount());host.remove();
 });
 it('asks before removing the photo and locations',async()=>{
  const project=exampleProjects()[0];const change=vi.fn();const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  await act(async()=>root.render(<PropertyPhotoView project={project} value={{photo:'data:image/jpeg;base64,AA',placements:{[project.nodes[0].id]:{x:.5,y:.5}}}} onChange={change}/>));
  await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='Remove property photo')!.click());
  expect(confirm).toHaveBeenCalled();expect(change).not.toHaveBeenCalled();
  confirm.mockReturnValue(true);await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='Remove property photo')!.click());
  expect(change).toHaveBeenCalledWith(undefined);confirm.mockRestore();await act(async()=>root.unmount());host.remove();
 });
 it('draws and redraws a route for an item without changing connections',async()=>{
  const base=exampleProjects()[0],item=base.nodes.find(n=>n.kind==='cord'||n.kind==='spt-1')!;
  expect(item).toBeTruthy();const original=JSON.stringify(base);const changes=vi.fn();
  function Harness(){const [value,setValue]=useState<PropertyPhoto|undefined>({photo:'data:image/jpeg;base64,AA',placements:{}});return <PropertyPhotoView project={base} value={value} onChange={next=>{changes(next);setValue(next);}}/>;}
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);await act(async()=>root.render(<Harness/>));
  const itemButton=Array.from(host.querySelectorAll<HTMLButtonElement>('.property-item-list button')).find(b=>b.textContent?.includes(item.name))!;
  await act(async()=>itemButton.click());
  await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='Draw route')!.click());
  const image=host.querySelector<HTMLDivElement>('.property-image')!;
  image.getBoundingClientRect=()=>({left:10,top:20,width:200,height:100,right:210,bottom:120,x:10,y:20,toJSON(){}});
  await act(async()=>image.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:60,clientY:45})));
  await act(async()=>image.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:160,clientY:95})));
  await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='Save route')!.click());
  expect(changes).toHaveBeenLastCalledWith(expect.objectContaining({routes:{[item.id]:{kind:'cord',points:[{x:.25,y:.25},{x:.75,y:.75}]}}}));
  expect(host.querySelector('.property-route.cord')).not.toBeNull();expect(JSON.stringify(base)).toBe(original);
  await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='Redraw route')!.click());
  await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='Add point at cursor')!.click());
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="Move route cursor right"]')!.click());
  await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='Add point at cursor')!.click());
  await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='Save route')!.click());
  expect(changes).toHaveBeenLastCalledWith(expect.objectContaining({routes:{[item.id]:{kind:'cord',points:[{x:.5,y:.5},{x:.55,y:.5}]}}}));
  expect(JSON.stringify(base)).toBe(original);await act(async()=>root.unmount());host.remove();
 });
 it('keeps an unfinished route when switching items and lets connection mode select a source',async()=>{
  const base=exampleProjects()[0],item=base.nodes.find(n=>n.kind==='cord'||n.kind==='spt-1')!,source=base.nodes.find(n=>n.id!==item.id)!;
  const selectSource=vi.fn();let setConnect:(value:string|null)=>void=()=>{};
  function Harness(){const [value,setValue]=useState<PropertyPhoto|undefined>({photo:'data:image/jpeg;base64,AA',placements:{[source.id]:{x:.5,y:.5}}});const [connect,set]=useState<string|null>(null);setConnect=set;return <PropertyPhotoView project={base} value={value} onChange={setValue} connectTargetId={connect} onSelectConnectionSource={selectSource}/>;}
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);await act(async()=>root.render(<Harness/>));
  const itemButton=()=>Array.from(host.querySelectorAll<HTMLButtonElement>('.property-item-list button')).find(b=>b.textContent?.includes(item.name))!;
  await act(async()=>itemButton().click());await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='Draw route')!.click());
  await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='Add point at cursor')!.click());
  await act(async()=>host.querySelector<HTMLButtonElement>(`[aria-label="Select ${source.name}"]`)!.click());
  await act(async()=>itemButton().click());await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='Continue drawing')!.click());
  expect(host.textContent).toContain('1 point');
  await act(async()=>setConnect(item.id));
  await act(async()=>host.querySelector<HTMLButtonElement>(`[aria-label="Select ${source.name}"]`)!.click());
  expect(selectSource).toHaveBeenCalledWith(source.id);
  await act(async()=>setConnect(null));
  expect(Array.from(host.querySelectorAll('button')).some(b=>b.textContent==='Continue drawing')).toBe(true);
  await act(async()=>root.unmount());host.remove();
 });
});
