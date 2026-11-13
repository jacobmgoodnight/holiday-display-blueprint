import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect,vi} from 'vitest';
import {QuickEquipmentPalette} from '../components/QuickEquipmentPalette';

describe('diagram equipment palette',()=>{
 it('lets a user choose a common item without creating it automatically',async()=>{
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),onChange=vi.fn();
  await act(async()=>root.render(<QuickEquipmentPalette onChange={onChange}/>));
  expect(host.querySelector('[aria-label="Common equipment types"]')).not.toBeNull();
  const cord=Array.from(host.querySelectorAll('button')).find(b=>b.textContent?.includes('Cord'))!;
  await act(async()=>cord.click());expect(onChange).toHaveBeenCalledExactlyOnceWith('cord');
  await act(async()=>root.render(<QuickEquipmentPalette value="cord" onChange={onChange}/>));
  expect(cord.getAttribute('aria-pressed')).toBe('true');
  await act(async()=>root.unmount());host.remove();
 });
});
