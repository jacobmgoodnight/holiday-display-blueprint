import type {PhotoCalibration,PhotoPoint} from './propertyPhoto';

/** Distances are in image-height units, preserving the actual aspect ratio. */
export function photoDistance(a:PhotoPoint,b:PhotoPoint,aspectRatio:number):number{
 return Math.hypot((a.x-b.x)*aspectRatio,a.y-b.y);
}

/** Perspective means this is only an approximation, especially on another plane. */
export function estimatePhotoRouteFeet(points:readonly PhotoPoint[],calibration?:PhotoCalibration):number|undefined{
 if(!calibration||points.length<2||!Number.isFinite(calibration.aspectRatio)||calibration.aspectRatio<=0||!Number.isFinite(calibration.knownFeet)||calibration.knownFeet<=0)return undefined;
 const reference=photoDistance(calibration.start,calibration.end,calibration.aspectRatio);
 if(!Number.isFinite(reference)||reference<0.000001)return undefined;
 let length=0;
 for(let i=1;i<points.length;i++)length+=photoDistance(points[i-1],points[i],calibration.aspectRatio);
 const estimate=length/reference*calibration.knownFeet;
 return Number.isFinite(estimate)?estimate:undefined;
}
