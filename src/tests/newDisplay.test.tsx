import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe, expect, it, vi} from 'vitest';
import {NewDisplay} from '../components/NewDisplay';

function setInput(input:HTMLInputElement, value:string){
 const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!;
 setter.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));
}
describe('new display dialog',()=>{
 it('requires a name and four-digit year before creating a trimmed draft',async()=>{
  const host=document.createElement('div');document.body.append(host);
  const root=createRoot(host),onCreate=vi.fn(),onClose=vi.fn();
  await act(async()=>root.render(<NewDisplay initialSeason="Halloween" initialYear={2026} onCreate={onCreate} onClose={onClose}/>));
  const form=host.querySelector('form')!,name=host.querySelector<HTMLInputElement>('#new-display-name')!,year=host.querySelector<HTMLInputElement>('#new-display-year')!;
  expect(host.querySelector('[role="dialog"]')?.getAttribute('aria-labelledby')).toBe('new-display-title');
  expect(document.activeElement).toBe(name);
  await act(async()=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  expect(host.querySelector('[role="alert"]')?.textContent).toContain('name');expect(onCreate).not.toHaveBeenCalled();
  await act(async()=>{setInput(name,'  Front yard  ');setInput(year,'26');});
  await act(async()=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  expect(host.querySelector('[role="alert"]')?.textContent).toContain('four-digit');expect(onCreate).not.toHaveBeenCalled();
  await act(async()=>{setInput(year,'2027');const season=host.querySelector<HTMLSelectElement>('#new-display-season')!;season.value='Christmas';season.dispatchEvent(new Event('change',{bubbles:true}));});
  await act(async()=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  expect(onCreate).toHaveBeenCalledWith({name:'Front yard',season:'Christmas',year:2027});
  expect(onClose).not.toHaveBeenCalled();
  await act(async()=>root.unmount());host.remove();
 });
 it('cancels with Escape without creating a plan and returns focus',async()=>{
  const trigger=document.createElement('button');document.body.append(trigger);trigger.focus();
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),onCreate=vi.fn(),onClose=vi.fn();
  await act(async()=>root.render(<NewDisplay initialSeason="Christmas" initialYear={2026} onCreate={onCreate} onClose={onClose}/>));
  await act(async()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
  expect(onClose).toHaveBeenCalledTimes(1);expect(onCreate).not.toHaveBeenCalled();
  await act(async()=>root.unmount());expect(document.activeElement).toBe(trigger);host.remove();trigger.remove();
 });
});
