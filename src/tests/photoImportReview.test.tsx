import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect,vi,beforeEach} from 'vitest';
import {PhotoImportReview} from '../components/PhotoImportReview';
import {exampleProjects} from '../fixtures/examples';
import {extractWorkbookPhotos,releaseWorkbookPhotos} from '../lib/workbookPhotos';
import {readPhoto} from '../lib/photos';

vi.mock('../lib/workbookPhotos',()=>({extractWorkbookPhotos:vi.fn(),releaseWorkbookPhotos:vi.fn()}));
vi.mock('../lib/photos',()=>({readPhoto:vi.fn()}));

function deferred<T>(){
 let resolve!:(value:T)=>void;
 const promise=new Promise<T>(r=>{resolve=r;});
 return {promise,resolve};
}

describe('workbook photo review lifecycle',()=>{
 beforeEach(()=>vi.resetAllMocks());
 it('releases previews if the review unmounts while a workbook is being read',async()=>{
  const pending=deferred<Awaited<ReturnType<typeof extractWorkbookPhotos>>>();
  vi.mocked(extractWorkbookPhotos).mockReturnValue(pending.promise);
  const photos=[{id:'one',name:'one.png',blob:new Blob(['image'],{type:'image/png'}),url:'blob:one'}];
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  const close=vi.fn();
  await act(async()=>root.render(<PhotoImportReview project={exampleProjects()[0]} onApply={()=>{}} onClose={close}/>));
  const input=host.querySelector('input[type=file]') as HTMLInputElement;
  Object.defineProperty(input,'files',{configurable:true,value:[new File(['workbook'],'example.xlsx')]});
  await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));
  expect((host.querySelector('[aria-label="Close photo import"]') as HTMLButtonElement).disabled).toBe(true);
  await act(async()=>root.unmount());
  await act(async()=>pending.resolve(photos));
  expect(releaseWorkbookPhotos).toHaveBeenCalledWith(photos);
  expect(close).not.toHaveBeenCalled();
  host.remove();
 });
 it('does not apply a photo after the review unmounts during compression',async()=>{
  const photo={id:'one',name:'one.png',blob:new Blob(['image'],{type:'image/png'}),url:'blob:one'};
  vi.mocked(extractWorkbookPhotos).mockResolvedValue([photo]);
  const pending=deferred<string>();vi.mocked(readPhoto).mockReturnValue(pending.promise);
  const project=exampleProjects()[0];const applied=vi.fn();const close=vi.fn();
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  await act(async()=>root.render(<PhotoImportReview project={project} onApply={applied} onClose={close}/>));
  const input=host.querySelector('input[type=file]') as HTMLInputElement;
  Object.defineProperty(input,'files',{configurable:true,value:[new File(['workbook'],'example.xlsx')]});
  await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));
  const select=host.querySelector('[aria-label="Assign one.png to component"]') as HTMLSelectElement;
  await act(async()=>{select.value=project.nodes[0].id;select.dispatchEvent(new Event('change',{bubbles:true}));});
  await act(async()=>(host.querySelector('.photo-import-confirm') as HTMLButtonElement).click());
  expect((host.querySelector('[aria-label="Close photo import"]') as HTMLButtonElement).disabled).toBe(true);
  await act(async()=>root.unmount());
  await act(async()=>pending.resolve('data:image/png;base64,AAAA'));
  expect(applied).not.toHaveBeenCalled();expect(close).not.toHaveBeenCalled();
  host.remove();
 });
});
