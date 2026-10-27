import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import * as validation from '../src/lib/shared/validation.ts';
import * as types from '../src/lib/tasks/types.ts';
const id='ae66172a-f871-43b3-a610-a838d8b7c001',space='ae66172a-f871-43b3-a610-a838d8b7a001';
function harness(path,responses,{signedIn=true}={}){
 const calls=[],invalidations=[];
 const supabase={from(table){calls.push(['from',table]);const q={};for(const method of ['select','eq','is','update','insert'])q[method]=(...args)=>{calls.push([method,...args]);return q;};for(const end of ['single','maybeSingle'])q[end]=async()=>{if(!responses.length)throw Error('Unexpected query');return responses.shift();};return q;}};
 const output=ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,loaded={exports:{}};
 new Function('require','exports',output)(name=>{
 if(name==='next/cache')return {revalidatePath:path=>invalidations.push(path)};
 if(name==='@/lib/auth/account')return {getAccountContext:async()=>signedIn?{supabase,userId:'owner-a'}:null};
 if(name==='@/lib/shared/validation')return validation;
 if(name==='@/lib/tasks/types')return types;
 throw Error(name);
 },loaded.exports);return {...loaded.exports,calls,invalidations};
}
const assign='../src/app/tasks/space-actions.ts',tasks='../src/app/tasks/actions.ts';
function form(extra={}){const data=new FormData();for(const[k,v]of Object.entries({id,space_id:space,previous_space_id:'',title:'A task',...extra}))data.set(k,v);return data;}
test('assign verifies target ownership and conditionally updates only the owned task',async()=>{
 const h=harness(assign,[{data:{id:space}},{data:{id}}]);assert.ok((await h.assignTaskSpace({},form())).message);
 for(const call of [['eq','user_id','owner-a'],['is','space_id',null]])assert.ok(h.calls.some(c=>JSON.stringify(c)===JSON.stringify(call)));assert.deepEqual(h.invalidations,['/','/tasks','/spaces','/search']);
});
test('unassign keeps the task and applies a previous-space condition',async()=>{
 const h=harness(assign,[{data:{id}}]);assert.ok((await h.assignTaskSpace({},form({space_id:'',previous_space_id:space}))).message);assert.ok(h.calls.some(c=>c[0]==='update'&&c[1].space_id===null));assert.ok(h.calls.some(c=>c[0]==='eq'&&c[1]==='space_id'&&c[2]===space));
});
test('foreign or unavailable spaces cannot trigger task writes',async()=>{
 const h=harness(assign,[{data:null}]);assert.ok((await h.assignTaskSpace({},form())).error);assert.equal(h.calls.some(c=>c[0]==='update'),false);
});
test('stale move conflicts retain the selected choice without invalidating successful data',async()=>{
 const h=harness(assign,[{data:{id:space}},{data:null},{data:{id,space_id:'elsewhere'}}]);assert.match((await h.assignTaskSpace({},form())).error,/moved elsewhere/);assert.deepEqual(h.invalidations,[]);
});
test('lost response retry can confirm the desired existing assignment',async()=>{
 const h=harness(assign,[{data:{id:space}},{data:null},{data:{id,space_id:space}}]);assert.ok((await h.assignTaskSpace({},form())).message);
});
test('invalid or signed-out moves make no writes',async()=>{
 const invalid=harness(assign,[]);assert.ok((await invalid.assignTaskSpace({},form({space_id:'bad'}))).error);assert.equal(invalid.calls.length,0);
 const out=harness(assign,[],{signedIn:false});assert.ok((await out.assignTaskSpace({},form())).error);assert.equal(out.calls.length,0);
});
test('space task creation passes owner and parent atomically in the insert',async()=>{
 const h=harness(tasks,[{data:{id}}]);assert.ok((await h.addTask({},form())).message);assert.ok(h.calls.some(c=>c[0]==='insert'&&c[1].space_id===space&&c[1].user_id==='owner-a'));
});
test('task create retry rejects a different space even with the same title',async()=>{
 const h=harness(tasks,[{error:{code:'23505'}},{data:{id,title:'A task',space_id:null}}]);assert.ok((await h.addTask({},form())).error);assert.deepEqual(h.invalidations,[]);
});
