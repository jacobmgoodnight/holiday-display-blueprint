import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {InstallationGuide} from '../components/InstallationGuide';
import {exampleProjects} from '../fixtures/examples';
describe('installation guide photo and print content',()=>{
 it('renders locally attached reference photos beside setup steps',()=>{
  const p=exampleProjects()[0];
  p.nodes.find(n=>n.id==='h-prop')!.photo='data:image/png;base64,Zm9v';
  const html=renderToStaticMarkup(<InstallationGuide project={p} scope={new Set(p.nodes.map(n=>n.id))} scopeLabel="O01 porch" onLocate={()=>{}} onTaskChange={()=>{}}/>);
  expect(html).toContain('ig-step-photo');
  expect(html).toContain('Installation reference for');
  expect(html).toContain('data:image/png;base64,Zm9v');
  expect(html).toContain('O01 porch');
  expect(html).toContain('Print this view');
 });
 it('prefers task-specific photograph over component photo',()=>{
  const p=exampleProjects()[0];
  p.nodes.find(n=>n.id==='h-prop')!.photo='data:image/png;base64,Y29tcG9uZW50';
  p.checklist['place:h-prop']={done:false,notes:'At porch',photo:'data:image/png;base64,dGFzaw=='};
  const html=renderToStaticMarkup(<InstallationGuide project={p} scope={new Set(p.nodes.map(n=>n.id))} scopeLabel="O01 porch" onLocate={()=>{}} onTaskChange={()=>{}}/>);
  expect(html).toContain('data:image/png;base64,dGFzaw==');
  expect(html).toContain('Note: At porch');
 });
});
