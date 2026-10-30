import {describe,expect,it} from 'vitest';
import {exampleProjects} from '../fixtures/examples';
import {addComponentPhoto,removeComponentPhoto,promoteComponentPhoto,photoCount,MAX_COMPONENT_PHOTOS} from '../lib/componentPhotos';
const img='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==';
describe('private equipment photo gallery',()=>{
 const p=exampleProjects()[0],id=p.nodes[0].id;
 it('preserves legacy primary while adding classified views',()=>{
  const before={...p,nodes:p.nodes.map(n=>n.id===id?{...n,photo:img}:n)};
  const after=addComponentPhoto(before,id,img,'connector');
  const node=after.nodes.find(n=>n.id===id)!;
  expect(node.photo).toBe(img);
  expect(node.photoGallery?.[0].role).toBe('connector');
  expect(photoCount(node.photo,node.photoGallery)).toBe(2);
  expect(before.nodes[0].photoGallery).toBeUndefined();
 });
 it('promotes and removes photos safely without rewriting other records',()=>{
  const next=addComponentPhoto(addComponentPhoto(p,id,img,'installed'),id,img,'storage');
  const photoId=next.nodes.find(n=>n.id===id)!.photoGallery![0].id;
  const promoted=promoteComponentPhoto(next,id,photoId);
  expect(promoted.nodes.find(n=>n.id===id)?.photoGallery).toHaveLength(1);
  const removed=removeComponentPhoto(promoted,id,'primary');
  expect(removed.nodes.find(n=>n.id===id)?.photo).toBe(img);
  expect(removed.nodes.length).toBe(p.nodes.length);
 });
 it('rejects unsafe URLs and caps gallery size',()=>{
  expect(()=>addComponentPhoto(p,id,'http://example.com/test.jpg')).toThrow(/compressed/);
  let next=p;
  for(let i=0;i<MAX_COMPONENT_PHOTOS;i++)next=addComponentPhoto(next,id,img,'detail');
  expect(()=>addComponentPhoto(next,id,img,'detail')).toThrow(/Maximum/);
 });
});
