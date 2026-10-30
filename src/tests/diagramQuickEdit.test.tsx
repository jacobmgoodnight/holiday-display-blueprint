import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {DiagramQuickEdit,tidyComponentName} from '../components/DiagramQuickEdit';
import {InspectorIdentity} from '../components/InspectorIdentity';
import {exampleProjects} from '../fixtures/examples';

describe('fast diagram editing without rewiring',()=>{
 const item=exampleProjects()[0].nodes.find(n=>n.id==='h-split')!;
 const season='Halloween' as const;
 it('normalizes renamed labels while preserving meaningful punctuation and refusing empty names',()=>{
  expect(tidyComponentName('   Roofline   C9 · first floor  ')).toBe('Roofline C9 · first floor');
  expect(tidyComponentName('    ')).toBe('');
  expect(tidyComponentName('X'.repeat(150))).toHaveLength(100);
 });
 it('puts selected item name, zone, and icon affordance in the identity card',()=>{
  const html=renderToStaticMarkup(<InspectorIdentity component={item} season={season} onName={()=>{}} onZone={()=>{}} onIcon={()=>{}} onPhotos={()=>{}}/>);
  expect(html).toContain('Rename selected component');
  expect(html).toContain('Selected component zone');
  expect(html).toContain('Change icon for');
  expect(html).toContain('Photos');
  expect(html).toContain(item.name);
  expect(html).toContain('Double-click / right-click');
 });
 it('shows on-diagram rename and icon tabs without changing electrical type or source',()=>{
  const html=renderToStaticMarkup(<DiagramQuickEdit item={item} season={season} position={{id:item.id,left:20,top:30,mode:'name'}} onRename={()=>{}} onIcon={()=>{}} onClose={()=>{}}/>);
  expect(html).toContain('Rename diagram item');
  expect(html).toContain('Rename');
  expect(html).toContain('Icon');
  expect(html).toContain('Names change the label, not the wiring');
 });
 it('allows direct icon selection from the selected item header',async()=>{
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  const onIcon=vi.fn(),onPhotos=vi.fn();
  await act(async()=>root.render(<InspectorIdentity component={item} season={season} onName={()=>{}} onZone={()=>{}} onIcon={onIcon} onPhotos={onPhotos}/>));
  await act(async()=>{(host.querySelector('button[aria-label^="Change icon for"]') as HTMLButtonElement).click();});
  const options=host.querySelectorAll('.visual-icon-suggested button');
  expect(options.length).toBeGreaterThan(1);
  const choose=Array.from(options).find(e=>(e as HTMLButtonElement).getAttribute('aria-label')) as HTMLButtonElement;
  await act(async()=>choose.click());
  expect(onIcon).toHaveBeenCalledTimes(1);
  await act(async()=>{(host.querySelector('button') as HTMLButtonElement).click();});
  await act(async()=>root.unmount());host.remove();
 });
 it('does not save an unfinished diagram rename when focus leaves or the user closes it',async()=>{
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  const onRename=vi.fn(),onClose=vi.fn();
  await act(async()=>root.render(<DiagramQuickEdit item={item} season={season} position={{id:item.id,left:10,top:10,mode:'name'}} onRename={onRename} onIcon={()=>{}} onClose={onClose}/>));
  const input=host.querySelector('input[aria-label="Rename diagram item"]') as HTMLInputElement;
  await act(async()=>{
   const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
   setter?.call(input,'Unfinished new label');
   input.dispatchEvent(new Event('input',{bubbles:true}));
   input.dispatchEvent(new FocusEvent('focusout',{bubbles:true}));
  });
  expect(onRename).not.toHaveBeenCalled();
  await act(async()=>{(host.querySelector('button[aria-label="Close quick editor"]') as HTMLButtonElement).click();});
  expect(onClose).toHaveBeenCalledOnce();
  expect(onRename).not.toHaveBeenCalled();
  await act(async()=>root.unmount());host.remove();
 });
 it('supports icon quick-edit tab without calling rename',async()=>{
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  const onRename=vi.fn(),onIcon=vi.fn(),onClose=vi.fn();
  await act(async()=>root.render(<DiagramQuickEdit item={item} season={season} position={{id:item.id,left:20,top:20,mode:'name'}} onRename={onRename} onIcon={onIcon} onClose={onClose}/>));
  await act(async()=>{(Array.from(host.querySelectorAll('.diagram-quick-tabs button')).find(b=>b.textContent?.includes('Icon')) as HTMLButtonElement).click();});
  const options=Array.from(host.querySelectorAll('.diagram-quick-icons .visual-icon-suggested button'));
  expect(options.length).toBeGreaterThan(1);
  await act(async()=>{(options[1] as HTMLButtonElement).click();});
  expect(onIcon).toHaveBeenCalledTimes(1);
  expect(onRename).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalledOnce();
  await act(async()=>root.unmount());host.remove();
 });
});
