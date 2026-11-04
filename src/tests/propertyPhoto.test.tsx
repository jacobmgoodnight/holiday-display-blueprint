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
 it('filters equipment and toggles labels without changing saved placements',async()=>{
  const project=exampleProjects()[0],item=project.nodes[0];const change=vi.fn();
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  await act(async()=>root.render(<PropertyPhotoView project={project} value={{photo:'data:image/jpeg;base64,AA',placements:{[item.id]:{x:.5,y:.5}}}} onChange={change}/>));
  const marker=host.querySelector<HTMLButtonElement>(`[aria-label="Select ${item.name}"]`)!;
  expect(marker.textContent).toContain(item.name);
  await act(async()=>host.querySelector<HTMLInputElement>('.property-view-controls input')!.click());
  expect(marker.textContent).not.toContain(item.name);expect(marker.getAttribute('aria-label')).toBe(`Select ${item.name}`);
  const typeSelect=Array.from(host.querySelectorAll<HTMLSelectElement>('.property-filters select'))[1];
  const other=project.nodes.find(n=>n.kind!==item.kind)!;
  await act(async()=>{typeSelect.value=other.kind;typeSelect.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(host.querySelector(`[aria-label="Select ${item.name}"]`)).toBeNull();expect(change).not.toHaveBeenCalled();
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="Zoom in"]')!.click());
  expect(host.querySelector<HTMLElement>('.property-image')!.style.width).toBe('125%');
  await act(async()=>root.unmount());host.remove();
 });
 it('edits saved route points and preserves other route metadata',async()=>{
  const project=exampleProjects()[0],item=project.nodes.find(n=>n.kind==='cord'||n.kind==='spt-1')!;
  const change=vi.fn();
  function Harness(){const [value,setValue]=useState<PropertyPhoto|undefined>({photo:'data:image/jpeg;base64,AA',placements:{},routes:{[item.id]:{kind:'cord',points:[{x:.25,y:.25},{x:.75,y:.75}],measuredFeet:20}}});return <PropertyPhotoView project={project} value={value} onChange={next=>{change(next);setValue(next);}}/>;}
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);await act(async()=>root.render(<Harness/>));
  await act(async()=>Array.from(host.querySelectorAll<HTMLButtonElement>('.property-item-list button')).find(b=>b.textContent?.includes(item.name))!.click());
  await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='Edit route points')!.click());
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="Edit route point 2"]')!.click());
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="Move route point right"]')!.click());
  await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='Save route')!.click());
  expect(change).toHaveBeenLastCalledWith(expect.objectContaining({routes:{[item.id]:expect.objectContaining({measuredFeet:20,points:[{x:.25,y:.25},{x:.76,y:.75}]})}}));
  await act(async()=>root.unmount());host.remove();
 });

 it('captures calibration points without placing or wiring equipment',async()=>{
  const project=exampleProjects()[0],snapshot=JSON.stringify(project),change=vi.fn();
  function Harness(){const [value,setValue]=useState<PropertyPhoto|undefined>({photo:'data:image/jpeg;base64,AA',placements:{}});return <PropertyPhotoView project={project} value={value} onChange={next=>{change(next);setValue(next);}}/>;}
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);await act(async()=>root.render(<Harness/>));
  const img=host.querySelector('img')!;Object.defineProperty(img,'naturalWidth',{value:200});Object.defineProperty(img,'naturalHeight',{value:100});await act(async()=>img.dispatchEvent(new Event('load',{bubbles:true})));
  await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='Set photo scale')!.click());
  const image=host.querySelector<HTMLDivElement>('.property-image')!;image.getBoundingClientRect=()=>({left:0,top:0,width:200,height:100,right:200,bottom:100,x:0,y:0,toJSON(){}});
  await act(async()=>image.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:20,clientY:50})));
  await act(async()=>image.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:120,clientY:50})));
  expect(host.textContent).toContain('2 of 2 points');expect(host.querySelectorAll('.property-routes circle')).toHaveLength(2);
  const input=host.querySelector<HTMLInputElement>('.photo-calibration-controls input')!;
  await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,'10');input.dispatchEvent(new Event('input',{bubbles:true}));});
  await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='Save photo scale')!.click());
  expect(change).toHaveBeenLastCalledWith(expect.objectContaining({placements:{},calibration:expect.objectContaining({knownFeet:10,aspectRatio:2})}));expect(JSON.stringify(project)).toBe(snapshot);
  await act(async()=>root.unmount());host.remove();
 });

 it('reports filtered IDs to photo overlays and preserves a paused calibration draft',async()=>{
  const project=exampleProjects()[0],item=project.nodes[0],other=project.nodes.find(n=>n.kind!==item.kind)!;
  let setAdding:(next:boolean)=>void=()=>{};const unsaved=vi.fn();
  function Harness(){const [value,setValue]=useState<PropertyPhoto|undefined>({photo:'data:image/jpeg;base64,AA',placements:{[item.id]:{x:.5,y:.5}}});const [adding,set]=useState(false);setAdding=set;return <PropertyPhotoView project={project} value={value} onChange={setValue} photoPlaceActive={adding} onUnsavedDraftChange={unsaved} svgOverlay={ids=><text data-testid="visible-ids">{[...ids].join(',')}</text>}/>;}
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);await act(async()=>root.render(<Harness/>));
  expect(host.querySelector('[data-testid="visible-ids"]')!.textContent).toContain(item.id);
  const typeSelect=Array.from(host.querySelectorAll<HTMLSelectElement>('.property-filters select'))[1];
  await act(async()=>{typeSelect.value=other.kind;typeSelect.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(host.querySelector('[data-testid="visible-ids"]')!.textContent).not.toContain(item.id);
  await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='Set photo scale')!.click());
  const image=host.querySelector<HTMLDivElement>('.property-image')!;image.getBoundingClientRect=()=>({left:0,top:0,width:200,height:100,right:200,bottom:100,x:0,y:0,toJSON(){}});
  await act(async()=>image.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:20,clientY:50})));
  expect(host.textContent).toContain('1 of 2 points');
  await act(async()=>setAdding(true));
  expect(host.textContent).toContain('Continue photo scale');expect(unsaved).toHaveBeenLastCalledWith(true);
  await act(async()=>setAdding(false));await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='Continue photo scale')!.click());
  expect(host.textContent).toContain('1 of 2 points');
  await act(async()=>root.unmount());host.remove();
 });

});
