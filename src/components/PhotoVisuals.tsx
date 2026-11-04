import type {Project} from '../lib/model';
import type {PropertyPhoto,PhotoPoint} from '../lib/propertyPhoto';
import {upstream} from '../lib/graph';
import {portName} from '../lib/portLabels';
import {getVisualIcon} from '../lib/visualIcons';
import './photoVisuals.css';

export type PhotoVisualOptions={preview:boolean;showPowerPath:boolean;showProps:boolean;propSize:number;color:string;spacing:number;brightness:number};
export const defaultPhotoVisuals:PhotoVisualOptions={preview:false,showPowerPath:false,showProps:false,propSize:80,color:'#ffd568',spacing:.04,brightness:.58};
type Props={value:PhotoVisualOptions;onChange:(next:PhotoVisualOptions)=>void;selectedName?:string};
export function PhotoVisualControls({value,onChange,selectedName}:Props){
 return <details className="photo-visual-options"><summary>Preview lights & power path</summary>
  <label><input type="checkbox" checked={value.preview} onChange={e=>onChange({...value,preview:e.target.checked})}/> Preview bulbs on light routes</label>
  {value.preview&&<div className="photo-visual-fields"><label>Bulb color<select value={value.color} onChange={e=>onChange({...value,color:e.target.value})}><option value="#ffd568">Warm white</option><option value="#eafaff">Cool white</option><option value="#ff4d4d">Red</option><option value="#72e58c">Green</option><option value="#6da7ff">Blue</option><option value="#e7a5ff">Purple</option><option value="#ff9d4c">Orange</option></select></label><label>Preview spacing<select value={value.spacing} onChange={e=>onChange({...value,spacing:Number(e.target.value)})}><option value={.025}>Closer</option><option value={.04}>Medium</option><option value={.07}>Farther apart</option></select></label><label>Photo brightness<input type="range" min="0.3" max="1" step="0.05" value={value.brightness} onChange={e=>onChange({...value,brightness:Number(e.target.value)})}/></label><small>Bulbs and spacing are illustrative, and large previews may be limited. They do not change stock counts or measurements.</small></div>}
  <label><input type="checkbox" checked={value.showProps} onChange={e=>onChange({...value,showProps:e.target.checked})}/> Preview decoration icons</label>
  {value.showProps&&<div className="photo-visual-fields"><label>Icon size<input type="range" min="40" max="140" step="10" value={value.propSize} onChange={e=>onChange({...value,propSize:Number(e.target.value)})}/></label><small>Choose an item's display icon in Edit details here. Icons are illustrative, not measured sizes.</small></div>}
  <label><input type="checkbox" checked={value.showPowerPath} onChange={e=>onChange({...value,showPowerPath:e.target.checked})}/> Show {selectedName?`${selectedName}’s `:'selected item’s '}recorded power path</label>
  {value.showPowerPath&&<small>Dashed lines connect placed markers for reference; they do not show the physical cord route.</small>}
 </details>;
}

/** Relative spacing intentionally produces an illustration, never a bulb or material count. */
export function previewPoints(points:PhotoPoint[],spacing:number,aspectRatio:number,limit=400):PhotoPoint[]{
 if(points.length<2||!Number.isFinite(spacing)||spacing<=0)return [];
 const ratio=Number.isFinite(aspectRatio)&&aspectRatio>0?aspectRatio:1;
 const result:PhotoPoint[]=[points[0]];let remaining=spacing;
 for(let i=1;i<points.length&&result.length<limit;i++){
  const start=points[i-1],end=points[i],dx=end.x-start.x,dy=end.y-start.y,length=Math.hypot(dx*ratio,dy);
  if(!length)continue;
  let distance=remaining;
  while(distance<=length&&result.length<limit){const t=distance/length;result.push({x:start.x+dx*t,y:start.y+dy*t});distance+=spacing;}
  remaining=distance-length;
 }
 return result;
}

/** SVG overlay represents saved edges as a schematic and routes as a visual preview only. */
export function PhotoVisualOverlay({project,photo,selectedId,options,aspectRatio=1,visibleIds}:{project:Project;photo:PropertyPhoto;selectedId:string|null;options:PhotoVisualOptions;aspectRatio?:number;visibleIds?:Set<string>}){
 const ids=selectedId?new Set([selectedId,...upstream(selectedId,project.edges)]):new Set<string>();
 const visible=(id:string)=>!visibleIds||visibleIds.has(id);
 const edges=options.showPowerPath?project.edges.filter(e=>ids.has(e.source)&&ids.has(e.target)&&visible(e.source)&&visible(e.target)&&photo.placements[e.source]&&photo.placements[e.target]):[];
 const bulbs:{id:string;point:PhotoPoint}[]=[];
 if(options.preview)for(const [id,route] of Object.entries(photo.routes||{})){
  if(bulbs.length>=1500)break;
  if(route.kind!=='lights'||!visible(id)||!project.nodes.some(n=>n.id===id))continue;
  bulbs.push(...previewPoints(route.points,options.spacing,aspectRatio,Math.min(400,1500-bulbs.length)).map(point=>({id,point})));
 }
 return <g aria-hidden="true">
  {edges.map(edge=>{const a=photo.placements[edge.source],b=photo.placements[edge.target],source=project.nodes.find(n=>n.id===edge.source);return <g key={edge.id} className="photo-power-path"><line x1={a.x*1000} y1={a.y*1000} x2={b.x*1000} y2={b.y*1000} vectorEffect="non-scaling-stroke"/><text x={(a.x+b.x)*500} y={(a.y+b.y)*500-10}>{source?portName(source,edge.sourcePort):`Output ${edge.sourcePort+1}`}</text></g>;})}
  {bulbs.map(({id,point},i)=><circle key={`${id}-${i}`} className="photo-preview-bulb" fill={options.color} cx={point.x*1000} cy={point.y*1000} r="7"/>)}
  {options.showProps&&project.nodes.flatMap(node=>{const point=photo.placements[node.id],icon=getVisualIcon(node.visualIcon);return node.kind==='decoration'&&visible(node.id)&&point&&icon?[<text key={node.id} x={point.x*1000} y={point.y*1000-28} textAnchor="middle" fontSize={options.propSize}>{icon.emoji}</text>]:[];})}
 </g>;
}
