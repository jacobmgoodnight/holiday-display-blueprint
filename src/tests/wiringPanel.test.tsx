import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,expect,it,vi} from 'vitest';
import {PlugInPanel} from '../components/PlugInPanel';
import {WirePanel} from '../components/WirePanel';
import {PowerInSection,PowerOutSection} from '../components/PowerSections';
import {PhotoConnect} from '../components/PhotoConnect';
import {createBlankDisplay} from '../lib/newDisplay';
import {makeNode} from '../lib/model';
import type {Project} from '../lib/model';
import {outputIsFree,outputRows,plugInTargets,unpluggedItems} from '../lib/wiringPanel';

const button=(host:HTMLElement,text:string)=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent?.includes(text))!;
async function mount(ui:React.ReactNode){const host=document.createElement('div');document.body.append(host);const root=createRoot(host);await act(async()=>root.render(ui));return {host,root,done:async()=>{await act(async()=>root.unmount());host.remove();}};}
function sample(){
 const outlet=makeNode('outlet','Front porch',{x:0,y:0}),cord=makeNode('cord','Front porch',{x:0,y:0}),lights=makeNode('light-strand','Front porch',{x:0,y:0}),ghost=makeNode('decoration','Other',{x:0,y:0});
 outlet.name='Porch outlet';cord.name='Green cord';lights.name='Roof lights';ghost.name='Ghost';
 const project:Project={...createBlankDisplay({name:'Test',year:2027,season:'Halloween'}),nodes:[outlet,cord,lights,ghost],edges:[{id:'e1',source:outlet.id,sourcePort:0,target:cord.id},{id:'e2',source:cord.id,sourcePort:0,target:lights.id}],checklist:{'wire:e1':{done:true}}};
 return {project,outlet,cord,lights,ghost};
}

describe('wiring panel helpers',()=>{
 it('lists every recorded output with its occupant and nothing for unknown counts',()=>{
  const {project,outlet,cord}=sample();
  const rows=outputRows(project,outlet);
  expect(rows.map(r=>r.occupant?.name)).toEqual(['Green cord',undefined]);
  expect(outputRows(project,{...cord,outputs:0,outputsUnknown:true})).toEqual([]);
 });
 it('only treats a known, existing, unoccupied output as free',()=>{
  const {project,outlet}=sample();
  expect(outputIsFree(project,outlet.id,1)).toBe(true);
  expect(outputIsFree(project,outlet.id,0)).toBe(false);
  expect(outputIsFree(project,outlet.id,2)).toBe(false);
  expect(outputIsFree({...project,nodes:project.nodes.map(n=>n.id===outlet.id?{...n,outputsUnknown:true}:n)},outlet.id,1)).toBe(false);
 });
 it('never offers an already-fed item, an outlet, or an upstream item as a plug-in target',()=>{
  const {project,outlet,cord,lights,ghost}=sample();
  expect(unpluggedItems(project).map(n=>n.name)).toEqual(['Ghost']);
  expect(plugInTargets(project,outlet.id).map(n=>n.name)).toEqual(['Ghost']);
  const unplugged={...project,edges:project.edges.filter(e=>e.id!=='e1')};
  // The cord now has no feed, but it is upstream of the lights: plugging it into them would loop.
  expect(plugInTargets(unplugged,lights.id).map(n=>n.id)).not.toContain(cord.id);
  expect(plugInTargets(unplugged,outlet.id).map(n=>n.id)).toContain(cord.id);
  expect(plugInTargets(project,ghost.id)).toEqual([]);
 });
});

