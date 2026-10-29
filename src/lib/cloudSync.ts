import type {Project} from './model';
import {createBackup,parseBackup} from './storage';
import {decryptHostedMasters,type EncryptedMasterEnvelope} from './hostedMasters';

export const SYNC_ENDPOINT='https://rwqclcpmtuebxndadkxv.supabase.co/functions/v1/holiday-blueprint-sync';
const STORAGE_KEY='hdb-private-sync-master-key-v1';
const BASELINE_PREFIX='hdb-sync-baseline-v1:';
const AAD='holiday-display-blueprint:shared-master:v1';
const FORMAT='holiday-display-blueprint-encrypted-master';
const textEncoder=new TextEncoder();

export type CloudCredentials={vaultId:string;token:string;key:string};
export type CloudSnapshot={revision:number;projects:Project[];updatedAt:string};
export type SyncOutcome={projects:Project[];conflicts:string[];upload:boolean;download:boolean;hashes:Record<string,string>};

const decode=(text:string):Uint8Array=>{
 const normalized=text.replace(/-/g,'+').replace(/_/g,'/');
 const binary=atob(normalized+'='.repeat((4-normalized.length%4)%4));
 return Uint8Array.from(binary,c=>c.charCodeAt(0));
};
const encode=(bytes:Uint8Array):string=>{
 let str='';
 for(let i=0;i<bytes.length;i+=16384)str+=String.fromCharCode(...bytes.subarray(i,i+16384));
 return btoa(str).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
};
const hex=(bytes:Uint8Array)=>Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
async function digest(value:Uint8Array):Promise<Uint8Array>{
 return new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(value)));
}
async function derived(keyBytes:Uint8Array,prefix:string):Promise<Uint8Array>{
 const prefixBytes=textEncoder.encode(prefix);
 const all=new Uint8Array(prefixBytes.length+keyBytes.length);
 all.set(prefixBytes);all.set(keyBytes,prefixBytes.length);
 return digest(all);
}
export async function syncCredentials(key:string):Promise<CloudCredentials>{
 if(!/^[A-Za-z0-9_-]{43}$/.test(key))throw Error('Invalid private sync link');
 const keyBytes=decode(key);
 if(keyBytes.length!==32)throw Error('Expected a 256-bit private key');
 return {key,vaultId:hex(await derived(keyBytes,'hdb-vault-id-v1:')),token:encode(await derived(keyBytes,'hdb-sync-auth-v1:'))};
}
export function getDeviceSyncKey():string|null{
 try{
  const fragment=window.location.hash.match(/^#master=([A-Za-z0-9_-]{43})$/);
  if(fragment){window.localStorage.setItem(STORAGE_KEY,fragment[1]);window.history.replaceState(window.history.state,'',window.location.pathname+window.location.search);return fragment[1];}
  const saved=window.localStorage.getItem(STORAGE_KEY);
  return saved&&/^[A-Za-z0-9_-]{43}$/.test(saved)?saved:null;
 }catch{return null;}
}
export function forgetDeviceSyncKey():void{try{window.localStorage.removeItem(STORAGE_KEY);}catch{/* storage disabled */}}
export function readBaseline(vaultId:string):Record<string,string>{
 try{
  const raw=window.localStorage.getItem(BASELINE_PREFIX+vaultId);
  const obj=raw?JSON.parse(raw):{};
  if(!obj||typeof obj!=='object'||Array.isArray(obj))return {};
  return Object.fromEntries(Object.entries(obj).filter((entry):entry is [string,string]=>!!entry[0]&&typeof entry[1]==='string'&&/^[0-9a-f]{64}$/.test(entry[1])));
 }catch{return {};}
}
export function saveBaseline(vaultId:string,baseline:Record<string,string>):void{
 try{window.localStorage.setItem(BASELINE_PREFIX+vaultId,JSON.stringify(baseline));}
 catch{/* offline browser without localStorage will conservatively flag conflicts later */}
}
/** Ignore save timestamps: content changes, not background persistence, trigger sync. */
export async function projectDigest(project:Project):Promise<string>{
 const {updatedAt: _timestamp, ...contents}=project;
 return hex(await digest(textEncoder.encode(JSON.stringify(contents))));
}
export async function hashProjects(projects:readonly Project[]):Promise<Record<string,string>>{
 const result:Record<string,string>={};
 for(const p of projects)if(!p.example)result[p.id]=await projectDigest(p);
 return result;
}
export function planMerge(
 local:Project[],remote:Project[],base:Record<string,string>,
 localHashes:Record<string,string>,remoteHashes:Record<string,string>,
 prefer?:'local'|'remote'
):SyncOutcome{
 const localReal=new Map(local.filter(p=>!p.example).map(p=>[p.id,p]));
 const remoteReal=new Map(remote.filter(p=>!p.example).map(p=>[p.id,p]));
 const ids=new Set([...localReal.keys(),...remoteReal.keys()]);
 const chosen:Project[]=[];
 const conflicts:string[]=[];
 let upload=false,download=false;
 for(const id of ids){
  const l=localReal.get(id),r=remoteReal.get(id);
  if(!l&&r){chosen.push(r);download=true;continue;}
  if(l&&!r){chosen.push(l);upload=true;continue;}
  if(!l||!r)continue;
  const lh=localHashes[id],rh=remoteHashes[id];
  if(lh===rh){chosen.push(l);continue;}
  if(prefer==='local'){chosen.push(l);upload=true;continue;}
  if(prefer==='remote'){chosen.push(r);download=true;continue;}
  const baseline=base[id];
  if(baseline===lh){chosen.push(r);download=true;}
  else if(baseline===rh){chosen.push(l);upload=true;}
  else{conflicts.push(id);chosen.push(l);}
 }
 return {projects:chosen,conflicts,upload,download,hashes:{}};
}
async function request(action:'pull'|'push',creds:CloudCredentials,other:Record<string,unknown>={}):Promise<Record<string,unknown>>{
 const res=await fetch(SYNC_ENDPOINT,{method:'POST',mode:'cors',cache:'no-store',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({action,vaultId:creds.vaultId,token:creds.token,...other})});
 let data:Record<string,unknown>;
 try{data=await res.json() as Record<string,unknown>;}catch{throw Error('Sync service returned an invalid response');}
 if(!res.ok){const msg=typeof data.error==='string'?data.error:'Sync service error';throw Object.assign(Error(msg),{status:res.status});}
 return data;
}
export async function pullCloud(creds:CloudCredentials):Promise<CloudSnapshot>{
 const obj=await request('pull',creds);
 if(!Number.isSafeInteger(obj.revision)||typeof obj.payload!=='object'||!obj.payload)throw Error('Damaged cloud snapshot');
 const decoded=await decryptHostedMasters(obj.payload,creds.key);
 return {revision:Number(obj.revision),projects:parseBackup(decoded),updatedAt:String(obj.updatedAt||'')};
}
export async function encryptProjects(projects:Project[],keyFragment:string):Promise<EncryptedMasterEnvelope>{
 if(!crypto.subtle||typeof CompressionStream==='undefined')throw Error('This browser needs secure Web Crypto and gzip support');
 const keyBytes=decode(keyFragment),iv=crypto.getRandomValues(new Uint8Array(12));
 const key=await crypto.subtle.importKey('raw',new Uint8Array(keyBytes),{name:'AES-GCM'},false,['encrypt']);
 const json=JSON.stringify(createBackup(projects.filter(p=>!p.example)));
 const compressed=await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
 const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:new Uint8Array(iv),additionalData:textEncoder.encode(AAD)},key,compressed));
 return {format:FORMAT,version:1,cipher:'AES-256-GCM',compression:'gzip',nonce:encode(iv),payload:encode(encrypted)};
}
export async function pushCloud(creds:CloudCredentials,revision:number,projects:Project[]):Promise<number>{
 const envelope=await encryptProjects(projects,creds.key);
 const result=await request('push',creds,{expectedRevision:revision,payload:envelope});
 if(!Number.isSafeInteger(result.revision))throw Error('Invalid cloud acknowledgement');
 return Number(result.revision);
}
