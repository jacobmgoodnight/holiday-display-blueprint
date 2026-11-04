import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,expect,it,vi} from 'vitest';
import {useUnsavedPhotoGuard} from '../lib/useUnsavedPhotoGuard';

describe('unsaved photo navigation guard',()=>{
 it('allows normal navigation and warns only while photo work is pending',async()=>{
  let guard:()=>boolean=()=>false;
  function Harness({dirty}:{dirty:boolean}){guard=useUnsavedPhotoGuard(dirty);return null;}
  const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  await act(async()=>root.render(<Harness dirty={false}/>));
  expect(guard()).toBe(true);expect(confirm).not.toHaveBeenCalled();
  let unload=new Event('beforeunload',{cancelable:true});expect(window.dispatchEvent(unload)).toBe(true);
  await act(async()=>root.render(<Harness dirty/>));
  expect(guard()).toBe(false);expect(confirm).toHaveBeenCalledOnce();
  unload=new Event('beforeunload',{cancelable:true});expect(window.dispatchEvent(unload)).toBe(false);expect(unload.defaultPrevented).toBe(true);
  confirm.mockReturnValue(true);expect(guard()).toBe(true);
  await act(async()=>root.render(<Harness dirty={false}/>));
  unload=new Event('beforeunload',{cancelable:true});expect(window.dispatchEvent(unload)).toBe(true);
  await act(async()=>root.unmount());host.remove();confirm.mockRestore();
 });
});
