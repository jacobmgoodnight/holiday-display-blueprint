import {getVisualIcon} from '../lib/visualIcons';
/** Small bundled vector drawings; no remote icon service or image request. */
export function VisualIconArtwork({id}:{id?:string}){
 const item=getVisualIcon(id);
 if(id==='skelly'||id==='bones')return <svg viewBox="0 0 40 44" width="26" height="28" fill="none" aria-hidden="true">
  <g stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
   <path d="M20 13v10m-7 1 7-1 7 1m-7-1v7m-6 0 6 3 6-3m-12 0-4 9m10-5-4 9m4-9 4 9m-12-17-8 7m24-7 8 7"/>
   <path d="M14 20c3-1 9-1 12 0m-12 4c3-1 9-1 12 0m-12 4c3-1 9-1 12 0"/>
  </g>
  <path d="M11 9a9 9 0 0 1 18 0c0 4-2 6-4 7v3h-10v-3c-2-1-4-3-4-7Z" fill="#f5ead6" stroke="#5b6873" strokeWidth="2"/>
  <ellipse cx="16" cy="10" rx="2.2" ry="2.6" fill="#4b5964"/><ellipse cx="24" cy="10" rx="2.2" ry="2.6" fill="#4b5964"/>
  <path d="m20 12-1.2 2h2.4Z" fill="#4b5964"/><path d="M16 17v2m4-2v2m4-2v2" stroke="#667481" strokeWidth="1.1"/>
 </svg>;
 if(id==='roof-c9')return <svg viewBox="0 0 48 38" width="30" height="27" fill="none" aria-hidden="true">
   <path d="m3 18 21-14 21 14M8 18v17h32V18" stroke="#658497" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
   <path d="M3 18 24 4 45 18" stroke="#465e70" strokeWidth="2" strokeLinecap="round"/>
   {[[9,15,'#e1a540'],[16,10,'#e05b54'],[24,5,'#65ae75'],[31,10,'#e1a540'],[39,15,'#e05b54']].map(([x,y,c],i)=><g key={i}><path d={'M'+x+' '+y+'v4'} stroke="#465d67" strokeWidth="1.5"/><ellipse cx={Number(x)} cy={Number(y)+4} rx="2.4" ry="3.4" fill={String(c)} stroke="#fff" strokeWidth=".5"/></g>)}
   <path d="M19 35V23h10v12" stroke="#658497" strokeWidth="2"/>
  </svg>;
 return <span aria-hidden="true">{item?.emoji||'📦'}</span>;
}
