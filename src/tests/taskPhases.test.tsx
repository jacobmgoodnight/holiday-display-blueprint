import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {exampleProjects} from '../fixtures/examples';
import {buildTaskPhases} from '../lib/taskPhases';
import {SeasonTasks} from '../components/SeasonTasks';

describe('phased install and teardown task screen',()=>{
 it('groups existing checklist IDs by phases and practical yard areas',()=>{
  const project=exampleProjects()[0];
  const tasks=buildTaskPhases(project,'setup');
  expect(tasks.map(p=>p.title)).toEqual(['Place equipment','Connect cords & branches','Test and finish']);
  expect(tasks[0].sections.some(s=>s.zone==='Front porch')).toBe(true);
  expect(tasks.flatMap(p=>p.tasks).every(t=>t.id.startsWith('place:')||t.id.startsWith('wire:')||t.id.startsWith('test:'))).toBe(true);
  const teardown=buildTaskPhases(project,'teardown');
  expect(teardown.map(x=>x.title)).toEqual(['Switch off safely','Unplug from the display back','Pack and label']);
  expect(teardown.flatMap(x=>x.tasks).some(x=>x.id.startsWith('pack:'))).toBe(true);
 });
 it('starts with one phase and one area, without expanding every checklist row',()=>{
  const project=exampleProjects()[0];
  const html=renderToStaticMarkup(<SeasonTasks project={project} mode="setup" onLocate={()=>{}} onTaskChange={()=>{}} onError={()=>{}}/>);
  expect(html).toContain('Place equipment');
  expect(html).toContain('Connect cords');
  expect(html).toContain('Notes / photo');
  expect(html).toContain('Find in checklist');
  expect(html).toContain('aria-expanded="false"');
  expect(html).toContain('Front porch');
 });
 it('opens existing task notes and photo inline without resetting completion',async()=>{
  const project=exampleProjects()[0];
  const all=buildTaskPhases(project,'setup').flatMap(p=>p.tasks);
  project.checklist=Object.fromEntries(all.map(t=>[t.id,{done:true}]));
  project.checklist['place:h-prop']={done:false,notes:'Take from garage',photo:'data:image/png;base64,AAAA'};
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  await act(async()=>root.render(<SeasonTasks project={project} mode="setup" onLocate={()=>{}} onTaskChange={()=>{}} onError={()=>{}}/>));
  const task=host.querySelector('[id="task-place:h-prop"]') as HTMLElement;
  expect(task).not.toBeNull();
  expect(task.querySelector('img')).toBeNull();
  await act(async()=>{(Array.from(task.querySelectorAll('button')).find(b=>b.textContent?.includes('Notes / photo')) as HTMLButtonElement).click();});
  expect(task.textContent).toContain('Take from garage');
  expect(task.querySelector('img')?.src).toContain('data:image/png;base64,AAAA');
  expect(project.checklist['place:h-prop'].done).toBe(false);
  await act(async()=>root.unmount());host.remove();
 });
});
