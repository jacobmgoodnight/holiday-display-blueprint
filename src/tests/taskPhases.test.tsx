import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect,vi} from 'vitest';
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
 it('opens the chosen area, reports its progress, and finds the next step after rendering',async()=>{
  const project=exampleProjects()[0];
  const phases=buildTaskPhases(project,'setup');
  const area=phases.flatMap(p=>p.sections).find(s=>s.zone!=='Front porch')!;
  const expected=phases.flatMap(p=>p.sections.filter(s=>s.zone===area.zone).flatMap(s=>s.tasks))[0];
  expect(expected).toBeDefined();
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  const scroll=vi.fn();const previous=HTMLElement.prototype.scrollIntoView;HTMLElement.prototype.scrollIntoView=scroll;
  try{
   await act(async()=>root.render(<SeasonTasks project={project} mode="setup" onLocate={()=>{}} onTaskChange={()=>{}} onError={()=>{}}/>));
   const select=host.querySelector('select')!;
   await act(async()=>{select.value=area.zone;select.dispatchEvent(new Event('change',{bubbles:true}));});
   expect(host.querySelector(`[id="task-${expected.id}"]`)).not.toBeNull();
   const firstPhase=phases.find(p=>p.sections.some(s=>s.zone===area.zone))!;
   const section=firstPhase.sections.find(s=>s.zone===area.zone)!;
   expect(host.querySelector('.season-phase-progress')?.textContent).toBe(`${section.done}/${section.tasks.length}`);
   await act(async()=>{(host.querySelector('.season-phase-heading') as HTMLButtonElement).click();});
   expect(host.querySelector(`[id="task-${expected.id}"]`)).toBeNull();
   await act(async()=>{(Array.from(host.querySelectorAll('button')).find(b=>b.textContent?.includes('Find in checklist')) as HTMLButtonElement).click();});
   expect(host.querySelector(`[id="task-${expected.id}"]`)).not.toBeNull();
   expect(scroll).toHaveBeenCalledOnce();
  }finally{HTMLElement.prototype.scrollIntoView=previous;await act(async()=>root.unmount());host.remove();}
 });
 it('shows empty areas accurately and resets the view when the project or mode changes',async()=>{
  const project=exampleProjects()[0];
  const emptyArea=(['Front porch','Garage & driveway','Backyard','Other'] as const).find(z=>!buildTaskPhases(project,'setup').some(p=>p.sections.some(s=>s.zone===z)))!;
  expect(emptyArea).toBeDefined();
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  const render=(p:typeof project,mode:'setup'|'teardown')=><SeasonTasks project={p} mode={mode} onLocate={()=>{}} onTaskChange={()=>{}} onError={()=>{}}/>;
  await act(async()=>root.render(render(project,'setup')));
  await act(async()=>{const select=host.querySelector('select')!;select.value=emptyArea;select.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(host.textContent).toContain(`No steps for ${emptyArea}`);
  expect(host.textContent).not.toContain(`All steps for ${emptyArea} are checked`);
  await act(async()=>root.render(render(project,'teardown')));
  expect(host.querySelector('select')?.value).toBe('all');
  expect(host.textContent).toContain('Switch off safely');
  await act(async()=>{const select=host.querySelector('select')!;select.value=emptyArea;select.dispatchEvent(new Event('change',{bubbles:true}));});
  await act(async()=>root.render(render({...project,id:'another-project'},'teardown')));
  expect(host.querySelector('select')?.value).toBe('all');
  await act(async()=>root.unmount());host.remove();
 });
 it('keeps tasks with an unrecognized or missing area accessible under Other',()=>{
  const project=exampleProjects()[0];
  const node=project.nodes.find(n=>n.kind!=='outlet')!;
  const legacy={...project,nodes:project.nodes.map(n=>n.id===node.id?{...n,zone:undefined as unknown as typeof n.zone}:n)};
  const phases=buildTaskPhases(legacy,'setup');
  const task=phases[0].sections.find(s=>s.zone==='Other')?.tasks.find(t=>t.id===`place:${node.id}`);
  expect(task?.label).toContain('Other');
 });
});
