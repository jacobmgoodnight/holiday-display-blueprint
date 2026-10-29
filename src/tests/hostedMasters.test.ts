import {describe,it,expect} from 'vitest';
import {readHostedMasterKey,validateHostedEnvelope} from '../lib/hostedMasters';
describe('encrypted GitHub-hosted masters',()=>{
 const key='A'.repeat(43);
 it('reads only a strict master URL fragment key',()=>{
  expect(readHostedMasterKey('#master='+key)).toBe(key);
  expect(readHostedMasterKey('#master='+key+'&foo=1')).toBeNull();
  expect(readHostedMasterKey('#master=short')).toBeNull();
  expect(readHostedMasterKey('#other='+key)).toBeNull();
  expect(readHostedMasterKey('')).toBeNull();
 });
 it('rejects plaintext and unsupported master payloads',()=>{
  expect(()=>validateHostedEnvelope({format:'holiday-display-blueprint',version:1,projects:[]})).toThrow();
  expect(()=>validateHostedEnvelope({format:'holiday-display-blueprint-encrypted-master',version:1,cipher:'none',compression:'gzip',nonce:'A'.repeat(16),payload:'AA'})).toThrow();
 });
 it('accepts a metadata-only valid encrypted envelope',()=>{
  const wrapped={format:'holiday-display-blueprint-encrypted-master',version:1,cipher:'AES-256-GCM',compression:'gzip',nonce:'A'.repeat(16),payload:'AAAA'};
  expect(validateHostedEnvelope(wrapped).payload).toBe('AAAA');
 });
});
