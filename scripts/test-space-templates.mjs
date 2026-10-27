import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import * as templates from '../src/lib/templates/types.ts';
import * as spaces from '../src/lib/spaces/types.ts';
import * as validation from '../src/lib/shared/validation.ts';
import {parseNote} from '../src/lib/notes/types.ts';
const id='ad55172a-f871-43b3-a610-a838d8b7a001';
const migration=fs.readFileSync(new URL('../supabase/migrations/20261027000900_space_templates.sql',import.meta.url),'utf8');
const catalog=[...migration.matchAll(/\('([a-z]+)','([^']+)','([^']+)',\$catalog\$([\s\S]*?)\$catalog\$::jsonb\)/g)].map(m=>({key:m[1],title:m[2],description:m[3],pages:JSON.parse(m[4])}));
function harness({signedIn=true,result={data:{space_id:id,first_page_id:id},error:null},offline=false}={}) {
 const calls=[],invalidations=[];
 const output=ts.transpileModule(fs.readFileSync(new URL('../src/app/spaces/template-actions.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const loaded={exports:{}};
 new Function('require','exports',output)(name=>{
 if(name==='next/cache')return {revalidatePath:path=>invalidations.push(path)};
 if(name==='@/lib/auth/account')return {getAccountContext:async()=>signedIn?{userId:'owner-a',supabase:{rpc:(name,params)=>{calls.push({name,params});return {single:async()=>{if(offline)throw Error('network');return result;}};}}}:null};
 if(name==='@/lib/shared/validation')return validation;
 if(name==='@/lib/spaces/types')return spaces;
 if(name==='@/lib/templates/types')return templates;
 throw Error(name);
 },loaded.exports);
 return {...loaded.exports,calls,invalidations};
}
function form(extra={}){const f=new FormData();for(const[k,v]of Object.entries({id,title:'  My personal space  ',template:'personal',...extra}))f.set(k,v);return f;}
test('database catalog contains all UI starters and every starter page obeys existing limits',()=>{
 assert.deepEqual(catalog.map(t=>t.key),['personal','work','study']);
 for(const item of catalog){assert.equal(templates.isTemplateKey(item.key),true);assert.ok(spaces.parseSpaceTitle(item.title));assert.equal(item.pages.length,3);assert.equal(new Set(item.pages.map(p=>p.title)).size,3);for(const p of item.pages)assert.ok(parseNote(p.title,p.body));}
});
test('blank and known keys are accepted while unrecognized inputs are rejected',()=>{
 for(const v of ['blank','personal','work','study'])assert.equal(templates.isTemplateKey(v),true);
 for(const v of [null,'__proto__','external',{key:'personal'},'PERSONAL'])assert.equal(templates.isTemplateKey(v),false);
});
test('creation verifies account and sends one atomic request without caller ownership/pages',async()=>{
 const h=harness();const r=await h.createSpaceFromTemplate({},form({user_id:'foreign',pages:'untrusted'}));assert.equal(r.id,id);assert.equal(r.pageId,id);assert.deepEqual(h.calls,[{name:'create_planner_space',params:{p_request_id:id,p_title:'My personal space',p_template_key:'personal'}}]);assert.deepEqual(h.invalidations,['/spaces','/search']);
});
test('invalid requests make no writes or RPC calls',async()=>{
 const h=harness();for(const extra of [{id:'bad'},{title:' '},{title:'x'.repeat(101)},{template:'unknown'}])assert.ok((await h.createSpaceFromTemplate({},form(extra))).error);assert.equal(h.calls.length,0);
});
test('expired accounts cannot create templates',async()=>{
 const h=harness({signedIn:false});assert.ok((await h.createSpaceFromTemplate({},form())).error);assert.equal(h.calls.length,0);
});
test('ambiguous requests preserve retry identity and do not retry automatically',async()=>{
 const h=harness({offline:true});const r=await h.createSpaceFromTemplate({},form());assert.ok(r.error);assert.equal(h.calls.length,1);assert.deepEqual(h.invalidations,[]);assert.equal(h.calls[0].params.p_request_id,id);
});
test('conflicting original requests do not return false success or invalidate pages',async()=>{
 const h=harness({result:{data:null,error:{code:'23505'}}});const r=await h.createSpaceFromTemplate({},form());assert.match(r.error,/original name and starter/);assert.equal(r.id,undefined);assert.deepEqual(h.invalidations,[]);
});
test('database errors, missing confirmations and mismatched ids are failures',async()=>{
 for(const result of [{data:null,error:{code:'23514'}},{data:null,error:null},{data:{space_id:'different'},error:null},{data:{space_id:id,first_page_id:'bad'},error:null},{data:{space_id:id,first_page_id:null},error:null}]){const h=harness({result});assert.ok((await h.createSpaceFromTemplate({},form())).error);assert.deepEqual(h.invalidations,[]);}
});
test('confirmed blank requests return a space without inventing a first page',async()=>{
 const h=harness({result:{data:{space_id:id,first_page_id:null},error:null}});const r=await h.createSpaceFromTemplate({},form({template:'blank'}));assert.equal(r.id,id);assert.equal(r.pageId,undefined);
});