describe('power in and power out sections',()=>{
 it('starts a new connection only from the tapped free output',async()=>{
  const {project,outlet,cord}=sample();const onPlugIn=vi.fn(),onOpen=vi.fn();
  const view=await mount(<PowerOutSection project={project} node={outlet} onPlugIn={onPlugIn} onOpenItem={onOpen} onSetOutputs={()=>true}/>);
  expect(view.host.textContent).toContain('1 of 2 free');
  expect(view.host.querySelectorAll('.power-plug-in')).toHaveLength(1);
  await act(async()=>button(view.host,'Plug something in').click());
  expect(onPlugIn).toHaveBeenCalledWith(1);
  await act(async()=>button(view.host,'Green cord').click());
  expect(onOpen).toHaveBeenCalledWith(cord.id);
  await view.done();
 });
 it('asks for the real output count instead of offering outputs it cannot know',async()=>{
  const {project,outlet}=sample();const unknown={...outlet,outputs:0,outputsUnknown:true};const onSet=vi.fn(()=>true),onPlugIn=vi.fn();
  const view=await mount(<PowerOutSection project={{...project,edges:[]}} node={unknown} onPlugIn={onPlugIn} onOpenItem={()=>{}} onSetOutputs={onSet}/>);
  expect(view.host.querySelector('.power-plug-in')).toBeNull();
  const select=view.host.querySelector('select')!;
  expect(Array.from(select.options).map(o=>o.value)).not.toContain('0');
  expect(button(view.host,'Save count').disabled).toBe(true);
  await act(async()=>{select.value='12';select.dispatchEvent(new Event('change',{bubbles:true}));});
  await act(async()=>button(view.host,'Save count').click());
  expect(onSet).toHaveBeenCalledWith(12);expect(onPlugIn).not.toHaveBeenCalled();
  await view.done();
 });
 it('shows nothing for an item that cannot power anything',async()=>{
  const {project,ghost}=sample();
  const view=await mount(<PowerOutSection project={project} node={ghost} onPlugIn={()=>{}} onOpenItem={()=>{}} onSetOutputs={()=>true}/>);
  expect(view.host.textContent).toBe('');
  await view.done();
 });
 it('describes the current feed and offers the right next action',async()=>{
  const {project,outlet,cord,ghost}=sample();const onPlugInto=vi.fn(),onUnplug=vi.fn();
  const fed=await mount(<PowerInSection project={project} node={cord} onPlugInto={onPlugInto} onUnplug={onUnplug} onOpenItem={()=>{}}/>);
  expect(fed.host.textContent).toContain('Plugged into Porch outlet');expect(fed.host.textContent).toContain('Output 1');
  await act(async()=>button(fed.host,'Unplug').click());expect(onUnplug).toHaveBeenCalledOnce();
  await act(async()=>button(fed.host,'Change').click());expect(onPlugInto).toHaveBeenCalledOnce();
  await fed.done();
  const loose=await mount(<PowerInSection project={project} node={ghost} onPlugInto={onPlugInto} onUnplug={onUnplug} onOpenItem={()=>{}}/>);
  expect(loose.host.textContent).toContain('Not plugged in yet');expect(button(loose.host,'Unplug')).toBeUndefined();
  await loose.done();
  const source=await mount(<PowerInSection project={project} node={outlet} onPlugInto={onPlugInto} onUnplug={onUnplug} onOpenItem={()=>{}}/>);
  expect(source.host.textContent).toContain('power source');expect(source.host.querySelectorAll('button')).toHaveLength(0);
  await source.done();
 });
});

