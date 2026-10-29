import type {Project,Connection,Component} from './model';
export type GraphError = {code:string;message:string};
export function validateGraph(nodes:Component[],edges:Connection[]):GraphError[] {
 const errors:GraphError[]=[]; const byId=new Map(nodes.map(n=>[n.id,n]));
 if(byId.size!==nodes.length)errors.push({code:'duplicate-node',message:'Duplicate component ID'});
 if(new Set(edges.map(e=>e.id)).size!==edges.length)errors.push({code:'duplicate-edge',message:'Duplicate connection ID'});
 const inbound=new Map<string,number>();const slots=new Set<string>();
 for(const e of edges){
  const a=byId.get(e.source),b=byId.get(e.target);
  if(!a||!b){errors.push({code:'missing-node',message:`Connection ${e.id} refers to missing component`});continue;}
  if(e.source===e.target)errors.push({code:'self-loop',message:`${a.name} cannot connect to itself`});
  if(!Number.isInteger(e.sourcePort)||e.sourcePort<0||e.sourcePort>=a.outputs)errors.push({code:'port',message:`${a.name} has no output port ${e.sourcePort+1}`});
  if(b.kind==='outlet')errors.push({code:'outlet-input',message:`An outlet cannot receive a connection: ${b.name}`});
  if(a.outputGender&&b.inputGender&&a.outputGender===b.inputGender)errors.push({code:'connector-gender',message:`${a.name} and ${b.name} have incompatible ${a.outputGender}/${b.inputGender} plugs`});
  const slot=`${e.source}:${e.sourcePort}`;
  if(slots.has(slot))errors.push({code:'occupied-port',message:`${a.name} output ${e.sourcePort+1} is already occupied`});
  slots.add(slot);inbound.set(e.target,(inbound.get(e.target)||0)+1);
 }
 for(const [id,count] of inbound)if(count>1)errors.push({code:'multiple-inputs',message:`${byId.get(id)?.name||id} has more than one power feed`});
 const color=new Map<string,number>();
 function visit(id:string):void {if(color.get(id)===1){errors.push({code:'cycle',message:'Power loop detected'});return;} if(color.get(id)===2)return;color.set(id,1);for(const e of edges.filter(e=>e.source===id))if(byId.has(e.target))visit(e.target);color.set(id,2);}
 for(const n of nodes)visit(n.id);
 return errors;
}
export function connect(nodes:Component[],edges:Connection[],source:string,target:string,preferredPort?:number):Connection[]{
 const a=nodes.find(n=>n.id===source),b=nodes.find(n=>n.id===target);
 if(!a||!b)throw Error('Select two existing components');
 const occupied=new Set(edges.filter(e=>e.source===source).map(e=>e.sourcePort));
 const port=preferredPort??Array.from({length:a.outputs},(_,i)=>i).find(i=>!occupied.has(i));
 if(port===undefined)throw Error(`No free output on ${a.name}`);
 const next=[...edges,{id:crypto.randomUUID(),source,sourcePort:port,target}];
 const errors=validateGraph(nodes,next);
 if(errors.length)throw Error(errors[0].message);
 return next;
}
export function reconnect(nodes:Component[],edges:Connection[],source:string,target:string,preferredPort?:number):Connection[]{return connect(nodes,edges.filter(e=>e.target!==target),source,target,preferredPort);}
export function upstream(id:string,edges:Connection[]):Set<string>{const found=new Set<string>();let cur=id;while(true){const e=edges.find(e=>e.target===cur);if(!e||found.has(e.source))break;found.add(e.source);cur=e.source;}return found;}
export function downstream(id:string,edges:Connection[]):Set<string>{const found=new Set<string>();const queue=[id];while(queue.length){const cur=queue.shift()!;for(const e of edges.filter(e=>e.source===cur)){if(!found.has(e.target)){found.add(e.target);queue.push(e.target);}}}return found;}
export function sourcePath(id:string,p:Project):Component[]{const parents=[...upstream(id,p.edges)];const lookup=new Map(p.nodes.map(n=>[n.id,n]));return [...parents.reverse().map(n=>lookup.get(n)!).filter(Boolean),lookup.get(id)!].filter(Boolean);}
export function warningSummary(p:Project):string[]{const res=validateGraph(p.nodes,p.edges).map(e=>e.message);
 const missingRatings=p.nodes.filter(n=>n.kind!=='outlet'&&n.ratedWatts===undefined).length;
 const unknownLoads=p.nodes.filter(n=>['decoration','projector','spotlight','controller','accessory','light-strand'].includes(n.kind)&&n.expectedWatts===undefined).length;
 if(missingRatings)res.push(`${missingRatings} component(s) without a verified power rating`);
 if(unknownLoads)res.push(`${unknownLoads} consumer load(s) without watt estimates`);
 res.push('Connector genders, GFCI, weather exposure, wire gauge, circuit sharing and manufacturer limits require manual verification.');
 return res;
}
export function layoutDepth(id:string,edges:Connection[],seen=new Set<string>()):number{
 if(seen.has(id))return 0;seen.add(id);const incoming=edges.find(e=>e.target===id);return incoming?1+layoutDepth(incoming.source,edges,seen):0;
}
export type Task={id:string;label:string;phase:string;nodeId?:string;kind:'setup'|'teardown'};
export function generatedTasks(p:Project,mode:'setup'|'teardown'):Task[]{
 const nodes=[...p.nodes].filter(n=>n.kind!=='outlet').sort((a,b)=>layoutDepth(a.id,p.edges)-layoutDepth(b.id,p.edges));
 const edges=[...p.edges].sort((a,b)=>layoutDepth(b.target,p.edges)-layoutDepth(a.target,p.edges));
 const place=nodes.map(n=>({id:`place:${n.id}`,label:`Position ${n.name} — ${n.zone}${n.inventory?.storage?` (from ${n.inventory.storage})`:''}`,phase:'1 · Position',nodeId:n.id,kind:mode}));
 const wire=edges.map(e=>({id:`wire:${e.id}`,label:`Connect ${p.nodes.find(n=>n.id===e.source)?.name||e.source} (output ${e.sourcePort+1}) → ${p.nodes.find(n=>n.id===e.target)?.name||e.target}`,phase:'2 · Connect downstream first',nodeId:e.target,kind:mode}));
 const tests=p.nodes.filter(n=>n.kind==='outlet').map(n=>({id:`test:${n.id}`,label:`Attended test of ${n.name} and its downstream loads; verify ratings and protection manually`,phase:'3 · Verify',nodeId:n.id,kind:mode}));
 const arr=[...place,...wire,...tests];
 if(mode==='setup')return arr;
 return [...tests.reverse().map(t=>({...t,id:`off:${t.nodeId}`,label:`De-energize ${p.nodes.find(n=>n.id===t.nodeId)?.name} before teardown`,phase:'1 · Power off'})),
  ...wire.reverse().map(t=>({...t,id:`un${t.id}`,label:t.label.replace('Connect','Disconnect'),phase:'2 · Unplug'})),
  ...place.reverse().map(t=>({...t,id:`pack:${t.nodeId}`,label:t.label.replace('Position','Pack / inspect'),phase:'3 · Pack'}))];
}
