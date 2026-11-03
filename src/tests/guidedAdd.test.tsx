import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,expect,it,vi} from 'vitest';
import {GuidedAdd,availableSources} from '../components/GuidedAdd';
import {createBlankDisplay} from '../lib/newDisplay';
import {makeNode} from '../lib/model';

const select=(host:HTMLElement,label:string,value:string)=>{const el=host.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!;el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));};
const button=(host:HTMLElement,label:string)=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent?.trim().endsWith(label))!;
const submit=(host:HTMLElement)=>host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
describe('guided equipment builder',()=>{
 it('requires area and explicit outlet count, then stays open for another item',async()=>{
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),onAdd=vi.fn(()=>true);
  await act(async()=>root.render(<GuidedAdd project={createBlankDisplay({name:'Test',year:2027,season:'Christmas'})} reusable={[]} onAdd={onAdd} onReuse={()=>true} onConnect={()=>true} onClose={()=>{}}/>));
  await act(async()=>button(host,'Outlet').click());
  await act(async()=>select(host,'Item area','Front porch'));
  await act(async()=>submit(host));expect(onAdd).not.toHaveBeenCalled();
  expect(host.querySelector<HTMLSelectElement>('[aria-label="Number of known outputs"] option[value="0"]')).toBeNull();
  await act(async()=>select(host,'Number of known outputs','2'));
  await act(async()=>submit(host));expect(onAdd).toHaveBeenCalledWith({kind:'outlet',name:'',zone:'Front porch',outputs:2});
  expect(host.querySelector('[role=status]')?.textContent).toContain('Add another');
  expect(host.querySelector('form')).not.toBeNull();
  await act(async()=>root.unmount());host.remove();
 });
 it('offers only free ports, and does not select a source or output for a new connection',async()=>{
  const outlet=makeNode('outlet','Front porch',{x:0,y:0}),light=makeNode('decoration','Front porch',{x:1,y:1});
  const project={...createBlankDisplay({name:'Test',year:2027,season:'Christmas'}),nodes:[outlet,light],edges:[{id:'edge',source:outlet.id,sourcePort:0,target:light.id}]};
  expect(availableSources(project)[0].ports).toEqual([1]);
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),onAdd=vi.fn(()=>true);
  await act(async()=>root.render(<GuidedAdd project={project} reusable={[]} onAdd={onAdd} onReuse={()=>true} onConnect={()=>true} onClose={()=>{}}/>));
  await act(async()=>button(host,'Extension cord').click());
  await act(async()=>{select(host,'Item area','Backyard');select(host,'Number of known outputs','1');});
  await act(async()=>host.querySelectorAll<HTMLInputElement>('input[name="guided-connection"]')[1].click());
  await act(async()=>submit(host));expect(onAdd).not.toHaveBeenCalled();
  await act(async()=>select(host,'Power source',outlet.id));
  await act(async()=>submit(host));expect(onAdd).not.toHaveBeenCalled();
  expect(Array.from(host.querySelector<HTMLSelectElement>('[aria-label="Source output"]')!.options).map(o=>o.value)).toEqual(['','1']);
  await act(async()=>select(host,'Source output','1'));
  await act(async()=>submit(host));expect(onAdd).toHaveBeenCalledWith({kind:'cord',name:'',zone:'Backyard',outputs:1,sourceId:outlet.id,port:1});
  await act(async()=>root.unmount());host.remove();
 });
 it('can add a decoration without creating a feed',async()=>{
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),onAdd=vi.fn(()=>true);
  await act(async()=>root.render(<GuidedAdd project={createBlankDisplay({name:'Test',year:2027,season:'Christmas'})} reusable={[]} onAdd={onAdd} onReuse={()=>true} onConnect={()=>true} onClose={()=>{}}/>));
  await act(async()=>button(host,'Decoration').click());await act(async()=>select(host,'Item area','Other'));
  await act(async()=>submit(host));expect(onAdd).toHaveBeenCalledWith({kind:'decoration',name:'',zone:'Other'});
  await act(async()=>root.unmount());host.remove();
 });
 it('opens with an initial kind, exposes errors, traps keyboard focus and restores the trigger',async()=>{
  const trigger=document.createElement('button');document.body.append(trigger);trigger.focus();
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),onClose=vi.fn(),onClearError=vi.fn();
  await act(async()=>root.render(<GuidedAdd project={createBlankDisplay({name:'Test',year:2027,season:'Christmas'})} reusable={[]} initialKind="cord" error="Could not add item" onClearError={onClearError} onAdd={()=>false} onReuse={()=>true} onConnect={()=>true} onClose={onClose}/>));
  expect(host.querySelector('[role=dialog]')?.getAttribute('aria-modal')).toBe('true');
  expect(document.activeElement?.textContent).toBe('Build your display');
  expect(host.querySelector('[role=alert]')?.textContent).toContain('Could not add');
  expect(button(host,'Extension cord').getAttribute('aria-pressed')).toBe('true');
  await act(async()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true})));
  expect(document.activeElement?.textContent).toBe('Done');
  await act(async()=>select(host,'Item area','Other'));expect(onClearError).toHaveBeenCalled();
  await act(async()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));
  expect(onClose).toHaveBeenCalledTimes(1);
  await act(async()=>root.unmount());expect(document.activeElement).toBe(trigger);host.remove();trigger.remove();
 });

 it('allows an unknown outlet count while distinguishing it from confirmed zero',async()=>{
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),onAdd=vi.fn(()=>true);
  await act(async()=>root.render(<GuidedAdd project={createBlankDisplay({name:'Test',year:2027,season:'Christmas'})} reusable={[]} onAdd={onAdd} onReuse={()=>true} onConnect={()=>true} onClose={()=>{}}/>));
  await act(async()=>button(host,'Outlet').click());await act(async()=>select(host,'Item area','Front porch'));
  await act(async()=>select(host,'Number of known outputs','unknown'));await act(async()=>submit(host));
  expect(onAdd).toHaveBeenCalledWith({kind:'outlet',name:'',zone:'Front porch',outputs:0,outputsUnknown:true});
  await act(async()=>button(host,'Extension cord').click());await act(async()=>select(host,'Number of known outputs','0'));await act(async()=>submit(host));
  expect(onAdd).toHaveBeenLastCalledWith({kind:'cord',name:'',zone:'Front porch',outputs:0});
  await act(async()=>root.unmount());host.remove();
 });

 it('connects existing unconnected items only after choosing a source and free output',async()=>{
  const outlet=makeNode('outlet','Front porch',{x:0,y:0}),target=makeNode('decoration','Other',{x:1,y:1}),already=makeNode('decoration','Other',{x:2,y:2});
  const project={...createBlankDisplay({name:'Test',year:2027,season:'Christmas'}),nodes:[outlet,target,already],edges:[{id:'old',source:outlet.id,sourcePort:0,target:already.id}]};
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),onConnect=vi.fn(()=>true);
  await act(async()=>root.render(<GuidedAdd project={project} reusable={[]} onAdd={()=>true} onReuse={()=>true} onConnect={onConnect} onClose={()=>{}}/>));
  const targetOptions=Array.from(host.querySelector<HTMLSelectElement>('[aria-label="Existing item to connect"]')!.options).map(o=>o.value);
  expect(targetOptions).toEqual(['',target.id]);
  await act(async()=>select(host,'Existing item to connect',target.id));
  expect(button(host,'Connect item').disabled).toBe(true);
  await act(async()=>select(host,'Existing item power source',outlet.id));
  expect(button(host,'Connect item').disabled).toBe(true);
  expect(Array.from(host.querySelector<HTMLSelectElement>('[aria-label="Existing item source output"]')!.options).map(o=>o.value)).toEqual(['','1']);
  await act(async()=>select(host,'Existing item source output','1'));
  await act(async()=>button(host,'Connect item').click());
  expect(onConnect).toHaveBeenCalledWith(target.id,outlet.id,1);expect(host.querySelector('[role=status]')?.textContent).toContain('connected');
  expect(host.querySelector('[role=dialog]')).not.toBeNull();
  await act(async()=>root.unmount());host.remove();
 });

});
