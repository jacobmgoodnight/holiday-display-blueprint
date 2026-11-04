import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {PhotoQuickEdit} from '../components/PhotoQuickEdit';
import {PhotoVisualOverlay,defaultPhotoVisuals,previewPoints} from '../components/PhotoVisuals';
import {createBlankDisplay} from '../lib/newDisplay';
import {makeNode} from '../lib/model';
import type {PropertyPhoto} from '../lib/propertyPhoto';

const click=(host:HTMLElement,text:string)=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent===text)!.click();

describe('photo quick details',()=>{
 it('reports an edit conflict instead of overwriting newer descriptive data',async()=>{
  const item=makeNode('decoration','Other',{x:0,y:0});item.name='Snowman';
  const save=vi.fn(()=>true),similar=vi.fn();
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  await act(async()=>root.render(<PhotoQuickEdit item={item} onSave={save} onAddSimilar={similar}/>));
  await act(async()=>click(host,'Edit details here'));
  await act(async()=>root.render(<PhotoQuickEdit item={{...item,name:'Updated elsewhere'}} onSave={save} onAddSimilar={similar}/>));
  await act(async()=>host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  expect(host.querySelector('[role=alert]')?.textContent).toContain('changed while you were editing');
  expect(save).not.toHaveBeenCalled();
  await act(async()=>click(host,'Cancel'));
  await act(async()=>click(host,'Edit details here'));
  expect(host.querySelector<HTMLInputElement>('[aria-label="Photo item name"]')!.value).toBe('Updated elsewhere');
  await act(async()=>root.unmount());host.remove();
 });
 it('saves only descriptive fields and calls the separate repeat-placement action',async()=>{
  const item=makeNode('cord','Backyard',{x:0,y:0});item.name='Cord';item.outputs=3;item.verified=true;
  const original=structuredClone(item),save=vi.fn(()=>true),similar=vi.fn();
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  await act(async()=>root.render(<PhotoQuickEdit item={item} onSave={save} onAddSimilar={similar}/>));
  await act(async()=>click(host,'Place another like this'));expect(similar).toHaveBeenCalledOnce();expect(save).not.toHaveBeenCalled();
  await act(async()=>click(host,'Edit details here'));
  await act(async()=>host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  expect(save).toHaveBeenCalledOnce();
  const [id,changes]=save.mock.calls[0] as unknown as [string,Record<string,unknown>];
  expect(id).toBe(item.id);expect(Object.keys(changes).sort()).toEqual(['color','name','notes','visualIcon','zone']);
  expect(item).toEqual(original);expect(item.outputs).toBe(3);expect(item.verified).toBe(true);
  await act(async()=>root.unmount());host.remove();
 });
});

describe('illustrative photo visuals',()=>{
 it('shows only saved, placed edges upstream of the selected item',()=>{
  const outlet=makeNode('outlet','Other',{x:0,y:0}),cord=makeNode('cord','Other',{x:0,y:0}),lights=makeNode('light-strand','Other',{x:0,y:0}),sibling=makeNode('decoration','Other',{x:0,y:0});
  const project={...createBlankDisplay({name:'test',season:'Christmas',year:2027}),nodes:[outlet,cord,lights,sibling],edges:[{id:'first',source:outlet.id,sourcePort:0,target:cord.id},{id:'second',source:cord.id,sourcePort:0,target:lights.id},{id:'sibling',source:outlet.id,sourcePort:1,target:sibling.id}]};
  const photo:PropertyPhoto={photo:'data:image/jpeg;base64,AA',placements:{[outlet.id]:{x:.1,y:.1},[cord.id]:{x:.3,y:.3},[lights.id]:{x:.8,y:.8},[sibling.id]:{x:.5,y:.6}}};
  const snapshot=JSON.stringify(project);
  const render=(layout:PropertyPhoto,selectedId:string|null,showPowerPath:boolean)=>renderToStaticMarkup(<svg><PhotoVisualOverlay project={project} photo={layout} selectedId={selectedId} options={{...defaultPhotoVisuals,showPowerPath}}/></svg>);
  let html=render(photo,lights.id,true);expect((html.match(/class="photo-power-path"/g)||[])).toHaveLength(2);
  expect(html).toContain('x1="100" y1="100" x2="300" y2="300"');
  expect(html).not.toContain('x2="500" y2="600"');
  const { [cord.id]:_removed,...remaining}=photo.placements;
  html=render({...photo,placements:remaining},lights.id,true);expect(html).not.toContain('class="photo-power-path"');
  expect(render(photo,lights.id,false)).not.toContain('class="photo-power-path"');
  expect(render(photo,null,true)).not.toContain('class="photo-power-path"');
  expect(JSON.stringify(project)).toBe(snapshot);
 });
 it('draws illustrative bulbs only along extant light routes, leaving equipment unchanged',()=>{
  const light=makeNode('light-strand','Other',{x:0,y:0}),cord=makeNode('cord','Other',{x:0,y:0});
  const project={...createBlankDisplay({name:'test',season:'Christmas',year:2027}),nodes:[light,cord],edges:[]};
  const photo:PropertyPhoto={photo:'data:image/jpeg;base64,AA',placements:{},routes:{[light.id]:{kind:'lights',points:[{x:0,y:0},{x:.2,y:0}]},[cord.id]:{kind:'cord',points:[{x:0,y:.5},{x:.2,y:.5}]},missing:{kind:'lights',points:[{x:0,y:.8},{x:.2,y:.8}]}}};
  const snapshot=JSON.stringify({project,photo});
  const render=(preview:boolean)=>renderToStaticMarkup(<svg><PhotoVisualOverlay project={project} photo={photo} selectedId={null} options={{...defaultPhotoVisuals,preview,spacing:.1}}/></svg>);
  const html=render(true);expect((html.match(/class="photo-preview-bulb"/g)||[])).toHaveLength(3);
  expect(html).not.toContain('cy="500"');expect(html).not.toContain('cy="800"');
  expect(render(false)).not.toContain('class="photo-preview-bulb"');expect(JSON.stringify({project,photo})).toBe(snapshot);
 });
 it('spaces the preview across segment joints and respects its safety limit',()=>{
  const points=previewPoints([{x:0,y:0},{x:.15,y:0},{x:.3,y:0}],.1,1);
  expect(points.map(p=>p.x)).toEqual([0,.1,.2]);
  expect(previewPoints([{x:0,y:0},{x:1,y:0}],.01,1,5)).toHaveLength(5);
  expect(previewPoints([{x:0,y:0}],.1,1)).toEqual([]);
 });
});
