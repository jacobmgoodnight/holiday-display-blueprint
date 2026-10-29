import {describe, expect, it} from 'vitest';
import type {Component, Connection} from '../lib/model';
import {powerFlowLayout} from '../lib/flowLayout';

const component = (id: string, name: string, kind: Component['kind'] = 'cord'): Component =>
  ({id, name, kind, zone: 'Front porch', position: {x: 999, y: 888},
    outputs: kind === 'outlet' ? 2 : 1});
const nodes = [
  component('o01','O01 front outlet','outlet'),
  component('k','Kasa','smart-plug'),
  component('split','Splitter','splitter'),
  component('a','Pumpkin arch','decoration'),
  component('b','Spotlight','spotlight'),
  component('o02','O02 garage outlet','outlet'),
  component('c','Scarecrow','decoration'),
  component('loose','Unconnected cord')
];
const edges: Connection[] = [
  {id:'1',source:'o01',sourcePort:0,target:'k'},
  {id:'2',source:'k',sourcePort:0,target:'split'},
  {id:'3',source:'split',sourcePort:1,target:'b'},
  {id:'4',source:'split',sourcePort:0,target:'a'},
  {id:'5',source:'o02',sourcePort:0,target:'c'}
];
describe('read-only power flow layout', () => {
  it('lays out each component exactly once, including disconnected equipment', () => {
    const positions = powerFlowLayout(nodes, edges);
    expect(positions.size).toBe(nodes.length);
    expect([...positions.values()].every(p => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
  });
  it('places every child to the right of its upstream source', () => {
    const positions = powerFlowLayout(nodes, edges);
    for(const edge of edges) expect(positions.get(edge.target)!.x).toBeGreaterThan(positions.get(edge.source)!.x);
  });
  it('separates siblings and independent circuits', () => {
    const positions = powerFlowLayout(nodes, edges);
    expect(positions.get('a')!.y).not.toBe(positions.get('b')!.y);
    expect(positions.get('o01')!.y).toBeLessThan(positions.get('o02')!.y);
  });
  it('follows output port order despite incoming edge order', () => {
    const positions = powerFlowLayout(nodes, edges);
    expect(positions.get('a')!.y).toBeLessThan(positions.get('b')!.y);
  });
  it('is deterministic and does not overwrite imported saved positions', () => {
    const original = JSON.stringify({nodes,edges});
    expect([...powerFlowLayout(nodes,edges)]).toEqual([...powerFlowLayout([...nodes].reverse(),[...edges].reverse())]);
    expect(JSON.stringify({nodes,edges})).toBe(original);
    expect(nodes[0].position).toEqual({x:999,y:888});
  });
  it('does not recurse forever on a malformed cycle', () => {
    const cycle = [{id:'x',source:'a',sourcePort:0,target:'b'},{id:'y',source:'b',sourcePort:0,target:'a'}];
    expect(powerFlowLayout([nodes[3],nodes[4]],cycle).size).toBe(2);
  });
});
