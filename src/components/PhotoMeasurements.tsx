import {useEffect,useState} from 'react';
import type {Component,Project,SharedLighting} from '../lib/model';
import type {PhotoCalibration,PhotoPoint,PhotoRoute,PropertyPhoto} from '../lib/propertyPhoto';
import {estimatePhotoRouteFeet,photoDistance} from '../lib/photoMeasurements';
import './photoMeasurements.css';

type MeasuredRoute=PhotoRoute&{measuredFeet?:number};
type MeasuredPhoto=PropertyPhoto&{calibration?:PhotoCalibration;routes?:Record<string,MeasuredRoute>};
type Props={project:Project;value:PropertyPhoto;node?:Component;lighting?:SharedLighting;aspectRatio?:number;calibrationPoints:PhotoPoint[]|null;hasCalibrationDraft?:boolean;onStartCalibration:()=>void;onCancelCalibration:()=>void;onUnsavedChange?:(dirty:boolean)=>void;onChange:(value:PropertyPhoto)=>void};
const formatFeet=(n:number)=>Number(n.toFixed(1)).toLocaleString();
const lengthComparison=(recorded:number,route:number)=>{
 const difference=Number((recorded-route).toFixed(1));
 if(difference===0)return 'The recorded length and route are about the same.';
 return `The recorded length is about ${formatFeet(Math.abs(difference))} ft ${difference<0?'shorter':'longer'} than the route.`;
};

