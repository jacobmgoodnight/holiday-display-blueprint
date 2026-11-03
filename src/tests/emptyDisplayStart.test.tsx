import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,expect,it,vi} from 'vitest';
import {EmptyDisplayStart} from '../components/EmptyDisplayStart';

describe('starting a blank display',()=>{
 it('offers explicit, independent ways to start without creating anything automatically',async()=>{
  const power=vi.fn(),equipment=vi.fn();
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  try{
   await act(async()=>root.render(<EmptyDisplayStart onAddPowerSource={power} onAddEquipment={equipment}/>));
   expect(host.textContent).toContain('Build your display, one piece at a time');
   expect(host.querySelectorAll('ol li')).toHaveLength(3);
   expect(power).not.toHaveBeenCalled();expect(equipment).not.toHaveBeenCalled();
   const buttons=Array.from(host.querySelectorAll('button'));
   await act(async()=>buttons.find(button=>button.textContent?.includes('Add equipment first'))!.click());
   expect(equipment).toHaveBeenCalledOnce();expect(power).not.toHaveBeenCalled();
   await act(async()=>buttons.find(button=>button.textContent?.includes('Add a power source'))!.click());
   expect(power).toHaveBeenCalledOnce();expect(equipment).toHaveBeenCalledOnce();
  }finally{await act(async()=>root.unmount());host.remove();}
 });
});
