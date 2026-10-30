import {describe,it,expect,vi} from 'vitest';
import {zipSync,strToU8} from 'fflate';
import {extractWorkbookPhotos,releaseWorkbookPhotos} from '../lib/workbookPhotos';

describe('private workbook picture review',()=>{
 it('lists embedded photos and their worksheet row without silently assigning equipment',async()=>{
  const files={
   'xl/workbook.xml':strToU8('<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Porch Photos" sheetId="1" r:id="rSheet"/></sheets></workbook>'),
   'xl/_rels/workbook.xml.rels':strToU8('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rSheet" Target="worksheets/sheet1.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"/></Relationships>'),
   'xl/worksheets/_rels/sheet1.xml.rels':strToU8('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rDraw" Target="../drawings/drawing1.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing"/></Relationships>'),
   'xl/drawings/drawing1.xml':strToU8('<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><xdr:oneCellAnchor><xdr:from><xdr:col>1</xdr:col><xdr:row>8</xdr:row></xdr:from><xdr:pic><xdr:blipFill><a:blip r:embed="rImage"/></xdr:blipFill></xdr:pic></xdr:oneCellAnchor></xdr:wsDr>'),
   'xl/drawings/_rels/drawing1.xml.rels':strToU8('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rImage" Target="/xl/media/image1.jpg" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"/></Relationships>'),
   'xl/media/image1.jpg':new Uint8Array([255,216,255,217])
  };
  const bytes=zipSync(files);
  const url=vi.fn(()=>'blob:photo1');Object.defineProperty(URL,'createObjectURL',{configurable:true,value:url});
  const revoke=vi.fn();Object.defineProperty(URL,'revokeObjectURL',{configurable:true,value:revoke});
  const file={name:'Halloween.xlsx',size:bytes.byteLength,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)} as File;
  const photos=await extractWorkbookPhotos(file);
  expect(photos).toHaveLength(1);
  expect(photos[0]).toMatchObject({name:'image1.jpg',sheet:'Porch Photos',row:9,url:'blob:photo1'});
  expect(photos[0].blob.type).toBe('image/jpeg');
  expect('componentId' in photos[0]).toBe(false);
  releaseWorkbookPhotos(photos);expect(revoke).toHaveBeenCalledWith('blob:photo1');
  Reflect.deleteProperty(URL,'createObjectURL');Reflect.deleteProperty(URL,'revokeObjectURL');
 });
 it('refuses legacy xls and non-workbook formats without touching saved projects',async()=>{
  await expect(extractWorkbookPhotos({name:'legacy.xls',size:100} as File)).rejects.toThrow(/xlsx/);
 });
});
