import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import * as search from '../src/lib/search/types.ts';
import * as validation from '../src/lib/shared/validation.ts';
const id='ac44172a-f871-43b3-a610-a838d8b7c001';
const item={kind:'task',id,title:'A task',space_id:null,space_title:null,event_date:null,completed:false};
function load(path,dependencies){
 const source=ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const loaded={exports:{}};new Function('require','exports',source)(name=>{if(name in dependencies)return dependencies[name];throw Error(name);},loaded.exports);return loaded.exports;
}
function actionHarness({signedIn=true,response={data:[],error:null},offline=false}={}) {
 const calls=[];
 const actions=load('../src/app/search/actions.ts',{
 '@/lib/auth/account':{getAccountContext:async()=>signedIn?{userId:'owner-a',supabase:{rpc:async(name,params)=>{calls.push({name,params});if(offline)throw Error('network');return response;}}}:null},
 '@/lib/search/types':search,
 });return {...actions,calls};
}
function form(values){const f=new FormData();for(const [k,v]of Object.entries({query:'needle',kind:'all',offset:'0',...values}))f.set(k,v);return f;}
test('search validates categories and uses Unicode character limits',()=>{
 for(const kind of search.SEARCH_KINDS)assert.equal(search.parseSearch('  Home  ',kind,'0').query,'Home');
 assert.equal(search.parseSearch('🌿'.repeat(100),'all','0').query.length,200);
 for(const args of [[null,'all','0'],['x'.repeat(101),'all','0'],['ok','foreign','0']])assert.equal(search.parseSearch(...args),null);
});
test('search treats special query characters as literal text',()=>{
 const query="%' OR true -- _";assert.equal(search.parseSearch(query,'all','0').query,query);
});
test('pagination rejects malformed offsets and bounds valid values',()=>{
 for(const v of ['-1','1e6','Infinity',null,'0 OR 1=1'])assert.equal(search.parseSearch('x','all',v).offset,0);
 assert.equal(search.parseSearch('x','all','999999').offset,999980);
 assert.equal(search.parseSearch('x','all','20').offset,20);
});
test('all result kinds open the correct planner destination',()=>{
 assert.equal(search.searchHref(item),'/tasks?task='+id);
 assert.equal(search.searchHref({...item,kind:'event',event_date:'2026-12-31'}),'/calendar?date=2026-12-31');
 assert.equal(search.searchHref({...item,kind:'note'}),'/notes?note='+id);
 assert.equal(search.searchHref({...item,kind:'space'}),'/spaces?space='+id);
 assert.equal(search.searchHref({...item,kind:'page',space_id:'parent'}),'/spaces?space=parent&entry='+id);
});
test('search checks identity on every call, including blank searches',async()=>{
 const h=actionHarness({signedIn:false});for(const query of ['needle',''])assert.ok((await h.searchPlanner(search.EMPTY_SEARCH,form({query}))).error);assert.equal(h.calls.length,0);
});
test('blank and invalid searches do not invoke database search',async()=>{
 const h=actionHarness();const blank=await h.searchPlanner(search.EMPTY_SEARCH,form({query:'  '}));assert.equal(blank.searched,false);
 assert.ok((await h.searchPlanner(search.EMPTY_SEARCH,form({kind:'bad'}))).error);assert.equal(h.calls.length,0);
});
test('search sends only literal query, category and offset, never a caller owner',async()=>{
 const h=actionHarness();await h.searchPlanner(search.EMPTY_SEARCH,form({query:'  100%_  ',kind:'note',offset:'20',user_id:'foreign'}));assert.deepEqual(h.calls,[{name:'planner_search',params:{p_query:'100%_',p_kind:'note',p_offset:20}}]);
});
test('lookahead pagination returns 20 items and exposes more results honestly',async()=>{
 const h=actionHarness({response:{data:Array.from({length:21},()=>item),error:null}});const r=await h.searchPlanner(search.EMPTY_SEARCH,form({offset:'20'}));assert.equal(r.items.length,20);assert.equal(r.more,true);assert.equal(r.offset,20);assert.equal(r.searched,true);
});
test('successful zero matches differ from an unsearched or failed state',async()=>{
 const r=await actionHarness().searchPlanner(search.EMPTY_SEARCH,form({}));assert.equal(r.searched,true);assert.equal(r.error,undefined);assert.deepEqual(r.items,[]);
});
test('database and network failures never report successful empty results',async()=>{
 for(const options of [{response:{data:null,error:{message:'missing migration'}}},{offline:true}]){
 const r=await actionHarness(options).searchPlanner(search.EMPTY_SEARCH,form({}));assert.ok(r.error);assert.equal(r.searched,false);assert.deepEqual(r.items,[]);
 }
});
function selectedHarness({result={data:{...item,created_at:'2026-01-01'},error:null},offline=false}={}) {
 const calls=[];
 const client={from(table){calls.push(['from',table]);return {select(columns){calls.push(['select',columns]);return this;},eq(k,v){calls.push(['eq',k,v]);return this;},async maybeSingle(){if(offline)throw Error('network');return result;}};}};
 const {loadSelectedTask}=load('../src/lib/tasks/selected-task.ts',{'@/lib/shared/validation':validation});
 return {calls,read:value=>loadSelectedTask(client,'owner-a',value)};
}
test('selected task fetches by exact identity and owner, independent of list limits',async()=>{
 const h=selectedHarness();const r=await h.read(id);assert.equal(r.task.id,id);assert.equal(r.error,false);assert.ok(h.calls.some(c=>JSON.stringify(c)===JSON.stringify(['eq','id',id])));assert.ok(h.calls.some(c=>JSON.stringify(c)===JSON.stringify(['eq','user_id','owner-a'])));
});
test('invalid task identifiers never access data',async()=>{
 const h=selectedHarness();for(const value of ['bad',[id],null])assert.equal((await h.read(value)).error,true);assert.equal(h.calls.length,0);
});
test('missing/foreign tasks and failed task loads produce no successful task',async()=>{
 for(const options of [{result:{data:null,error:null}},{offline:true},{result:{data:null,error:{message:'denied'}}}])assert.deepEqual(await selectedHarness(options).read(id),{task:null,error:true});
});
