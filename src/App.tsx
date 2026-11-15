import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {ReactFlow,Background,Controls,MiniMap,ReactFlowProvider,useReactFlow,MarkerType,type Edge,type Connection as FlowConnection} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {AlertTriangle,ArrowDownToLine,ArrowUpRight,BookOpen,CheckCircle2,RotateCcw,RotateCw,ChevronDown,CircuitBoard,ClipboardCheck,Copy,Download,FileSpreadsheet,ImagePlus,Link2,History,Map,MoreVertical,Package,PlugZap,Plus,Printer,LockKeyhole,Search,ShieldAlert,Smartphone,Maximize2,Minimize2,ZoomIn,ZoomOut,Eye,SlidersHorizontal,PenTool,Trash2,Unplug,Upload,WifiOff,X} from 'lucide-react';
import type {Component,Kind,Project,Season,Zone} from './lib/model';
import {categories,now,outputCount} from './lib/model';
import {downstream,generatedTasks,sourcePath,upstream,validateGraph,warningSummary} from './lib/graph';
import {db,initialize,createBackup,parseBackup,restoreBackup,downloadText} from './lib/storage';
import {readPhoto} from './lib/photos';
import {BlueprintNode,type BlueprintFlowNode} from './components/BlueprintNode';
import {DiagramQuickEdit,type DiagramQuickEditState,tidyComponentName} from './components/DiagramQuickEdit';
import {InspectorIdentity} from './components/InspectorIdentity';
import {ComponentPhotoGallery} from './components/ComponentPhotoGallery';
import {QuickEquipmentPalette} from './components/QuickEquipmentPalette';
import {PlugInPanel} from './components/PlugInPanel';
import {EquipmentInventory} from './components/EquipmentInventory';
import {WirePanel} from './components/WirePanel';
import {PowerInSection,PowerOutSection} from './components/PowerSections';
import {outputIsFree,unpluggedItems} from './lib/wiringPanel';
import {duplicateEquipment} from './lib/duplicateEquipment';
import {quickAddConnected} from './lib/quickAdd';
import {createBlankDisplay,projectLabel} from './lib/newDisplay';
import {addComponentPhoto,promoteComponentPhoto,removeComponentPhoto,photoCount,type PhotoRole} from './lib/componentPhotos';
import {ExcelWizard} from './components/ExcelWizard';
import {ConnectionFinder} from './components/ConnectionFinder';
import {InstallationGuide} from './components/InstallationGuide';
import {SeasonTasks} from './components/SeasonTasks';
import {PhotoImportReview,type PhotoImportAddition} from './components/PhotoImportReview';
import {FieldMode} from './components/FieldMode';
import {NewDisplay} from './components/NewDisplay';
import {EmptyDisplayStart} from './components/EmptyDisplayStart';
import {PropertyPhotoView} from './components/PropertyPhotoView';
import {PropertyPhotoViews} from './components/PropertyPhotoViews';
import {PhotoQuickEdit} from './components/PhotoQuickEdit';
import {PhotoVisualControls,PhotoVisualOverlay,defaultPhotoVisuals} from './components/PhotoVisuals';
import {useUnsavedPhotoGuard} from './lib/useUnsavedPhotoGuard';
import {PhotoAddPalette,type PhotoAddDraft} from './components/PhotoAddPalette';
import {PhotoConnect} from './components/PhotoConnect';
import {PhotoNextSteps} from './components/PhotoNextSteps';
import {ConnectionOverview} from './components/ConnectionOverview';
import {PhotoDirectDraw} from './components/PhotoDirectDraw';
import {createPhotoDirectRoute,type DirectRouteDraft} from './lib/photoDirectDraw';
import {addPhotoEquipment} from './lib/photoEquipment';
import {getPropertyPhotoViews,setPropertyPhotoLayout,MAIN_PROPERTY_PHOTO_ID,type PropertyPhoto} from './lib/propertyPhoto';
import {GuidedAdd,type GuidedAddOptions} from './components/GuidedAdd';
import {addGuidedEquipment,connectGuidedEquipment} from './lib/guidedEquipment';
import {SharedLightingInventory} from './components/SharedLightingInventory';
import {VersionHistory} from './components/VersionHistory';
import {isSharedLightingRecord,createSharedLightingRecord,availableStock,addStock,updateStock,addPlacement,updatePlacement,repeatLastYearAssignments,importLegacyLighting,stockCsv} from './lib/sharedLighting';

