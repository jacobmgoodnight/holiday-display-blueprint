import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect,vi} from 'vitest';
import {BuilderQuickEdit} from '../components/BuilderQuickEdit';
import {exampleProjects} from '../fixtures/examples';
describe('fullscreen Builder Quick Edit',()=>{
 const item=exampleProjects()[0].nodes.find(n=>n.id==='h-split')!;
 const props={component:item,season:'Halloween' as const,onPatch:vi.fn(),onPortLabel:vi.fn(),onPhotos:vi.fn(),onDuplicate:vi.fn()};
 it('shows a compact edit form and a clearly unconnected Duplicate action',()=>{
  const html=renderToStaticMarkup(<BuilderQuickEdit {...props}/>);
  expect(html).toContain('Quick edit item name');
  expect(html).toContain('Quick edit zone');
  expect(html).toContain('Quick edit storage location');
  expect(html).toContain('Quick edit wire color');
  expect(html).toContain('Quick edit item notes');
  expect(html).toContain('Diagram icon and output labels');
  expect(html).toContain('Duplicate unconnected');
  expect(html).toContain('Auto-save on');
 });
 it('executes the Duplicate and Photo callbacks when selected',async()=>{
  const host=document.createElement('div');document.body.append(host);
  const root=createRoot(host);
  const onDuplicate=vi.fn(),onPhotos=vi.fn();
  await act(async()=>{root.render(<BuilderQuickEdit {...props} onDuplicate={onDuplicate} onPhotos={onPhotos}/>);});
  const buttons=[...host.querySelectorAll('button')];
  await act(async()=>{buttons.find(b=>b.textContent?.includes('Duplicate unconnected'))!.click();});
  await act(async()=>{buttons.find(b=>b.textContent?.includes('Photos'))!.click();});
  expect(onDuplicate).toHaveBeenCalledTimes(1);
  expect(onPhotos).toHaveBeenCalledTimes(1);
  await act(async()=>{root.unmount();});host.remove();
 });
 it('asks user to tap a component when none is selected',()=>{
  const html=renderToStaticMarkup(<BuilderQuickEdit {...props} component={undefined}/>);
  expect(html).toContain('Tap an item on the diagram');
  expect(html).not.toContain('Duplicate unconnected');
 });
});

describe('quick edit usability',()=>{
 const item=exampleProjects()[0].nodes.find(n=>n.kind==='cord')!;
 const props={season:'Halloween' as const,onPortLabel:vi.fn(),onPhotos:vi.fn(),onDuplicate:vi.fn()};
 it('keeps the most common edits visible and groups optional details',()=>{
  const html=renderToStaticMarkup(<BuilderQuickEdit {...props} component={item} onPatch={()=>{}}/>);
  expect(html).toContain('Quick edit item name');
  expect(html).toContain('Quick edit zone');
  expect(html).toContain('<summary>Color, storage and notes</summary>');
  expect(html).toContain('Duplicate unconnected');
 });
 it('records an explicitly selected output count including two-digit values',async()=>{
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);const onPatch=vi.fn();
  await act(async()=>root.render(<BuilderQuickEdit {...props} component={{...item,outputs:0,outputsUnknown:true}} onPatch={onPatch}/>));
  const select=host.querySelector('select[aria-label="Quick edit known outputs"]') as HTMLSelectElement;
  expect(select.value).toBe('');
  expect(onPatch).not.toHaveBeenCalled();
  await act(async()=>{select.value='12';select.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(onPatch).toHaveBeenCalledExactlyOnceWith({outputs:12,outputsUnknown:false});
  await act(async()=>root.unmount());host.remove();
 });
 it('does not offer zero outputs for an outlet',()=>{
  const outlet={...item,kind:'outlet' as const,outputs:0,outputsUnknown:true};
  const html=renderToStaticMarkup(<BuilderQuickEdit {...props} component={outlet} onPatch={()=>{}}/>);
  expect(html).not.toContain('<option value="0">0</option>');
  expect(html).toContain('<option value="16">16</option>');
 });
});
