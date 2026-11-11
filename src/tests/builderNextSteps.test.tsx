import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect,vi} from 'vitest';
import {ConnectionOverview} from '../components/ConnectionOverview';
import {PhotoNextSteps} from '../components/PhotoNextSteps';
import {createBlankDisplay} from '../lib/newDisplay';
import {makeNode} from '../lib/model';

describe('builder next steps',()=>{
 it('shows the saved item and invokes only the requested next action',async()=>{
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  const edit=vi.fn(),connect=vi.fn(),draw=vi.fn(),measure=vi.fn();
  await act(async()=>root.render(<PhotoNextSteps itemName="Roof lights" canConnect onEdit={edit} onConnect={connect} onDrawAnother={draw} onMeasure={measure} onDismiss={()=>{}}/>));
  expect(host.textContent).toContain('Saved: Roof lights');expect(host.textContent).toContain('does not create a power connection');
  const button=Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='Estimate length')!;
  await act(async()=>button.click());expect(measure).toHaveBeenCalledOnce();expect(connect).not.toHaveBeenCalled();expect(draw).not.toHaveBeenCalled();
  await act(async()=>root.unmount());host.remove();
 });
 it('shows recorded port occupancy and unknown counts and delegates explicit connections',async()=>{
  const source=makeNode('outlet','Front porch',{x:0,y:0}),target=makeNode('decoration','Other',{x:0,y:0}),unfed=makeNode('cord','Other',{x:0,y:0});
  source.name='Outlet';target.name='Lights';unfed.name='Unknown cord';unfed.outputs=0;unfed.outputsUnknown=true;
  const project={...createBlankDisplay({name:'Test',year:2027,season:'Christmas'}),nodes:[source,target,unfed],edges:[{id:'e',source:source.id,sourcePort:0,target:target.id}]};
  const onConnect=vi.fn(),host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  await act(async()=>root.render(<ConnectionOverview project={project} onConnect={onConnect}/>));
  expect(host.textContent).toContain('Occupied by Lights');expect(host.textContent).toContain('Available');expect(host.textContent).toContain('Output count unknown');
  const connect=host.querySelector<HTMLButtonElement>('[aria-label="Connect Unknown cord"]')!;
  await act(async()=>connect.click());expect(onConnect).toHaveBeenCalledWith(unfed.id);expect(project.edges).toHaveLength(1);
  await act(async()=>root.unmount());host.remove();
 });
});
