/**
 * Shared-master files may live in a PUBLIC GitHub Pages deployment, but contain
 * only AES-GCM ciphertext. The 256-bit key travels in the URL fragment, never
 * in the repository, HTTP request URL, GitHub Actions logs, or bundle.
 *
 * This is a read-only published snapshot, NOT automatic cross-device syncing.
 */
export const SHARED_MASTER_FILENAME = 'shared-masters.v1.json';
const FORMAT = 'holiday-display-blueprint-encrypted-master';
const AAD = 'holiday-display-blueprint:shared-master:v1';

export type EncryptedMasterEnvelope = {
 format: typeof FORMAT;
 version: 1;
 cipher: 'AES-256-GCM';
 compression: 'gzip';
 nonce: string;
 payload: string;
 createdAt?: string;
 sha256?: string;
};

export function readHostedMasterKey(hash:string):string|null {
 const match = /^#master=([A-Za-z0-9_-]{43})$/.exec(hash);
 return match ? match[1] : null;
}

export function validateHostedEnvelope(input:unknown):EncryptedMasterEnvelope {
 if(typeof input !== 'object'||input===null)throw Error('Invalid hosted master file');
 const e=input as Partial<EncryptedMasterEnvelope>;
 if(e.format!==FORMAT||e.version!==1||e.cipher!=='AES-256-GCM'||e.compression!=='gzip'||
   typeof e.nonce!=='string'||!/^[A-Za-z0-9_-]{16}$/.test(e.nonce)||
   typeof e.payload!=='string'||e.payload.length>8_000_000||
   !/^[A-Za-z0-9_-]+$/.test(e.payload))throw Error('Unsupported or damaged hosted master file');
 return e as EncryptedMasterEnvelope;
}

function decodeUrlBase64(value:string):Uint8Array {
 const normalized=value.replace(/-/g,'+').replace(/_/g,'/');
 const padded=normalized+'='.repeat((4-normalized.length%4)%4);
 const binary=atob(padded);
 return Uint8Array.from(binary,c=>c.charCodeAt(0));
}

export async function decryptHostedMasters(input:unknown,keyFragment:string):Promise<unknown> {
 const envelope=validateHostedEnvelope(input);
 if(!/^[A-Za-z0-9_-]{43}$/.test(keyFragment))throw Error('Invalid master share key');
 const keyBytes=decodeUrlBase64(keyFragment);
 if(keyBytes.byteLength!==32)throw Error('Expected a 256-bit share key');
 const nonce=decodeUrlBase64(envelope.nonce);
 if(nonce.byteLength!==12)throw Error('Invalid encryption nonce');
 if(!globalThis.crypto?.subtle)throw Error('This browser does not support secure Web Crypto');
 if(typeof DecompressionStream==='undefined')throw Error('This browser does not support gzip decompression. Update your browser.');
 const key=await crypto.subtle.importKey('raw',new Uint8Array(keyBytes),{name:'AES-GCM'},false,['decrypt']);
 let plain: ArrayBuffer;
 try {
  plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(nonce),
   additionalData:new TextEncoder().encode(AAD)},key,new Uint8Array(decodeUrlBase64(envelope.payload)));
 } catch {
  throw Error('This master link is invalid or the hosted file has changed');
 }
 const decompressed=new Blob([plain]).stream().pipeThrough(new DecompressionStream('gzip'));
 const text=await new Response(decompressed).text();
 return JSON.parse(text) as unknown;
}
