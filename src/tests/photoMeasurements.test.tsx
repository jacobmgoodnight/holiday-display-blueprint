import {act,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,expect,it,vi} from 'vitest';
import {PhotoMeasurements} from '../components/PhotoMeasurements';
import {estimatePhotoRouteFeet} from '../lib/photoMeasurements';
import {availableStock,createSharedLightingRecord} from '../lib/sharedLighting';
import type {PhotoPoint,PropertyPhoto} from '../lib/propertyPhoto';
import {exampleProjects} from '../fixtures/examples';

describe('photo route measurements',()=>{
 it('uses the photo aspect ratio for both calibration and route segments',()=>{
  const scale={start:{x:0,y:0},end:{x:.5,y:0},knownFeet:10,aspectRatio:2};
  expect(estimatePhotoRouteFeet([{x:0,y:0},{x:0,y:1}],scale)).toBe(10);
  expect(estimatePhotoRouteFeet([{x:0,y:0},{x:.5,y:0},{x:.5,y:.5}],scale)).toBe(15);
  expect(estimatePhotoRouteFeet([{x:0,y:0},{x:1,y:0}],{...scale,end:scale.start})).toBeUndefined();
  expect(estimatePhotoRouteFeet([{x:0,y:0},{x:1,y:0}],undefined)).toBeUndefined();
  expect(estimatePhotoRouteFeet([{x:0,y:0}],scale)).toBeUndefined();
 });
 it('saves a reference and measured override as photo metadata without changing the project',async()=>{
  const project=exampleProjects()[0];const item=project.nodes.find(n=>n.kind==='cord'||n.kind==='spt-1')!;
  const original=JSON.stringify(project);const changed=vi.fn();
  const points:PhotoPoint[]=[{x:.1,y:.2},{x:.6,y:.2}];
  function Harness(){
   const [value,setValue]=useState<PropertyPhoto>({photo:'data:image/jpeg;base64,AA',placements:{},routes:{[item.id]:{kind:'cord',points:[{x:0,y:0},{x:.5,y:0}]}}});
   const [calibrationPoints,setCalibrationPoints]=useState<PhotoPoint[]|null>(null);
   return <PhotoMeasurements project={project} value={value} node={item} aspectRatio={2} calibrationPoints={calibrationPoints} onStartCalibration={()=>setCalibrationPoints(points)} onCancelCalibration={()=>setCalibrationPoints(null)} onChange={v=>{changed(v);setValue(v);}}/>;
  }
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);await act(async()=>root.render(<Harness/>));
  const button=(name:string)=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent===name)!;
  await act(async()=>button('Set photo scale').click());
  const reference=host.querySelector<HTMLInputElement>('input[type=number]')!;
  const setInput=async(input:HTMLInputElement,value:string)=>act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));});
  await setInput(reference,'10');
  await act(async()=>button('Save photo scale').click());
  expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({calibration:{start:points[0],end:points[1],knownFeet:10,aspectRatio:2}}));
  expect(host.textContent).toContain('Approximately 10 ft');
  await setInput(host.querySelector<HTMLInputElement>('[aria-label="Measured route length in feet"]')!,'12.5');
  await act(async()=>button('Save measured length').click());
  expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({routes:{[item.id]:expect.objectContaining({measuredFeet:12.5})}}));
  expect(host.textContent).toContain('Using your measured length of 12.5 ft');
  await setInput(host.querySelector<HTMLInputElement>('[aria-label="Measured route length in feet"]')!,'0');
  expect(button('Save measured length').disabled).toBe(true);
  await setInput(host.querySelector<HTMLInputElement>('[aria-label="Measured route length in feet"]')!,'');
  await act(async()=>button('Save measured length').click());
  expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({routes:{[item.id]:expect.not.objectContaining({measuredFeet:expect.anything()})}}));
  expect(JSON.stringify(project)).toBe(original);
  await act(async()=>root.unmount());host.remove();
 });
 it('shows only explicitly linked placements from the separate shared stock record',async()=>{
  const project=exampleProjects()[0];const item=project.nodes.find(n=>n.kind==='cord'||n.kind==='spt-1')!;
  const shared=createSharedLightingRecord();
  shared.sharedLighting={stock:[{id:'stock',name:'Outdoor light strands',type:'Mini',owned:4,unit:'strands',condition:'good'}],placements:[
   {id:'linked',stockId:'stock',season:project.season,year:project.year,area:'Other',quantity:2,status:'planned',componentId:item.id},
   {id:'different-year',stockId:'stock',season:project.season,year:project.year-1,area:'Other',quantity:3,status:'planned',componentId:item.id},
   {id:'unlinked',stockId:'stock',season:project.season,year:project.year,area:'Other',quantity:1,status:'planned'}
  ]};
  expect(project.sharedLighting).toBeUndefined();
  const value:PropertyPhoto={photo:'data:image/jpeg;base64,AA',placements:{},routes:{[item.id]:{kind:'cord',points:[{x:0,y:0},{x:1,y:0}]}}};
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  await act(async()=>root.render(<PhotoMeasurements project={project} lighting={availableStock([project,shared])} value={value} node={item} calibrationPoints={null} onStartCalibration={()=>{}} onCancelCalibration={()=>{}} onChange={()=>{}}/>));
  expect(host.textContent).toContain('Outdoor light strands, 2 strands (planned). Recorded owned: 4 strands.');
  expect(host.textContent).not.toContain('3 strands');
  expect(host.textContent).not.toContain('1 strands');
  await act(async()=>root.unmount());host.remove();
 });
 it('reports unsaved entries and keeps length drafts when another item is selected',async()=>{
  const project=exampleProjects()[0];const first=project.nodes[0],second=project.nodes[1];
  const value:PropertyPhoto={photo:'data:image/jpeg;base64,AA',placements:{},routes:{
   [first.id]:{kind:'cord',points:[{x:0,y:0},{x:1,y:0}]},
   [second.id]:{kind:'lights',points:[{x:0,y:0},{x:1,y:0}]}
  }};
  const status=vi.fn();let choose:(id:string)=>void=()=>{};
  function Harness(){
   const [selected,setSelected]=useState(first.id);choose=setSelected;
   const [points,setPoints]=useState<PhotoPoint[]|null>(null);
   return <PhotoMeasurements project={project} value={value} node={project.nodes.find(n=>n.id===selected)} aspectRatio={2} calibrationPoints={points} onStartCalibration={()=>setPoints([])} onCancelCalibration={()=>setPoints(null)} onUnsavedChange={status} onChange={()=>{}}/>;
  }
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);await act(async()=>root.render(<Harness/>));
  const button=(name:string)=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent===name)!;
  const setInput=async(input:HTMLInputElement,value:string)=>act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));});
  await act(async()=>button('Set photo scale').click());
  await setInput(host.querySelector<HTMLInputElement>('input[type=number]')!,'8');
  expect(status).toHaveBeenLastCalledWith(true);
  await act(async()=>button('Cancel scale').click());
  expect(status).toHaveBeenLastCalledWith(false);
  await setInput(host.querySelector<HTMLInputElement>('[aria-label="Measured route length in feet"]')!,'17');
  expect(status).toHaveBeenLastCalledWith(true);
  await act(async()=>choose(second.id));
  expect(host.textContent).toContain('Other items have unsaved route lengths');
  expect(status).toHaveBeenLastCalledWith(true);
  await act(async()=>choose(first.id));
  expect(host.querySelector<HTMLInputElement>('[aria-label="Measured route length in feet"]')!.value).toBe('17');
  await act(async()=>button('Discard this length edit').click());
  expect(status).toHaveBeenLastCalledWith(false);
  await act(async()=>root.unmount());host.remove();
 });
});