describe('plug-in panel',()=>{
 it('names the exact output and adds nothing until a type is chosen',async()=>{
  const {project,outlet}=sample();const onAdd=vi.fn(()=>true),onExisting=vi.fn(()=>true);
  const view=await mount(<PlugInPanel project={project} sourceId={outlet.id} port={1} onAddNew={onAdd} onConnectExisting={onExisting} onCancel={()=>{}}/>);
  expect(view.host.textContent).toContain('Porch outlet');expect(view.host.textContent).toContain('Output 2');
  expect(button(view.host,'Add and plug in').disabled).toBe(true);
  expect(view.host.textContent).not.toContain('Outdoor outlet');
  await act(async()=>button(view.host,'Splitter').click());
  await act(async()=>button(view.host,'Add and plug in').click());
  expect(onAdd).toHaveBeenCalledWith('splitter','');expect(onExisting).not.toHaveBeenCalled();
  await view.done();
 });
 it('plugs in an existing unplugged item only after it is picked',async()=>{
  const {project,outlet,ghost}=sample();const onAdd=vi.fn(()=>true),onExisting=vi.fn(()=>true);
  const view=await mount(<PlugInPanel project={project} sourceId={outlet.id} port={1} onAddNew={onAdd} onConnectExisting={onExisting} onCancel={()=>{}}/>);
  await act(async()=>button(view.host,'Already on the diagram').click());
  expect(button(view.host,'Plug in item').disabled).toBe(true);
  await act(async()=>button(view.host,'Ghost').click());
  await act(async()=>button(view.host,'Plug in Ghost').click());
  expect(onExisting).toHaveBeenCalledWith(ghost.id);expect(onAdd).not.toHaveBeenCalled();
  await view.done();
 });
 it('refuses an output that has since been taken',async()=>{
  const {project,outlet}=sample();const onAdd=vi.fn(()=>true);
  const view=await mount(<PlugInPanel project={project} sourceId={outlet.id} port={0} onAddNew={onAdd} onConnectExisting={()=>true} onCancel={()=>{}}/>);
  expect(view.host.textContent).toContain('no longer available');expect(button(view.host,'Add and plug in')).toBeUndefined();
  await view.done();
 });
});

describe('wire panel',()=>{
 it('shows both ends and requires a preview before an insertion can be confirmed',async()=>{
  const {project}=sample();const onInsert=vi.fn(),onUnplug=vi.fn();
  const view=await mount(<WirePanel project={project} edgeId="e1" onInsert={onInsert} onUnplug={onUnplug} onOpenItem={()=>{}}/>);
  expect(view.host.textContent).toContain('Porch outlet');expect(view.host.textContent).toContain('Green cord');expect(view.host.textContent).toContain('Install step checked');
  expect(button(view.host,'Confirm insertion')).toBeUndefined();
  await act(async()=>button(view.host,'Preview change').click());
  expect(view.host.textContent).toContain('Porch outlet (Output 1) → Splitter → Green cord');
  expect(onInsert).not.toHaveBeenCalled();
  await act(async()=>button(view.host,'Confirm insertion').click());
  expect(onInsert).toHaveBeenCalledWith('splitter','');
  await act(async()=>button(view.host,'Unplug Green cord').click());expect(onUnplug).toHaveBeenCalledOnce();
  await view.done();
 });
 it('hides a stale preview when the insertion details change',async()=>{
  const {project}=sample();
  const view=await mount(<WirePanel project={project} edgeId="e2" onInsert={()=>{}} onUnplug={()=>{}} onOpenItem={()=>{}}/>);
  await act(async()=>button(view.host,'Preview change').click());
  const select=view.host.querySelector('select')!;
  await act(async()=>{select.value='cord';select.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(button(view.host,'Confirm insertion')).toBeUndefined();
  expect(Array.from(select.options).map(o=>o.value)).not.toContain('outlet');
  await view.done();
 });
});

describe('changing an existing feed from the diagram',()=>{
 it('stays blocked by default and needs an explicit new output when rewiring is allowed',async()=>{
  const {project,outlet,cord}=sample();const onConnect=vi.fn(()=>true);
  const blocked=await mount(<PhotoConnect surface="diagram" project={project} targetId={cord.id} sourceId={outlet.id} onSourceChange={()=>{}} onConnect={onConnect} onCancel={()=>{}}/>);
  expect(blocked.host.textContent).toContain('already has a recorded connection');
  await blocked.done();
  const view=await mount(<PhotoConnect surface="diagram" allowRewire project={project} targetId={cord.id} sourceId={outlet.id} onSourceChange={()=>{}} onConnect={onConnect} onCancel={()=>{}}/>);
  expect(view.host.textContent).toContain('Now plugged into Porch outlet');
  expect(button(view.host,'Change connection').disabled).toBe(true);
  expect(button(view.host,'Plugged in here now').disabled).toBe(true);
  await act(async()=>button(view.host,'Output 2').click());
  await act(async()=>button(view.host,'Change connection').click());
  expect(onConnect).toHaveBeenCalledWith(outlet.id,1);
  await view.done();
 });
});