/** Adds only photo annotations. It never changes equipment, inventory or power connections. */
export function PhotoMeasurements({project,value,node,lighting,aspectRatio,calibrationPoints,hasCalibrationDraft,onStartCalibration,onCancelCalibration,onUnsavedChange,onChange}:Props){
 const photo=value as MeasuredPhoto;
 const route=node?photo.routes?.[node.id]:undefined;
 const [knownFeet,setKnownFeet]=useState('');
 const [lengthDrafts,setLengthDrafts]=useState<Record<string,string>>({});
 useEffect(()=>setKnownFeet(photo.calibration?.knownFeet?.toString()||''),[value.photo,photo.calibration?.knownFeet]);
 useEffect(()=>setLengthDrafts({}),[value.photo]);
 const measuredFeet=node?(lengthDrafts[node.id]??route?.measuredFeet?.toString()??''):'';
 const dirtyLengthIds=Object.keys(lengthDrafts).filter(id=>{
  const saved=photo.routes?.[id]?.measuredFeet;
  if(!photo.routes?.[id])return false;
  const draft=lengthDrafts[id].trim();
  return draft===''?saved!==undefined:!Number.isFinite(Number(draft))||Number(draft)!==saved;
 });
 const knownChanged=!!(calibrationPoints!==null||hasCalibrationDraft)&&knownFeet.trim()!==(photo.calibration?.knownFeet?.toString()||'');
 const unsaved=knownChanged||dirtyLengthIds.length>0;
 useEffect(()=>{onUnsavedChange?.(unsaved);},[unsaved,onUnsavedChange]);
 const reference=Number(knownFeet);
 const validAspect=aspectRatio!==undefined&&Number.isFinite(aspectRatio)&&aspectRatio>=0.01&&aspectRatio<=100;
 const validReference=calibrationPoints?.length===2&&validAspect&&Number.isFinite(reference)&&reference>0&&reference<=100000&&photoDistance(calibrationPoints[0],calibrationPoints[1],aspectRatio!)>=0.000001;
 const estimate=route?estimatePhotoRouteFeet(route.points,photo.calibration):undefined;
 const effective=route?.measuredFeet??estimate;
 const numericMeasured=Number(measuredFeet);
 const validMeasured=measuredFeet.trim()===''||(Number.isFinite(numericMeasured)&&numericMeasured>0&&numericMeasured<=100000);
 const linkedEntries=(project.lightingInventory||[]).filter(entry=>entry.componentId===node?.id);
 const linkedPlacements=(lighting?.placements||[]).filter(entry=>entry.componentId===node?.id&&entry.season===project.season&&entry.year===project.year);
 const saveCalibration=()=>{
  if(!validReference||!calibrationPoints||!aspectRatio)return;
  onChange({...photo,calibration:{start:calibrationPoints[0],end:calibrationPoints[1],knownFeet:reference,aspectRatio}});
  onCancelCalibration();
 };
 const saveMeasured=()=>{
  if(!node||!route||!validMeasured)return;
  const updated={...route};
  if(measuredFeet.trim()==='')delete updated.measuredFeet;else updated.measuredFeet=numericMeasured;
  onChange({...photo,routes:{...photo.routes,[node.id]:updated}});
  setLengthDrafts(drafts=>{const next={...drafts};delete next[node.id];return next;});
 };
 return <section className="photo-measurements" aria-label="Photo measurements and materials">
  <h3>Measurements &amp; materials</h3>
  <p>Optionally set a scale using a known distance in this photo. Photo estimates are approximate: perspective, hidden routing and slack affect actual length. Measure in the field before buying or installing.</p>
  {photo.calibration&&<p>Photo scale: {formatFeet(photo.calibration.knownFeet)} ft between the reference points.</p>}
  {calibrationPoints===null?<button type="button" onClick={onStartCalibration}>{hasCalibrationDraft?'Continue photo scale':photo.calibration?'Replace photo scale':'Set photo scale'}</button>:<div className="photo-calibration-controls">
   <strong>Tap the two ends of a known distance on the photo ({Math.min(calibrationPoints.length,2)} of 2 points).</strong>
   {!validAspect&&<p>Waiting for the photo dimensions before a scale can be saved.</p>}
   <label>Actual distance between points (ft)<input type="number" inputMode="decimal" min="0" max="100000" step="any" value={knownFeet} onChange={e=>setKnownFeet(e.target.value)} /></label>
   {calibrationPoints.length===2&&validAspect&&photoDistance(calibrationPoints[0],calibrationPoints[1],aspectRatio!)<0.000001&&<p role="alert">Choose two different points.</p>}
   <button type="button" disabled={!validReference} onClick={saveCalibration}>Save photo scale</button><button type="button" onClick={()=>{setKnownFeet(photo.calibration?.knownFeet?.toString()||'');onCancelCalibration();}}>Cancel scale</button>
  </div>}
  {photo.calibration&&calibrationPoints===null&&<button type="button" onClick={()=>{const next={...photo};delete next.calibration;onChange(next);}}>Remove photo scale</button>}
  {node&&route?<div className="photo-route-measurement">
   <p><strong>{node.name} route:</strong> {estimate===undefined?'Set a photo scale to see an approximate length.':`Approximately ${formatFeet(estimate)} ft on the photo.`}</p>
   <label>Measured route length (ft, optional)<input aria-label="Measured route length in feet" type="number" inputMode="decimal" min="0" max="100000" step="any" value={measuredFeet} onChange={e=>{const draft=e.target.value;setLengthDrafts(drafts=>({...drafts,[node.id]:draft}));}}/></label><button type="button" disabled={!validMeasured} onClick={saveMeasured}>Save measured length</button>
   {dirtyLengthIds.includes(node.id)&&<button type="button" onClick={()=>setLengthDrafts(drafts=>{const next={...drafts};delete next[node.id];return next;})}>Discard this length edit</button>}
   {route.measuredFeet!==undefined&&<p>Using your measured length of {formatFeet(route.measuredFeet)} ft for this route. Clear and save to use the photo estimate again.</p>}
   {node.lengthFt!==undefined&&<p>Recorded equipment length: {formatFeet(node.lengthFt)} ft.{effective!==undefined&&` ${lengthComparison(node.lengthFt,effective)} Check slack and routing before choosing equipment.`}</p>}
   {linkedEntries.map(entry=>{const combined=entry.strandCount!==undefined&&entry.lengthPerStrandFt!==undefined?entry.strandCount*entry.lengthPerStrandFt:undefined;return <p key={entry.id}>Linked lighting record: {entry.label}{entry.strandCount!==undefined?`, ${entry.strandCount} strands`:''}{entry.lengthPerStrandFt!==undefined?`, ${formatFeet(entry.lengthPerStrandFt)} ft per strand`:''} ({entry.status}).{combined!==undefined&&` Recorded combined length: ${formatFeet(combined)} ft.`}{combined!==undefined&&effective!==undefined&&` ${lengthComparison(combined,effective)}`}</p>;})}
   {linkedPlacements.map(placement=>{const stock=lighting?.stock.find(item=>item.id===placement.stockId);return <p key={placement.id}>Linked lighting placement: {stock?.name||'Unknown stock'}{placement.quantity!==undefined&&stock?`, ${placement.quantity} ${stock.unit}`:''} ({placement.status}).{stock?.owned!==undefined&&` Recorded owned: ${stock.owned} ${stock.unit}.`}</p>;})}
   {(linkedEntries.length>0||linkedPlacements.length>0)&&<p>Lighting quantities are shown as recorded and are not converted to feet or treated as available stock.</p>}
  </div>:<p>Select an item with a saved route to see its estimated or measured length and any linked materials.</p>}
  {dirtyLengthIds.some(id=>id!==node?.id)&&<p>Other items have unsaved route lengths. Select them to finish, or <button type="button" onClick={()=>setLengthDrafts({})}>discard all length edits</button>.</p>}
 </section>;
}
