import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {FullscreenConnectPanel} from '../components/FullscreenConnectPanel';
import {exampleProjects} from '../fixtures/examples';
import type {Component} from '../lib/model';

describe('fullscreen connection steps',()=>{
 const example=exampleProjects()[0];
 const base=example.nodes[0];
 const source={...base,id:'source',name:'Wall outlet',kind:'outlet' as const,outputs:2,outputsUnknown:false};
 const full={...base,id:'full',name:'Full cord',kind:'cord' as const,outputs:1,outputsUnknown:false};
 const unknown={...base,id:'unknown',name:'Unknown cord',kind:'cord' as const,outputs:0,outputsUnknown:true};
 const leaf={...base,id:'leaf',name:'Decoration',kind:'decoration' as const,outputs:0,outputsUnknown:false};
 const project={...example,nodes:[source,full,unknown,leaf],edges:[{id:'a',source:'source',sourcePort:0,target:'full'},{id:'b',source:'full',sourcePort:0,target:'leaf'}]};
 const handlers=()=>({onLayoutChange:vi.fn(),onBeginSource:vi.fn(),onPortChange:vi.fn(),onCancel:vi.fn(),onDisconnect:vi.fn(),onRemove:vi.fn()});
 it('explains unavailable sources and never assumes a source or output',async()=>{
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);const callbacks=handlers();
  await act(async()=>root.render(<FullscreenConnectPanel project={project} sourceId={null} sourcePort={null} layoutMode="auto" {...callbacks}/>));
  const picker=host.querySelector('select[aria-label="Choose a power source"]') as HTMLSelectElement;
  expect(picker.value).toBe('');
  expect(picker.querySelector<HTMLOptionElement>('option[value="full"]')?.disabled).toBe(true);
  expect(picker.querySelector<HTMLOptionElement>('option[value="unknown"]')?.textContent).toContain('outputs unknown');
  expect(picker.querySelector<HTMLOptionElement>('option[value="unknown"]')?.disabled).toBe(true);
  expect(picker.querySelector<HTMLOptionElement>('option[value="leaf"]')?.textContent).toContain('no outputs');
  await act(async()=>{picker.value='source';picker.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(callbacks.onBeginSource).toHaveBeenCalledExactlyOnceWith('source');
  expect(callbacks.onPortChange).not.toHaveBeenCalled();
  await act(async()=>root.unmount());host.remove();
 });
 it('offers only free source outputs and supports explicit selection and cancellation',async()=>{
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);const callbacks=handlers();
  await act(async()=>root.render(<FullscreenConnectPanel project={project} selectedNode={source} sourceId="source" sourcePort={null} layoutMode="auto" {...callbacks}/>));
  const picker=host.querySelector('select[aria-label="Builder source output"]') as HTMLSelectElement;
  expect(picker.value).toBe('');
  expect(picker.querySelector('option[value="0"]')).toBeNull();
  expect(picker.querySelector('option[value="1"]')).not.toBeNull();
  expect(host.textContent).toContain('Choose the actual output');
  await act(async()=>{picker.value='1';picker.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(callbacks.onPortChange).toHaveBeenCalledExactlyOnceWith(1);
  await act(async()=>{Array.from(host.querySelectorAll('button')).find(b=>b.textContent?.includes('Cancel connection'))!.click();});
  expect(callbacks.onCancel).toHaveBeenCalledOnce();
  expect(callbacks.onDisconnect).not.toHaveBeenCalled();
  await act(async()=>root.unmount());host.remove();
 });
 it('gives actionable guidance when the selected item has unknown or occupied outputs',()=>{
  const callbacks=handlers();
  const render=(selectedNode:Component)=>(renderToStaticMarkup(<FullscreenConnectPanel project={project} selectedNode={selectedNode} sourceId={null} sourcePort={null} layoutMode="auto" {...callbacks}/>));
  expect(render(unknown)).toContain('Use Quick edit to record the actual count');
  expect(render(full)).toContain('All outputs on this item are occupied');
 });
});
