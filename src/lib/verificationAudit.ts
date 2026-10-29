import type {Component,Project} from './model';
import {validateGraph,upstream} from './graph';

/** Actionable documentation gaps, not a measurement of electrical safety. */
export type AuditKind='feed'|'graph'|'verification'|'cord'|'load'|'connector'|'photo'|'ratings';
export type AuditSeverity='critical'|'attention'|'optional';
export type AuditIssue={id:string;nodeId:string;kind:AuditKind;severity:AuditSeverity;summary:string;hint:string};
export type AuditCounts={critical:number;attention:number;optional:number};
const cordKinds=new Set<Component['kind']>(['cord','spt-1']);
const consumerKinds=new Set<Component['kind']>(['light-strand','decoration','projector','spotlight','controller','accessory']);
const issue=(nodeId:string,kind:AuditKind,severity:AuditSeverity,summary:string,hint:string):AuditIssue=>({id:kind+':'+nodeId,nodeId,kind,severity,summary,hint});
export function getVerificationIssues(project:Project,scope?:ReadonlySet<string>):AuditIssue[]{
 const edges=project.edges;
 const byId=new Map(project.nodes.map(n=>[n.id,n]));
 const issues:AuditIssue[]=[];
 const scopeNodes=project.nodes.filter(n=>!scope||scope.has(n.id));
 const malformed=new Set(validateGraph(project.nodes,edges).filter(e=>e.code!=='duplicate-node'&&e.code!=='duplicate-edge').map(e=>e.message));
 if(malformed.size)issues.push(issue('','graph','critical',`${malformed.size} graph validation error(s)`,'Review the exact validation messages in the Wiring Diagram before connecting power.'));
 for(const n of scopeNodes){
  const inEdge=edges.find(e=>e.target===n.id);
  if(n.kind!=='outlet'){
   if(!inEdge){
    issues.push(issue(n.id,'feed','critical','No recorded upstream power feed','Choose the real source and output in the component editor; do not guess.'));
   }else{
    const parentIds=upstream(n.id,edges);
    const rooted=[...parentIds].some(id=>byId.get(id)?.kind==='outlet');
    if(!rooted)issues.push(issue(n.id,'feed','critical','Power path does not reach a documented outlet','Trace upstream connections until the source outlet is recorded.'));
   }
  }
  if(!n.verified)issues.push(issue(n.id,'verification','attention','Not marked verified in the yard','Inspect and confirm the real physical component and connection before marking field-verified.'));
  if(cordKinds.has(n.kind)&&(n.lengthFt===undefined||!Number.isFinite(n.lengthFt)||n.lengthFt<=0)){
   issues.push(issue(n.id,'cord','attention','Cord length not recorded','Measure or confirm the actual cable length; do not infer it from the diagram.'));
  }
  if(consumerKinds.has(n.kind)&&(n.expectedWatts===undefined||!Number.isFinite(n.expectedWatts)||n.expectedWatts<0)){
   issues.push(issue(n.id,'load','attention','Power consumption unknown','Record the manufacturer's actual wattage or leave unknown until verified.'));
  }
  if(n.kind!=='outlet'&&!n.inputGender&&['cord','spt-1','smart-plug','splitter','inline-tap','light-strand'].includes(n.kind)){
   issues.push(issue(n.id,'connector','optional','Input connector type unknown','Document the plug type when it is relevant to this connection.'));
  }
  if(n.outputs>0&&n.kind!=='outlet'&&!n.outputGender){
   issues.push(issue(n.id,'connector','optional','Output connector type unknown','Document the actual socket/connector type.'));
  }
  if(!n.photo)issues.push(issue(n.id,'photo','optional','No equipment reference photo','Attach a photograph of the actual device or connection if useful for next year.'));
  if(consumerKinds.has(n.kind)&&(n.ratedWatts===undefined||!Number.isFinite(n.ratedWatts))){
   issues.push(issue(n.id,'ratings','optional','Manufacturer rating not recorded','Read the device label; do not assume a safe maximum.'));
  }
 }
 const rank:Record<AuditSeverity,number>={critical:0,attention:1,optional:2};
 return issues.sort((a,b)=>rank[a.severity]-rank[b.severity]||a.summary.localeCompare(b.summary)||a.nodeId.localeCompare(b.nodeId));
}
export function auditCounts(items:readonly AuditIssue[]):AuditCounts{
 return {critical:items.filter(x=>x.severity==='critical').length,attention:items.filter(x=>x.severity==='attention').length,optional:items.filter(x=>x.severity==='optional').length};
}
