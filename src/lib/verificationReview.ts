import {getVerificationIssues} from './verificationAudit';
import {validateGraph} from './graph';
import {now} from './model';
import type {Project} from './model';
/** This status documents a human's as-installed review, not electrical safety approval. */
export function reviewInstalledProject(project:Project,notes:string):Project{
 const graphErrors=validateGraph(project.nodes,project.edges);
 if(graphErrors.length)throw Error('Cannot mark a malformed electrical graph as installed: '+graphErrors[0].message);
 if(!project.nodes.some(n=>n.kind==='outlet'))throw Error('The plan has no documented outlet or power source');
 const findings=getVerificationIssues(project).filter(i=>i.severity==='critical'||i.severity==='attention');
 if(findings.length&&notes.trim().length<12)throw Error('Add a specific review note for unresolved installation findings before marking as-installed');
 if(!findings.length&&notes.trim().length<4)throw Error('Record the date and nature of your field verification');
 const exceptions=findings.map(i=>{
  const node=project.nodes.find(n=>n.id===i.nodeId);
  return `${node?.name||'Graph'}: ${i.summary}`;
 });
 return {...project,status:'verified',updatedAt:now(),verificationReview:{reviewedAt:now(),notes:notes.trim(),exceptions}};
}
