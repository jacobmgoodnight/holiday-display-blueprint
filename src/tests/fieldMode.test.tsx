import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {FieldMode} from '../components/FieldMode';
import {exampleProjects} from '../fixtures/examples';

describe('phone-first Field Mode',()=>{
 const project=exampleProjects()[0];
 it('shows a real outlet chooser and the next unchecked task',()=>{
  const html=renderToStaticMarkup(<FieldMode project={project} onLocate={()=>{}} onTaskChange={()=>{}} onEdit={()=>{}}/>);
  expect(html).toContain('Set up your display');
  expect(html).toContain('Continue installation');
  expect(html).toContain('O01');
  expect(html).toContain('Mark step complete');
  expect(html).toContain('Show detailed wiring');
  expect(html).toContain('aria-pressed="true"');
  expect(html).not.toContain('class="field-guide" open');
  expect(html).toContain('Field Mode documents your plan');
 });
 it('offers one-tap full screen exploration from the phone field view',()=>{
  const html=renderToStaticMarkup(<FieldMode project={project} onLocate={()=>{}} onTaskChange={()=>{}} onEdit={()=>{}} onExplore={()=>{}} onTasks={()=>{}}/>);
  expect(html).toContain('Fullscreen diagram');
  expect(html).toContain('Edit wiring');
  expect(html).toContain('Install checklist');
 });
 it('recognizes completion of every step, while retaining warnings',()=>{
  const initial=renderToStaticMarkup(<FieldMode project={project} onLocate={()=>{}} onTaskChange={()=>{}} onEdit={()=>{}}/>);
  expect(initial).toContain('installation steps complete');
  const keys=Object.fromEntries(project.nodes.map(n=>['place:'+n.id,{done:true}]));
  const checked={...project,checklist:{...project.checklist,...keys}};
  const html=renderToStaticMarkup(<FieldMode project={checked} onLocate={()=>{}} onTaskChange={()=>{}} onEdit={()=>{}}/>);
  expect(html).toContain('installation steps complete');
 });
});
