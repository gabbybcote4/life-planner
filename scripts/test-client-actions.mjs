import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { createRequestId } from '../src/lib/shared/request-id.ts';
const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(fs.readFileSync(new URL('../src/lib/shared/client-actions.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const loaded = { exports: {} };
new Function('require', 'exports', compiled)(require, loaded.exports);
const { runAction, UNCONFIRMED_SAVE } = loaded.exports;
const { redirect, notFound } = require('next/navigation');
test('confirmed and expected error results pass through unchanged', async () => {
  for (const result of [{message:'Saved'}, {error:'Conflict'}]) assert.equal(await runAction(async()=>result, UNCONFIRMED_SAVE), result);
});
test('transport failures return an honest error and do not retry automatically', async () => {
  let calls=0;
  const result=await runAction(async()=>{calls++;throw new TypeError('Failed to fetch');}, UNCONFIRMED_SAVE);
  assert.equal(result, UNCONFIRMED_SAVE); assert.equal(calls,1); assert.ok(result.error);
});
test('synchronous preparation failures are handled', async () => {
  assert.equal(await runAction(()=>{throw new Error('Unavailable');}, UNCONFIRMED_SAVE), UNCONFIRMED_SAVE);
});
test('Next redirects and not-found control flow still propagate', async () => {
  for (const operation of [()=>redirect('/login'), ()=>notFound()]) {
    let original; try { operation(); } catch(error) { original=error; }
    await assert.rejects(runAction(async()=>{throw original;}, UNCONFIRMED_SAVE), error=>error===original);
  }
});
test('request ids use native UUID generation when available', () => {
  assert.equal(createRequestId({randomUUID:()=> 'native-id'}), 'native-id');
});
test('local HTTP fallback produces version 4 UUIDs using secure random bytes', () => {
  let calls=0;
  const id=createRequestId({getRandomValues:bytes=>{calls++;bytes.fill(255);return bytes;}});
  assert.equal(id,'ffffffff-ffff-4fff-bfff-ffffffffffff'); assert.equal(calls,1);
});
test('request ids fail explicitly when secure random values are unavailable', () => {
  assert.throws(()=>createRequestId({}), /Secure random/);
});
