import {useMemo,useState} from 'react';
import {AlertTriangle,CheckCircle2,ChevronDown,ClipboardCheck,Eye,Search} from 'lucide-react';
import type {Project} from '../lib/model';
import {auditCounts,getVerificationIssues,type AuditSeverity,type AuditIssue} from '../lib/verificationAudit';
import './verificationAudit.css';
type Props={project:Project;scope:ReadonlySet<string>;scopeLabel:string;onLocate:(id:string)=>void;onVerify:(id:string)=>void};
export function VerificationAudit({project,scope,scopeLabel,onLocate,onVerify}:Props){
 const [detail,setDetail]=useState(false);
 const [filter,setFilter]=useState<'all'|AuditSeverity>('all');
 const [needle,setNeedle]=useState('');
 const issues=useMemo(()=>getVerificationIssues(project,scope),[project,scope]);
 const counts=useMemo(()=>auditCounts(issues),[issues]);
 const shown=issues.filter(item=>{
  if(!detail&&item.severity==='optional')return false;
  if(filter!=='all'&&filter!==item.severity)return false;
  const name=project.nodes.find(n=>n.id===item.nodeId)?.name||'Graph';
  return (name+' '+item.summary+' '+item.hint).toLowerCase().includes(needle.trim().toLowerCase());
 });
 const uniqueAffected=new Set(issues.filter(i=>i.severity!=='optional').map(i=>i.nodeId));
 return <section className="audit-panel" aria-label="Needs verification dashboard">
  <header className="audit-intro"><div><span className="eyebrow">FIELD CHECK · DOCUMENTATION GAPS</span><h2>What still needs checking?</h2><p>{scopeLabel} · Check what is missing before setup. These are reminders, not an electrical safety approval.</p></div><span className="audit-project-state">{project.status==='verified'?'As-installed record · not certified':'Draft / not fully verified'}</span></header>
  <div className="audit-metrics" aria-label="Outstanding audit categories">
   <button className={filter==='critical'?'selected':''} onClick={()=>setFilter(v=>v==='critical'?'all':'critical')} aria-pressed={filter==='critical'}><strong>{counts.critical}</strong><span>Connection issues</span></button>
   <button className={filter==='attention'?'selected':''} onClick={()=>setFilter(v=>v==='attention'?'all':'attention')} aria-pressed={filter==='attention'}><strong>{counts.attention}</strong><span>Field checks</span></button>
   <button className={filter==='optional'?'selected':''} onClick={()=>{setDetail(true);setFilter(v=>v==='optional'?'all':'optional')}} aria-pressed={filter==='optional'}><strong>{counts.optional}</strong><span>Extra details</span></button>
   <div className="audit-metric-muted"><strong>{uniqueAffected.size}</strong><span>Items needing review</span></div>
  </div>
  <div className="audit-controls"><label><Search size={16}/><input value={needle} onChange={e=>setNeedle(e.target.value)} aria-label="Search verification issues" placeholder="Find an item or missing detail…"/></label>
   <button className="button secondary" onClick={()=>{setDetail(v=>!v);setFilter('all')}} aria-expanded={detail}>{detail?'Hide optional details':'Show optional details'} <ChevronDown size={14}/></button>
  </div>
  <div className="audit-results" role="list" aria-label="Outstanding verification issues">
   {shown.map((item:AuditIssue)=>{
    const node=project.nodes.find(n=>n.id===item.nodeId);
    return <article className={`audit-row severity-${item.severity}`} role="listitem" key={item.id}>
     <div className="audit-row-icon">{item.severity==='critical'?<AlertTriangle size={18}/>:<ClipboardCheck size={18}/>}</div>
     <div className="audit-row-body"><strong>{node?.name||'Wiring diagram'}</strong><span>{item.summary}</span><p>{item.hint}</p></div>
     <div className="audit-row-actions">
      {node&&<button className="audit-jump" onClick={()=>onLocate(node.id)} aria-label={`Locate ${node.name} in diagram`}><Eye size={16}/> Locate</button>}
      {node&&!node.verified&&item.kind==='verification'&&<button className="audit-verify" onClick={()=>onVerify(node.id)}><CheckCircle2 size={16}/> Mark field-checked</button>}
     </div>
    </article>;
   })}
   {!shown.length&&<div className="audit-empty"><CheckCircle2 size={21}/>{issues.length?'No issues match this filter. Try clearing the search or showing optional details.':'No listed documentation gaps in this view. Always inspect real electrical protection, loads, cords and connections before energizing.'}</div>}
  </div>
 </section>;
}
