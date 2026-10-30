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
 it('renders actionable checkboxes, notes, and reference photos from existing data',()=>{
  const project=exampleProjects()[0];
  project.checklist['place:h-prop']={done:true,notes:'Take from garage',photo:'data:image/png;base64,AAAA'};
  const html=renderToStaticMarkup(<SeasonTasks project={project} mode="setup" onLocate={()=>{}} onTaskChange={()=>{}} onError={()=>{}}/>);
  expect(html).toContain('Place equipment');
  expect(html).toContain('Connect cords');
  expect(html).toContain('Notes &amp; photo');
  expect(html).toContain('data:image/png;base64,AAAA');
  expect(html).toContain('Take from garage');
  expect(html).toContain('checkbox');
  expect(html).toContain('Front porch');
 });
});
