/** Resize photos before saving them as private IndexedDB data; exports can include them. */
export async function readPhoto(file:File):Promise<string>{
 if(!file.type.startsWith('image/'))throw Error('Choose an image file');
 if(file.size>25_000_000)throw Error('Image exceeds 25 MB; please resize first');
 const source=await new Promise<string>((ok,fail)=>{const reader=new FileReader();reader.onload=()=>ok(String(reader.result));reader.onerror=()=>fail(Error('Image read failed'));reader.readAsDataURL(file);});
 const img=new Image();img.src=source;await img.decode();const scale=Math.min(1,1600/Math.max(img.width,img.height));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');ctx.drawImage(img,0,0,canvas.width,canvas.height);
 return canvas.toDataURL('image/jpeg',0.78);
}
