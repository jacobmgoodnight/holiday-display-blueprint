import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect,vi} from 'vitest';
import {MobileMenuToggle} from '../components/MobileMenuToggle';

describe('responsive header menu button',()=>{
 it('opens the mobile drawer with an accessible action',async()=>{
  const container=document.createElement('div');document.body.append(container);
  const root=createRoot(container);const toggle=vi.fn();
  await act(async()=>{root.render(<MobileMenuToggle open={false} onToggle={toggle}/>);});
  const button=container.querySelector('button')!;
  expect(button.getAttribute('aria-label')).toBe('Open menu');
  expect(button.getAttribute('aria-expanded')).toBe('false');
  expect(button.getAttribute('aria-controls')).toBe('mobile-navigation');
  await act(async()=>{button.click();});
  expect(toggle).toHaveBeenCalledTimes(1);
  await act(async()=>{root.unmount();});container.remove();
 });
 it('shows an explicit close action when navigation is open',async()=>{
  const container=document.createElement('div');document.body.append(container);
  const root=createRoot(container);const toggle=vi.fn();
  await act(async()=>{root.render(<MobileMenuToggle open={true} onToggle={toggle}/>);});
  const button=container.querySelector('button')!;
  expect(button.getAttribute('aria-label')).toBe('Close menu');
  expect(button.getAttribute('aria-expanded')).toBe('true');
  await act(async()=>{button.click();});
  expect(toggle).toHaveBeenCalledTimes(1);
  await act(async()=>{root.unmount();});container.remove();
 });
});
