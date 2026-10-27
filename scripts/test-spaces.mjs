import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {parseSpaceTitle} from '../src/lib/spaces/types.ts';
import * as appearance from '../src/lib/spaces/appearance.ts';
import * as notes from '../src/lib/notes/types.ts';
import * as validation from '../src/lib/shared/validation.ts';
const id='cf22172a-f871-43b3-a610-a838d8b7f001', parent='cf22172a-f871-43b3-a610-a838d8b7a001';
function harness(path,responses,account=true){
 const calls=[], invalidations=[];
 const supabase={from(table){const chain={};calls.push(['from',table]);for(const method of ['select','insert','update','eq'])chain[method]=(...args)=>{calls.push([method,...args]);return chain;};for(const method of ['single','maybeSingle'])chain[method]=async()=>{if(!responses.length)throw Error('Unexpected database call');return responses.shift();};return chain;}};
 const output=ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const loaded={exports:{}};
 new Function('require','exports',output)(name=>{
  if(name==='next/cache')return {revalidatePath:path=>invalidations.push(path)};
  if(name.endsWith('/auth/account'))return {getAccountContext:async()=>account?{supabase,userId:'owner-a'}:null};
  if(name.endsWith('/notes/types'))return notes;
  if(name.endsWith('/shared/validation'))return validation;
  if(name.endsWith('/spaces/appearance'))return appearance;
  if(name.endsWith('/spaces/types'))return {parseSpaceTitle};
  throw Error(name);
 },loaded.exports);
 return {...loaded.exports,calls,invalidations};
}
function data(extra={}){const f=new FormData();for(const [key,value] of Object.entries({id,space_id:parent,mode:'edit',revision:'2',title:'A page',body:'Line one\nLine two',...extra}))f.set(key,value);return f;}
test('space titles trim, reject empty/nontext and count unicode code points',()=>{
 assert.equal(parseSpaceTitle(' Home '),'Home');for(const v of [null,'  ','x'.repeat(101)])assert.equal(parseSpaceTitle(v),null);assert.equal(parseSpaceTitle('🌿'.repeat(100)),'🌿'.repeat(100));
});
test('page save refuses an unavailable parent before writing',async()=>{
 const h=harness('../src/app/spaces/page-actions.ts',[{data:null,error:null}]);assert.ok((await h.saveSpacePage({},data())).error);assert.equal(h.calls.some(c=>c[0]==='update'),false);
});
test('page edits filter owner, parent, id and revision',async()=>{
 const h=harness('../src/app/spaces/page-actions.ts',[{data:{id:parent}},{data:{id,revision:3}}]);const result=await h.saveSpacePage({},data());assert.equal(result.revision,3);
 for(const filter of [['eq','user_id','owner-a'],['eq','space_id',parent],['eq','id',id],['eq','revision',2]])assert.ok(h.calls.some(c=>JSON.stringify(c)===JSON.stringify(filter)));
 assert.deepEqual(h.invalidations,['/spaces','/notes']);
});
test('stale page save reports conflict without success',async()=>{
 const h=harness('../src/app/spaces/page-actions.ts',[{data:{id:parent}},{data:null,error:null}]);assert.match((await h.saveSpacePage({},data())).error,/changed elsewhere/);assert.deepEqual(h.invalidations,[]);
});
test('lost create response can confirm matching page without another insert',async()=>{
 const h=harness('../src/app/spaces/page-actions.ts',[{data:{id:parent}},{error:{code:'23505'}},{data:{id,title:'A page',body:'Line one\nLine two',revision:1}}]);assert.equal((await h.saveSpacePage({},data({mode:'create'}))).id,id);assert.equal(h.calls.filter(c=>c[0]==='insert').length,1);assert.ok(h.calls.filter(c=>c[0]==='from').every(c=>['spaces','space_pages'].includes(c[1])));
});
test('space rename rejects stale writes and validates session independently',async()=>{
 const stale=harness('../src/app/spaces/actions.ts',[{data:null,error:null}]);assert.match((await stale.saveSpace({},data())).error,/changed elsewhere/);
 const signedOut=harness('../src/app/spaces/actions.ts',[],false);assert.match((await signedOut.saveSpace({},data())).error,/session expired/);assert.equal(signedOut.calls.length,0);
});
test('invalid page inputs do not access the database',async()=>{
 const h=harness('../src/app/spaces/page-actions.ts',[]);for(const extra of [{space_id:'invalid'},{title:' '},{body:'x'.repeat(20001)},{revision:'0'}])assert.ok((await h.saveSpacePage({},data(extra))).error);assert.equal(h.calls.length,0);
});
