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
});
