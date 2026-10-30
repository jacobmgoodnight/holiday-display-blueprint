import {unzipSync} from 'fflate';

/** All parsing happens in the browser. No pictures or workbook bytes are uploaded. */
export type WorkbookPhoto={id:string;name:string;sheet?:string;row?:number;blob:Blob;url:string};
const MAX_FILE=20_000_000;
const MAX_IMAGES=100;
const xml=(bytes?:Uint8Array):Document|null=>bytes?new DOMParser().parseFromString(new TextDecoder().decode(bytes),'application/xml'):null;
const elements=(doc:Document|Element|null,name:string):Element[]=>doc?Array.from(doc.getElementsByTagNameNS('*',name)):[];
const attribute=(el:Element,name:string)=>el.getAttribute(name)||el.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships',name.replace(/^.*:/,''))||'';
const normal=(base:string,target:string)=>{
 if(target.startsWith('/'))return target.replace(/^\/+/, '');
 const parts=base.split('/').slice(0,-1);
 for(const chunk of target.split('/')){if(chunk==='..')parts.pop();else if(chunk&&chunk!=='.')parts.push(chunk);}
 return parts.join('/');
};
export async function extractWorkbookPhotos(file:File):Promise<WorkbookPhoto[]>{
 if(!/\.xlsx$/i.test(file.name))throw Error('Embedded photo review supports .xlsx workbooks. Convert legacy .xls to .xlsx first.');
 if(file.size>MAX_FILE)throw Error('Workbook is over 20 MB. Split or compress its pictures before importing.');
 const bytes=new Uint8Array(await file.arrayBuffer());
 const entries=unzipSync(bytes,{filter:item=>/^xl\/(media\/|drawings\/|worksheets\/_rels\/|_rels\/workbook\.xml\.rels$|workbook\.xml$)/.test(item.name)});
 const media=Object.keys(entries).filter(x=>/^xl\/media\/[^/]+\.(jpe?g|png|webp)$/i.test(x)).sort();
 if(media.length>MAX_IMAGES)throw Error('Workbook has more than 100 embedded pictures. Split it into smaller workbooks.');
 if(!media.length)return [];
 const mapping=new Map<string,{sheet?:string;row?:number}>();
 const workbook=xml(entries['xl/workbook.xml']);
 const workbookRels=xml(entries['xl/_rels/workbook.xml.rels']);
 const sheetPaths=new Map(elements(workbookRels,'Relationship').map(e=>[attribute(e,'Id'),normal('xl/workbook.xml',attribute(e,'Target'))]));
 for(const sheet of elements(workbook,'sheet')){
  const path=sheetPaths.get(attribute(sheet,'r:id'));if(!path)continue;
  const relPath=path.replace(/\/([^/]+)$/,'/_rels/$1.rels');
  const rels=xml(entries[relPath]);
  for(const drawingRel of elements(rels,'Relationship').filter(x=>attribute(x,'Type').endsWith('/drawing'))){
   const drawingPath=normal(path,attribute(drawingRel,'Target'));
   const draw=xml(entries[drawingPath]);
   const drawingRelations=xml(entries[drawingPath.replace(/\/([^/]+)$/,'/_rels/$1.rels')]);
   const images=new Map(elements(drawingRelations,'Relationship').filter(e=>attribute(e,'Type').endsWith('/image')).map(e=>[attribute(e,'Id'),normal(drawingPath,attribute(e,'Target'))]));
   for(const anchor of [...elements(draw,'oneCellAnchor'),...elements(draw,'twoCellAnchor')]){
    const blip=elements(anchor,'blip')[0];const image=images.get(blip?attribute(blip,'r:embed'):'');
    if(!image)continue;
    const origin=elements(anchor,'from')[0];
    const rowText=origin?elements(origin,'row')[0]?.textContent:undefined;
    mapping.set(image,{sheet:attribute(sheet,'name'),row:rowText===undefined?undefined:Number(rowText)+1});
   }
  }
 }
 return media.map(path=>{
  const data=entries[path];const name=path.split('/').pop()!;
  const ext=name.split('.').pop()?.toLowerCase();
  const type=ext==='png'?'image/png':ext==='webp'?'image/webp':'image/jpeg';
  const blob=new Blob([new Uint8Array(data)],{type});
  return {id:path,name,...mapping.get(path),blob,url:URL.createObjectURL(blob)};
 });
}
export function releaseWorkbookPhotos(photos:readonly WorkbookPhoto[]){for(const p of photos)URL.revokeObjectURL(p.url);}
