const PROJECT_URL=Deno.env.get('SUPABASE_URL')||'';
const SERVICE_KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const ORIGINS=new Set(['https://jacobmgoodnight.github.io','http://localhost:5173','http://127.0.0.1:5173']);
const HEX=/^[0-9a-f]{64}$/;
const TOKEN=/^[A-Za-z0-9_-]{43}$/;
function response(status:number,body:Record<string,unknown>,origin:string){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}});}
async function hexDigest(input:string){const bytes=new TextEncoder().encode(input);return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');}
function timingEqual(a:string,b:string){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
Deno.serve(async request=>{
 const origin=request.headers.get('origin')||'';
 if(!ORIGINS.has(origin))return new Response('Forbidden origin',{status:403});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'}});
 if(request.method!=='POST')return response(405,{error:'Method not allowed'},origin);
 if(!SERVICE_KEY||!PROJECT_URL)return response(503,{error:'Sync service unavailable'},origin);
 const limit=8_000_000;
 const length=Number(request.headers.get('content-length')||'0');
 if(length>limit)return response(413,{error:'Sync payload too large'},origin);
 let body:Record<string,unknown>;
 try{const raw=await request.text();if(raw.length>limit)return response(413,{error:'Sync payload too large'},origin);body=JSON.parse(raw);if(typeof body!=='object'||!body||Array.isArray(body))throw Error('Invalid JSON');}
 catch{return response(400,{error:'Invalid sync request'},origin);}
 const {vaultId,token,action}=body;
 if(typeof vaultId!=='string'||!HEX.test(vaultId)||typeof token!=='string'||!TOKEN.test(token)||!['pull','push'].includes(String(action)))return response(400,{error:'Invalid sync credentials'},origin);
 const endpoint=PROJECT_URL+'/rest/v1/hdb_sync_vaults';
 const headers={'apikey':SERVICE_KEY,'Authorization':'Bearer '+SERVICE_KEY,'Accept':'application/json','Content-Type':'application/json'};
 try{
  const query=endpoint+'?vault_id=eq.'+encodeURIComponent(vaultId)+'&select=access_hash,revision,encrypted_payload,updated_at';
  const get=await fetch(query,{headers,cache:'no-store'});
  if(!get.ok)return response(503,{error:'Storage read unavailable'},origin);
  const rows=await get.json();
  if(!Array.isArray(rows)||rows.length!==1)return response(404,{error:'Sync vault not found'},origin);
  const saved=rows[0];
  const hashed=await hexDigest(token);
  if(typeof saved.access_hash!=='string'||!timingEqual(hashed,saved.access_hash))return response(403,{error:'Invalid private sync link'},origin);
  if(action==='pull')return response(200,{revision:saved.revision,payload:saved.encrypted_payload,updatedAt:saved.updated_at},origin);
  const {expectedRevision,payload}=body;
  if(!Number.isSafeInteger(expectedRevision)||Number(expectedRevision)<1)return response(400,{error:'Missing cloud revision'},origin);
  if(!payload||typeof payload!=='object'||Array.isArray(payload)||payload.format!=='holiday-display-blueprint-encrypted-master'||payload.version!==1||payload.cipher!=='AES-256-GCM'||payload.compression!=='gzip'||typeof payload.nonce!=='string'||!(/^[A-Za-z0-9_-]{16}$/).test(payload.nonce)||typeof payload.payload!=='string'||!(/^[A-Za-z0-9_-]+$/).test(payload.payload)||payload.payload.length>6_500_000)return response(400,{error:'Invalid encrypted payload'},origin);
  // PostgreSQL compare-and-swap update; parallel clients may not overwrite one another.
  const updateUrl=endpoint+'?vault_id=eq.'+encodeURIComponent(vaultId)+'&revision=eq.'+encodeURIComponent(String(expectedRevision))+'&select=revision,updated_at';
  const update=await fetch(updateUrl,{method:'PATCH',headers:{...headers,'Prefer':'return=representation'},body:JSON.stringify({revision:expectedRevision+1,encrypted_payload:payload,updated_at:new Date().toISOString()})});
  if(!update.ok)return response(503,{error:'Storage write unavailable'},origin);
  const updated=await update.json();
  if(!Array.isArray(updated)||updated.length!==1)return response(409,{error:'Cloud revision changed; reload before saving'},origin);
  return response(200,{revision:updated[0].revision,updatedAt:updated[0].updated_at},origin);
 }catch{return response(503,{error:'Sync service temporarily unavailable'},origin);}
});