import {VerificationAudit} from './components/VerificationAudit';
import {auditCounts,getVerificationIssues} from './lib/verificationAudit';
import {reviewInstalledProject} from './lib/verificationReview';
import {editPowerFeed,undoLastWiringChange} from './lib/wiringEdits';
import {downloadWiringReference} from './lib/wiringExport';
import {DeviceTransfer} from './components/DeviceTransfer';
import {MobileMenuToggle} from './components/MobileMenuToggle';
import {hasOnlyExamples} from './lib/deviceTransfer';
import {useSharedSync} from './hooks/useSharedSync';
import {useProjectPersistence} from './hooks/useProjectPersistence';
import {deleteComponentSafely} from './lib/graphDeletion';
import {emptyGraphHistory,graphFingerprint,recordGraphStep,undoGraphStep,redoGraphStep,type GraphHistory} from './lib/diagramHistory';
import './components/deviceTransfer.css';
import {wireDescription} from './lib/wiringGuide';
import {powerFlowLayout} from './lib/flowLayout';
import {portName,renameOutputPort} from './lib/portLabels';
import {insertIntoConnection} from './lib/wiringBuilder';
import {phoneDiagramAnchor,searchComponents,workspaceCanEdit} from './lib/canvasWorkspace';
import {exampleProjects} from './fixtures/examples';
import './styles.css';
import './components/diagramStatus.css';
import './components/mobileExperience.css';
import './components/wiringWorkspace.css';
const nodeTypes={blueprint:BlueprintNode};
/** Below this zoom, item names stop being readable on a desktop canvas. */
const legibleZoom=.72;
type Tab='field'|'diagram'|'setup'|'teardown'|'inventory';type View='All zones'|Zone|`Outlet: ${string}`;
const zones:Zone[]=['Front porch','Garage & driveway','Backyard','Other'];
const iconFor:Record<Tab,typeof Map>={field:Smartphone,diagram:Map,setup:ClipboardCheck,teardown:Unplug,inventory:Package};
const csvEscape=(s:unknown)=>`"${String(s??'').replace(/"/g,'""')}"`;
function AppContent(){
 const {fitView,setCenter,setViewport,zoomIn,zoomOut,getZoom}=useReactFlow<BlueprintFlowNode,Edge>();
 const [projects,setProjects]=useState<Project[]>([]);const [active,setActive]=useState('');const [loaded,setLoaded]=useState(false);const [storageReady,setStorageReady]=useState(true);
 const [tab,setTab]=useState<Tab>(()=>window.matchMedia('(max-width:720px)').matches?'field':'diagram');const [view,setView]=useState<View>('All zones');const [selected,setSelected]=useState<string|null>(null);const [trace,setTrace]=useState<'none'|'upstream'|'downstream'|'outage'>('none');
 const [diagramMode,setDiagramMode]=useState<'map'|'guide'|'audit'|'photo'>('map');const [layoutMode,setLayoutMode]=useState<'auto'|'manual'>('auto');const [pathOnly,setPathOnly]=useState(false);const [focusRequest,setFocusRequest]=useState<{id:string;seq:number;keepZoom?:boolean}|null>(null);
 const [inventoryMode,setInventoryMode]=useState<'equipment'|'lighting'>('equipment');
 const [diagramSearch,setDiagramSearch]=useState('');const [showDiagramMore,setShowDiagramMore]=useState(false);const [plugIn,setPlugIn]=useState<{sourceId:string;port:number}|null>(null);
 const [showPhotoImport,setShowPhotoImport]=useState(false);
 const [showNewDisplay,setShowNewDisplay]=useState(false);
 const [showGuidedAdd,setShowGuidedAdd]=useState(false);
 const [guidedKind,setGuidedKind]=useState<Kind|undefined>();
 const [guidedError,setGuidedError]=useState('');
 const [photoAddDraft,setPhotoAddDraft]=useState<PhotoAddDraft>({kind:null,zone:''});
 const [directDraft,setDirectDraft]=useState<DirectRouteDraft|null>(null);
 const [pendingPhotoDraw,setPendingPhotoDraw]=useState<string|null>(null);
 const [nextPhotoItem,setNextPhotoItem]=useState<string|null>(null);
 const [photoEditRequest,setPhotoEditRequest]=useState(0);
 const [photoMeasureRequest,setPhotoMeasureRequest]=useState(0);
 const [diagramConnectTarget,setDiagramConnectTarget]=useState<string|null>(null);
 const [diagramConnectSource,setDiagramConnectSource]=useState('');
 const [photoConnectTarget,setPhotoConnectTarget]=useState<string|null>(null);
 const [photoConnectSource,setPhotoConnectSource]=useState('');
 const [activePhotoId,setActivePhotoId]=useState(MAIN_PROPERTY_PHOTO_ID);
 const [photoUnsaved,setPhotoUnsaved]=useState(false);
 const [photoQuickDirty,setPhotoQuickDirty]=useState(false);
 const photoAddInFlight=useRef<Project|null>(null);
 const [photoSimilarId,setPhotoSimilarId]=useState<string|null>(null);
 const [photoVisuals,setPhotoVisuals]=useState(defaultPhotoVisuals);
 const [photoAspect,setPhotoAspect]=useState(1);
 const photoPlacing=!!photoSimilarId||!!photoAddDraft.kind&&!!photoAddDraft.zone||!!directDraft?.zone;
 useEffect(()=>{if(photoPlacing&&window.innerWidth<1000)requestAnimationFrame(()=>document.querySelector('.property-photo-viewport')?.scrollIntoView({behavior:'smooth',block:'start'}));},[photoPlacing]);
 const confirmPhotoNavigation=useUnsavedPhotoGuard(tab==='diagram'&&diagramMode==='photo'&&(photoUnsaved||photoQuickDirty||!!directDraft?.points.length));
 const closeNewDisplay=useCallback(()=>{setShowNewDisplay(false);requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>(window.matchMedia('(max-width:720px)').matches?'.mobile-header-menu':'.desktop-more-button')?.focus());},[]);
 const [showHistory,setShowHistory]=useState(false);const [showTransfer,setShowTransfer]=useState(false);const [dismissTransfer,setDismissTransfer]=useState(false);const [showWizard,setShowWizard]=useState(false);const [showMenu,setShowMenu]=useState(false);const [showSidebar,setShowSidebar]=useState(false);
 const [message,setMessage]=useState(''); const [inspectorOpen,setInspectorOpen]=useState(true);
 const [diagramQuickEdit,setDiagramQuickEdit]=useState<DiagramQuickEditState|null>(null);
 const [graphHistory,setGraphHistory]=useState<GraphHistory>(emptyGraphHistory);
 const [fullscreen,setFullscreen]=useState(false);
 const [fullMode,setFullMode]=useState<'explore'|'builder'>('explore');
 const [fullSearch,setFullSearch]=useState('');
 const [galleryId,setGalleryId]=useState<string|null>(null);
 const [fullToolsOpen,setFullToolsOpen]=useState(false);
 const [insertEdgeId,setInsertEdgeId]=useState('');
 const workspaceEditable=workspaceCanEdit(fullscreen,fullMode);
 // A new selection must always begin at the selected item's identity, even
 // if the previous inspector was scrolled into its electrical specifications.
 useEffect(()=>{const inspector=document.querySelector<HTMLElement>('.inspector');if(inspector)inspector.scrollTop=0;},[selected,active,inspectorOpen,fullscreen]);
 useEffect(()=>{setDiagramQuickEdit(null);},[active,tab,diagramMode]);
 useEffect(()=>{setDiagramConnectTarget(null);setDiagramConnectSource('');setPlugIn(null);},[fullscreen]);
 useEffect(()=>{setPhotoAddDraft({kind:null,zone:''});setPlugIn(null);setShowDiagramMore(false);setPhotoConnectTarget(null);setPhotoConnectSource('');setDirectDraft(null);setDiagramConnectTarget(null);setDiagramConnectSource('');setNextPhotoItem(null);setPhotoEditRequest(0);setPhotoMeasureRequest(0);},[active,tab,diagramMode]);
 useEffect(()=>{setActivePhotoId(MAIN_PROPERTY_PHOTO_ID);setPhotoUnsaved(false);setPhotoQuickDirty(false);setPhotoSimilarId(null);setPhotoVisuals(defaultPhotoVisuals);setPhotoAspect(1);},[active]);
 const openDiagramQuickEdit=useCallback((id:string,x:number,y:number,mode:'name'|'icon')=>{
  if(!workspaceEditable)return;
  const bounds=document.getElementById('diagram-canvas')?.getBoundingClientRect();
  if(!bounds)return;
  const width=Math.min(320,Math.max(200,bounds.width-16));
  const left=Math.max(8,Math.min(x-bounds.left+12,bounds.width-width-8));
  const top=Math.max(8,Math.min(y-bounds.top+10,Math.max(8,bounds.height-285)));
  setDiagramQuickEdit({id,left,top,mode});
  setSelected(id);setTrace('none');
  setInspectorOpen(true);
 },[workspaceEditable]);
 // F2 opens the existing inline name editor without interfering with input fields
 // or making read-only fullscreen Explore editable.
 useEffect(()=>{
  if(tab!=='diagram'||diagramMode!=='map'||!workspaceEditable||!selected)return;
  const onRenameKey=(event:KeyboardEvent)=>{
   if(event.key!=='F2'||event.altKey||event.ctrlKey||event.metaKey)return;
   const target=event.target;
   if(target instanceof HTMLElement&&target.closest('input,textarea,select,[contenteditable="true"],.diagram-quick-editor'))return;
   const canvas=document.getElementById('diagram-canvas');
   if(!canvas)return;
   const bounds=canvas.getBoundingClientRect();
   const element=Array.from(canvas.querySelectorAll<HTMLElement>('.react-flow__node')).find(n=>n.dataset.id===selected);
   const rect=element?.getBoundingClientRect();
   event.preventDefault();
   openDiagramQuickEdit(selected,rect?.left??bounds.left+bounds.width/2,rect?.top??bounds.top+bounds.height/2,'name');
  };
  document.addEventListener('keydown',onRenameKey);
  return()=>document.removeEventListener('keydown',onRenameKey);
 },[tab,diagramMode,workspaceEditable,selected,openDiagramQuickEdit]);
 useEffect(()=>{
  if(!fullscreen)return;
  const previous=document.body.style.overflow;document.body.style.overflow='hidden';
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'){if(diagramQuickEdit){setDiagramQuickEdit(null);return;}if(showGuidedAdd||galleryId)return;if(diagramConnectTarget||plugIn){setDiagramConnectTarget(null);setDiagramConnectSource('');setPlugIn(null);return;}setFullscreen(false);setFullSearch('');}};
  document.addEventListener('keydown',onKey);
  return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',onKey);};
 },[fullscreen,diagramQuickEdit,diagramConnectTarget,plugIn,showGuidedAdd,galleryId]);
 useEffect(()=>{
  if(!galleryId)return;
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')setGalleryId(null);};
  document.addEventListener('keydown',onKey);
  return()=>document.removeEventListener('keydown',onKey);
 },[galleryId]);
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
 useEffect(()=>{let live=true;initialize().then(items=>{if(live){setProjects(items);setActive(items.find(p=>!isSharedLightingRecord(p))?.id||'');setLoaded(true);}}).catch(e=>{if(live){const fallback=exampleProjects();setProjects(fallback);setActive(fallback[0].id);setLoaded(true);setStorageReady(false);setMessage(`Browser storage unavailable: ${String(e)}. Changes are temporary — export a JSON backup.`);}});return()=>{live=false;};},[]);
 const cloud=useSharedSync({loaded,storageReady,projects,setProjects,onImported:(chosen)=>{
  const outlet=chosen.nodes.find(n=>n.kind==='outlet');
  setActive(chosen.id);setTab(window.matchMedia('(max-width:720px)').matches?'field':'diagram');setDiagramMode('guide');
  setView(outlet&&chosen.nodes.length>20?`Outlet: ${outlet.id}`:'All zones');
  setSelected(null);setTrace('none');setPathOnly(false);
  setMessage('Your private master plans are available here and are now synced with other linked devices.');
 }});
 const project=projects.find(p=>p.id===active);
 const photoView=project?getPropertyPhotoViews(project).find(v=>v.id===activePhotoId):undefined;
 useEffect(()=>{if(!pendingPhotoDraw)return;if(project?.nodes.some(n=>n.id===pendingPhotoDraw)){setSelected(pendingPhotoDraw);setPhotoEditRequest(0);setNextPhotoItem(pendingPhotoDraw);setDirectDraft(null);setMessage('Route and equipment saved. Connect and verify the item when ready.');}else setGuidedError('The display or photo changed before the route could be saved. Your drawing is still here; please try again.');setPendingPhotoDraw(null);},[pendingPhotoDraw,project]);
 const sharedLighting=availableStock(projects);
 const availableProjects=projects.filter(p=>!isSharedLightingRecord(p));
 useEffect(()=>{setInventoryMode(project?.season==='Christmas'?'lighting':'equipment');},[active,project?.season]);
 const localSaving=useProjectPersistence(projects,active,loaded,storageReady);
 const inventorySaving=tab==='inventory'&&inventoryMode==='lighting'&&projects.some(isSharedLightingRecord)?localSaving.getState('shared-lighting-inventory-v1'):localSaving.saveState;
 useEffect(()=>{
  if(tab!=='diagram'||diagramMode!=='map'||!workspaceEditable)return;
  const onKey=(event:KeyboardEvent)=>{
   if(!(event.ctrlKey||event.metaKey)||event.altKey||event.key.toLowerCase()!=='z'&&event.key.toLowerCase()!=='y')return;
   const target=event.target;
   if(target instanceof HTMLElement&&target.closest('input,textarea,select,[contenteditable="true"],.diagram-quick-editor'))return;
   if(event.key.toLowerCase()==='z'&&!event.shiftKey&&graphHistory.past.length){event.preventDefault();stepGraph('undo');}
   else if((event.key.toLowerCase()==='y'||event.key.toLowerCase()==='z'&&event.shiftKey)&&graphHistory.future.length){event.preventDefault();stepGraph('redo');}
  };
  document.addEventListener('keydown',onKey);
  return()=>document.removeEventListener('keydown',onKey);
 },[tab,diagramMode,workspaceEditable,graphHistory,project,cloud.status]);

 useEffect(()=>{if(fullscreen||tab!=='diagram'||diagramMode!=='map'||!project)return;const timer=setTimeout(()=>{
  if(window.innerWidth>=720){
   // Fit everything only while it stays readable; otherwise start legibly at the power sources and let the user pan.
   const canvas=document.getElementById('diagram-canvas')?.getBoundingClientRect();
   const spots=project.nodes.filter(n=>visibleIds.has(n.id)).map(n=>layoutMode==='auto'?(autoPositions.get(n.id)||n.position):n.position);
   if(!canvas||!spots.length){void fitView({padding:.16,duration:160});return;}
   const minX=Math.min(...spots.map(p=>p.x)),maxX=Math.max(...spots.map(p=>p.x))+210,minY=Math.min(...spots.map(p=>p.y)),maxY=Math.max(...spots.map(p=>p.y))+95;
   const pad=36,fit=Math.min((canvas.width-pad*2)/(maxX-minX),(canvas.height-pad*2)/(maxY-minY));
   if(fit>=legibleZoom){void fitView({padding:.12,maxZoom:1.15,duration:160});return;}
   const tall=(maxY-minY)*legibleZoom>canvas.height-pad*2;
   void setViewport({x:pad-minX*legibleZoom,y:tall?pad-minY*legibleZoom:(canvas.height-(maxY-minY)*legibleZoom)/2-minY*legibleZoom,zoom:legibleZoom},{duration:160});
   return;
  }
  const anchor=phoneDiagramAnchor(project,visibleIds,view,selected);
  if(!anchor)return;
  const pos=layoutMode==='auto'?(autoPositions.get(anchor.id)||anchor.position):anchor.position;
  setCenter(pos.x+105,pos.y+43,{zoom:.85,duration:160});
 },90);return()=>clearTimeout(timer);},[view,tab,active,inspectorOpen,fitView,setCenter,setViewport,layoutMode,pathOnly,diagramMode,fullscreen]);
 const update=useCallback((fn:(p:Project)=>Project)=>{setProjects(all=>all.map(p=>{if(p.id!==active)return p;const result=fn(p);return result===p?p:{...result,updatedAt:now()};}));},[active]);
 // These are local session commands, not synced revisions. Reject a stale graph.
 function commitGraphChange(next:Project,label:string,editPhoto?:(photo:PropertyPhoto|undefined)=>PropertyPhoto|undefined,expectedPhoto?:string){
  if(!project)return;
  try{
   const beforePhoto=photoView?.layout,afterPhoto=editPhoto&&beforePhoto?editPhoto(beforePhoto):undefined;
   const photoChange=beforePhoto&&afterPhoto&&beforePhoto.photo===afterPhoto.photo?{viewId:activePhotoId,before:beforePhoto,after:afterPhoto}:undefined;
   const history=recordGraphStep(graphHistory,project,next,label,photoChange);
   update(current=>{
    const currentView=getPropertyPhotoViews(current).find(v=>v.id===activePhotoId);
    if(graphFingerprint(current)!==graphFingerprint(project)||(expectedPhoto!==undefined&&currentView?.layout?.photo!==expectedPhoto)||(editPhoto&&JSON.stringify(currentView?.layout)!==JSON.stringify(beforePhoto)))return current;
    const retained=graphFingerprint(next)===graphFingerprint(project)?current:{...next,propertyPhoto:current.propertyPhoto,propertyPhotoViews:current.propertyPhotoViews,propertyPhotoName:current.propertyPhotoName};
    return editPhoto?setPropertyPhotoLayout(retained,activePhotoId,editPhoto(currentView?.layout)):retained;
   });
   setGraphHistory(editPhoto&&!photoChange?emptyGraphHistory():history);
   return true;
  }catch(error){
   if(String(error).includes('session undo limit')){
    // Large private photo-rich projects must still be editable; simply refuse to
    // claim we can keep an oversized in-memory history.
    update(current=>{
     const currentView=getPropertyPhotoViews(current).find(v=>v.id===activePhotoId);
     if(graphFingerprint(current)!==graphFingerprint(project)||(expectedPhoto!==undefined&&currentView?.layout?.photo!==expectedPhoto)||(editPhoto&&JSON.stringify(currentView?.layout)!==JSON.stringify(photoView?.layout)))return current;
     const retained=graphFingerprint(next)===graphFingerprint(project)?current:{...next,propertyPhoto:current.propertyPhoto,propertyPhotoViews:current.propertyPhotoViews,propertyPhotoName:current.propertyPhotoName};
     return editPhoto?setPropertyPhotoLayout(retained,activePhotoId,editPhoto(currentView?.layout)):retained;
    });
    setGraphHistory(emptyGraphHistory());
    setMessage('Change saved, but this photo-heavy plan is too large for session undo. Make a private restore point before further rewiring.');return true;
   }else {setMessage('Change not saved: '+String(error));return false;}
  }
 }
 function stepGraph(direction:'undo'|'redo'){
  if(!project||cloud.status==='conflict')return;
  try{
   const step=(direction==='undo'?graphHistory.past:graphHistory.future).at(-1);
   const result=direction==='undo'?undoGraphStep(graphHistory,project):redoGraphStep(graphHistory,project);
   update(current=>{if(graphFingerprint(current)!==graphFingerprint(project))return current;const retained=step&&graphFingerprint(step.before)===graphFingerprint(step.after)?current:{...result.project,propertyPhoto:current.propertyPhoto,propertyPhotoViews:current.propertyPhotoViews,propertyPhotoName:current.propertyPhotoName};if(!step?.photo)return retained;const currentView=getPropertyPhotoViews(current).find(v=>v.id===step.photo!.viewId);const expected=direction==='undo'?step.photo.after:step.photo.before;if(JSON.stringify(currentView?.layout)!==JSON.stringify(expected))return current;return setPropertyPhotoLayout(retained,step.photo.viewId,getPropertyPhotoViews(result.project).find(v=>v.id===step.photo!.viewId)?.layout);});
   setGraphHistory(result.history);
   setDiagramQuickEdit(null);setSelected(null);setNextPhotoItem(null);setInsertEdgeId('');
   setMessage((direction==='undo'?'Undid ':'Redid ')+result.label+(step?.photo&&graphFingerprint(step.before)===graphFingerprint(step.after)?'.':'. Affected physical connections need checking; field checks were not restored.'));
  }catch(error){setGraphHistory(emptyGraphHistory());setMessage('Diagram history is no longer safe to replay: '+String(error));}
 }

 function updateShared(fn:(stock:ReturnType<typeof availableStock>)=>ReturnType<typeof availableStock>){
  setProjects(all=>{
   const existing=all.find(isSharedLightingRecord);
   const record=existing||createSharedLightingRecord();
   const changed=fn(record.sharedLighting||{stock:[],placements:[]});
   const next={...record,sharedLighting:changed,updatedAt:now()};
   return existing?all.map(p=>isSharedLightingRecord(p)?next:p):[...all,next];
  });
 }
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
 const flowNodes=useMemo<BlueprintFlowNode[]>(()=>{if(!project)return [];const fed=new Set(project.edges.map(e=>e.target));const used=new globalThis.Map<string,number>();for(const e of project.edges)used.set(e.source,(used.get(e.source)||0)+1);return project.nodes.filter(n=>visibleIds.has(n.id)).map(n=>({id:n.id,type:'blueprint' as const,position:layoutMode==='auto'?(autoPositions.get(n.id)||n.position):n.position,data:{component:n,highlight:highlighted.has(n.id),dim:!!selected&&trace!=='none'&&!highlighted.has(n.id),canQuickEdit:workspaceEditable,unplugged:n.kind!=='outlet'&&!fed.has(n.id),freeOutputs:n.outputsUnknown||!n.outputs?undefined:Math.max(0,n.outputs-(used.get(n.id)||0)),onIconEdit:(event)=>openDiagramQuickEdit(n.id,event.clientX,event.clientY,'icon')},selected:n.id===selected}));},[project,visibleIds,highlighted,selected,trace,autoPositions,layoutMode,workspaceEditable,openDiagramQuickEdit]);
 const diagramMatches=useMemo(()=>project?searchComponents(project,diagramSearch,8):[],[project,diagramSearch]);
 const fullscreenMatches=useMemo(()=>project?searchComponents(project,fullSearch,8):[],[project,fullSearch]);
 const insertEdge=project?.edges.find(e=>e.id===insertEdgeId);
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
 function chooseProject(id:string,confirmed=false){if(id!==active&&!confirmed&&!confirmPhotoNavigation())return;setGraphHistory(emptyGraphHistory());setDiagramQuickEdit(null);setGalleryId(null);setPlugIn(null);setDiagramSearch('');setShowDiagramMore(false);setFullscreen(false);setInsertEdgeId('');const next=projects.find(p=>p.id===id);const first=next?.nodes.find(n=>n.kind==='outlet');setActive(id);setSelected(null);setTrace('none');setPathOnly(false);setFocusRequest(null);setView(next&&next.nodes.length>25&&first?`Outlet: ${first.id}`:'All zones');setShowMenu(false);setShowSidebar(false);}
 function changeView(next:View){setDiagramQuickEdit(null);setView(next);setInsertEdgeId('');setPlugIn(null);setSelected(null);setTrace('none');setPathOnly(false);setFocusRequest(null);}
 function jumpToNode(id:string){if(!confirmPhotoNavigation())return;setDiagramQuickEdit(null);setInsertEdgeId('');setPlugIn(null);setTab('diagram');setDiagramMode('map');if(!baseVisibleIds.has(id))setView('All zones');setSelected(id);setTrace('upstream');setInspectorOpen(true);setFocusRequest(prev=>({id,seq:(prev?.seq||0)+1}));if(window.innerWidth<720)setTimeout(()=>document.getElementById('diagram-canvas')?.scrollIntoView({behavior:'smooth',block:'start'}),130);}
 function focusOutlet(id:string){changeView(`Outlet: ${id}`);setSelected(id);setTrace('downstream');}

 useEffect(()=>{if(tab!=='diagram'||diagramMode!=='map'||!project||!focusRequest)return;const node=project.nodes.find(n=>n.id===focusRequest.id);if(!node)return;const timer=setTimeout(()=>{const pos=layoutMode==='auto'?(autoPositions.get(node.id)||node.position):node.position;const zoom=focusRequest.keepZoom?Math.min(1.15,Math.max(getZoom(),.55)):window.innerWidth<720?0.85:1.1;const canvas=document.getElementById('diagram-canvas')?.getBoundingClientRect();const panel=fullscreen&&fullMode==='builder'&&window.innerWidth<1000?document.querySelector('.fullscreen-sheet')?.getBoundingClientRect():undefined;const clearCenter=canvas&&panel?Math.max(canvas.top+100,(canvas.top+100+Math.min(panel.top,canvas.bottom))/2):undefined;const offset=canvas&&clearCenter!==undefined?Math.max(0,(canvas.top+canvas.height/2-clearCenter)/zoom):0;setCenter(pos.x+105,pos.y+43+offset,{zoom,duration:350});setFocusRequest(null);},240);return()=>clearTimeout(timer);},[tab,diagramMode,project,focusRequest,layoutMode,autoPositions,setCenter,getZoom,fullscreen,fullMode]);
 function reviewInstallationStatus(value:'draft'|'verified'){
  if(!project)return;
  if(value==='draft'){update(p=>({...p,status:'draft'}));return;}
  const outstanding=getVerificationIssues(project).filter(i=>i.severity==='critical'||i.severity==='attention');
  const note=window.prompt(outstanding.length?`There are ${outstanding.length} unresolved installation findings. Record what you inspected and which items still need attention. This does not certify electrical safety.`:'Record the physical installation check and any exceptions. This does not certify electrical safety.');
  if(note===null)return;
  try{const reviewed=reviewInstalledProject(project,note);if(!window.confirm(`Record this plan as verified-as-installed with ${reviewed.verificationReview?.exceptions.length||0} documented exception(s)? This is not an electrical safety certificate.`))return;update(()=>reviewed);setMessage('As-installed field review recorded with a timestamp. Outstanding issues remain visible in Needs Verification.');}
  catch(err){setMessage(err instanceof Error?err.message:String(err));}
 }
 function createDisplay(details:{season:Season;year:number;name:string}){
  if(!confirmPhotoNavigation())return;
  const p=createBlankDisplay(details);
  setProjects(all=>[...all,p]);chooseProject(p.id,true);setTab('field');setDiagramMode('map');setShowNewDisplay(false);
  setMessage('New display created locally. Add your first item when you are ready.');
 }
 function copyNextYear(){if(!project||!confirmPhotoNavigation())return;const year=project.year+1;const p={...structuredClone(project),id:crypto.randomUUID(),year,name:`${project.season} ${year} · copied plan`,status:'draft' as const,checklist:{},wiringHistory:[],verificationReview:undefined,createdAt:now(),updatedAt:now(),example:false,nodes:project.nodes.map(n=>({...n,verified:false})),lightingInventory:undefined};
  setProjects(all=>[...all,p]);chooseProject(p.id,true);setMessage('Copied plan is a DRAFT — verify every connection before use.');}
 const guidedStartCount=useRef(0);
 function startAdding(kind?:Kind){guidedStartCount.current=project?.nodes.length||0;setGuidedKind(kind);setGuidedError('');setShowGuidedAdd(true);}
 // Items added from Home are easiest to continue with on the diagram, where they can be plugged in.
 function finishAdding(){setShowGuidedAdd(false);if(tab==='field'&&project&&project.nodes.length>guidedStartCount.current){setTab('diagram');setDiagramMode('map');}}
 function openPropertyPhoto(){setFullscreen(false);setTab('diagram');setDiagramMode('photo');setShowSidebar(false);setShowMenu(false);}
 function applyPortLabel(id:string,index:number,label:string){
  if(!project)return;
  try{
   const next=renameOutputPort(project,id,index,label);
   if(next!==project){update(()=>next);setMessage('Output name saved. Existing wiring and output number are unchanged.');}
  }catch(error){setMessage(error instanceof Error?error.message:String(error));}
 }
 function insertOnWire(kind:Kind,name:string){
  if(!project||!insertEdgeId)return;
  try{
   const updated=insertIntoConnection(project,insertEdgeId,kind,name);
   if(!commitGraphChange(updated,'insert item on wire'))return;
   const added=updated.nodes.find(n=>!project.nodes.some(prev=>prev.id===n.id));
   setInsertEdgeId('');setSelected(added?.id||null);setTrace('none');
   if(added)setFocusRequest(prev=>({id:added.id,seq:(prev?.seq||0)+1,keepZoom:true}));
   setMessage('Item inserted. New connections need physical verification and the old wiring step was reset.');
  }catch(error){setMessage(error instanceof Error?error.message:String(error));}
 }
 // The output always comes from an explicit tap on that output's own row; none is inferred here.
 function plugInNew(kind:Kind,name:string){
  if(!project||!plugIn)return false;
  const source=project.nodes.find(n=>n.id===plugIn.sourceId);
  if(!source||!outputIsFree(project,plugIn.sourceId,plugIn.port)){setGuidedError('That output is no longer free. Pick another output.');return false;}
  try{
   const next=quickAddConnected(project,{sourceId:source.id,port:plugIn.port,kind,name,connectorTypesUnknown:true});
   if(!commitGraphChange(next,'add and connect item')){setGuidedError('The item could not be saved. Check the diagram and try again.');return false;}
   const added=next.nodes[next.nodes.length-1];
   setPlugIn(null);setGuidedError('');setSelected(added.id);setTrace('upstream');
   setFocusRequest(prev=>({id:added.id,seq:(prev?.seq||0)+1,keepZoom:true}));
   setMessage(added.name+' plugged into '+source.name+' · '+portName(source,plugIn.port)+'. Check the real connection in the yard.');
   return true;
  }catch(err){setGuidedError(err instanceof Error?err.message:String(err));return false;}
 }
 function plugInExisting(targetId:string){
  if(!project||!plugIn)return false;
  if(!guidedConnect(targetId,plugIn.sourceId,plugIn.port))return false;
  setPlugIn(null);setTrace('upstream');setMessage('Connection recorded. Check it in the yard.');
  return true;
 }
 function startConnect(id:string){setPlugIn(null);setInsertEdgeId('');setDiagramQuickEdit(null);setDiagramConnectTarget(id);setDiagramConnectSource('');setGuidedError('');setInspectorOpen(true);if(window.innerWidth<720&&!fullscreen)setTimeout(()=>document.getElementById('mobile-item-inspector')?.scrollIntoView({behavior:'smooth',block:'start'}),80);}
 function showItem(id:string){const item=project?.nodes.find(n=>n.id===id);if(!item)return;if(!baseVisibleIds.has(id))setView('All zones');setPathOnly(false);setDiagramQuickEdit(null);setInsertEdgeId('');setPlugIn(null);setSelected(id);setTrace(item.kind==='outlet'?'downstream':'upstream');setInspectorOpen(true);setFocusRequest(prev=>({id,seq:(prev?.seq||0)+1,keepZoom:true}));}
 async function addEquipmentPhoto(id:string,file:File,role:PhotoRole){
  try{
   const data=await readPhoto(file);
   const n=project?.nodes.find(n=>n.id===id);
   if(!n||photoCount(n.photo,n.photoGallery)>=8){setMessage('This item is missing or its gallery is full (8 photos).');return;}
   update(p=>addComponentPhoto(p,id,data,role));
   setMessage('Photo attached to equipment. Encrypted sync will transfer it when online.');
  }catch(error){setMessage(error instanceof Error?error.message:String(error));}
 }
 function changeEquipmentPhoto(id:string,photoId:string,action:'promote'|'remove'){
  try{update(p=>action==='promote'?promoteComponentPhoto(p,id,photoId):removeComponentPhoto(p,id,photoId));}
  catch(error){setMessage(error instanceof Error?error.message:String(error));}
 }
 function moveBuilderItem(dx:number,dy:number){
  if(!project||!selected||layoutMode!=='manual'||!workspaceEditable)return;
  const item=project.nodes.find(node=>node.id===selected);if(!item)return;
  const next={...project,nodes:project.nodes.map(node=>node.id===selected?{...node,position:{x:node.position.x+dx,y:node.position.y+dy}}:node)};
  if(commitGraphChange(next,'move diagram item'))setMessage(`Moved ${item.name} on the diagram.`);
 }

 const reusable=useMemo(()=>{const seen=new Set<string>();return projects.filter(p=>p.id!==active&&(project?.example||!p.example)).flatMap(p=>p.nodes.map(n=>({...n,from:p.season+' '+p.year}))).filter(n=>{const asset=n.assetId||n.id;if(seen.has(asset)||project?.nodes.some(local=>(local.assetId||local.id)===asset))return false;seen.add(asset);return true;});},[projects,active,project]);
 function leaveDirectDraw(){if(directDraft?.points.length&&!window.confirm('Discard this unfinished route?'))return false;setDirectDraft(null);return true;}
 function saveDirectDraw(draft:DirectRouteDraft){if(!project||!photoView?.layout||pendingPhotoDraw)return false;if(photoQuickDirty&&!window.confirm('Discard unsaved item details before saving this new item?'))return false;try{const result=createPhotoDirectRoute(project,photoView.layout,draft);if(!commitGraphChange(result.project,'draw equipment on photo',result.applyLayout,photoView.layout.photo))return false;setGuidedError('');setPendingPhotoDraw(result.nodeId);}catch(error){setGuidedError(error instanceof Error?error.message:String(error));}return false;}
 function guidedAdd(options:GuidedAddOptions){if(!project)return false;try{const result=addGuidedEquipment(project,options);if(!commitGraphChange(result.project,'add equipment')){setGuidedError('The item could not be saved. Check the diagram and try again.');return false;}setInsertEdgeId('');setPlugIn(null);setSelected(result.nodeId);setTrace('none');setFocusRequest(prev=>({id:result.nodeId,seq:(prev?.seq||0)+1,keepZoom:true}));setGuidedError('');return true;}catch(error){setGuidedError(error instanceof Error?error.message:String(error));return false;}}
 function guidedConnect(targetId:string,sourceId:string,port:number){if(!project)return false;try{const next=connectGuidedEquipment(project,targetId,sourceId,port);if(!commitGraphChange(next,'connect equipment')){setGuidedError('The connection could not be saved.');return false;}setSelected(targetId);setGuidedError('');return true;}catch(error){setGuidedError(error instanceof Error?error.message:String(error));return false;}}
 function addAtPhoto(point:{x:number;y:number}){
  if(!project||!photoView?.layout||(!photoSimilarId&&(!photoAddDraft.kind||!photoAddDraft.zone)))return;
  if(photoQuickDirty&&!window.confirm('Discard unsaved item details before placing another item?'))return;
  if(photoAddInFlight.current===project){setMessage('Finishing the previous addition. Tap again in a moment.');return;}
  photoAddInFlight.current=project;
  try{
   const photo=photoView.layout.photo;
   const result=photoSimilarId?(()=>{const duplicate=duplicateEquipment(project,photoSimilarId);return {project:duplicate.project,nodeId:duplicate.copy.id};})():addPhotoEquipment({...project,propertyPhoto:photoView.layout},photoAddDraft.kind!,photoAddDraft.zone as Zone,point);
   if(!commitGraphChange(result.project,'add equipment on photo',current=>current?{...current,placements:{...current.placements,[result.nodeId]:point}}:current,photo)){photoAddInFlight.current=null;return;}
   setSelected(result.nodeId);setGuidedError('');
  }catch(error){photoAddInFlight.current=null;setGuidedError(error instanceof Error?error.message:String(error));}
 }
 function setPhotoOutputs(id:string,count:number){
  if(!project)return false;
  const node=project.nodes.find(n=>n.id===id);
  if(!node?.outputsUnknown||!Number.isInteger(count)||count<(node.kind==='outlet'?1:0)||count>16){setGuidedError('Enter the actual number of outputs for this item.');return false;}
  const nodes=project.nodes.map(n=>n.id===id?{...n,outputs:count,outputsUnknown:false,verified:false}:n);
  const errors=validateGraph(nodes,project.edges);
  if(errors.length){setGuidedError(errors[0].message);return false;}
  if(!commitGraphChange({...project,nodes,status:'draft'},'record known outputs')){setGuidedError('The output count could not be saved.');return false;}
  setGuidedError('');return true;
 }
 function guidedReuse(assetId:string,zone:Zone){if(!project)return false;const found=reusable.find(n=>(n.assetId||n.id)===assetId);if(!found){setGuidedError('This equipment is no longer available.');return false;}const {from:_from,...original}=structuredClone(found);const copy:Component={...original,id:crypto.randomUUID(),assetId:found.assetId||found.id,zone,position:{x:80+(project.nodes.length%5)*230,y:160+Math.floor(project.nodes.length/5)*160},verified:false};if(!commitGraphChange({...project,nodes:[...project.nodes,copy],status:'draft'},'reuse equipment')){setGuidedError('The item could not be saved.');return false;}setSelected(copy.id);setGuidedError('');return true;}
 function changePowerFeed(target:string,source:string|null,port?:number){
  if(!project)return false;
  const old=project.edges.find(e=>e.target===target);
  if(old&&(old.source!==source||old.sourcePort!==port)){
   if(!confirm((source===null?'Disconnect this power feed?':'Change this recorded power feed?')+' The branch becomes Draft and needs re-verification.'))return false;
  }
  try{
   const edited=editPowerFeed(project,target,source,port);
   if(edited===project){setMessage('Connection is already recorded.');return true;}
   if(!commitGraphChange(edited,source===null?'disconnect feed':'connect or rewire feed'))return false;
   setMessage(source===null?'Feed disconnected. Branch marked Draft.':'Connection saved. Recheck this branch before use.');
   return true;
  }catch(e){setMessage(`Cannot change wiring: ${e instanceof Error?e.message:String(e)}`);return false;}
 }
 function addConnection(source:string,target:string,port?:number){
  if(!project)return;
  if(port===undefined){setMessage('Choose the actual source output before connecting.');return;}
  changePowerFeed(target,source,port);
 }
 const onConnect=useCallback((params:FlowConnection)=>{if(!params.source||!params.target)return;const port=params.sourceHandle?.match(/^port-(\d+)$/)?.[1];addConnection(params.source,params.target,port===undefined?undefined:Number(port));},[project,active]);
 function patchComponent(id:string,fields:Partial<Component>,recordHistory=false){
  if(!project)return false;
  const before=project.nodes.find(n=>n.id===id);
  const electricalKeys=['kind','outputs','outputsUnknown','inputGender','outputGender','cordType','color','lengthFt','ratedWatts','expectedWatts'] as const;
  const changedElectrical=!!before&&electricalKeys.some(k=>k in fields&&fields[k as keyof Component]!==before[k as keyof Component]);
  const nodes=project.nodes.map(n=>n.id===id?{...n,...fields,...(changedElectrical?{verified:false}:{})}:n);
  const errors=validateGraph(nodes,project.edges);
  if(errors.length){setMessage(errors[0].message);return false;}
  const next={...project,nodes,status:changedElectrical?'draft' as const:project.status};
  if(recordHistory)return !!commitGraphChange(next,'edit item appearance or name');
  update(current=>graphFingerprint(current)===graphFingerprint(project)?{...next,propertyPhoto:current.propertyPhoto,propertyPhotoViews:current.propertyPhotoViews,propertyPhotoName:current.propertyPhotoName}:current);return true;
}
 function duplicateSelectedItem(id:string){
  if(!project)return;
  try{
   const {project:next,copy}=duplicateEquipment(project,id);
   commitGraphChange(next,'duplicate item');
   setView('All zones');setSelected(copy.id);setTrace('none');setPathOnly(false);
   setPlugIn(null);setInsertEdgeId('');setInspectorOpen(true);
   setFocusRequest(prev=>({id:copy.id,seq:(prev?.seq||0)+1}));
   setMessage(copy.name+' created as a new unconnected Draft item. Review its physical details and connect it to a verified free output when ready.');
  }catch(error){setMessage(error instanceof Error?error.message:String(error));}
 }
 function removeComponent(id:string){if(!project)return;const node=project.nodes.find(n=>n.id===id);if(!node)return;const downstreamCount=downstream(id,project.edges).size;
 if(!confirm(`Remove ${node.name} and its power connections? ${downstreamCount} downstream item(s) will need re-verification. You can undo this removal.`))return;
 try{const deleted=deleteComponentSafely(project,id);commitGraphChange(deleted.project,'remove component');setSelected(null);setPlugIn(null);setMessage('Component removed; connected downstream items marked unverified.');}catch(err){setMessage(String(err));}
}
 function applyReviewedPhotos(items:PhotoImportAddition[]){
  if(!project||!items.length)return;
  try{
   let updated=project;
   for(const item of items)updated=addComponentPhoto(updated,item.componentId,item.src,item.role);
   update(()=>updated);
   setMessage(items.length+' reviewed workbook photo(s) added to private component galleries. Existing photos and wiring were preserved.');
  }catch(e){setMessage('Photo import was not applied: '+String(e));throw e;}
 }
 async function attachPhoto(file:File|undefined,id?:string){if(!file||!project)return;try{const data=await readPhoto(file);if(id)patchComponent(id,{photo:data});else update(p=>({...p,backgroundPhoto:data}));}catch(e){setMessage(String(e));}}
 async function importBackup(file?:File){if(!file||!confirmPhotoNavigation())return;try{const content=JSON.parse(await file.text());const parsed=parseBackup(content);if(!confirm(`Restore ${parsed.length} project(s)? Matching project IDs will be overwritten. Back up your current work first.`))return;await localSaving.flushAll();await restoreBackup(content);setProjects(await db.projects.toArray());setActive(parsed.find(p=>!isSharedLightingRecord(p))?.id||active);setView('All zones');setSelected(null);setMessage('Backup successfully restored to this browser.');}catch(e){setMessage(`Restore rejected: ${String(e)}`);}}
 function updateTask(id:string,fields:{done?:boolean;notes?:string;photo?:string}){update(p=>({...p,checklist:{...p.checklist,[id]:{...p.checklist[id],...fields,done:fields.done??p.checklist[id]?.done??false}}}));}
 const selectedNode=project?.nodes.find(n=>n.id===selected);
 const selectedFeed=project?.edges.find(e=>e.target===selectedNode?.id);
 const selectedFeedSource=project?.nodes.find(n=>n.id===selectedFeed?.source);
 const diagramEditNode=project?.nodes.find(n=>n.id===diagramQuickEdit?.id);
 const galleryNode=project?.nodes.find(n=>n.id===galleryId);
 const warnings=project?warningSummary(project):[];
 const audit=useMemo(()=>project?getVerificationIssues(project):[],[project]);
 const auditSummary=useMemo(()=>auditCounts(audit),[audit]);
 const warningErrors=project?validateGraph(project.nodes,project.edges):[];
 function undoLastFeed(){if(!project)return;if(!confirm('Reverse the most recent documented power-feed change? This will NOT restore any old checked steps or verified status; inspect the connection in the yard.'))return;try{const undone=undoLastWiringChange(project);commitGraphChange(undone,'reverse last feed');setMessage('Most recent power-feed change reversed. Branch remains Draft and needs field verification.');}catch(error){setMessage(error instanceof Error?error.message:String(error));}}
 function printAll(){if(!confirmPhotoNavigation())return;setDiagramMode('map');setView('All zones');setTab('diagram');setSelected(null);setTimeout(()=>window.print(),250);}
 function exportPrivateBackup(){downloadText('holiday-display-blueprint-private-backup.json',JSON.stringify(createBackup(projects),null,2));setMessage('Private backup downloaded. Transfer it using a trusted private file service, not public GitHub.');}
 const examplesOnly=hasOnlyExamples(availableProjects);
 if(!loaded)return <div className="startup">Opening your local Blueprint workspace…</div>;
 if(!project)return <div className="startup">No project selected.</div>;
 const exportEquipmentCsv=()=>{const rows=[['ID','Name','Type','Zone','Color','Length ft','Storage','Quantity','Condition','Price','Repair history'],...project.nodes.map(n=>[n.id,n.name,n.kind,n.zone,n.color,n.lengthFt,n.inventory?.storage,n.inventory?.quantity,n.inventory?.condition,n.inventory?.price,n.inventory?.repairHistory])];downloadText(`inventory-${project.season}-${project.year}.csv`,rows.map(r=>r.map(csvEscape).join(',')).join('\r\n'),'text/csv');};
 const setupTasks=generatedTasks(project,'setup');
 const setupDone=setupTasks.filter(t=>project.checklist[t.id]?.done).length;
 const openFindings=auditSummary.critical+auditSummary.attention;
 const connectTargetNode=project.nodes.find(n=>n.id===diagramConnectTarget);
 const unplugged=unpluggedItems(project);
 const homeSummary=<div className="home-summary" role="group" aria-label="Where this display stands">
  <button type="button" onClick={()=>{setTab('diagram');setDiagramMode('map');setSelected(null);setTrace('none');}}><strong>{project.nodes.length}</strong><span>{project.nodes.length===1?'item':'items'} on the wiring diagram</span></button>
  <button type="button" className={unplugged.length?'needs-attention':''} onClick={()=>{setTab('diagram');setDiagramMode('map');setSelected(null);setTrace('none');setInspectorOpen(true);}}><strong>{unplugged.length}</strong><span>not plugged in yet</span></button>
  <button type="button" onClick={()=>setTab('setup')}><strong>{setupDone} of {setupTasks.length}</strong><span>install steps checked</span></button>
  <button type="button" className={openFindings?'needs-attention':''} onClick={()=>{setTab('diagram');setDiagramMode('audit');}}><strong>{openFindings}</strong><span>{openFindings===1?'thing':'things'} still to check</span></button>
 </div>;
 const panelActive=!!(selectedNode||insertEdge||diagramConnectTarget||plugIn);
 const panelBusy=!!(diagramConnectTarget||plugIn);
 const panelTitle=diagramConnectTarget?'Choose a power source':plugIn?'Plug something in':insertEdge?'Connection':selectedNode?'Item details':'Wiring overview';
 const closePanel=()=>{if(panelBusy){setDiagramConnectTarget(null);setDiagramConnectSource('');setPlugIn(null);setGuidedError('');return;}if(insertEdge){setInsertEdgeId('');return;}if(fullscreen){setSelected(null);setTrace('none');return;}setInspectorOpen(false);};
 const canvasHint=diagramConnectTarget?'Tap the power source on the diagram, or pick it in the panel.':!project.nodes.length?'Add an outlet to start your diagram.':insertEdge?'Unplug this connection or put something in between.':selectedNode?'Plug things in, rename or remove from the panel.':'Click an item to plug things into it, or a wire to change it. Drag the background to move around.';
 const historyButtons=<div className="diagram-history-actions" role="group" aria-label="Diagram undo and redo"><button type="button" className="button secondary" disabled={!graphHistory.past.length||graphHistory.past.at(-1)?.projectId!==project.id||cloud.status==='conflict'} onClick={()=>stepGraph('undo')} title="Undo last diagram change (Ctrl/Cmd+Z)"><RotateCcw size={15}/> <span>Undo</span></button><button type="button" className="button secondary" disabled={!graphHistory.future.length||graphHistory.future.at(-1)?.projectId!==project.id||cloud.status==='conflict'} onClick={()=>stepGraph('redo')} title="Redo last diagram change (Ctrl/Cmd+Shift+Z)"><RotateCw size={15}/> <span>Redo</span></button></div>;
 const panelHead=<div className="inspector-title"><strong>{panelTitle}</strong><button className="icon-button" aria-label={panelBusy?'Cancel':insertEdge||fullscreen?'Close':'Hide side panel'} onClick={closePanel}><X size={16}/></button></div>;
 const panelBody=diagramConnectTarget?<PhotoConnect surface="diagram" allowRewire project={project} targetId={diagramConnectTarget} sourceId={diagramConnectSource} onSourceChange={id=>{setDiagramConnectSource(id);setGuidedError('');}} onSetOutputs={setPhotoOutputs} error={guidedError} onCancel={closePanel} onConnect={(source,port)=>{const target=diagramConnectTarget;const rewire=project.edges.some(e=>e.target===target);if(rewire?!changePowerFeed(target,source,port):!guidedConnect(target,source,port))return false;setDiagramConnectTarget(null);setDiagramConnectSource('');setSelected(target);setTrace('upstream');if(!rewire)setMessage('Connection recorded. Check it in the yard.');return true;}}/>
  :plugIn?<PlugInPanel project={project} sourceId={plugIn.sourceId} port={plugIn.port} error={guidedError} onAddNew={plugInNew} onConnectExisting={plugInExisting} onCancel={closePanel}/>
  :insertEdge?<WirePanel project={project} edgeId={insertEdge.id} onInsert={insertOnWire} onUnplug={()=>{if(changePowerFeed(insertEdge.target,null))setInsertEdgeId('');}} onOpenItem={showItem}/>
  :selectedNode?<>
        <InspectorIdentity key={selectedNode.id} component={selectedNode} season={project.season} onName={name=>patchComponent(selectedNode.id,{name},true)} onIcon={visualIcon=>patchComponent(selectedNode.id,{visualIcon},true)} onZone={zone=>patchComponent(selectedNode.id,{zone},true)} onPhotos={()=>setGalleryId(selectedNode.id)}/>
         <PowerInSection project={project} node={selectedNode} onPlugInto={()=>startConnect(selectedNode.id)} onUnplug={()=>changePowerFeed(selectedNode.id,null)} onOpenItem={showItem}/>
         <PowerOutSection project={project} node={selectedNode} onPlugIn={port=>{setGuidedError('');setPlugIn({sourceId:selectedNode.id,port});}} onOpenItem={showItem} onSetOutputs={count=>{const ok=setPhotoOutputs(selectedNode.id,count);if(!ok)setMessage('Enter the actual number of outputs for this item.');return ok;}}/>
         <div className="trace-buttons"><button onClick={()=>setTrace('upstream')} className={trace==='upstream'?'active':''}><ArrowDownToLine size={15}/> Trace source</button><button onClick={()=>setTrace('outage')} className={trace==='outage'?'active':''}><WifiOff size={15}/> If unplugged</button><button onClick={()=>setPathOnly(x=>!x)} className={pathOnly?'active':''} aria-pressed={pathOnly}><Eye size={15}/> {pathOnly?'Show everything':'Only this path'}</button></div>
         {trace==='upstream'&&<div className="trace-box"><strong>Power path back to source</strong>{sourcePath(selectedNode.id,project).map((n,i)=><div key={n.id}>{i>0?'↳ ':''}{n.name}</div>)}</div>}
         {trace==='outage'&&<div className="trace-box warning"><strong>Components losing this feed: {downstream(selectedNode.id,project.edges).size}</strong>{[...downstream(selectedNode.id,project.edges)].map(id=><div key={id}>{project.nodes.find(n=>n.id===id)?.name||id}</div>)}</div>}
         {selectedNode.outputs>0&&<details className="port-label-details"><summary>Output names · {selectedNode.outputs} ports</summary><p>Label the real sockets (e.g. Kasa left, C9 female tap). Output numbers and connections remain unchanged.</p><div className="port-label-inputs">{Array.from({length:selectedNode.outputs},(_,port)=><label key={`${selectedNode.id}:${port}`}>Port {port+1}<input key={`${selectedNode.id}:${port}`} defaultValue={selectedNode.portLabels?.[String(port)]||''} maxLength={40} aria-label={`Name output ${port+1} of ${selectedNode.name}`} placeholder={`Output ${port+1}`} onBlur={e=>applyPortLabel(selectedNode.id,port,e.target.value)}/></label>)}</div></details>}
         {project.wiringHistory?.some(entry=>entry.targetId===selectedNode.id)&&<details className="wiring-history"><summary>Recent wiring changes</summary>{[...project.wiringHistory].filter(entry=>entry.targetId===selectedNode.id).slice(-5).reverse().map(entry=><p key={entry.id}><strong>{entry.action}</strong> · {new Date(entry.at).toLocaleString()}<span>{entry.fromId||'No source'}{entry.fromPort!==undefined?` (output ${entry.fromPort+1})`:''} → {entry.toId||'Disconnected'}{entry.toPort!==undefined?` (output ${entry.toPort+1})`:''}</span></p>)}</details>}
         <div className="inspector-quick-actions"><button onClick={()=>duplicateSelectedItem(selectedNode.id)}><Copy size={15}/> Duplicate</button><button onClick={()=>setGalleryId(selectedNode.id)}><ImagePlus size={15}/> Photos ({photoCount(selectedNode.photo,selectedNode.photoGallery)})</button><button className="quick-action-danger" onClick={()=>removeComponent(selectedNode.id)}><Trash2 size={15}/> Remove</button></div>
         {layoutMode==='manual'&&<div className="panel-move" role="group" aria-label="Move selected diagram item"><strong>Move on diagram</strong><div><button type="button" aria-label="Move item left" onClick={()=>moveBuilderItem(-40,0)}>← Left</button><button type="button" aria-label="Move item right" onClick={()=>moveBuilderItem(40,0)}>Right →</button><button type="button" aria-label="Move item up" onClick={()=>moveBuilderItem(0,-40)}>↑ Up</button><button type="button" aria-label="Move item down" onClick={()=>moveBuilderItem(0,40)}>↓ Down</button></div><small>Moves only this item on the picture. It never changes what is plugged into what.</small></div>}
         <details className="inspector-advanced"><summary>Equipment specs, storage & notes</summary>
          <div className="inspector-fields">
          <div className="form-grid"><label>Type<select value={selectedNode.kind} onChange={e=>{const kind=e.target.value as Kind;patchComponent(selectedNode.id,{kind,outputs:outputCount(kind),outputsUnknown:false});}}>{categories.map(c=><option key={c.kind} value={c.kind}>{c.label}</option>)}</select></label><label>Outputs<input aria-label="Known output count" type="number" min={0} max={16} placeholder="Unknown" value={selectedNode.outputsUnknown?'':selectedNode.outputs} onChange={e=>patchComponent(selectedNode.id,e.target.value===''?{outputs:0,outputsUnknown:true,outputGender:undefined}:{outputs:Number(e.target.value),outputsUnknown:false})}/>{selectedNode.outputsUnknown&&<small>Unknown — enter the actual count when checked.</small>}</label></div>
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
          {selectedNode.photo&&<button className="inspector-photo-button" onClick={()=>setGalleryId(selectedNode.id)}><img className="component-photo" src={selectedNode.photo} alt={'Cover photo for '+selectedNode.name}/><span>View / add reference photos</span></button>}
           <button className="text-danger" onClick={()=>removeComponent(selectedNode.id)}><Trash2 size={15}/> Remove component and links</button>
         </div></details>
  </>:<>
   <div className="panel-overview">
    {project.nodes.length===0?<p className="muted">Nothing on this diagram yet. Add the outlet everything starts from.</p>:<ol className="panel-howto"><li><strong>Click an item</strong> to see what it plugs into and what plugs into it.</li><li><strong>Plug something in</strong> on any free output to add the next piece.</li><li><strong>Click a wire</strong> to unplug it or put a cord or splitter in between.</li></ol>}
    <div className="panel-add"><strong>Add an item</strong><QuickEquipmentPalette onChange={kind=>startAdding(kind)}/></div>
    {unplugged.length>0&&<section className="panel-unplugged" aria-label="Items not plugged in"><h4>Not plugged in yet <span>{unplugged.length}</span></h4><ul>{unplugged.slice(0,8).map(n=><li key={n.id}><button type="button" className="power-link" onClick={()=>showItem(n.id)}>{n.name}</button><button type="button" onClick={()=>{showItem(n.id);startConnect(n.id);}} aria-label={`Choose where ${n.name} plugs in`}>Plug into…</button></li>)}</ul>{unplugged.length>8&&<small>{unplugged.length-8} more are listed in the connection overview below.</small>}</section>}
   </div>
   <ConnectionOverview project={project} onConnect={id=>{showItem(id);startConnect(id);}} onLocate={showItem}/>
   <ConnectionFinder key={project.id} project={project} scope={baseVisibleIds} selected={selected} onSelect={showItem}/>
  </>;
 return <div className="app-shell">
  <header className="topbar"><div className="brand"><div className="brand-icon"><CircuitBoard size={23}/></div><div><strong>HOLIDAY DISPLAY <span>BLUEPRINT</span></strong><small>LOCAL-FIRST DISPLAY PLANNER</small></div></div>
   <div className="project-picker"><label className="visually-hidden" htmlFor="projects">Seasonal project</label><select id="projects" value={active} onChange={e=>chooseProject(e.target.value)}>{[...availableProjects].sort((a,b)=>b.year-a.year||a.season.localeCompare(b.season)).map(p=><option value={p.id} key={p.id}>{projectLabel(p)}</option>)}</select><ChevronDown className="picker-chevron" size={17}/></div>
   <div className="top-actions"><span className={`local-pill local-save-${inventorySaving.phase}`} title={inventorySaving.message||''} role="status"><span className="pulse-dot"/> {inventorySaving.phase==='saving'?'Saving on this device…':inventorySaving.phase==='failed'?'Local save failed':'Saved locally'}</span><button className="button secondary desktop-only" onClick={()=>{downloadText('holiday-display-blueprint-backup.json',JSON.stringify(createBackup(projects),null,2));setMessage('Backup downloaded. Keep the file private — it may include photos and details.');}}><Download size={16}/> Backup</button>
   <MobileMenuToggle open={showSidebar} onToggle={()=>{setShowMenu(false);setShowSidebar(x=>!x)}}/>
   <button type="button" className="icon-button desktop-more-button" aria-label="More actions" aria-controls="more-actions-menu" aria-expanded={showMenu} onClick={()=>{setShowSidebar(false);setShowMenu(x=>!x)}}><MoreVertical size={20}/></button>{showMenu&&<div id="more-actions-menu" className="action-menu action-menu-grouped" aria-label="More actions">
    <p className="menu-heading">Displays</p>
    <button onClick={()=>{setShowMenu(false);setShowNewDisplay(true)}}><Plus size={16}/> New display</button><button onClick={copyNextYear}><Copy size={16}/> Copy into next year</button>
    <p className="menu-heading">Spreadsheets and printing</p>
    <button onClick={()=>{setShowWizard(true);setShowMenu(false);}}><FileSpreadsheet size={16}/> Import Excel workbook</button>
    <button onClick={()=>{setShowPhotoImport(true);setShowMenu(false);}}><ImagePlus size={16}/> Match workbook photos</button>
    <button onClick={()=>{downloadWiringReference(project,sharedLighting);setShowMenu(false);setMessage('Private reference workbook exported. Continue editing in Blueprint.');}}><FileSpreadsheet size={16}/> Export wiring reference (.xlsx)</button>
    <button onClick={()=>{setShowMenu(false);printAll()}}><Printer size={16}/> Print diagram</button>
    <p className="menu-heading">Backups and devices</p>
    <button onClick={()=>{downloadText('holiday-display-blueprint-backup.json',JSON.stringify(createBackup(projects),null,2));setShowMenu(false);}}><Download size={16}/> Back up all projects (JSON)</button>
    <label className="menu-upload"><Upload size={16}/> Restore JSON backup<input type="file" accept=".json" onChange={e=>{void importBackup(e.target.files?.[0]);setShowMenu(false);e.target.value='';}}/></label>
    <button onClick={()=>{setShowHistory(true);setShowMenu(false)}}><History size={16}/> Restore points / history</button>
    <button onClick={()=>{setShowMenu(false);setShowTransfer(true);}}><Smartphone size={16}/> Move plans to another device</button>
    {cloud.enabled&&<button onClick={()=>{if(confirm('Disconnect encrypted sync on this device? Local projects will remain here.'))cloud.disconnect();setShowMenu(false);}}><LockKeyhole size={16}/> Stop syncing this device</button>}
    <p className="menu-heading">Remove</p>
    <button onClick={()=>{if(!confirmPhotoNavigation())return;if(cloud.enabled){setMessage('Cloud-linked project deletion is disabled until safe deletion synchronization is available. No data was removed.');setShowMenu(false);return;}if(!confirm('Delete this local project? Export a private backup first.'))return;const ids=projects.filter(p=>p.id!==active);if(!ids.some(p=>!isSharedLightingRecord(p))){setMessage('Keep at least one seasonal project.');return;}const doomed=active;void (async()=>{await localSaving.discardProject(doomed);await db.projects.delete(doomed);setProjects(ids);setActive(ids.find(p=>!isSharedLightingRecord(p))!.id);setShowMenu(false);setMessage('Local project deleted.');})().catch(err=>setMessage('Delete failed: '+String(err)));}}><Trash2 size={16}/> Delete selected project</button>
   </div>}</div>
  </header>
  {showMenu&&<button type="button" className="more-menu-dismiss" aria-label="Dismiss more actions" onClick={()=>setShowMenu(false)}/>}
  {showSidebar&&<button type="button" className="mobile-drawer-dismiss" aria-label="Close menu" onClick={()=>setShowSidebar(false)}/>}
  <div className="workspace">
   <aside id="mobile-navigation" aria-label="Navigation and tools" className={`leftbar ${showSidebar?'leftbar-open':''}`}>
    <div className="mobile-drawer-header mobile-drawer-only"><div><strong>Navigation & tools</strong><span>{project.season} {project.year}</span></div><button type="button" className="icon-button" aria-label="Close menu" onClick={()=>setShowSidebar(false)}><X size={22}/></button></div><div className="side-section desktop-drawer-navigation"><p className="side-label">WORKSPACE</p><nav className="nav-list" aria-label="Workspace tabs">{(['field','diagram','inventory','setup'] as Tab[]).map(t=>{const Icon=iconFor[t];return <button key={t} className={`nav-link ${tab===t||(t==='setup'&&tab==='teardown')?'active':''}`} onClick={()=>{if(t!==tab&&!confirmPhotoNavigation())return;setTab(t);setShowSidebar(false);}}><Icon size={18}/><span>{({field:'Home',diagram:'Wiring diagram',setup:'Install & teardown',teardown:'Teardown steps',inventory:'Inventory'})[t]}</span>{t==='setup'&&<small>{generatedTasks(project,'setup').length}</small>}</button>;})}</nav></div>
    <div className="side-section mobile-drawer-only">
     <p className="side-label">TOOLS & BACKUPS</p>
     <nav className="nav-list" aria-label="Mobile quick actions">
      <button className="nav-link" onClick={()=>{setShowSidebar(false);setShowNewDisplay(true)}}><Plus size={16}/> New display</button>
      <button className="nav-link" onClick={copyNextYear}><Copy size={16}/> Copy into next year</button>
      <button className="nav-link" onClick={()=>{if(!confirmPhotoNavigation())return;setTab('diagram');setDiagramMode('guide');setShowSidebar(false)}}><ClipboardCheck size={18}/> Install steps</button>
      <button className="nav-link" onClick={()=>{if(!confirmPhotoNavigation())return;setTab('diagram');setDiagramMode('audit');setShowSidebar(false)}}><AlertTriangle size={18}/> Needs checking</button>
      <button className="nav-link" onClick={()=>{setShowWizard(true);setShowSidebar(false)}}><FileSpreadsheet size={18}/> Import Excel workbook</button>
      <button className="nav-link" onClick={()=>{setShowPhotoImport(true);setShowSidebar(false)}}><ImagePlus size={18}/> Review workbook photos</button>
      <button className="nav-link" onClick={()=>{downloadWiringReference(project,sharedLighting);setShowSidebar(false);setMessage('Private Excel reference exported. Continue editing in Blueprint.')}}><Download size={18}/> Export Excel reference</button>
      <button className="nav-link" onClick={()=>{setShowHistory(true);setShowSidebar(false)}}><History size={18}/> Restore points / history</button>
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
    <div className="safety-note"><ShieldAlert size={19}/><div><strong>Electrical verification required</strong><span>Blueprint does not certify cords, loads, GFCI protection, or circuit safety.</span></div></div>
   </aside>
   <main className="content">
    {localSaving.saveState.phase==='failed'&&<div className="sync-alert" role="alert"><AlertTriangle size={17}/><span>Local save failed: {localSaving.saveState.message}. Changes remain on-screen. Retry saving now or make a private backup before leaving.</span><button className="button secondary" onClick={()=>void localSaving.flushAll()}>Retry local save</button></div>}
    {cloud.enabled&&<div className={`sync-bar sync-${cloud.status}`} role="status">
      <LockKeyhole size={16}/><span><strong>{cloud.status==='synced'?'Private sync on':cloud.status==='conflict'?'Sync needs your choice':cloud.status==='offline'?'Offline — changes saved here':'Checking encrypted cloud…'}</strong>{cloud.lastSynced&&cloud.status==='synced'?` · Last synced ${cloud.lastSynced}`:''}</span>
      <button className="button secondary" onClick={()=>void cloud.syncNow()} disabled={cloud.status==='saving'}>Sync now</button>
     </div>}
    {cloud.status==='offline'&&<div className="sync-alert"><AlertTriangle size={17}/><span>Cloud sync unavailable: {cloud.error}. Changes remain on this device and retry automatically.</span></div>}
    {cloud.status==='conflict'&&<section className="sync-alert sync-conflict" role="alert"><AlertTriangle size={20}/><div><strong>Both devices changed the same project</strong><p>{cloud.conflicts.join(', ')}. Nothing was overwritten. Choose which version to use, or export a backup first.</p><div className="sync-alert-actions"><button className="button secondary" onClick={()=>{exportPrivateBackup();}}>Back up this device</button><button className="button secondary" onClick={()=>{if(confirm('Replace this device’s conflicting changes with the cloud version? A private backup will be downloaded first.')){exportPrivateBackup();void cloud.syncNow('remote');}}}>Use cloud version</button><button className="button primary" onClick={()=>{if(confirm('Replace the conflicting cloud version with this device’s version? A private local backup will be downloaded first. This affects other synced devices.')){exportPrivateBackup();void cloud.syncNow('local');}}}>Keep this device</button></div></div></section>}
    {examplesOnly&&!cloud.enabled&&!dismissTransfer&&<section className="transfer-banner" role="note" aria-label="See master plans on this device">
      <div className="transfer-banner-copy"><Upload size={21}/><div><strong>Only examples on this device</strong><span>Import your private Halloween + Christmas backup from the computer that has your master plans.</span></div></div>
      <div className="transfer-banner-actions"><button className="button secondary" onClick={()=>setShowTransfer(true)}>Bring masters here</button><button className="icon-button" onClick={()=>setDismissTransfer(true)} aria-label="Dismiss master transfer tip"><X size={16}/></button></div>
     </section>}
    {tab==='field'&&<><div className="field-sync-line" role="status"><span>{localSaving.saveState.phase==='saved'?'Saved locally':localSaving.saveState.phase==='saving'?'Saving on this device…':'Local save failed'}</span><span>{!cloud.enabled?'Sync not linked':cloud.status==='synced'?'Private sync connected':cloud.status==='offline'?'Cloud offline; local edits retained':cloud.status==='conflict'?'Sync conflict needs review':'Cloud checking…'}</span></div>{project.nodes.length===0?<EmptyDisplayStart onAddPowerSource={()=>startAdding('outlet')} onAddEquipment={()=>startAdding('decoration')} onOpenPhoto={openPropertyPhoto}/>:<>{project.edges.length===0&&<div className="continue-display"><div><strong>Keep building your display</strong><span>Add equipment and record its connections when you know them.</span></div><button onClick={()=>startAdding('decoration')}><Plus size={16}/> Add equipment</button></div>}{homeSummary}<FieldMode key={project.id} project={project} onLocate={jumpToNode} onTaskChange={(id,done)=>updateTask(id,{done})} onExplore={()=>{setTab('diagram');setDiagramMode('map');setFullscreen(true);setFullMode('explore');setFullToolsOpen(false);setSelected(null);setView('All zones')}} onEdit={()=>{setTab('diagram');setDiagramMode('map');setSelected(null);setView('All zones')}} onTasks={()=>setTab('setup')}/></>}</>}
    {tab==='diagram'&&<>
      <div className="wiring-viewbar">
       <div className="diagram-mode-switch" role="group" aria-label="Choose diagram or installation view">
        <button className={diagramMode==='map'?'active':''} aria-pressed={diagramMode==='map'} onClick={()=>{if(confirmPhotoNavigation())setDiagramMode('map');}}><CircuitBoard size={17}/> Wiring</button>
        <button className={diagramMode==='photo'?'active':''} aria-pressed={diagramMode==='photo'} onClick={openPropertyPhoto}><ImagePlus size={17}/> Property photo</button>
        <button className={diagramMode==='guide'?'active':''} aria-pressed={diagramMode==='guide'} onClick={()=>{if(confirmPhotoNavigation())setDiagramMode('guide');}}><ClipboardCheck size={17}/> Install steps</button>
        <button className={diagramMode==='audit'?'active':''} aria-pressed={diagramMode==='audit'} onClick={()=>{if(confirmPhotoNavigation())setDiagramMode('audit');}}><AlertTriangle size={17}/> Needs checking{auditSummary.critical+auditSummary.attention>0&&<span className="viewbar-count" aria-label={`${auditSummary.critical+auditSummary.attention} open findings`}>{auditSummary.critical+auditSummary.attention}</span>}</button>
       </div>
       <div className="viewbar-right">
        {diagramMode!=='photo'&&<label className="viewbar-scope">Showing<select aria-label="Part of the display to show" value={view} onChange={e=>{const next=e.target.value as View;if(next.startsWith('Outlet: '))focusOutlet(next.slice(8));else changeView(next);}}>
         <option value="All zones">Whole display</option>
         {project.nodes.some(n=>n.kind==='outlet')&&<optgroup label="One outlet">{project.nodes.filter(n=>n.kind==='outlet').map(o=><option key={o.id} value={`Outlet: ${o.id}`}>{o.name}</option>)}</optgroup>}
         <optgroup label="One area">{zones.map(z=><option key={z} value={z}>{z}</option>)}</optgroup>
        </select></label>}
        <div className="viewbar-more"><button type="button" className="button secondary" aria-expanded={showDiagramMore} aria-controls="diagram-more-menu" onClick={()=>setShowDiagramMore(x=>!x)}><FileSpreadsheet size={16}/> <span>Import / export</span> <ChevronDown size={14}/></button>
         {showDiagramMore&&<div id="diagram-more-menu" className="action-menu viewbar-menu" aria-label="Import, export and print">
          <button onClick={()=>{setShowDiagramMore(false);setShowWizard(true);}}><FileSpreadsheet size={16}/> Import Excel workbook</button>
          <button onClick={()=>{setShowDiagramMore(false);setShowPhotoImport(true);}}><ImagePlus size={16}/> Match workbook photos</button>
          <button onClick={()=>{setShowDiagramMore(false);downloadWiringReference(project,sharedLighting);setMessage('Reference workbook downloaded; original Excel master unchanged.');}}><Download size={16}/> Export Excel reference</button>
          <button onClick={()=>{setShowDiagramMore(false);printAll();}}><Printer size={16}/> Print diagram</button>
         </div>}
        </div>
       </div>
      </div>
      {showDiagramMore&&<button type="button" className="more-menu-dismiss" aria-label="Dismiss import and export menu" onClick={()=>setShowDiagramMore(false)}/>}
      {diagramMode==='photo'&&<><PropertyPhotoViews project={project} activeId={activePhotoId} hasUnsavedDraft={photoUnsaved||photoQuickDirty||!!directDraft?.points.length} onUpdate={update} onSelect={id=>{setActivePhotoId(id);setNextPhotoItem(null);setPhotoEditRequest(0);setPhotoMeasureRequest(0);setDirectDraft(null);setPhotoUnsaved(false);setPhotoQuickDirty(false);setPhotoSimilarId(null);setPhotoAddDraft({kind:null,zone:''});setPhotoConnectTarget(null);setPhotoConnectSource('');setPhotoAspect(1);}}/>
       <PropertyPhotoView key={project.id+':'+activePhotoId} project={project} lighting={sharedLighting} value={photoView?.layout} onChange={value=>{if(value&&photoView?.layout&&value.photo===photoView.layout.photo){commitGraphChange(project,'edit photo layout',()=>value,photoView.layout.photo);}else{setDirectDraft(null);setGraphHistory(emptyGraphHistory());update(p=>setPropertyPhotoLayout(p,activePhotoId,value));}}} onOpenItem={jumpToNode} onAddItem={()=>startAdding()} selectedItemId={selected}
       onUnsavedDraftChange={setPhotoUnsaved} onImageAspectRatio={setPhotoAspect} measurementRequest={photoMeasureRequest} historyControls={<div className="photo-history-controls" role="group" aria-label="Photo and diagram undo and redo"><button type="button" disabled={!graphHistory.past.length||photoUnsaved||photoQuickDirty||!!directDraft?.points.length||cloud.status==='conflict'} onClick={()=>stepGraph('undo')}><RotateCcw size={15}/> Undo</button><button type="button" disabled={!graphHistory.future.length||photoUnsaved||photoQuickDirty||!!directDraft?.points.length||cloud.status==='conflict'} onClick={()=>stepGraph('redo')}><RotateCw size={15}/> Redo</button><small>Recent photo and diagram edits, this session</small></div>}
       canSelectItem={id=>id===selected||!photoQuickDirty||window.confirm('Discard unsaved item details before selecting another item?')} onSelectItem={id=>{setSelected(id);if(id!==nextPhotoItem)setNextPhotoItem(null);}} photoPlaceActive={!!photoSimilarId||!!photoAddDraft.kind&&!!photoAddDraft.zone} onPhotoPlace={addAtPhoto}
       onPhotoModeChange={options=>{if(options?.discardDirectRouteConfirmed)setDirectDraft(null);else if(!leaveDirectDraw())return false;setPhotoSimilarId(null);setPhotoAddDraft(d=>({...d,kind:null}));setPhotoConnectTarget(null);setPhotoConnectSource('');setGuidedError('');return true;}}
       directRoutePoints={directDraft?.zone?directDraft.points:null} onDirectRoutePoint={point=>setDirectDraft(d=>d&&d.points.length<500?{...d,points:[...d.points,point]}:d)}
       imageBrightness={photoVisuals.preview?photoVisuals.brightness:1}
       svgOverlay={photoView?.layout?(visibleIds)=><PhotoVisualOverlay project={project} photo={photoView.layout!} selectedId={selected} options={photoVisuals} aspectRatio={photoAspect} visibleIds={visibleIds}/>:undefined}
       detailExtra={item=><PhotoQuickEdit key={item.id} item={item} openRequest={item.id===nextPhotoItem?photoEditRequest:0} onDirtyChange={setPhotoQuickDirty} onSave={(id,changes)=>patchComponent(id,changes,true)} onAddSimilar={()=>{if(!leaveDirectDraw())return;setPhotoAddDraft(d=>({...d,kind:null}));setPhotoConnectTarget(null);setPhotoConnectSource('');setPhotoSimilarId(item.id);setGuidedError('');requestAnimationFrame(()=>document.querySelector('.property-image')?.scrollIntoView({behavior:'smooth',block:'center'}));}}/>}
       addPalette={<>{nextPhotoItem&&selected===nextPhotoItem&&project.nodes.some(n=>n.id===nextPhotoItem)&&!directDraft&&<PhotoNextSteps itemName={project.nodes.find(n=>n.id===nextPhotoItem)!.name} canConnect={!project.edges.some(e=>e.target===nextPhotoItem)} onEdit={()=>{setPhotoEditRequest(v=>v+1);requestAnimationFrame(()=>document.querySelector('.photo-quick-edit')?.scrollIntoView({behavior:'smooth',block:'center'}));}} onConnect={()=>{setPhotoConnectSource('');setPhotoConnectTarget(nextPhotoItem);setNextPhotoItem(null);requestAnimationFrame(()=>document.getElementById('photo-connection-panel')?.scrollIntoView({behavior:'smooth',block:'nearest'}));}} onDrawAnother={()=>{const item=project.nodes.find(n=>n.id===nextPhotoItem);if(!item)return;setDirectDraft({kind:item.kind==='cord'?'cord':'lights',zone:item.zone,points:[],cursor:{x:.5,y:.5}});setNextPhotoItem(null);}} onMeasure={()=>{setPhotoMeasureRequest(v=>v+1);setNextPhotoItem(null);}} onDismiss={()=>setNextPhotoItem(null)}/>}<PhotoDirectDraw value={directDraft} onChange={draft=>{if(draft&&!directDraft){setPhotoSimilarId(null);setPhotoAddDraft(d=>({...d,kind:null}));setPhotoConnectTarget(null);setPhotoConnectSource('');setGuidedError('');}setDirectDraft(draft);}} onSave={saveDirectDraw}/>{!directDraft&&(photoSimilarId?<div className="photo-add-palette"><strong>Place another like {project.nodes.find(n=>n.id===photoSimilarId)?.name||'this item'}</strong><p>Tap the photo for each new unconnected item. Review its physical details.</p><button type="button" onClick={()=>setPhotoSimilarId(null)}>Stop adding</button></div>:<PhotoAddPalette value={photoAddDraft} onChange={draft=>{setPhotoAddDraft(draft);setPhotoConnectTarget(null);setPhotoConnectSource('');setGuidedError('');}}/>)}<PhotoVisualControls value={photoVisuals} onChange={setPhotoVisuals} selectedName={project.nodes.find(n=>n.id===selected)?.name}/>{!photoConnectTarget&&guidedError&&<p role="alert">{guidedError}</p>}</>}
       onConnectItem={id=>{setPhotoSimilarId(null);setPhotoAddDraft(d=>({...d,kind:null}));setGuidedError('');setPhotoConnectSource('');setPhotoConnectTarget(id);requestAnimationFrame(()=>document.getElementById('photo-connection-panel')?.scrollIntoView({behavior:'smooth',block:'nearest'}));}}
       connectTargetId={photoConnectTarget} onSelectConnectionSource={id=>{setPhotoConnectSource(id);setGuidedError('');}}
       connectionPanel={photoConnectTarget?<div id="photo-connection-panel"><PhotoConnect project={project} targetId={photoConnectTarget} sourceId={photoConnectSource} onSourceChange={id=>{setPhotoConnectSource(id);setGuidedError('');}} onSetOutputs={setPhotoOutputs} error={guidedError} onCancel={()=>{setPhotoConnectTarget(null);setPhotoConnectSource('');setGuidedError('');}} onConnect={(source,port)=>{if(!guidedConnect(photoConnectTarget,source,port))return false;setPhotoConnectTarget(null);setPhotoConnectSource('');setMessage('Connection recorded. Verify it in the field.');return true;}}/></div>:undefined}/></>}
      {diagramMode==='audit'&&<><VerificationAudit project={project} scope={baseVisibleIds} scopeLabel={view.startsWith('Outlet: ')?project.nodes.find(n=>n.id===view.slice(8))?.name||view:view} onLocate={jumpToNode} onVerify={id=>{const component=project.nodes.find(n=>n.id===id);if(!component)return;if(confirm(`Have you physically checked ${component.name} at the display? This marks it field-verified, not electrically certified.`)){patchComponent(id,{verified:true});setMessage(`${component.name} marked checked in the field. Any missing wiring or rating details remain outstanding.`);}}}/>
        <div className="audit-undo"><div><strong>Latest recorded wiring change</strong><p>{project.wiringHistory?.length?`${project.wiringHistory.at(-1)?.action} · ${project.wiringHistory.at(-1)?.targetName}`:'No guided wiring edits recorded yet'}</p></div><button className="button secondary" disabled={!project.wiringHistory?.length||cloud.status==='conflict'} onClick={undoLastFeed}><ArrowUpRight size={15}/> Reverse last feed change</button></div></>}
       {diagramMode==='guide'&&<InstallationGuide key={project.id} project={project} scope={baseVisibleIds} scopeLabel={view.startsWith('Outlet: ')?project.nodes.find(n=>n.id===view.slice(8))?.name||view:view} onLocate={jumpToNode} onTaskChange={(id,done)=>updateTask(id,{done})}/>}
      {diagramMode==='map'&&<div role={fullscreen?'dialog':undefined} aria-modal={fullscreen||undefined} aria-label={fullscreen?'Fullscreen wiring workspace':undefined} className={`diagram-layout wiring-layout ${!inspectorOpen?'diagram-wide':''} ${fullscreen?'diagram-fullscreen':''}`}><div className="diagram-card">
       {!fullscreen&&<div className="wiring-toolbar" role="toolbar" aria-label="Wiring diagram tools">
        <button type="button" className="button primary" onClick={()=>startAdding()}><Plus size={16}/> Add item</button>
        {historyButtons}
        <div className="wiring-search"><Search size={15}/><input type="search" aria-label="Find an item on the diagram" placeholder="Find an item…" value={diagramSearch} onChange={e=>setDiagramSearch(e.target.value)}/>
         {diagramSearch.trim().length>=2&&<div className="wiring-search-results" role="list">{diagramMatches.map(item=><button type="button" role="listitem" key={item.id} onClick={()=>{showItem(item.id);setDiagramSearch('');}}><strong>{item.name}</strong><small>{item.zone}</small></button>)}{diagramMatches.length===0&&<p>No matching items</p>}</div>}
        </div>
        <span className="wiring-toolbar-gap"/>
        <label className="layout-picker desktop-only"><span className="visually-hidden">Arrange items</span><select aria-label="Diagram arrangement" title="How items are arranged on the diagram" value={layoutMode} onChange={e=>setLayoutMode(e.target.value as 'auto'|'manual')}><option value="auto">Arranged automatically</option><option value="manual">My own positions</option></select></label>
        <button type="button" className="button secondary" onClick={()=>{setFullscreen(true);setFullMode('builder');setFullSearch('');setFullToolsOpen(false)}}><Maximize2 size={16}/> <span>Full screen</span></button>
        <button type="button" className="icon-button desktop-only" aria-label={inspectorOpen?'Hide side panel':'Show side panel'} aria-pressed={inspectorOpen} onClick={()=>setInspectorOpen(s=>!s)}><BookOpen size={19}/></button>
       </div>}
       <div id="diagram-canvas" className="canvas-wrap" style={project.backgroundPhoto?{backgroundImage:`linear-gradient(#f9fafbcc,#f9fafbcc),url(${project.backgroundPhoto})`,backgroundSize:'contain',backgroundPosition:'center',backgroundRepeat:'no-repeat'}:undefined}>
       <ReactFlow<BlueprintFlowNode,Edge> nodes={flowNodes} edges={flowEdges} nodeTypes={nodeTypes} fitView fitViewOptions={{padding:0.22,maxZoom:1.15}} minZoom={0.08} maxZoom={3} zoomOnDoubleClick={!workspaceEditable} nodesDraggable={workspaceEditable&&layoutMode==='manual'} nodesConnectable={workspaceEditable} edgesReconnectable={false} onNodesChange={changes=>{if(!workspaceEditable||layoutMode!=='manual')return;for(const change of changes){if(change.type==='position'&&change.position){update(p=>({...p,nodes:p.nodes.map(n=>n.id===change.id?{...n,position:change.position!}:n)}));}}}}
         onNodeClick={(_,n)=>{setDiagramQuickEdit(null);setInsertEdgeId('');if(workspaceEditable&&diagramConnectTarget){setDiagramConnectSource(n.id);setGuidedError('');return;}setPlugIn(null);setSelected(n.id);setTrace(n.data.component.kind==='outlet'?'downstream':'upstream');if(fullscreen&&fullMode==='explore')setGalleryId(n.id);else setInspectorOpen(true);}}
         onNodeDoubleClick={(event,n)=>{if(!workspaceEditable||diagramConnectTarget)return;event.preventDefault();openDiagramQuickEdit(n.id,event.clientX,event.clientY,'name');}}
         onNodeContextMenu={(event,n)=>{if(!workspaceEditable||diagramConnectTarget)return;event.preventDefault();openDiagramQuickEdit(n.id,event.clientX,event.clientY,'name');}}
         onPaneClick={()=>{setDiagramQuickEdit(null);setInsertEdgeId('');setPlugIn(null);setSelected(null);setTrace('none');}} onConnect={connection=>{if(workspaceEditable)onConnect(connection);}}
         onEdgeClick={(_,edge)=>{setDiagramQuickEdit(null);if(diagramConnectTarget)return;if(!workspaceEditable){const target=project.nodes.find(n=>n.id===edge.target);if(target){setSelected(target.id);setTrace('upstream');}return;}setPlugIn(null);setSelected(null);setTrace('none');setInsertEdgeId(edge.id);setInspectorOpen(true);}}
         onEdgesDelete={deleted=>{if(!workspaceEditable)return;for(const e of deleted)changePowerFeed(e.target,null);}} onNodesDelete={deleted=>{if(deleted.length===1)removeComponent(deleted[0].id);else setMessage('Delete nodes one at a time from the component inspector.')}} deleteKeyCode={null}>
        <Background gap={24} size={1} color="#e1e7ed"/>{!fullscreen&&<Controls showInteractive={false}/>}<MiniMap pannable zoomable nodeColor={n=>n.data?.component&&(n.data.component as Component).kind==='outlet'?'#d68b3e':'#6289aa'} style={{width:130,height:85,display:fullscreen?'none':undefined}}/>
       </ReactFlow>
       {workspaceEditable&&connectTargetNode&&<div className={`canvas-banner ${fullscreen?'canvas-banner-fullscreen':''}`} role="status"><Link2 size={15}/><span>Tap the item that <strong>{connectTargetNode.name}</strong> plugs into, then choose its output in the panel.</span><button type="button" onClick={()=>{setDiagramConnectTarget(null);setDiagramConnectSource('');setGuidedError('');}}>Cancel</button></div>}
       {project.nodes.length===0&&workspaceEditable&&<div className="canvas-empty"><strong>Nothing on this diagram yet</strong><p>Start with the outlet everything plugs into. Then select it and plug things in, one piece at a time.</p><div><button type="button" className="button primary" onClick={()=>startAdding('outlet')}><PlugZap size={16}/> Add an outlet</button><button type="button" className="button secondary" onClick={()=>startAdding()}>Add something else</button></div></div>}
       {selectedNode&&!fullscreen&&!diagramConnectTarget&&!plugIn&&<div className="mobile-selected-item" aria-label="Selected diagram item"><span title={selectedNode.name}><strong>{selectedNode.name}</strong><small>{selectedFeedSource?`Plugged into ${selectedFeedSource.name}`:selectedNode.kind==='outlet'?'Power source':'Not plugged in'}</small></span>{selectedNode.kind!=='outlet'&&!selectedFeed&&<button onClick={()=>startConnect(selectedNode.id)}><Link2 size={16}/> Plug into…</button>}<button onClick={()=>{setInspectorOpen(true);setTimeout(()=>document.getElementById('mobile-item-inspector')?.scrollIntoView({behavior:'smooth',block:'start'}),80)}}><BookOpen size={16}/> Details</button><button aria-label={'Photos for '+selectedNode.name} onClick={()=>setGalleryId(selectedNode.id)}><ImagePlus size={16}/></button></div>}
       {diagramQuickEdit&&diagramEditNode&&workspaceEditable&&<DiagramQuickEdit key={diagramEditNode.id} item={diagramEditNode} season={project.season} position={diagramQuickEdit}
         onClose={()=>setDiagramQuickEdit(null)}
         onRename={name=>{const clean=tidyComponentName(name);if(clean)patchComponent(diagramEditNode.id,{name:clean},true);}}
         onIcon={visualIcon=>patchComponent(diagramEditNode.id,{visualIcon},true)}/>}
       {fullscreen&&<div className="fullscreen-workspace-ui">
        <div className="fullscreen-topbar">
         <span className="fullscreen-title"><CircuitBoard size={18}/><strong>{project.season} {project.year}</strong><small>{fullMode==='explore'?'Explore wiring':'Build wiring'}</small></span>
         <div className="fullscreen-toolgroup" role="group" aria-label="Workspace mode">
          <button aria-pressed={fullMode==='explore'} className={fullMode==='explore'?'active':''} onClick={()=>{setFullMode('explore');setDiagramConnectTarget(null);setDiagramConnectSource('');setPlugIn(null)}}><Eye size={16}/> Explore</button>
          <button aria-pressed={fullMode==='builder'} className={fullMode==='builder'?'active':''} onClick={()=>{setFullMode('builder');setDiagramConnectTarget(null);setDiagramConnectSource('');setPlugIn(null)}}><PenTool size={16}/> Builder</button>
         </div>
         <button className="fullscreen-close" aria-label="Exit fullscreen diagram" onClick={()=>{setFullscreen(false);setDiagramConnectTarget(null);setDiagramConnectSource('');setPlugIn(null);setFullSearch('')}}><Minimize2 size={18}/> <span>Exit</span></button>
        </div>
        <div className="fullscreen-controls">
         <select className="fullscreen-circuit" aria-label="Fullscreen power circuit" value={view} onChange={e=>changeView(e.target.value as View)}>
          <option value="All zones">Whole system</option>
          {project.nodes.filter(n=>n.kind==='outlet').map(n=><option value={`Outlet: ${n.id}`} key={n.id}>{n.name.match(/\bO\d+\b/i)?.[0]||n.name}</option>)}
          {zones.map(z=><option value={z} key={z}>{z}</option>)}
         </select>
         <div className="fullscreen-zoom" role="group" aria-label="Diagram zoom">
          <button aria-label="Zoom out diagram" onClick={()=>void zoomOut({duration:180})}><ZoomOut size={17}/></button>
          <button aria-label="Fit entire visible diagram" onClick={()=>void fitView({padding:.15,duration:230})}>Fit</button>
          <button aria-label="Zoom in diagram" onClick={()=>void zoomIn({duration:180})}><ZoomIn size={17}/></button>
         </div>
         <button className="fullscreen-more-toggle" aria-label={fullToolsOpen?'Hide search and options':'Show search and options'} aria-expanded={fullToolsOpen} onClick={()=>setFullToolsOpen(v=>!v)}><SlidersHorizontal size={18}/><span>Tools</span></button>
         {fullToolsOpen&&<div className="fullscreen-extra">
          <button aria-pressed={pathOnly} disabled={!selected} onClick={()=>setPathOnly(v=>!v)}>{pathOnly?'Show whole circuit':'Path only'}</button>
          <div className="fullscreen-search"><Search size={15}/><input aria-label="Find equipment in fullscreen diagram" value={fullSearch} placeholder="Find an item in any circuit…" onChange={e=>setFullSearch(e.target.value)}/>
           {fullSearch.trim().length>=2&&<div className="fullscreen-matches" role="list">
            {fullscreenMatches.map(item=><button key={item.id} role="listitem" onClick={()=>{if(!baseVisibleIds.has(item.id))setView('All zones');setSelected(item.id);setTrace('upstream');setFocusRequest(prev=>({id:item.id,seq:(prev?.seq||0)+1}));setFullSearch('');setFullToolsOpen(false)}}><strong>{item.name}</strong><small>{item.zone}</small></button>)}
            {fullscreenMatches.length===0&&<p>No matching items</p>}
           </div>}
          </div>
          <small>Drag to pan · pinch to zoom · tap items to trace their source</small>
         </div>}
        </div>
        {fullMode==='builder'&&<div className={`fullscreen-sheet ${panelActive?'sheet-open':''}`} aria-label="Wiring builder tools">
         <div className="sheet-bar"><button type="button" className="sheet-add" onClick={()=>startAdding()}><Plus size={16}/> Add item</button>{historyButtons}<label className="layout-picker"><span className="visually-hidden">Arrange items</span><select aria-label="Builder diagram layout" title="How items are arranged on the diagram" value={layoutMode} onChange={e=>setLayoutMode(e.target.value as 'auto'|'manual')}><option value="auto">Arranged automatically</option><option value="manual">My own positions</option></select></label>{!panelActive&&<small>{project.nodes.length?'Tap an item to plug things into it, rename it or remove it. Tap a wire to unplug it or put something in between.':'Add an outlet to start.'}</small>}</div>
         {panelActive&&<div className="inspector sheet-panel">{panelHead}{panelBody}</div>}
        </div>}
        {selectedNode&&fullMode==='explore'&&<div className="fullscreen-selection"><strong>{selectedNode.name}</strong><span>{sourcePath(selectedNode.id,project).map(n=>n.name).join(' → ')}</span><button onClick={()=>{setSelected(null);setTrace('none');setPathOnly(false)}} aria-label="Clear selected path"><X size={15}/></button></div>}
       </div>}
       </div>{!fullscreen&&<div className="canvas-footer"><span className="canvas-hint">{canvasHint}</span><span className="canvas-counts"><CheckCircle2 size={14}/> {project.nodes.length} items · {project.edges.length} connections{warningErrors.length?' · Diagram has errors':''}</span><label className="photo-action"><ImagePlus size={15}/> Background image<input type="file" accept="image/*" onChange={e=>{void attachPhoto(e.target.files?.[0]);e.target.value='';}}/></label></div>}</div>
       {inspectorOpen&&!fullscreen&&<div id="mobile-item-inspector" className="inspector">{panelHead}{panelBody}</div>}
      </div>}<div className="notice-row"><AlertTriangle size={17}/><div><strong>Manual electrical checks</strong><span>{warnings.join(' • ')}</span></div></div>
     </>}
    {(tab==='setup'||tab==='teardown')&&<><div className="tasks-mode-switch" role="group" aria-label="Task mode"><button className={tab==='setup'?'active':''} onClick={()=>setTab('setup')}>Install</button><button className={tab==='teardown'?'active':''} onClick={()=>setTab('teardown')}>Teardown</button></div><SeasonTasks key={project.id+':'+tab} project={project} mode={tab} onLocate={jumpToNode} onTaskChange={updateTask} onError={setMessage}/></>}
        {tab==='inventory'&&<>
       <div className="inventory-mode-switch" role="group" aria-label="Inventory view">
        <button className={inventoryMode==='lighting'?'active':''} aria-pressed={inventoryMode==='lighting'} onClick={()=>setInventoryMode('lighting')}>💡 Lighting counts</button>
        <button className={inventoryMode==='equipment'?'active':''} aria-pressed={inventoryMode==='equipment'} onClick={()=>setInventoryMode('equipment')}>📦 Equipment</button>
       </div>
       {inventoryMode==='lighting'?<SharedLightingInventory project={project} catalog={sharedLighting}
        legacyRows={(project.lightingInventory||[]).filter(x=>!sharedLighting.stock.some(s=>s.id===x.id)).length}
        onMigrate={()=>{const legacy=(project.lightingInventory||[]).filter(x=>!sharedLighting.stock.some(s=>s.id===x.id));if(!legacy.length)return;if(!confirm('Import '+legacy.length+' previous annual rows as permanent inventory? If these are repeated records of the same physical lights across years, import them only once. Original annual entries remain in your backup.'))return;updateShared(x=>importLegacyLighting(x,legacy,project.season,project.year));setMessage('Existing light counts moved to shared stock. Verify unique physical items once.');}}
        onCreate={type=>updateShared(x=>addStock(x,type))}
        onChangeStock={(id,fields)=>{try{updateShared(x=>updateStock(x,id,fields));}catch(e){setMessage(String(e));}}}
        onPhoto={async(id,file)=>{try{const photo=await readPhoto(file);updateShared(x=>updateStock(x,id,{photo}));setMessage('Private stock photo saved on this device; cloud sync will transfer it when possible.');}catch(e){setMessage('Photo could not be saved: '+String(e));}}}
        onDeleteStock={id=>{if(sharedLighting.placements.some(p=>p.stockId===id)){setMessage('Referenced in another year; remove assignments first.');return;}updateShared(x=>({...x,stock:x.stock.filter(s=>s.id!==id)}));}}
        onPlace={(id,area)=>updateShared(x=>addPlacement(x,id,project.season,project.year,area))}
        onChangePlacement={(id,fields)=>{try{updateShared(x=>updatePlacement(x,id,fields));}catch(e){setMessage(String(e));}}}
        onRemovePlacement={id=>updateShared(x=>({...x,placements:x.placements.filter(p=>p.id!==id)}))}
        onCopyPrevious={()=>{updateShared(x=>repeatLastYearAssignments(x,project.season,project.year));setMessage('Last-year locations reused as Planned. Stock quantities were not changed.');}}
        onExport={()=>downloadText(`lighting-stock-${project.season}-${project.year}.csv`,stockCsv(sharedLighting,project.season,project.year),'text/csv')}/>:<EquipmentInventory project={project} onPatch={(id,fields)=>{patchComponent(id,fields);}} onShow={id=>{setPathOnly(false);setView('All zones');jumpToNode(id);}} onExport={exportEquipmentCsv}/>}</>}
   </main>
  </div>
  <nav className="mobile-tabbar" aria-label="Mobile main navigation">{(['field','diagram','inventory','setup'] as Tab[]).map(t=>{const Icon=iconFor[t];return <button key={t} className={tab===t||(t==='setup'&&tab==='teardown')?'active':''} onClick={()=>{if(t!==tab&&!confirmPhotoNavigation())return;setTab(t);setShowSidebar(false);setShowMenu(false)}}><Icon size={21}/><span>{({field:'Home',diagram:'Diagram',setup:'Tasks',teardown:'Tasks',inventory:'Inventory'})[t]}</span></button>;})}</nav>
  {message&&<div className={`toast${fullscreen?' toast-fullscreen':''}`} role="status"><span>{message}</span><button aria-label="Dismiss message" onClick={()=>setMessage('')}><X size={16}/></button></div>}
  {showTransfer&&<DeviceTransfer hasRealPlans={!examplesOnly} projectCount={availableProjects.length} onExport={exportPrivateBackup} onImport={importBackup} onClose={()=>setShowTransfer(false)}/>}
  {showGuidedAdd&&<div className="guided-add-backdrop"><GuidedAdd key={project.id} project={project} reusable={reusable} initialKind={guidedKind} error={guidedError} onClearError={()=>setGuidedError('')} onAdd={guidedAdd} onReuse={guidedReuse} onConnect={guidedConnect} onClose={finishAdding}/></div>}
  {showNewDisplay&&<NewDisplay initialSeason={project.season} initialYear={new Date().getFullYear()} onCreate={createDisplay} onClose={closeNewDisplay}/>}
  {galleryNode&&<ComponentPhotoGallery key={galleryNode.id} project={project} component={galleryNode} canEdit={!fullscreen||fullMode==='builder'} onClose={()=>setGalleryId(null)} onAdd={(file,role)=>addEquipmentPhoto(galleryNode.id,file,role)} onPromote={id=>changeEquipmentPhoto(galleryNode.id,id,'promote')} onRemove={id=>changeEquipmentPhoto(galleryNode.id,id,'remove')} onEdit={()=>{if(fullscreen)setFullMode('builder');setSelected(galleryNode.id);setInspectorOpen(true);setGalleryId(null);}}/>}
   {showHistory&&<VersionHistory project={project} onClose={()=>setShowHistory(false)} onRestore={restored=>{if(!confirmPhotoNavigation())return;update(()=>restored);setMessage('Restore point applied as Draft. Recheck all connections and sync status.');}}/>}
   {showPhotoImport&&<PhotoImportReview key={project.id} project={project} onApply={applyReviewedPhotos} onClose={()=>setShowPhotoImport(false)}/>}
   {showWizard&&<ExcelWizard project={project} onSave={p=>{update(()=>p);setMessage('Workbook rows imported as draft. Review each mapping and save a backup.');}} onImportMaster={p=>{if(!confirmPhotoNavigation())return;setProjects(all=>[...all,p]);setActive(p.id);setView(p.nodes.length>25&&p.nodes.some(n=>n.kind==='outlet')?`Outlet: ${p.nodes.find(n=>n.kind==='outlet')!.id}`:'All zones');setSelected(null);setTrace('none');setMessage(`${p.season} workbook imported as a separate DRAFT. Check every connection and export a private backup.`);}} onClose={()=>setShowWizard(false)}/>}
 </div>;
}
export default function App(){return <ReactFlowProvider><AppContent/></ReactFlowProvider>;}
