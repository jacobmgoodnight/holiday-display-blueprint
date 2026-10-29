import type {Project} from './model';
import {saveProject} from './storage';

export type SavePhase='saved'|'saving'|'failed';
export type SaveState={phase:SavePhase;message?:string};
type Writer=(project:Project)=>Promise<void>;
/** Serialized per-project persistence prevents a slow old write overwriting a newer edit. */
export class ProjectSaveQueue{
 private pending=new Map<string,Project>();
 private active=new Map<string,Promise<void>>();
 private timers=new Map<string,ReturnType<typeof setTimeout>>();
 private retries=new Map<string,number>();
 private states=new Map<string,SaveState>();
 private listeners=new Set<()=>void>();
 constructor(private writer:Writer=saveProject,private delayMs=450){}
 subscribe(fn:()=>void){this.listeners.add(fn);return()=>{this.listeners.delete(fn);};}
 getState(id:string):SaveState{return this.states.get(id)||{phase:'saved'};}
 private state(id:string,next:SaveState){this.states.set(id,next);for(const fn of this.listeners)fn();}
 private schedule(id:string,delay:number){
  const t=this.timers.get(id);if(t)clearTimeout(t);
  this.timers.set(id,setTimeout(()=>{this.timers.delete(id);void this.flush(id);},delay));
 }
 queue(project:Project){
  this.pending.set(project.id,project);this.retries.delete(project.id);
  this.state(project.id,{phase:'saving'});
  this.schedule(project.id,this.delayMs);
 }
 async flush(id:string):Promise<void>{
  const t=this.timers.get(id);if(t){clearTimeout(t);this.timers.delete(id);}
  const existing=this.active.get(id);if(existing){await existing;if(this.pending.has(id))return this.flush(id);return;}
  if(!this.pending.has(id))return;
  const job=(async()=>{
   while(this.pending.has(id)){
    const latest=this.pending.get(id)!;this.pending.delete(id);
    try{
     await this.writer(latest);
     this.retries.delete(id);
     if(!this.pending.has(id))this.state(id,{phase:'saved'});
    }catch(e){
     // Keep the newest edit, not the failed old snapshot.
     if(!this.pending.has(id))this.pending.set(id,latest);
     const times=(this.retries.get(id)||0)+1;this.retries.set(id,times);
     this.state(id,{phase:'failed',message:e instanceof Error?e.message:String(e)});
     this.schedule(id,Math.min(30000,1000*2**Math.min(5,times)));
     break;
    }
   }
  })();
  this.active.set(id,job);
  try{await job;}finally{if(this.active.get(id)===job)this.active.delete(id);}
 }
 async flushAll():Promise<void>{
  const ids=new Set([...this.pending.keys(),...this.active.keys()]);
  await Promise.all([...ids].map(id=>this.flush(id)));
 }
 /** Prevent a delayed write from resurrecting a deliberately deleted project. */
 async discard(id:string):Promise<void>{
  const t=this.timers.get(id);if(t)clearTimeout(t);this.timers.delete(id);
  this.pending.delete(id);this.retries.delete(id);
  await this.active.get(id);
  this.pending.delete(id);this.states.delete(id);
  for(const fn of this.listeners)fn();
 }
 hasPending(id:string){return this.pending.has(id)||this.active.has(id);}
}
