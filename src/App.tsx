import {useCallback,useEffect,useMemo,useState,type CSSProperties} from 'react';
import {ReactFlow,Background,Controls,MiniMap,ReactFlowProvider,useReactFlow,MarkerType,type Edge,type Connection as FlowConnection} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {Activity,AlertTriangle,ArrowDownToLine,ArrowRight,ArrowUpRight,BookOpen,Box,Check,CheckCircle2,ChevronDown,CircuitBoard,ClipboardCheck,Copy,Download,FileSpreadsheet,ImagePlus,Layers,Link2,Map,MoreVertical,Package,PlugZap,Plus,Printer,LockKeyhole,Search,ShieldAlert,Smartphone,Maximize2,Minimize2,ZoomIn,ZoomOut,Eye,SlidersHorizontal,PenTool,Trash2,Unplug,Upload,WifiOff,X} from 'lucide-react';
import type {Component,Kind,Project,Season,Zone} from './lib/model';
import {categories,makeNode,now,outputCount} from './lib/model';
import {downstream,generatedTasks,sourcePath,upstream,validateGraph,warningSummary,type Task} from './lib/graph';
import {db,initialize,createBackup,parseBackup,restoreBackup,downloadText} from './lib/storage';
import {readPhoto} from './lib/photos';
import {BlueprintNode,type BlueprintFlowNode} from './components/BlueprintNode';
import {ExcelWizard} from './components/ExcelWizard';
import {ConnectionFinder} from './components/ConnectionFinder';
import {InstallationGuide} from './components/InstallationGuide';
import {FieldMode} from './components/FieldMode';
import {VerificationAudit} from './components/VerificationAudit';
import {auditCounts,getVerificationIssues} from './lib/verificationAudit';
import {reviewInstalledProject} from './lib/verificationReview';
import {PowerFeedEditor} from './components/PowerFeedEditor';
import {editPowerFeed,undoLastWiringChange} from './lib/wiringEdits';
import {downloadWiringReference} from './lib/wiringExport';
import {DeviceTransfer} from './components/DeviceTransfer';
import {MobileMenuToggle} from './components/MobileMenuToggle';
import {hasOnlyExamples} from './lib/deviceTransfer';
import {useSharedSync} from './hooks/useSharedSync';
import {useProjectPersistence} from './hooks/useProjectPersistence';
import {deleteComponentSafely,undoComponentDeletion,type DeletedComponent} from './lib/graphDeletion';
import './components/deviceTransfer.css';
import {wireDescription} from './lib/wiringGuide';
import {powerFlowLayout} from './lib/flowLayout';
import {portName,renameOutputPort} from './lib/portLabels';
import {insertIntoConnection,insertableKinds} from './lib/wiringBuilder';
import {freeOutputPorts,searchComponents,workspaceCanEdit} from './lib/canvasWorkspace';
import {exampleProjects} from './fixtures/examples';
import './styles.css';
const nodeTypes={blueprint:BlueprintNode};
type Tab='field'|'diagram'|'setup'|'teardown'|'inventory';type View='All zones'|Zone|`Outlet: ${string}`;
const zones:Zone[]=['Front porch','Garage & driveway','Backyard','Other'];
const iconFor:Record<Tab,typeof Map>={field:Smartphone,diagram:Map,setup:ClipboardCheck,teardown:Unplug,inventory:Package};
function blank(season:Season,year:number):Project{return {id:crypto.randomUUID(),season,year,name:`${season} ${year} · new plan`,status:'draft',nodes:[],edges:[],checklist:{},createdAt:now(),updatedAt:now(),example:false};}
function projectLabel(p:Project){return `${p.season==='Halloween'?'🎃':'🎄'} ${p.year} · ${p.name.replace(/^(Halloween|Christmas)\s*(\d{4})?\s*[·\-]?\s*/,'').slice(0,36)}`;}
const csvEscape=(s:unknown)=>`"${String(s??'').replace(/"/g,'""')}"`;
function AppContent(){
 const {fitView,setCenter,zoomIn,zoomOut,screenToFlowPosition}=useReactFlow<BlueprintFlowNode,Edge>();
 const [projects,setProjects]=useState<Project[]>([]);const [active,setActive]=useState('');const [loaded,setLoaded]=useState(false);const [storageReady,setStorageReady]=useState(true);
 const [tab,setTab]=useState<Tab>(()=>window.matchMedia('(max-width:720px)').matches?'field':'diagram');const [view,setView]=useState<View>('All zones');const [selected,setSelected]=useState<string|null>(null);const [trace,setTrace]=useState<'none'|'upstream'|'downstream'|'outage'>('none');
 const [diagramMode,setDiagramMode]=useState<'map'|'guide'|'audit'>('map');const [layoutMode,setLayoutMode]=useState<'auto'|'manual'>('auto');const [pathOnly,setPathOnly]=useState(false);const [focusRequest,setFocusRequest]=useState<{id:string;seq:number}|null>(null);
 const [search,setSearch]=useState('');const [reuseId,setReuseId]=useState('');const [addKind,setAddKind]=useState<Kind>('decoration');const [connectFrom,setConnectFrom]=useState('');const [connectTo,setConnectTo]=useState('');
 const [showTransfer,setShowTransfer]=useState(false);const [dismissTransfer,setDismissTransfer]=useState(false);const [showWizard,setShowWizard]=useState(false);const [showMenu,setShowMenu]=useState(false);const [showSidebar,setShowSidebar]=useState(false);
 const [message,setMessage]=useState(''); const [inspectorOpen,setInspectorOpen]=useState(true);
 const [deletedReceipt,setDeletedReceipt]=useState<DeletedComponent|null>(null);
 const [fullscreen,setFullscreen]=useState(false);
 const [fullMode,setFullMode]=useState<'explore'|'builder'>('explore');
 const [fullSearch,setFullSearch]=useState('');
 const [builderSource,setBuilderSource]=useState<string|null>(null);
 const [builderPort,setBuilderPort]=useState(0);
 const [builderName,setBuilderName]=useState('');
 const [fullToolsOpen,setFullToolsOpen]=useState(false);
 const [insertEdgeId,setInsertEdgeId]=useState('');
 const [insertKind,setInsertKind]=useState<Kind>('splitter');
 const [builderPanel,setBuilderPanel]=useState<'add'|'wire'|'insert'|'ports'>('wire');
 const [insertName,setInsertName]=useState('');
 const [showInsertPreview,setShowInsertPreview]=useState(false);
 const workspaceEditable=workspaceCanEdit(fullscreen,fullMode);
 useEffect(()=>{
  if(!fullscreen)return;
  const previous=document.body.style.overflow;document.body.style.overflow='hidden';
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'){setFullscreen(false);setBuilderSource(null);setFullSearch('');setShowInsertPreview(false);}};
  document.addEventListener('keydown',onKey);
  return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',onKey);};
 },[fullscreen]);
 useEffect(()=>{
  if(!fullscreen||tab!=='diagram'||diagramMode!=='map'||!project)return;
  const timer=setTimeout(()=>{
   const mobile=window.innerWidth<1000;
   if(!mobile){void fitView({padding:.17,duration:230,maxZoom:.95});return;}
   const outlet=view.startsWith('Outlet: ')?project.nodes.find(n=>n.id===view.slice(8)):project.nodes.find(n=>n.kind==='outlet');
   const anchor=project.nodes.find(n=>n.id===selected)||outlet||project.nodes[0];
   if(!anchor)return;
   const pos=layoutMode==='auto'?(autoPositions.get(anchor.id)||anchor.position):anchor.position;
   // Start at legible node scale; full-system overview remains available through Fit.
   setCenter(pos.x+195,pos.y+55,{zoom:.88,duration:200});
  },190);
  return()=>clearTimeout(timer);
 },[fullscreen,tab,diagramMode,view,layoutMode,active,fitView,setCenter]);
 useEffect(()=>{
  if(!showSidebar&&!showMenu)return;
  const dismiss=(event:KeyboardEvent)=>{if(event.key==='Escape'){setShowSidebar(false);setShowMenu(false);}};
  document.addEventListener('keydown',dismiss);
  return()=>document.removeEventListener('keydown',dismiss);
 },[showSidebar,showMenu]);
 useEffect(()=>{
  if(!showSidebar||!window.matchMedia('(max-width:900px)').matches)return;
  const previous=document.body.style.overflow;document.body.style.overflow='hidden';
  return()=>{document.body.style.overflow=previous;};
 },[showSidebar]);
 useEffect(()=>{let live=true;initialize().then(items=>{if(live){setProjects(items);setActive(items[0]?.id||'');setLoaded(true);}}).catch(e=>{if(live){const fallback=exampleProjects();setProjects(fallback);setActive(fallback[0].id);setLoaded(true);setStorageReady(false);setMessage(`Browser storage unavailable: ${String(e)}. Changes are temporary — export a JSON backup.`);}});return()=>{live=false;};},[]);
 const cloud=useSharedSync({loaded,storageReady,projects,setProjects,onImported:(chosen)=>{
  const outlet=chosen.nodes.find(n=>n.kind==='outlet');
  setActive(chosen.id);setTab(window.matchMedia('(max-width:720px)').matches?'field':'diagram');setDiagramMode('guide');
  setView(outlet&&chosen.nodes.length>20?`Outlet: ${outlet.id}`:'All zones');
  setSelected(null);setTrace('none');setPathOnly(false);
  setMessage('Your private master plans are available here and are now synced with other linked devices.');
 }});
 const project=projects.find(p=>p.id===active);
 const localSaving=useProjectPersistence(projects,active,loaded,storageReady);
 useEffect(()=>{if(fullscreen||tab!=='diagram'||diagramMode!=='map')return;const timer=setTimeout(()=>{void fitView({padding:.16,duration:160});},90);return()=>clearTimeout(timer);},[view,tab,active,inspectorOpen,fitView,layoutMode,pathOnly,diagramMode,fullscreen]);
 const update=useCallback((fn:(p:Project)=>Project)=>{setProjects(all=>all.map(p=>{if(p.id!==active)return p;const result=fn(p);return result===p?p:{...result,updatedAt:now()};}));},[active]);
 useEffect(()=>{if(!message)return;const timer=setTimeout(()=>setMessage(''),6500);return()=>clearTimeout(timer);},[message]);
 const highlighted=useMemo(()=>{if(!project||!selected)return new Set<string>();if(trace==='upstream')return new Set([...upstream(selected,project.edges),selected]);if(trace==='downstream'||trace==='outage')return new Set([...downstream(selected,project.edges),selected]);return new Set([selected]);},[project,selected,trace]);
 const baseVisibleIds=useMemo(()=>{if(!project)return new Set<string>();if(view==='All zones')return new Set(project.nodes.map(n=>n.id));const ids=new Set<string>();
 if(view.startsWith('Outlet: ')){const id=view.replace('Outlet: ','');ids.add(id);for(const d of downstream(id,project.edges))ids.add(d);}
 else{for(const n of project.nodes.filter(n=>n.zone===view)){ids.add(n.id);for(const parent of upstream(n.id,project.edges))ids.add(parent);}}
 return ids;},[project,view]);
 const visibleIds=useMemo(()=>{
  if(!project||!pathOnly||!selected)return baseVisibleIds;
  const route=project.nodes.find(n=>n.id===selected)?.kind==='outlet'
   ? new Set([selected,...downstream(selected,project.edges)])
   : new Set([selected,...upstream(selected,project.edges)]);
  return new Set([...route].filter(id=>baseVisibleIds.has(id)));
 },[project,pathOnly,selected,baseVisibleIds]);
 const autoPositions=useMemo(()=>layoutMode==='auto'&&project
   ?powerFlowLayout(project.nodes.filter(n=>visibleIds.has(n.id)),project.edges.filter(e=>visibleIds.has(e.source)&&visibleIds.has(e.target)))
   :new globalThis.Map<string,{x:number;y:number}>(),[project,visibleIds,layoutMode]);
 const flowNodes:BlueprintFlowNode[]=useMemo(()=>project?.nodes.filter(n=>visibleIds.has(n.id)).map(n=>({id:n.id,type:'blueprint' as const,position:layoutMode==='auto'?(autoPositions.get(n.id)||n.position):n.position,data:{component:n,highlight:highlighted.has(n.id),dim:!!selected&&trace!=='none'&&!highlighted.has(n.id)},selected:n.id===selected}))||[],[project,visibleIds,highlighted,selected,trace,autoPositions,layoutMode]);
 const fullscreenMatches=useMemo(()=>project?searchComponents(project,fullSearch,8):[],[project,fullSearch]);
 const insertEdge=project?.edges.find(e=>e.id===insertEdgeId);
 const insertFrom=project?.nodes.find(n=>n.id===insertEdge?.source);
 const insertTo=project?.nodes.find(n=>n.id===insertEdge?.target);
 const flowEdges:Edge[]=useMemo(()=>project?.edges.filter(e=>visibleIds.has(e.source)&&visibleIds.has(e.target)).map(e=>{
  const target=project.nodes.find(n=>n.id===e.target);
  const source=project.nodes.find(n=>n.id===e.source);
   const part=target?wireDescription(target):undefined;
   const named=source?.portLabels?.[String(e.sourcePort)]?.trim();
   const label=[named,part].filter(Boolean).join(' · ')||undefined;
  return {id:e.id,source:e.source,target:e.target,sourceHandle:`port-${e.sourcePort}`,targetHandle:'input',type:'smoothstep',
    animated:selected!==null&&(highlighted.has(e.source)&&highlighted.has(e.target)),label,
    labelStyle:{fill:'#344e63',fontWeight:650,fontSize:10},
    labelBgStyle:{fill:'#fff',stroke:'#cad8e3',strokeWidth:0.6},
    labelBgPadding:[7,4] as [number,number],labelBgBorderRadius:6,
    style:{stroke:insertEdgeId===e.id?'#327963':selected&&highlighted.has(e.source)&&highlighted.has(e.target)?'#d68b3e':'#8296a9',strokeWidth:insertEdgeId===e.id?4:selected&&highlighted.has(e.source)&&highlighted.has(e.target)?3:1.8},
    markerEnd:{type:MarkerType.ArrowClosed,color:'#8296a9'}};
 })||[],[project,visibleIds,selected,highlighted,insertEdgeId]);
 function chooseProject(id:string){setFullscreen(false);setBuilderSource(null);setInsertEdgeId('');setShowInsertPreview(false);const next=projects.find(p=>p.id===id);const first=next?.nodes.find(n=>n.kind==='outlet');setActive(id);setSelected(null);setTrace('none');setPathOnly(false);setFocusRequest(null);setView(next&&next.nodes.length>25&&first?`Outlet: ${first.id}`:'All zones');setShowMenu(false);setShowSidebar(false);}
 function changeView(next:View){setView(next);setShowInsertPreview(false);setSelected(null);setTrace('none');setPathOnly(false);setFocusRequest(null);}
 function jumpToNode(id:string){setTab('diagram');setDiagramMode('map');if(!baseVisibleIds.has(id))setView('All zones');setSelected(id);setTrace('upstream');setInspectorOpen(true);setFocusRequest(prev=>({id,seq:(prev?.seq||0)+1}));if(window.innerWidth<720)setTimeout(()=>document.getElementById('diagram-canvas')?.scrollIntoView({behavior:'smooth',block:'start'}),130);}
 function openFinder(){setInspectorOpen(true);if(window.innerWidth<720)setTimeout(()=>document.getElementById('connection-finder')?.scrollIntoView({behavior:'smooth',block:'start'}),130);}
 function focusOutlet(id:string){changeView(`Outlet: ${id}`);setSelected(id);setTrace('downstream');}

 useEffect(()=>{if(tab!=='diagram'||diagramMode!=='map'||!project||!focusRequest)return;const node=project.nodes.find(n=>n.id===focusRequest.id);if(!node)return;const timer=setTimeout(()=>{const pos=layoutMode==='auto'?(autoPositions.get(node.id)||node.position):node.position;setCenter(pos.x+105,pos.y+43,{zoom:window.innerWidth < 720 ? 0.85 : 1.1,duration:350});setFocusRequest(null);},240);return()=>clearTimeout(timer);},[tab,diagramMode,project,focusRequest,layoutMode,autoPositions,setCenter]);
 function reviewInstallationStatus(value:'draft'|'verified'){
  if(!project)return;
  if(value==='draft'){update(p=>({...p,status:'draft'}));return;}
  const outstanding=getVerificationIssues(project).filter(i=>i.severity==='critical'||i.severity==='attention');
  const note=window.prompt(outstanding.length?`There are ${outstanding.length} unresolved installation findings. Record what you inspected and which items still need attention. This does not certify electrical safety.`:'Record the physical installation check and any exceptions. This does not certify electrical safety.');
  if(note===null)return;
  try{const reviewed=reviewInstalledProject(project,note);if(!window.confirm(`Record this plan as verified-as-installed with ${reviewed.verificationReview?.exceptions.length||0} documented exception(s)? This is not an electrical safety certificate.`))return;update(()=>reviewed);setMessage('As-installed field review recorded with a timestamp. Outstanding issues remain visible in Needs Verification.');}
  catch(err){setMessage(err instanceof Error?err.message:String(err));}
 }
 function makeNew(duplicate:boolean){if(!project)return;const year=duplicate?project.year+1:project.year;const p=duplicate?{...structuredClone(project),id:crypto.randomUUID(),year,name:`${project.season} ${year} · copied plan`,status:'draft' as const,checklist:{},wiringHistory:[],verificationReview:undefined,createdAt:now(),updatedAt:now(),example:false,nodes:project.nodes.map(n=>({...n,verified:false}))}:blank(project.season,year);
 setProjects(all=>[...all,p]);setActive(p.id);setSelected(null);setView('All zones');setShowMenu(false);setMessage(duplicate?'Copied plan is a DRAFT — verify every connection before use.':'Created a blank local project.');}
 function applyPortLabel(id:string,index:number,label:string){
  if(!project)return;
  try{
   const next=renameOutputPort(project,id,index,label);
   if(next!==project){update(()=>next);setMessage('Output name saved. Existing wiring and output number are unchanged.');}
  }catch(error){setMessage(error instanceof Error?error.message:String(error));}
 }
 function insertBuilderLink(){
  if(!project||!insertEdgeId||!showInsertPreview)return;
  try{
   const updated=insertIntoConnection(project,insertEdgeId,insertKind,insertName);
   update(()=>updated);
   const added=updated.nodes.find(n=>!project.nodes.some(prev=>prev.id===n.id));
   setSelected(added?.id||null);setTrace('none');setInsertEdgeId('');setInsertName('');setShowInsertPreview(false);
   setMessage('Item inserted. New connections need physical verification and the old wiring step was reset.');
  }catch(error){setMessage(error instanceof Error?error.message:String(error));}
 }
 function addBuilderItem(){
  if(!project)return;
  const zone:Zone=zones.includes(view as Zone)?view as Zone:'Front porch';
  const count=project.nodes.filter(n=>n.zone===zone).length;
  const position=layoutMode==='manual'?screenToFlowPosition({x:window.innerWidth/2,y:window.innerHeight/2}):{x:110+(count%4)*215,y:100+Math.floor(count/4)*120};
  const n=makeNode(addKind,zone,position);
  if(builderName.trim())n.name=builderName.trim().slice(0,100);
  update(p=>({...p,nodes:[...p.nodes,n],status:'draft'}));
  setSelected(n.id);setTrace('none');setBuilderName('');
  setMessage('Added an unverified item. Choose an existing upstream power source to connect it.');
 }
 function chooseBuilderSource(){
  if(!project||!selected)return;
  const source=project.nodes.find(n=>n.id===selected);
  if(!source||source.outputs===0){setMessage('Select an outlet, cord, smart plug, or splitter with an available output.');return;}
  const ports=freeOutputPorts(project,selected);
  if(!ports.length){setMessage('No unused output on this component. Select another source or free a port first.');return;}
  setBuilderSource(selected);setBuilderPort(ports[0]);setMessage('Choose the source output, then tap the receiving item to connect it.');
 }
 function selectBuilderTarget(id:string){
  if(!project||!builderSource)return;
  if(id===builderSource){setMessage('Choose a different receiving item.');return;}
  const source=project.nodes.find(n=>n.id===builderSource),target=project.nodes.find(n=>n.id===id);
  if(!source||!target||target.kind==='outlet'){setMessage('A house outlet cannot receive a power connection.');return;}
  if(!freeOutputPorts(project,builderSource,id).includes(builderPort)){setMessage('That source output is occupied. Pick another free output before connecting.');return;}
  changePowerFeed(id,builderSource,builderPort);
  setBuilderSource(null);
  setSelected(id);setTrace('upstream');
 }
 function addComponent(){if(!project)return;const zone:Zone=zones.includes(view as Zone)?view as Zone:'Front porch';const offset=project.nodes.filter(n=>n.zone===zone).length;const n=makeNode(addKind,zone,{x:80+(offset%5)*240,y:80+Math.floor(offset/5)*150});update(p=>({...p,nodes:[...p.nodes,n]}));setSelected(n.id);setInspectorOpen(true);setMessage('Component added. Connect it with the output handles or the connection form.');}

 const reusable=useMemo(()=>{const seen=new Set<string>();return projects.filter(p=>p.id!==active).flatMap(p=>p.nodes.map(n=>({...n,from:p.season+' '+p.year}))).filter(n=>{const asset=n.assetId||n.id;if(seen.has(asset)||project?.nodes.some(local=>(local.assetId||local.id)===asset))return false;seen.add(asset);return true;});},[projects,active,project]);
 function reuseComponent(){if(!project)return;const found=reusable.find(n=>(n.assetId||n.id)===reuseId);if(!found)return;const zone:Zone=zones.includes(view as Zone)?view as Zone:'Front porch';const copy:Component={...structuredClone(found),id:crypto.randomUUID(),assetId:found.assetId||found.id,zone,position:{x:80+(project.nodes.length%5)*230,y:160+Math.floor(project.nodes.length/5)*160},verified:false};update(p=>({...p,nodes:[...p.nodes,copy]}));setSelected(copy.id);setMessage('Linked existing equipment to this plan. Check placement and all connections.');}
 function changePowerFeed(target:string,source:string|null,port?:number){
  if(!project)return;
  const old=project.edges.find(e=>e.target===target);
  if(old&&(old.source!==source||old.sourcePort!==port)){
   if(!confirm((source===null?'Disconnect this power feed?':'Change this recorded power feed?')+' The branch becomes Draft and needs re-verification.'))return;
  }
  try{
   const edited=editPowerFeed(project,target,source,port);
   if(edited===project){setMessage('Connection is already recorded.');return;}
   update(()=>edited);
   setMessage(source===null?'Feed disconnected. Branch marked Draft.':'Connection saved. Recheck this branch before use.');
  }catch(e){setMessage(`Cannot change wiring: ${e instanceof Error?e.message:String(e)}`);}
 }
 function addConnection(source:string,target:string,port?:number){
  if(!project)return;
  const component=project.nodes.find(n=>n.id===source);
  const occupied=new Set(project.edges.filter(e=>e.source===source&&e.target!==target).map(e=>e.sourcePort));
  const free=port??Array.from({length:component?.outputs||0},(_,i)=>i).find(i=>!occupied.has(i));
  changePowerFeed(target,source,free);
 }
 const onConnect=useCallback((params:FlowConnection)=>{if(!params.source||!params.target)return;const port=params.sourceHandle?.match(/^port-(\d+)$/)?.[1];addConnection(params.source,params.target,port===undefined?undefined:Number(port));},[project,active]);
 function patchComponent(id:string,fields:Partial<Component>){
  if(!project)return;
  const before=project.nodes.find(n=>n.id===id);
  const electricalKeys=['kind','outputs','inputGender','outputGender','cordType','color','lengthFt','ratedWatts','expectedWatts'] as const;
  const changedElectrical=!!before&&electricalKeys.some(k=>k in fields&&fields[k as keyof Component]!==before[k as keyof Component]);
  const nodes=project.nodes.map(n=>n.id===id?{...n,...fields,...(changedElectrical?{verified:false}:{})}:n);
  const errors=validateGraph(nodes,project.edges);
  if(errors.length){setMessage(errors[0].message);return;}
  update(p=>({...p,nodes,status:changedElectrical?'draft':p.status}));
}
 function removeComponent(id:string){if(!project)return;const node=project.nodes.find(n=>n.id===id);if(!node)return;const downstreamCount=downstream(id,project.edges).size;
 if(!confirm(`Remove ${node.name} and its power connections? ${downstreamCount} downstream item(s) will need re-verification. You can undo this removal.`))return;
 try{const deleted=deleteComponentSafely(project,id);update(()=>deleted.project);setDeletedReceipt(deleted.receipt);setSelected(null);setMessage('Component removed; connected downstream items marked unverified.');}catch(err){setMessage(String(err));}
}
function undoDeletion(){if(!project||!deletedReceipt||deletedReceipt.projectId!==project.id)return;
 try{const restored=undoComponentDeletion(project,deletedReceipt);update(()=>restored);setDeletedReceipt(null);setMessage('Component and valid links restored as Draft. Previous checked wiring steps were not restored.');}
 catch(err){setMessage(`Undo unavailable: ${String(err)}`);}
}
 async function attachPhoto(file:File|undefined,id?:string){if(!file||!project)return;try{const data=await readPhoto(file);if(id)patchComponent(id,{photo:data});else update(p=>({...p,backgroundPhoto:data}));}catch(e){setMessage(String(e));}}
 async function importBackup(file?:File){if(!file)return;try{const content=JSON.parse(await file.text());const parsed=parseBackup(content);if(!confirm(`Restore ${parsed.length} project(s)? Matching project IDs will be overwritten. Back up your current work first.`))return;await localSaving.flushAll();await restoreBackup(content);setProjects(await db.projects.toArray());setActive(parsed[0]?.id||active);setView('All zones');setSelected(null);setMessage('Backup successfully restored to this browser.');}catch(e){setMessage(`Restore rejected: ${String(e)}`);}}
 const tasks=useMemo(()=>project?generatedTasks(project,tab==='teardown'?'teardown':'setup'):[],[project,tab]);
 const progress=tasks.filter(t=>project?.checklist[t.id]?.done).length;
 function updateTask(id:string,fields:{done?:boolean;notes?:string;photo?:string}){update(p=>({...p,checklist:{...p.checklist,[id]:{...p.checklist[id],...fields,done:fields.done??p.checklist[id]?.done??false}}}));}
 function renderTask(t:Task){const state=project?.checklist[t.id];return <article className={`task ${state?.done?'task-done':''}`} key={t.id}><label className="task-check"><input type="checkbox" checked={!!state?.done} onChange={e=>updateTask(t.id,{done:e.target.checked})}/><span className="task-check-icon">{state?.done?<Check size={22}/>:null}</span><span>{t.label}</span></label><div className="task-foot"><button className="plain-link" onClick={()=>{setTab('diagram');if(t.nodeId)jumpToNode(t.nodeId);}}>Show on diagram <ArrowUpRight size={13}/></button><input aria-label={`Notes for ${t.label}`} placeholder="Notes / exceptions" value={state?.notes||''} onChange={e=>updateTask(t.id,{notes:e.target.value})}/><label className="task-photo-action" title="Attach task photo"><ImagePlus size={17}/><input type="file" accept="image/*" capture="environment" onChange={async e=>{const file=e.target.files?.[0];if(file)try{updateTask(t.id,{photo:await readPhoto(file)});}catch(err){setMessage(String(err));}e.target.value='';}}/></label></div>{state?.photo&&<img className="task-photo" src={state.photo} alt={`Reference for ${t.label}`}/>}</article>;}
 const selectedNode=project?.nodes.find(n=>n.id===selected);
 const warnings=project?warningSummary(project):[];
 const audit=useMemo(()=>project?getVerificationIssues(project):[],[project]);
 const auditSummary=useMemo(()=>auditCounts(audit),[audit]);
 const warningErrors=project?validateGraph(project.nodes,project.edges):[];
 const checklistKinds=Array.from(new Set(tasks.map(t=>t.phase)));
 function undoLastFeed(){if(!project)return;if(!confirm('Reverse the most recent documented power-feed change? This will NOT restore any old checked steps or verified status; inspect the connection in the yard.'))return;try{const undone=undoLastWiringChange(project);update(()=>undone);setMessage('Most recent power-feed change reversed. Branch remains Draft and needs field verification.');}catch(error){setMessage(error instanceof Error?error.message:String(error));}}
 function printAll(){setDiagramMode('map');setView('All zones');setTab('diagram');setSelected(null);setTimeout(()=>window.print(),250);}
 function exportPrivateBackup(){downloadText('holiday-display-blueprint-private-backup.json',JSON.stringify(createBackup(projects),null,2));setMessage('Private backup downloaded. Transfer it using a trusted private file service, not public GitHub.');}
 const examplesOnly=hasOnlyExamples(projects);
 if(!loaded)return <div className="startup">Opening your local Blueprint workspace…</div>;
 if(!project)return <div className="startup">No project selected.</div>;
 return <div className="app-shell">
  <header className="topbar"><div className="brand"><div className="brand-icon"><CircuitBoard size={23}/></div><div><strong>HOLIDAY DISPLAY <span>BLUEPRINT</span></strong><small>LOCAL-FIRST DISPLAY PLANNER</small></div></div>
   <div className="project-picker"><label className="visually-hidden" htmlFor="projects">Seasonal project</label><select id="projects" value={active} onChange={e=>chooseProject(e.target.value)}>{[...projects].sort((a,b)=>b.year-a.year||a.season.localeCompare(b.season)).map(p=><option value={p.id} key={p.id}>{projectLabel(p)}</option>)}</select><ChevronDown className="picker-chevron" size={17}/></div>
   <div className="top-actions"><span className={`local-pill local-save-${localSaving.saveState.phase}`} title={localSaving.saveState.message||''} role="status"><span className="pulse-dot"/> {localSaving.saveState.phase==='saving'?'Saving locally…':localSaving.saveState.phase==='failed'?'Local save failed':'Saved locally'}</span><button className="button secondary desktop-only" onClick={()=>{downloadText('holiday-display-blueprint-backup.json',JSON.stringify(createBackup(projects),null,2));setMessage('Backup downloaded. Keep the file private — it may include photos and details.');}}><Download size={16}/> Backup</button>
   <MobileMenuToggle open={showSidebar} onToggle={()=>{setShowMenu(false);setShowSidebar(x=>!x)}}/>
   <button type="button" className="icon-button desktop-more-button" aria-label="More actions" aria-controls="more-actions-menu" aria-expanded={showMenu} onClick={()=>{setShowSidebar(false);setShowMenu(x=>!x)}}><MoreVertical size={20}/></button>{showMenu&&<div id="more-actions-menu" className="action-menu" aria-label="More actions">
    <button onClick={()=>makeNew(false)}><Plus size={16}/> New blank project</button><button onClick={()=>makeNew(true)}><Copy size={16}/> Copy into next year</button>
    <button onClick={()=>{setShowWizard(true);setShowMenu(false);}}><FileSpreadsheet size={16}/> Import Excel workbook</button>
    <button onClick={()=>{downloadText('holiday-display-blueprint-backup.json',JSON.stringify(createBackup(projects),null,2));setShowMenu(false);}}><Download size={16}/> Back up all projects (JSON)</button>
    <label className="menu-upload"><Upload size={16}/> Restore JSON backup<input type="file" accept=".json" onChange={e=>{void importBackup(e.target.files?.[0]);setShowMenu(false);e.target.value='';}}/></label>
    <button onClick={()=>{setShowMenu(false);setShowTransfer(true);}}><Upload size={16}/> Back up / move plans</button>
    {cloud.enabled&&<button onClick={()=>{if(confirm('Disconnect encrypted sync on this device? Local projects will remain here.'))cloud.disconnect();setShowMenu(false);}}><LockKeyhole size={16}/> Stop syncing this device</button>}
    <button onClick={()=>{downloadWiringReference(project);setShowMenu(false);setMessage('Private reference workbook exported. Continue editing in Blueprint.');}}><FileSpreadsheet size={16}/> Export wiring reference (.xlsx)</button>
    <button onClick={()=>{setShowMenu(false);printAll()}}><Printer size={16}/> Print diagram</button>
    <button onClick={()=>{if(cloud.enabled){setMessage('Cloud-linked project deletion is disabled until safe deletion synchronization is available. No data was removed.');setShowMenu(false);return;}if(!confirm('Delete this local project? Export a private backup first.'))return;const ids=projects.filter(p=>p.id!==active);if(!ids.length){setMessage('Keep at least one project.');return;}const doomed=active;void (async()=>{await localSaving.discardProject(doomed);await db.projects.delete(doomed);setProjects(ids);setActive(ids[0].id);setShowMenu(false);setMessage('Local project deleted.');})().catch(err=>setMessage('Delete failed: '+String(err)));}}><Trash2 size={16}/> Delete selected project</button>
   </div>}</div>
  </header>
  {showMenu&&<button type="button" className="more-menu-dismiss" aria-label="Dismiss more actions" onClick={()=>setShowMenu(false)}/>}
  {showSidebar&&<button type="button" className="mobile-drawer-dismiss" aria-label="Close menu" onClick={()=>setShowSidebar(false)}/>}
  <div className="workspace">
   <aside id="mobile-navigation" aria-label="Navigation and tools" className={`leftbar ${showSidebar?'leftbar-open':''}`}>
    <div className="mobile-drawer-header mobile-drawer-only"><div><strong>Navigation & tools</strong><span>{project.season} {project.year}</span></div><button type="button" className="icon-button" aria-label="Close menu" onClick={()=>setShowSidebar(false)}><X size={22}/></button></div><div className="side-section"><p className="side-label">WORKSPACE</p><nav className="nav-list" aria-label="Workspace tabs">{(['field','diagram','setup','teardown','inventory'] as Tab[]).map(t=>{const Icon=iconFor[t];return <button key={t} className={`nav-link ${tab===t?'active':''}`} onClick={()=>{setTab(t);setShowSidebar(false);}}><Icon size={18}/><span>{({field:'Field Mode · phone-friendly',diagram:'Wiring diagram',setup:'Installation steps',teardown:'Teardown steps',inventory:'Equipment inventory'})[t]}</span>{t==='setup'&&<small>{generatedTasks(project,'setup').length}</small>}</button>;})}</nav></div>
    <div className="side-section mobile-drawer-only">
     <p className="side-label">QUICK ACTIONS</p>
     <nav className="nav-list" aria-label="Mobile quick actions">
      <button className="nav-link" onClick={()=>{setTab('field');setShowSidebar(false)}}><Smartphone size={18}/> Field Mode</button>
      <button className="nav-link" onClick={()=>{setTab('diagram');setDiagramMode('guide');setShowSidebar(false)}}><ClipboardCheck size={18}/> Simplified install view</button>
      <button className="nav-link" onClick={()=>{setTab('diagram');setDiagramMode('audit');setShowSidebar(false)}}><AlertTriangle size={18}/> Needs verification</button>
      <button className="nav-link" onClick={()=>{setTab('diagram');setDiagramMode('map');setShowSidebar(false)}}><CircuitBoard size={18}/> Wiring diagram editor</button>
      <button className="nav-link" onClick={()=>{setShowWizard(true);setShowSidebar(false)}}><FileSpreadsheet size={18}/> Import Excel workbook</button>
      <button className="nav-link" onClick={()=>{downloadWiringReference(project);setShowSidebar(false);setMessage('Private Excel reference exported. Continue editing in Blueprint.')}}><Download size={18}/> Export Excel reference</button>
      <button className="nav-link" onClick={()=>{exportPrivateBackup();setShowSidebar(false)}}><Download size={18}/> Back up all projects</button>
      {cloud.enabled&&<button className="nav-link" onClick={()=>{setShowSidebar(false);void cloud.syncNow()}}><LockKeyhole size={18}/> Sync now</button>}
      <button className="nav-link" onClick={()=>{setShowSidebar(false);setShowTransfer(true)}}><Upload size={18}/> Backup / device options</button>
     </nav>
    </div>
    <div className="side-section"><p className="side-label">SEASON OVERVIEW</p><div className="side-season"><span>{project.season==='Halloween'?'🎃':'🎄'}</span><div><strong>{project.season} {project.year}</strong><small>{project.nodes.length} components · {project.edges.length} connections</small></div></div>
      <label className="status-row">Installation record<select value={project.status} onChange={e=>reviewInstallationStatus(e.target.value as 'draft'|'verified')}><option value="draft">Draft · not verified</option><option value="verified">Verified as-installed</option></select></label>
      {project.verificationReview&&<div className="field-review-history"><strong>Last field review: {new Date(project.verificationReview.reviewedAt).toLocaleDateString()}</strong><span>{project.verificationReview.notes}</span><small>{project.verificationReview.exceptions.length} findings documented at review · not electrical certification</small></div>}
       {project.example&&<div className="example-notice"><AlertTriangle size={17}/> Example data only. Not an installation record.</div>}
    </div>
    {tab==='diagram'&&<div className="side-section"><p className="side-label">DIAGRAM VIEWS</p><div className="nav-list">{(['All zones',...zones] as View[]).map(v=><button className={`nav-link nav-sub ${view===v?'active':''}`} key={v} onClick={()=>{changeView(v);setShowSidebar(false)}}><Layers size={15}/>{v==='All zones'?'Whole property':v}</button>)}{project.nodes.filter(n=>n.kind==='outlet').map(o=><button className={`nav-link nav-sub ${view===`Outlet: ${o.id}`?'active':''}`} key={o.id} onClick={()=>{focusOutlet(o.id);setShowSidebar(false)}}><PlugZap size={15}/>{o.name}</button>)}</div></div>}
    <div className="safety-note"><ShieldAlert size={19}/><div><strong>Electrical verification required</strong><span>Blueprint does not certify cords, loads, GFCI protection, or circuit safety.</span></div></div>
   </aside>
   <main className="content">
    {localSaving.saveState.phase==='failed'&&<div className="sync-alert" role="alert"><AlertTriangle size={17}/><span>Local save failed: {localSaving.saveState.message}. Changes remain on-screen. Retry saving now or make a private backup before leaving.</span><button className="button secondary" onClick={()=>void localSaving.flushAll()}>Retry local save</button></div>}
    {deletedReceipt?.projectId===project.id&&<div className="sync-alert" role="status"><span>A component was removed and affected branches require checking.</span><button className="button secondary" onClick={undoDeletion}>Undo component removal</button><button className="icon-button" aria-label="Dismiss undo option" onClick={()=>setDeletedReceipt(null)}><X size={16}/></button></div>}
    {cloud.enabled&&<div className={`sync-bar sync-${cloud.status}`} role="status">
      <LockKeyhole size={16}/><span><strong>{cloud.status==='synced'?'Private sync on':cloud.status==='conflict'?'Sync needs your choice':cloud.status==='offline'?'Offline — changes saved here':'Checking encrypted cloud…'}</strong>{cloud.lastSynced&&cloud.status==='synced'?` · Last synced ${cloud.lastSynced}`:''}</span>
      <button className="button secondary" onClick={()=>void cloud.syncNow()} disabled={cloud.status==='saving'}>Sync now</button>
     </div>}
    {cloud.status==='offline'&&<div className="sync-alert"><AlertTriangle size={17}/><span>Cloud sync unavailable: {cloud.error}. Changes remain on this device and retry automatically.</span></div>}
    {cloud.status==='conflict'&&<section className="sync-alert sync-conflict" role="alert"><AlertTriangle size={20}/><div><strong>Both devices changed the same project</strong><p>{cloud.conflicts.join(', ')}. Nothing was overwritten. Choose which version to use, or export a backup first.</p><div className="sync-alert-actions"><button className="button secondary" onClick={()=>{exportPrivateBackup();}}>Back up this device</button><button className="button secondary" onClick={()=>{if(confirm('Replace this device’s conflicting changes with the cloud version? Export a backup first if needed.'))void cloud.syncNow('remote');}}>Use cloud version</button><button className="button primary" onClick={()=>{if(confirm('Replace the conflicting cloud version with this device’s version? This will affect your other synced devices.'))void cloud.syncNow('local');}}>Keep this device</button></div></div></section>}
    {examplesOnly&&!cloud.enabled&&!dismissTransfer&&<section className="transfer-banner" role="note" aria-label="See master plans on this device">
      <div className="transfer-banner-copy"><Upload size={21}/><div><strong>Only examples on this device</strong><span>Import your private Halloween + Christmas backup from the computer that has your master plans.</span></div></div>
      <div className="transfer-banner-actions"><button className="button secondary" onClick={()=>setShowTransfer(true)}>Bring masters here</button><button className="icon-button" onClick={()=>setDismissTransfer(true)} aria-label="Dismiss master transfer tip"><X size={16}/></button></div>
     </section>}
    <div className="page-head"><div><div className="eyebrow">{project.season.toUpperCase()} {project.year} / {tab==='diagram'?'SYSTEM OVERVIEW':tab.toUpperCase()}</div><h1>{({field:'Your yard companion.',diagram:'Your display, connected.',setup:'Install with confidence.',teardown:'Pack it right for next year.',inventory:'Know what you own.'})[tab]}</h1><p>{({field:'Follow connections and setup steps without opening the graph editor.',diagram:'Plan the wiring once. Find every connection next season.',setup:'Ordered from your wiring graph. Check off each step as you work.',teardown:'Power off, disconnect, inspect and pack your components.',inventory:'Storage, condition and repair history in one place.'})[tab]}</p></div>
     <div className="head-buttons">{tab==='diagram'?<><button className="button secondary" onClick={()=>setShowWizard(true)}><FileSpreadsheet size={16}/> <span className="desktop-only">Import workbook</span><span className="mobile-only">Import</span></button><button className="button secondary" onClick={()=>{downloadWiringReference(project);setMessage('Reference workbook downloaded; original Excel master unchanged.');}}><FileSpreadsheet size={16}/> <span className="desktop-only">Export Excel reference</span><span className="mobile-only">Excel</span></button><button className="button secondary desktop-only" onClick={printAll}><Printer size={16}/> Print</button></>:null}
     {tab==='inventory'&&<button className="button secondary" onClick={()=>{const rows=[['ID','Name','Type','Zone','Color','Length ft','Storage','Quantity','Condition','Price','Repair history'],...project.nodes.map(n=>[n.id,n.name,n.kind,n.zone,n.color,n.lengthFt,n.inventory?.storage,n.inventory?.quantity,n.inventory?.condition,n.inventory?.price,n.inventory?.repairHistory])];downloadText(`inventory-${project.season}-${project.year}.csv`,rows.map(r=>r.map(csvEscape).join(',')).join('\r\n'),'text/csv');}}><Download size={16}/> CSV</button>}</div></div>
    {tab==='field'&&<><div className="field-sync-line" role="status"><span>{localSaving.saveState.phase==='saved'?'Saved locally':localSaving.saveState.phase==='saving'?'Saving on this device…':'Local save failed'}</span><span>{!cloud.enabled?'Sync not linked':cloud.status==='synced'?'Private sync connected':cloud.status==='offline'?'Cloud offline; local edits retained':cloud.status==='conflict'?'Sync conflict needs review':'Cloud checking…'}</span></div><FieldMode key={project.id} project={project} onLocate={jumpToNode} onTaskChange={(id,done)=>updateTask(id,{done})} onExplore={()=>{setTab('diagram');setDiagramMode('map');setFullscreen(true);setFullMode('explore');setBuilderSource(null);setSelected(null);setView('All zones')}} onEdit={()=>{setTab('diagram');setDiagramMode('map');setSelected(null);setView('All zones')}}/></>}
    {tab==='diagram'&&<>
      <div className="stats"><div className="stat"><div className="stat-icon soft-blue"><Layers size={20}/></div><div><strong>{project.nodes.length}</strong><span>Components</span></div></div><div className="stat"><div className="stat-icon soft-amber"><Link2 size={20}/></div><div><strong>{project.edges.length}</strong><span>Connections</span></div></div><div className="stat"><div className="stat-icon soft-green"><PlugZap size={20}/></div><div><strong>{project.nodes.filter(n=>n.kind==='outlet').length}</strong><span>Power sources</span></div></div><div className="stat"><div className="stat-icon soft-red"><AlertTriangle size={20}/></div><div><strong>{auditSummary.critical+auditSummary.attention}</strong><span>Needs verification</span></div></div></div>
      <div className="circuit-shortcuts" role="group" aria-label="Quick outlet focus">
        <span><PlugZap size={16}/> Focus circuit</span>
        <button className={view==='All zones'?'active':''} onClick={()=>changeView('All zones')}>Whole system</button>
        {project.nodes.filter(n=>n.kind==='outlet').map(o=><button key={o.id} className={view===`Outlet: ${o.id}`?'active':''}
          onClick={()=>focusOutlet(o.id)} title={o.name}>{o.name.match(/\bO\d+\b/i)?.[0]||o.name.slice(0,23)}</button>)}
      </div>
      <div className="diagram-mode-switch" role="group" aria-label="Choose diagram or installation view">
       <button className={diagramMode==='map'?'active':''} aria-pressed={diagramMode==='map'} onClick={()=>setDiagramMode('map')}><CircuitBoard size={17}/> Diagram editor</button>
       <button className={diagramMode==='guide'?'active':''} aria-pressed={diagramMode==='guide'} onClick={()=>setDiagramMode('guide')}><ClipboardCheck size={17}/> Install view</button>
        <button className={diagramMode==='audit'?'active':''} aria-pressed={diagramMode==='audit'} onClick={()=>setDiagramMode('audit')}><AlertTriangle size={17}/> Needs verification</button>
      </div>
      {diagramMode==='map'&&<div className="diagram-toolbar"><div className="tool-title"><CircuitBoard size={18}/><strong>Electrical graph</strong><span>Auto layout or your saved positions</span></div><div className="tool-actions"><label className="layout-picker">Layout<select aria-label="Diagram arrangement" value={layoutMode} onChange={e=>setLayoutMode(e.target.value as 'auto'|'manual')}><option value="auto">Auto power flow</option><option value="manual">My saved positions</option></select></label><button className="button secondary" onClick={()=>{setFullscreen(true);setFullMode('explore');setBuilderSource(null);setFullSearch('')}}><Maximize2 size={16}/> Fullscreen</button><button className="button secondary finder-open" onClick={openFinder}><Search size={15}/> Find</button><button className={`button secondary ${pathOnly?'path-isolated':''}`} disabled={!selected} aria-pressed={pathOnly} onClick={()=>setPathOnly(x=>!x)}>{pathOnly?'Show circuit':'Path only'}</button><select aria-label="New component type" value={addKind} onChange={e=>setAddKind(e.target.value as Kind)}>{categories.map(k=><option key={k.kind} value={k.kind}>{k.label}</option>)}</select><button className="button primary" onClick={addComponent}><Plus size={16}/> Add</button><button className="icon-button" aria-label="Toggle inspector" onClick={()=>setInspectorOpen(s=>!s)}><BookOpen size={19}/></button></div></div>}
      {diagramMode==='map'&&reusable.length>0&&<div className="reuse-strip"><Copy size={14}/><span>Reuse equipment from other seasons</span><select aria-label="Existing equipment" value={reuseId} onChange={e=>setReuseId(e.target.value)}><option value="">Select reusable item</option>{reusable.map(n=><option key={n.assetId||n.id} value={n.assetId||n.id}>{n.name} · {n.from}</option>)}</select><button className="button secondary" onClick={reuseComponent} disabled={!reuseId}>Add to this plan</button></div>}
      {diagramMode==='audit'&&<><div className="audit-undo"><div><strong>Latest recorded wiring change</strong><p>{project.wiringHistory?.length?`${project.wiringHistory.at(-1)?.action} · ${project.wiringHistory.at(-1)?.targetName}`:'No guided wiring edits recorded yet'}</p></div><button className="button secondary" disabled={!project.wiringHistory?.length||cloud.status==='conflict'} onClick={undoLastFeed}><ArrowUpRight size={15}/> Reverse last feed change</button></div>
        <VerificationAudit project={project} scope={baseVisibleIds} scopeLabel={view.startsWith('Outlet: ')?project.nodes.find(n=>n.id===view.slice(8))?.name||view:view} onLocate={jumpToNode} onVerify={id=>{const component=project.nodes.find(n=>n.id===id);if(!component)return;if(confirm(`Have you physically checked ${component.name} at the display? This marks it field-verified, not electrically certified.`)){patchComponent(id,{verified:true});setMessage(`${component.name} marked checked in the field. Any missing wiring or rating details remain outstanding.`);}}}/></>}
       {diagramMode==='guide'&&<InstallationGuide key={project.id} project={project} scope={baseVisibleIds} scopeLabel={view.startsWith('Outlet: ')?project.nodes.find(n=>n.id===view.slice(8))?.name||view:view} onLocate={jumpToNode} onTaskChange={(id,done)=>updateTask(id,{done})}/>}
      {diagramMode==='map'&&<div role={fullscreen?'dialog':undefined} aria-modal={fullscreen||undefined} aria-label={fullscreen?'Fullscreen wiring workspace':undefined} className={`diagram-layout ${!inspectorOpen?'diagram-wide':''} ${fullscreen?'diagram-fullscreen':''}`}><div className="diagram-card"><div className="canvas-label"><span className="canvas-live-dot"/> {view==='All zones'?'FULL SYSTEM':view.toUpperCase()} <span>· draft wiring view</span></div><div id="diagram-canvas" className="canvas-wrap" style={project.backgroundPhoto?{backgroundImage:`linear-gradient(#f9fafbcc,#f9fafbcc),url(${project.backgroundPhoto})`,backgroundSize:'contain',backgroundPosition:'center',backgroundRepeat:'no-repeat'}:undefined}>
       <ReactFlow<BlueprintFlowNode,Edge> nodes={flowNodes} edges={flowEdges} nodeTypes={nodeTypes} fitView fitViewOptions={{padding:0.22}} minZoom={0.08} maxZoom={3} nodesDraggable={workspaceEditable&&layoutMode==='manual'} nodesConnectable={workspaceEditable} edgesReconnectable={false} onNodesChange={changes=>{if(!workspaceEditable||layoutMode!=='manual')return;for(const change of changes){if(change.type==='position'&&change.position){update(p=>({...p,nodes:p.nodes.map(n=>n.id===change.id?{...n,position:change.position!}:n)}));}}}} onNodeClick={(_,n)=>{if(fullscreen&&fullMode==='builder'&&builderSource){selectBuilderTarget(n.id);return;}setSelected(n.id);setTrace(n.data.component.kind==='outlet'?'downstream':'upstream');if(!fullscreen)setInspectorOpen(true);}} onPaneClick={()=>{setSelected(null);setTrace('none');}} onConnect={connection=>{if(workspaceEditable)onConnect(connection);}} onEdgeClick={(_,edge)=>{if(fullscreen&&fullMode==='builder'){setInsertEdgeId(edge.id);setBuilderPanel('insert');setShowInsertPreview(false);return;}const target=project.nodes.find(n=>n.id===edge.target);if(target){setSelected(target.id);setTrace('upstream');if(!fullscreen)setInspectorOpen(true);}}} onEdgesDelete={deleted=>{if(!workspaceEditable)return;for(const e of deleted){if(confirm('Disconnect this power feed and mark downstream items for verification?'))changePowerFeed(e.target,null);}}} onNodesDelete={deleted=>{if(deleted.length===1)removeComponent(deleted[0].id);else setMessage('Delete nodes one at a time from the component inspector.')}} deleteKeyCode={null}>
        <Background gap={24} size={1} color="#e1e7ed"/>{!fullscreen&&<Controls showInteractive={false}/>}<MiniMap pannable zoomable nodeColor={n=>n.data?.component&&(n.data.component as Component).kind==='outlet'?'#d68b3e':'#6289aa'} style={{width:130,height:85,display:fullscreen?'none':undefined}}/>
       </ReactFlow>
       {fullscreen&&<div className="fullscreen-workspace-ui">
        <div className="fullscreen-topbar">
         <span className="fullscreen-title"><CircuitBoard size={18}/><strong>{project.season} {project.year}</strong><small>{fullMode==='explore'?'Explore wiring':'Build wiring'}</small></span>
         <div className="fullscreen-toolgroup" role="group" aria-label="Workspace mode">
          <button aria-pressed={fullMode==='explore'} className={fullMode==='explore'?'active':''} onClick={()=>{setFullMode('explore');setBuilderSource(null)}}><Eye size={16}/> Explore</button>
          <button aria-pressed={fullMode==='builder'} className={fullMode==='builder'?'active':''} onClick={()=>{setFullMode('builder');setBuilderSource(null)}}><PenTool size={16}/> Builder</button>
         </div>
         <button className="fullscreen-close" aria-label="Exit fullscreen diagram" onClick={()=>{setFullscreen(false);setBuilderSource(null);setFullSearch('')}}><Minimize2 size={18}/> <span>Exit</span></button>
        </div>
        <div className="fullscreen-controls">
         <label>Power circuit <select aria-label="Fullscreen power circuit" value={view} onChange={e=>changeView(e.target.value as View)}>
          <option value="All zones">Whole system</option>
          {project.nodes.filter(n=>n.kind==='outlet').map(n=><option value={`Outlet: ${n.id}`} key={n.id}>{n.name}</option>)}
          {zones.map(z=><option value={z} key={z}>{z}</option>)}</select></label>
         <div className="fullscreen-zoom" role="group" aria-label="Diagram zoom">
          <button aria-label="Zoom out diagram" onClick={()=>void zoomOut({duration:180})}><ZoomOut size={18}/></button>
          <button aria-label="Fit diagram to screen" onClick={()=>void fitView({padding:.2,duration:230})}>Fit</button>
          <button aria-label="Zoom in diagram" onClick={()=>void zoomIn({duration:180})}><ZoomIn size={18}/></button>
         </div>
         <button aria-pressed={pathOnly} disabled={!selected} onClick={()=>setPathOnly(v=>!v)}>{pathOnly?'Show circuit':'Path only'}</button>
         <div className="fullscreen-search"><Search size={15}/><input aria-label="Find equipment in fullscreen diagram" value={fullSearch} placeholder="Find any item…" onChange={e=>setFullSearch(e.target.value)}/>
          {fullSearch.trim().length>=2&&<div className="fullscreen-matches" role="list">
           {fullscreenMatches.map(item=><button key={item.id} role="listitem" onClick={()=>{if(!baseVisibleIds.has(item.id))setView('All zones');setSelected(item.id);setTrace('upstream');setFocusRequest(prev=>({id:item.id,seq:(prev?.seq||0)+1}));setFullSearch('')}}><strong>{item.name}</strong><small>{item.zone}</small></button>)}
           {fullscreenMatches.length===0&&<p>No matching items</p>}
          </div>}
         </div>
        </div>
        {fullMode==='explore'?<div className="fullscreen-hint">Drag empty space to pan · scroll or pinch to zoom · tap an item to trace its power</div>:
         <div className="fullscreen-builder" aria-label="Wiring builder tools">
          <div className="builder-add-row">
           <label>New item <select aria-label="New item type" value={addKind} onChange={e=>setAddKind(e.target.value as Kind)}>{categories.map(k=><option key={k.kind} value={k.kind}>{k.label}</option>)}</select></label>
           <input aria-label="Optional new item name" placeholder="Optional name" value={builderName} maxLength={100} onChange={e=>setBuilderName(e.target.value)}/>
           <button className="builder-primary" onClick={addBuilderItem}><Plus size={16}/> Add item</button>
          </div>
          <div className="builder-edit-row">
           <label>Layout <select aria-label="Builder diagram layout" value={layoutMode} onChange={e=>setLayoutMode(e.target.value as 'auto'|'manual')}><option value="auto">Auto flow</option><option value="manual">Move items manually</option></select></label>
           {selectedNode&&<label className="builder-rename">Selected <input aria-label="Rename selected component" value={selectedNode.name} onChange={e=>patchComponent(selectedNode.id,{name:e.target.value})}/></label>}
           {builderSource?<>
            <span className="builder-help">From {project.nodes.find(n=>n.id===builderSource)?.name}: select output, then tap the receiving item.</span>
            <label>Output <select aria-label="Builder source output" value={builderPort} onChange={e=>setBuilderPort(Number(e.target.value))}>{freeOutputPorts(project,builderSource).map(port=><option key={port} value={port}>Output {port+1}</option>)}</select></label>
            <button onClick={()=>setBuilderSource(null)}>Cancel wire</button>
           </>:<button disabled={!selectedNode||!selectedNode.outputs||!freeOutputPorts(project,selectedNode.id).length} onClick={chooseBuilderSource}><Link2 size={15}/> Connect from selected</button>}
           <button disabled={!selectedNode||!project.edges.some(e=>e.target===selectedNode.id)} onClick={()=>{if(selectedNode)changePowerFeed(selectedNode.id,null)}}><Unplug size={15}/> Disconnect</button>
           <button className="builder-danger" disabled={!selectedNode} onClick={()=>{if(selectedNode)removeComponent(selectedNode.id)}}><Trash2 size={15}/> Remove item</button>
           {deletedReceipt?.projectId===project.id&&<button onClick={undoDeletion}>Undo remove</button>}
          </div>
         </div>}
        {selectedNode&&fullMode==='explore'&&<div className="fullscreen-selection"><strong>{selectedNode.name}</strong><span>{sourcePath(selectedNode.id,project).map(n=>n.name).join(' → ')}</span><button onClick={()=>{setSelected(null);setTrace('none');setPathOnly(false)}} aria-label="Clear selected path"><X size={15}/></button></div>}
       </div>}
       </div><div className="canvas-footer"><span><CheckCircle2 size={14}/> {warningErrors.length?'Graph has errors':'Connection graph valid'}</span><label className="photo-action"><ImagePlus size={15}/> Add property image<input type="file" accept="image/*" onChange={e=>{void attachPhoto(e.target.files?.[0]);e.target.value='';}}/></label></div></div>
       {inspectorOpen&&!fullscreen&&<div className="inspector"><div className="inspector-title"><strong>{selectedNode?'Component details':'Connection tools'}</strong><button className="icon-button" aria-label="Close inspector" onClick={()=>setInspectorOpen(false)}><X size={16}/></button></div>
        <ConnectionFinder key={project.id} project={project} scope={baseVisibleIds} selected={selected} onSelect={jumpToNode}/>
        {selectedNode?<><div className="inspector-component"><div className="inspector-icon"><Box size={22}/></div><div><span className="eyebrow">{selectedNode.kind.replace(/-/g,' ').toUpperCase()}</span><h3>{selectedNode.name}</h3><small>{selectedNode.id}</small></div></div>
         <div className="trace-buttons"><button onClick={()=>setTrace('upstream')} className={trace==='upstream'?'active':''}><ArrowDownToLine size={15}/> Trace source</button><button onClick={()=>setTrace('outage')} className={trace==='outage'?'active':''}><WifiOff size={15}/> If unplugged</button></div>
         {trace==='upstream'&&<div className="trace-box"><strong>Power path back to source</strong>{sourcePath(selectedNode.id,project).map((n,i)=><div key={n.id}>{i>0?'↳ ':''}{n.name}</div>)}</div>}
         {trace==='outage'&&<div className="trace-box warning"><strong>Components losing this feed: {downstream(selectedNode.id,project.edges).size}</strong>{[...downstream(selectedNode.id,project.edges)].map(id=><div key={id}>{project.nodes.find(n=>n.id===id)?.name||id}</div>)}</div>}
         {selectedNode.kind!=='outlet'&&<PowerFeedEditor key={selectedNode.id} project={project} target={selectedNode} onConnect={(source,port)=>changePowerFeed(selectedNode.id,source,port)} onDisconnect={()=>changePowerFeed(selectedNode.id,null)}/>}
         {project.wiringHistory?.some(entry=>entry.targetId===selectedNode.id)&&<details className="wiring-history"><summary>Recent wiring changes</summary>{[...project.wiringHistory].filter(entry=>entry.targetId===selectedNode.id).slice(-5).reverse().map(entry=><p key={entry.id}><strong>{entry.action}</strong> · {new Date(entry.at).toLocaleString()}<span>{entry.fromId||'No source'}{entry.fromPort!==undefined?` (output ${entry.fromPort+1})`:''} → {entry.toId||'Disconnected'}{entry.toPort!==undefined?` (output ${entry.toPort+1})`:''}</span></p>)}</details>}
         <div className="inspector-fields"><label>Name<input value={selectedNode.name} onChange={e=>patchComponent(selectedNode.id,{name:e.target.value})}/></label><label>Zone<select value={selectedNode.zone} onChange={e=>patchComponent(selectedNode.id,{zone:e.target.value as Zone})}>{zones.map(z=><option key={z}>{z}</option>)}</select></label>
          <div className="form-grid"><label>Type<select value={selectedNode.kind} onChange={e=>{const kind=e.target.value as Kind;patchComponent(selectedNode.id,{kind,outputs:outputCount(kind)});}}>{categories.map(c=><option key={c.kind} value={c.kind}>{c.label}</option>)}</select></label><label>Outputs<input type="number" min={0} max={16} value={selectedNode.outputs} onChange={e=>patchComponent(selectedNode.id,{outputs:Number(e.target.value)})}/></label></div>
          <div className="form-grid"><label>Input plug<select disabled={selectedNode.kind==='outlet'} value={selectedNode.inputGender||''} onChange={e=>patchComponent(selectedNode.id,{inputGender:e.target.value?e.target.value as 'male'|'female':undefined})}><option value="">Unknown</option><option value="male">Male</option><option value="female">Female</option></select></label><label>Output connector<select disabled={selectedNode.outputs===0} value={selectedNode.outputGender||''} onChange={e=>patchComponent(selectedNode.id,{outputGender:e.target.value?e.target.value as 'male'|'female':undefined})}><option value="">Unknown</option><option value="female">Female</option><option value="male">Male</option></select></label></div>
          <label className="field-verified"><input type="checkbox" checked={!!selectedNode.verified} onChange={e=>patchComponent(selectedNode.id,{verified:e.target.checked})}/> Verified this component on site (not electrical certification)</label>
          <label>Wire / cord construction<input placeholder="e.g. outdoor 16/3, SPT-1" value={selectedNode.cordType||''} onChange={e=>patchComponent(selectedNode.id,{cordType:e.target.value})}/></label>
          <div className="form-grid"><label>Wire color<input placeholder="e.g. Green" value={selectedNode.color||''} onChange={e=>patchComponent(selectedNode.id,{color:e.target.value})}/></label><label>Length (ft)<input type="number" min={0} value={selectedNode.lengthFt??''} onChange={e=>patchComponent(selectedNode.id,{lengthFt:e.target.value===''?undefined:Number(e.target.value)})}/></label></div>
          <div className="form-grid"><label>Rated watts<input type="number" min={0} value={selectedNode.ratedWatts??''} onChange={e=>patchComponent(selectedNode.id,{ratedWatts:e.target.value===''?undefined:Number(e.target.value)})}/></label><label>Expected load W<input type="number" min={0} value={selectedNode.expectedWatts??''} onChange={e=>patchComponent(selectedNode.id,{expectedWatts:e.target.value===''?undefined:Number(e.target.value)})}/></label></div>
          <label>Storage bin/location<input placeholder="e.g. Garage bin A" value={selectedNode.inventory?.storage||''} onChange={e=>patchComponent(selectedNode.id,{inventory:{...selectedNode.inventory,storage:e.target.value}})}/></label>
          <div className="form-grid"><label>Quantity<input type="number" min={0} value={selectedNode.inventory?.quantity??1} onChange={e=>patchComponent(selectedNode.id,{inventory:{...selectedNode.inventory,quantity:Number(e.target.value)}})}/></label><label>Condition<select value={selectedNode.inventory?.condition||'good'} onChange={e=>patchComponent(selectedNode.id,{inventory:{...selectedNode.inventory,condition:e.target.value as 'good'|'missing'|'damaged'|'repair'}})}><option value="good">Good</option><option value="missing">Missing</option><option value="damaged">Damaged</option><option value="repair">Needs repair</option></select></label></div>
          <div className="form-grid"><label>Purchase date<input type="date" value={selectedNode.inventory?.purchaseDate||''} onChange={e=>patchComponent(selectedNode.id,{inventory:{...selectedNode.inventory,purchaseDate:e.target.value}})}/></label><label>Purchase price ($)<input type="number" min={0} step="0.01" value={selectedNode.inventory?.price??''} onChange={e=>patchComponent(selectedNode.id,{inventory:{...selectedNode.inventory,price:e.target.value===''?undefined:Number(e.target.value)}})}/></label></div>
          <label>Repair history<textarea rows={2} value={selectedNode.inventory?.repairHistory||''} onChange={e=>patchComponent(selectedNode.id,{inventory:{...selectedNode.inventory,repairHistory:e.target.value}})}/></label>
          {selectedNode.assetId&&<div className="asset-usage"><strong>Shared asset ID</strong><code>{selectedNode.assetId}</code><span>Used in: {projects.filter(p=>p.nodes.some(n=>n.assetId===selectedNode.assetId)).map(p=>`${p.season} ${p.year}`).join(' · ')||'Current season'}</span></div>}
          <label>Notes / install instructions<textarea rows={3} value={selectedNode.notes||''} onChange={e=>patchComponent(selectedNode.id,{notes:e.target.value})}/></label>
          {selectedNode.photo&&<img className="component-photo" src={selectedNode.photo} alt={`Reference for ${selectedNode.name}`}/>}<label className="upload-inline"><ImagePlus size={16}/>{selectedNode.photo?'Replace photo':'Attach component photo'}<input type="file" accept="image/*" onChange={e=>{void attachPhoto(e.target.files?.[0],selectedNode.id);e.target.value='';}}/></label>
          <button className="text-danger" onClick={()=>removeComponent(selectedNode.id)}><Trash2 size={15}/> Remove component and links</button>
         </div></>:<><p className="muted">Select an item to edit, trace its power source or show the outage impact. Drag from a small output dot to another component’s input dot to wire them.</p><div className="connect-form"><strong>Connect two components</strong><label>From (powered output)<select value={connectFrom} onChange={e=>setConnectFrom(e.target.value)}><option value="">Choose source</option>{project.nodes.filter(n=>n.outputs>0).map(n=><option key={n.id} value={n.id}>{n.name}</option>)}</select></label><label>To (receiving input)<select value={connectTo} onChange={e=>setConnectTo(e.target.value)}><option value="">Choose target</option>{project.nodes.filter(n=>n.kind!=='outlet').map(n=><option key={n.id} value={n.id}>{n.name}</option>)}</select></label><button className="button primary" disabled={!connectFrom||!connectTo} onClick={()=>addConnection(connectFrom,connectTo)}><Link2 size={15}/> Connect available port</button></div></>}
       </div>}
      </div>}<div className="notice-row"><AlertTriangle size={17}/><div><strong>Manual electrical checks</strong><span>{warnings.join(' • ')}</span></div></div>
     </>}
    {(tab==='setup'||tab==='teardown')&&<div className="checklist-layout"><div className="checklist-main"><div className="checklist-summary"><div><span className="eyebrow">{tab==='setup'?'INSTALLATION PLAN':'TEARDOWN PLAN'}</span><h2>{progress} of {tasks.length} complete</h2><p>Tasks are generated from component placement and wiring dependencies.</p></div><div className="progress-ring" style={{'--progress':`${tasks.length?progress/tasks.length*100:0}%`} as CSSProperties}>{tasks.length?Math.round(progress/tasks.length*100):0}%</div></div><div className="progress-track"><div style={{width:`${tasks.length?progress/tasks.length*100:0}%`}}/></div>
      {checklistKinds.map(phase=><section className="task-section" key={phase}><h3>{phase}</h3>{tasks.filter(t=>t.phase===phase).map(renderTask)}</section>)}{!tasks.length&&<div className="empty-state">Add components and wiring connections to automatically generate steps.</div>}
     </div><aside className="checklist-aside"><div className="mini-card"><strong><Activity size={17}/> In the yard</strong><p>Every checkbox and note saves to this browser. With your private master link connected, updates sync securely across devices when online. Offline changes stay local until synchronized.</p></div><button className="button secondary" onClick={()=>{setTab('diagram');setSelected(null);setPathOnly(false);}}><Map size={16}/> Back to wiring</button></aside></div>}
    {tab==='inventory'&&<div className="inventory-panel"><div className="inventory-toolbar"><div className="searchbox"><Search size={17}/><input aria-label="Search inventory" placeholder="Search equipment, bins, notes..." value={search} onChange={e=>setSearch(e.target.value)}/></div><span>{project.nodes.length} items</span></div><div className="inventory-list">{project.nodes.filter(n=>`${n.name} ${n.kind} ${n.zone} ${n.inventory?.storage} ${n.notes}`.toLowerCase().includes(search.toLowerCase())).map(n=><button className="inventory-row" key={n.id} onClick={()=>{setTab('diagram');setPathOnly(false);setView('All zones');jumpToNode(n.id);}}>{n.photo?<img src={n.photo} alt=""/>:<span className="inventory-blank"><Package size={22}/></span>}<span className="inventory-info"><strong>{n.name}</strong><small>{n.kind} · {n.zone}</small></span><span className="inventory-storage">{n.inventory?.storage||'Storage not set'}<small>{n.inventory?.condition||'Condition not recorded'}</small></span><ArrowRight size={18}/></button>)}</div></div>}
   </main>
  </div>
  <nav className="mobile-tabbar" aria-label="Mobile main navigation">{(['field','diagram','setup','teardown','inventory'] as Tab[]).map(t=>{const Icon=iconFor[t];return <button key={t} className={tab===t?'active':''} onClick={()=>{setTab(t);setShowSidebar(false);setShowMenu(false)}}><Icon size={21}/><span>{({field:'Field',diagram:'Wiring',setup:'Install',teardown:'Teardown',inventory:'Inventory'})[t]}</span></button>;})}</nav>
  {message&&<div className="toast" role="status"><span>{message}</span><button aria-label="Dismiss message" onClick={()=>setMessage('')}><X size={16}/></button></div>}
  {showTransfer&&<DeviceTransfer hasRealPlans={!examplesOnly} projectCount={projects.length} onExport={exportPrivateBackup} onImport={importBackup} onClose={()=>setShowTransfer(false)}/>}
  {showWizard&&<ExcelWizard project={project} onSave={p=>{update(()=>p);setMessage('Workbook rows imported as draft. Review each mapping and save a backup.');}} onImportMaster={p=>{setProjects(all=>[...all,p]);setActive(p.id);setView(p.nodes.length>25&&p.nodes.some(n=>n.kind==='outlet')?`Outlet: ${p.nodes.find(n=>n.kind==='outlet')!.id}`:'All zones');setSelected(null);setTrace('none');setMessage(`${p.season} workbook imported as a separate DRAFT. Check every connection and export a private backup.`);}} onClose={()=>setShowWizard(false)}/>}
 </div>;
}
export default function App(){return <ReactFlowProvider><AppContent/></ReactFlowProvider>;}
