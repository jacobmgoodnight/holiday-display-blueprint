import {act,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,expect,it,vi} from 'vitest';
import {PhotoConnect,photoConnectionSourceReason} from '../components/PhotoConnect';
import {createBlankDisplay} from '../lib/newDisplay';
import {makeNode} from '../lib/model';

const button=(host:HTMLElement,text:string)=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent?.includes(text))!;
describe('photo connection panel',()=>{
 it('requires an explicitly selected source and free output and displays occupied ports',async()=>{
  const outlet=makeNode('outlet','Front porch',{x:0,y:0}),target=makeNode('decoration','Other',{x:0,y:0}),other=makeNode('decoration','Other',{x:0,y:0});
  outlet.name='Wall outlet';other.name='Existing lights';
  const project={...createBlankDisplay({name:'Test',year:2027,season:'Christmas'}),nodes:[outlet,target,other],edges:[{id:'old',source:outlet.id,sourcePort:0,target:other.id}]};
  const onConnect=vi.fn(()=>true);
  function Harness(){const [source,setSource]=useState('');return <PhotoConnect project={project} targetId={target.id} sourceId={source} onSourceChange={setSource} onConnect={onConnect} onCancel={()=>{}}/>;}
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  await act(async()=>root.render(<Harness/>));
  expect(button(host,'Save connection').disabled).toBe(true);
  const select=host.querySelector<HTMLSelectElement>('select')!;
  await act(async()=>{select.value=outlet.id;select.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(button(host,'Save connection').disabled).toBe(true);
  expect(button(host,'Output 1').disabled).toBe(true);expect(button(host,'Output 1').textContent).toContain('Occupied by Existing lights');
  await act(async()=>button(host,'Output 2').click());
  await act(async()=>button(host,'Save connection').click());
  expect(onConnect).toHaveBeenCalledWith(outlet.id,1);
  await act(async()=>root.unmount());host.remove();
 });
 it('explains invalid marker choices and prevents loops, unknown outputs and rewiring',async()=>{
  const target=makeNode('cord','Other',{x:0,y:0}),child=makeNode('cord','Other',{x:0,y:0}),unknown=makeNode('cord','Other',{x:0,y:0}),outlet=makeNode('outlet','Other',{x:0,y:0});
  unknown.outputs=0;unknown.outputsUnknown=true;
  const project={...createBlankDisplay({name:'Test',year:2027,season:'Christmas'}),nodes:[target,child,unknown,outlet],edges:[{id:'child',source:target.id,sourcePort:0,target:child.id}]};
  expect(photoConnectionSourceReason(project,target.id,target.id)).toContain('itself');
  expect(photoConnectionSourceReason(project,target.id,child.id)).toContain('power loop');
  expect(photoConnectionSourceReason(project,target.id,unknown.id)).toContain('unknown');
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),onConnect=vi.fn(()=>true);
  const render=(source:string,p=project)=><PhotoConnect project={p} targetId={target.id} sourceId={source} onSourceChange={()=>{}} onConnect={onConnect} onCancel={()=>{}}/>;
  await act(async()=>root.render(render(child.id)));expect(host.querySelector('[role=status]')?.textContent).toContain('power loop');expect(button(host,'Save connection').disabled).toBe(true);
  await act(async()=>root.render(render(unknown.id)));expect(host.querySelector('[role=status]')?.textContent).toContain('unknown');
  const full={...project,edges:[...project.edges,{id:'taken1',source:outlet.id,sourcePort:0,target:unknown.id},{id:'taken2',source:outlet.id,sourcePort:1,target:child.id}]};
  await act(async()=>root.render(render(outlet.id,full)));expect(host.querySelector('[role=status]')?.textContent).toContain('already occupied');expect(button(host,'Output 1').disabled).toBe(true);expect(button(host,'Output 2').textContent).toContain('Occupied');
  const connected={...project,edges:[...project.edges,{id:'feed',source:outlet.id,sourcePort:0,target:target.id}]};
  await act(async()=>root.render(render(outlet.id,connected)));expect(host.textContent).toContain('already has a recorded connection');expect(host.textContent).not.toContain('Save connection');expect(onConnect).not.toHaveBeenCalled();
  await act(async()=>root.unmount());host.remove();
 });
 it('records an unknown output count only when explicitly chosen, then requires choosing an output',async()=>{
  const outlet=makeNode('outlet','Front porch',{x:0,y:0}),target=makeNode('decoration','Other',{x:0,y:0});
  outlet.outputs=0;outlet.outputsUnknown=true;
  const initial={...createBlankDisplay({name:'Test',year:2027,season:'Christmas'}),nodes:[outlet,target],edges:[]};
  const onConnect=vi.fn(()=>true),onSetOutputs=vi.fn();
  function Harness(){const [project,setProject]=useState(initial);return <PhotoConnect project={project} targetId={target.id} sourceId={outlet.id} onSourceChange={()=>{}} onSetOutputs={(id,count)=>{onSetOutputs(id,count);setProject(p=>({...p,nodes:p.nodes.map(n=>n.id===id?{...n,outputs:count,outputsUnknown:undefined}:n)}));return true;}} onConnect={onConnect} onCancel={()=>{}}/>;}
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  await act(async()=>root.render(<Harness/>));
  const count=host.querySelector<HTMLSelectElement>('[aria-label="Actual number of outputs"]')!;
  expect(count.value).toBe('');expect(Array.from(count.options).some(o=>o.value==='0')).toBe(false);expect(button(host,'Save output count').disabled).toBe(true);
  await act(async()=>{count.value='1';count.dispatchEvent(new Event('change',{bubbles:true}));});
  await act(async()=>button(host,'Save output count').click());
  expect(onSetOutputs).toHaveBeenCalledWith(outlet.id,1);expect(onConnect).not.toHaveBeenCalled();expect(button(host,'Save connection').disabled).toBe(true);
  await act(async()=>button(host,'Output 1').click());await act(async()=>button(host,'Save connection').click());
  expect(onConnect).toHaveBeenCalledWith(outlet.id,0);
  await act(async()=>root.unmount());host.remove();
 });
});
