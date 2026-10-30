import type {Project,Zone} from './model';
import {generatedTasks,type Task} from './graph';
export type TaskSection={zone:Zone|'Power sources';tasks:Task[];done:number};
export type TaskPhase={id:string;title:string;instruction:string;tasks:Task[];done:number;sections:TaskSection[]};
const phases={
 setup:[
  ['1 · Position','Place equipment','Start with props and runs. Use the recorded storage bin and location photos; do not mark a step done until positioned.'],
  ['2 · Connect downstream first','Connect cords & branches','Follow the documented outlet/port path. Keep power off while making or changing connections.'],
  ['3 · Verify','Test and finish','After checking actual electrical ratings, connectors and protection, perform attended power-on tests. A checklist is not safety certification.']
 ],
 teardown:[
  ['1 · Power off','Switch off safely','Turn off and disconnect the recorded power source before touching or taking apart wiring.'],
  ['2 · Unplug','Unplug from the display back','Disconnect each recorded connection and inspect it for damage before packing.'],
  ['3 · Pack','Pack and label','Pack props, cords and lights by their saved storage locations; add notes or photographs for next year.']
 ]
} as const;
const zoneOrder:ReadonlyArray<Zone|'Power sources'>=['Front porch','Garage & driveway','Backyard','Other','Power sources'];
export function buildTaskPhases(project:Project,mode:'setup'|'teardown'):TaskPhase[]{
 const tasks=generatedTasks(project,mode);
 const byId=new Map(project.nodes.map(n=>[n.id,n]));
 return phases[mode].map(([id,title,instruction])=>{
  const phaseTasks=tasks.filter(t=>t.phase===id);
  const sections=zoneOrder.map(zone=>{
   const scoped=phaseTasks.filter(t=>(t.nodeId?byId.get(t.nodeId)?.zone:'Power sources')===zone);
   return {zone,tasks:scoped,done:scoped.filter(t=>project.checklist[t.id]?.done).length};
  }).filter(s=>s.tasks.length);
  return {id,title,instruction,tasks:phaseTasks,done:phaseTasks.filter(t=>project.checklist[t.id]?.done).length,sections};
 });
}
