import {act,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,expect,it,vi} from 'vitest';
import {PhotoDirectDraw} from '../components/PhotoDirectDraw';
import {createPhotoDirectRoute,type DirectRouteDraft} from '../lib/photoDirectDraw';
import {createBlankDisplay} from '../lib/newDisplay';
import {validateGraph} from '../lib/graph';

describe('direct photo routes',()=>{
 it.each(['lights','cord'] as const)('creates one unconnected %s item with an independent visual route',kind=>{
  const photo={photo:'data:image/jpeg;base64,AA',placements:{existing:{x:.1,y:.2}}};
  const project={...createBlankDisplay({name:'Test',year:2027,season:'Christmas'}),propertyPhoto:{photo:'other-view',placements:{}}};
  const draft:DirectRouteDraft={kind,zone:'Backyard',points:[{x:.2,y:.3},{x:.8,y:.9}],cursor:{x:.5,y:.5}};
  const result=createPhotoDirectRoute(project,photo,draft);
  expect(result.project.propertyPhoto).toEqual(project.propertyPhoto);
  expect(result.project.edges).toEqual([]);
  expect(result.project.nodes).toHaveLength(1);
  expect(result.project.nodes[0]).toMatchObject({kind:kind==='lights'?'light-strand':'cord',zone:'Backyard',outputs:0,outputsUnknown:true});
  expect(result.project.nodes[0].inputGender).toBeUndefined();
  expect(result.project.nodes[0].outputGender).toBeUndefined();
  expect(result.project.nodes[0].lengthFt).toBeUndefined();
  expect(result.applyLayout(photo)).toMatchObject({placements:{existing:{x:.1,y:.2},[result.nodeId]:draft.points[0]},routes:{[result.nodeId]:{kind,points:draft.points}}});
  expect(photo.placements).toEqual({existing:{x:.1,y:.2}});
  expect(validateGraph(result.project.nodes,result.project.edges)).toEqual([]);
 });
 it('rejects missing areas, incomplete traces and invalid coordinates before creating anything',()=>{
  const p=createBlankDisplay({name:'Test',year:2027,season:'Christmas'}),photo={photo:'image',placements:{}};
  const draft:DirectRouteDraft={kind:'cord',zone:'',points:[{x:.1,y:.1},{x:.5,y:.5}],cursor:{x:.5,y:.5}};
  expect(()=>createPhotoDirectRoute(p,photo,draft)).toThrow('area');
  expect(()=>createPhotoDirectRoute(p,photo,{...draft,zone:'Other',points:[draft.points[0]]})).toThrow('two');
  expect(()=>createPhotoDirectRoute(p,photo,{...draft,zone:'Other',points:[draft.points[0],draft.points[0]]})).toThrow('different');
  expect(()=>createPhotoDirectRoute(p,photo,{...draft,zone:'Other',points:[draft.points[0],{x:2,y:0}]})).toThrow('valid');
  expect(p.nodes).toEqual([]);
 });
 it('lets keyboard users add and undo points and cancels without saving',async()=>{
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);const save=vi.fn(()=>true);
  function Harness(){const [draft,setDraft]=useState<DirectRouteDraft|null>(null);return <PhotoDirectDraw value={draft} onChange={setDraft} onSave={save}/>;}
  const button=(name:string)=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent?.trim()===name)!;
  await act(async()=>root.render(<Harness/>));
  await act(async()=>button('Draw lights').click());
  const select=host.querySelector<HTMLSelectElement>('select')!;
  await act(async()=>{select.value='Other';select.dispatchEvent(new Event('change',{bubbles:true}));});
  await act(async()=>button('Add point at cursor').click());
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="Move new route cursor right"]')!.click());
  await act(async()=>button('Add point at cursor').click());
  expect(button('Save route and item').disabled).toBe(false);
  await act(async()=>button('Undo point').click());
  expect(button('Save route and item').disabled).toBe(true);
  const confirm=vi.spyOn(window,'confirm').mockReturnValue(true);
  await act(async()=>button('Cancel').click());
  expect(save).not.toHaveBeenCalled();expect(button('Draw lights')).toBeTruthy();confirm.mockRestore();
  await act(async()=>root.unmount());host.remove();
 });
});
