import {act,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,expect,it} from 'vitest';
import {PhotoAddPalette,type PhotoAddDraft} from '../components/PhotoAddPalette';
import {addPhotoEquipment} from '../lib/photoEquipment';
import {createBlankDisplay} from '../lib/newDisplay';
import {validateGraph} from '../lib/graph';

describe('photo equipment',()=>{
 it('creates distinct, unconnected items with unknown outputs and exact photo locations',()=>{
  const base={...createBlankDisplay({name:'Synthetic',season:'Christmas',year:2027}),propertyPhoto:{photo:'data:image/jpeg;base64,AA',placements:{}}};
  const first=addPhotoEquipment(base,'cord','Backyard',{x:.1,y:.2});
  const second=addPhotoEquipment(first.project,'cord','Backyard',{x:.9,y:.8});
  expect(second.project.nodes.map(n=>n.name)).toEqual(['Extension cord','Extension cord 2']);
  expect(second.project.nodes.every(n=>n.outputs===0&&n.outputsUnknown&&!n.inputGender&&!n.outputGender)).toBe(true);
  expect(second.project.propertyPhoto?.placements).toEqual({[first.nodeId]:{x:.1,y:.2},[second.nodeId]:{x:.9,y:.8}});
  expect(second.project.edges).toEqual([]);
  expect(validateGraph(second.project.nodes,second.project.edges)).toEqual([]);
  expect(base.nodes).toEqual([]);
 });
 it('requires a photo and valid coordinates and never invents an output count',()=>{
  const blank=createBlankDisplay({name:'Synthetic',season:'Halloween',year:2027});
  expect(()=>addPhotoEquipment(blank,'outlet','Other',{x:.5,y:.5})).toThrow('photo');
  const withPhoto={...blank,propertyPhoto:{photo:'data:image/jpeg;base64,AA',placements:{}}};
  expect(()=>addPhotoEquipment(withPhoto,'cord','Other',{x:-.1,y:.5})).toThrow('location');
  const outlet=addPhotoEquipment(withPhoto,'outlet','Other',{x:0,y:1});
  expect(outlet.project.nodes[0]).toMatchObject({outputs:0,outputsUnknown:true});
  const prop=addPhotoEquipment(outlet.project,'decoration','Other',{x:.5,y:.5});
  expect(prop.project.nodes[1]).toMatchObject({outputs:0});
  expect(prop.project.nodes[1].outputsUnknown).toBeUndefined();
 });
 it('lets a user select a type and area and stop repeated placement',async()=>{
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  function Harness(){const [draft,setDraft]=useState<PhotoAddDraft>({kind:null,zone:''});return <PhotoAddPalette value={draft} onChange={setDraft}/>;}
  await act(async()=>root.render(<Harness/>));
  const buttons=()=>Array.from(host.querySelectorAll('button'));
  await act(async()=>buttons().find(b=>b.textContent?.includes('Lights'))!.click());
  expect(buttons().find(b=>b.textContent?.includes('Lights'))?.getAttribute('aria-pressed')).toBe('true');
  const select=host.querySelector<HTMLSelectElement>('select')!;
  await act(async()=>{select.value='Backyard';select.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(host.textContent).toContain('Keep tapping to add more');
  await act(async()=>buttons().find(b=>b.textContent==='Stop adding')!.click());
  expect(host.textContent).not.toContain('Keep tapping to add more');
  expect(buttons().find(b=>b.textContent?.includes('Lights'))?.getAttribute('aria-pressed')).toBe('false');
  await act(async()=>root.unmount());host.remove();
 });
});
