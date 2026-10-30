/* Offline app shell cache only: NEVER cache private project sync data, JSON backups or cross-origin requests. */
const VERSION='hdb-appshell-1';
const ROOT=new URL(self.registration.scope);
const APP=ROOT.pathname;
const IS_CORE=(url)=>url.origin===self.location.origin&&(url.pathname===APP||url.pathname.startsWith(APP+'assets/')||url.pathname===APP+'manifest.webmanifest'||url.pathname===APP+'icon.svg');
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(VERSION);
  const response=await fetch(APP,{cache:'reload'});
  if(!response.ok)throw new Error('App shell unavailable');
  await cache.put(APP,response.clone());
  const html=await response.text();
  const paths=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>new URL(m[1],self.location.origin)).filter(IS_CORE);
  await Promise.allSettled([...paths,new URL(APP+'manifest.webmanifest',self.location.origin),new URL(APP+'icon.svg',self.location.origin)].map(async url=>{const r=await fetch(url,{cache:'reload'});if(r.ok)await cache.put(url,r)}));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith('hdb-appshell-')&&key!==VERSION)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(!IS_CORE(url))return;
 if(request.mode==='navigate'){
  event.respondWith((async()=>{
   try{const res=await fetch(request);if(res.ok){const cache=await caches.open(VERSION);await cache.put(APP,res.clone())}return res}
   catch{const cached=await caches.match(APP);return cached||Response.error()}
  })());return;
 }
 event.respondWith((async()=>{
  const cached=await caches.match(request);
  if(cached)return cached;
  try{const res=await fetch(request);if(res.ok){const cache=await caches.open(VERSION);await cache.put(request,res.clone())}return res}
  catch{return Response.error()}
 })());
});
