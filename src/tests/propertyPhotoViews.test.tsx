import 'fake-indexeddb/auto';
import {act,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,expect,it,vi} from 'vitest';
import {PropertyPhotoViews} from '../components/PropertyPhotoViews';
import type {Project} from '../lib/model';
import {exampleProjects} from '../fixtures/examples';
import {getPropertyPhotoViews,setPropertyPhotoLayout} from '../lib/propertyPhoto';
import {createBackup,parseBackup} from '../lib/storage';

describe('multiple property photo views',()=>{
 it('treats the existing photo as the main view and updates photos independently',()=>{
  const base=exampleProjects()[0],item=base.nodes[0].id;
  const legacy={...base,propertyPhoto:{photo:'legacy',placements:{[item]:{x:.1,y:.2}}}};
  expect(getPropertyPhotoViews(legacy)).toEqual([{id:'main',name:'Main view',layout:legacy.propertyPhoto}]);
  const project={...legacy,propertyPhotoViews:[{id:'yard',name:'Backyard',layout:{photo:'yard',placements:{[item]:{x:.8,y:.9}}}}]};
  const next=setPropertyPhotoLayout(project,'yard',{photo:'yard',placements:{[item]:{x:.7,y:.6}}});
  expect(next.propertyPhoto).toEqual(legacy.propertyPhoto);expect(next.nodes).toEqual(legacy.nodes);expect(next.edges).toEqual(legacy.edges);
  expect(next.propertyPhotoViews[0].layout.placements[item]).toEqual({x:.7,y:.6});
  expect(setPropertyPhotoLayout(next,'missing',undefined)).toBe(next);
  expect(parseBackup(JSON.parse(JSON.stringify(createBackup([next]))))[0]).toEqual(next);
 });
 it('rejects duplicate IDs, invalid layouts, invalid calibration and excessive views',()=>{
  const base=exampleProjects()[0],point={x:.1,y:.2},photo={photo:'photo',placements:{},calibration:{start:point,end:{x:.8,y:.2},knownFeet:12,aspectRatio:1.5},routes:{x:{kind:'cord' as const,points:[point,{x:.8,y:.2}],measuredFeet:14}}};
  expect(parseBackup(createBackup([{...base,propertyPhoto:photo}]))[0].propertyPhoto).toEqual(photo);
  for(const views of [[{id:'main',name:'A'}],[{id:'x',name:'A'},{id:'x',name:'B'}],[{id:'x',name:'A',layout:{photo:'bad',placements:{a:{x:2,y:0}}}}],Array.from({length:8},(_,i)=>({id:String(i),name:'A'}))])expect(()=>parseBackup(createBackup([{...base,propertyPhotoViews:views}]))).toThrow('Malformed property photo views');
  for(const calibration of [{...photo.calibration,knownFeet:0},{...photo.calibration,aspectRatio:Infinity},{...photo.calibration,end:point}])expect(()=>parseBackup(createBackup([{...base,propertyPhoto:{...photo,calibration}}]))).toThrow('Malformed property photo');
  expect(()=>parseBackup(createBackup([{...base,propertyPhoto:{...photo,routes:{x:{...photo.routes.x,measuredFeet:-1}}}}]))).toThrow('Malformed property photo');
 });
 it('requires confirmation to delete an additional photo view',async()=>{
  const base={...exampleProjects()[0],propertyPhotoViews:[{id:'yard',name:'Backyard',layout:{photo:'yard',placements:{}}}]};
  const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);let latest:Project=base;
  function Harness(){const [project,setProject]=useState<Project>(base),[active,setActive]=useState('yard');latest=project;return <PropertyPhotoViews project={project} activeId={active} onSelect={setActive} onUpdate={fn=>setProject(fn)}/>;}
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);await act(async()=>root.render(<Harness/>));
  const remove=()=>Array.from(host.querySelectorAll('button')).find(button=>button.textContent==='Delete view')!;
  await act(async()=>remove().click());expect(confirm).toHaveBeenCalled();expect(latest.propertyPhotoViews).toHaveLength(1);
  confirm.mockReturnValue(true);await act(async()=>remove().click());expect(latest.propertyPhotoViews).toHaveLength(0);expect(host.textContent).toContain('Main view');
  confirm.mockRestore();await act(async()=>root.unmount());host.remove();
 });
 it('switches without interruption unless a drawing is unfinished',async()=>{
  const project={...exampleProjects()[0],propertyPhotoViews:[{id:'yard',name:'Backyard'}]};
  const confirm=vi.spyOn(window,'confirm').mockReturnValue(false),select=vi.fn();
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  await act(async()=>root.render(<PropertyPhotoViews project={project} activeId="main" onSelect={select} onUpdate={()=>{}}/>));
  let dropdown=host.querySelector('select')!;dropdown.value='yard';await act(async()=>dropdown.dispatchEvent(new Event('change',{bubbles:true})));
  expect(select).toHaveBeenCalledWith('yard');expect(confirm).not.toHaveBeenCalled();select.mockClear();
  await act(async()=>root.render(<PropertyPhotoViews project={project} activeId="main" onSelect={select} onUpdate={()=>{}} hasUnsavedDraft/>));
  dropdown=host.querySelector('select')!;dropdown.value='yard';await act(async()=>dropdown.dispatchEvent(new Event('change',{bubbles:true})));
  expect(confirm).toHaveBeenCalled();expect(select).not.toHaveBeenCalled();
  confirm.mockRestore();await act(async()=>root.unmount());host.remove();
 });
});
