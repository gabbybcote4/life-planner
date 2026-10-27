import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as appearance from '../src/lib/spaces/appearance.ts';
import * as types from '../src/lib/spaces/types.ts';
import * as notes from '../src/lib/notes/types.ts';
import * as validation from '../src/lib/shared/validation.ts';
const require=createRequire(import.meta.url),id='b3aa172a-f871-43b3-a610-a838d8b7a001';
function load(path,deps){const code=ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,loaded={exports:{}};new Function('require','exports',code)(name=>name in deps?deps[name]:require(name),loaded.exports);return loaded.exports;}
function harness(result={data:{id,revision:2},error:null}){
 const calls=[],invalidations=[];const client={from(table){calls.push(['from',table]);return {update(value){calls.push(['update',value]);return this;},eq(k,v){calls.push(['eq',k,v]);return this;},select(){return this;},async maybeSingle(){return result;}};}};
 const actions=load('../src/app/spaces/actions.ts',{'next/cache':{revalidatePath:p=>invalidations.push(p)},'@/lib/auth/account':{getAccountContext:async()=>({supabase:client,userId:'owner-a'})},'@/lib/shared/validation':validation,'@/lib/notes/types':notes,'@/lib/spaces/types':types,'@/lib/spaces/appearance':appearance});return {...actions,calls,invalidations};
}
function form(extra={}){const f=new FormData();for(const[k,v]of Object.entries({id,mode:'edit',revision:'1',title:'Home',icon:'home',cover:'desk',accent:'mint',...extra}))f.set(k,v);return f;}
test('built-in appearance choices validate and older missing fields get automatic defaults',()=>{assert.deepEqual(appearance.parseSpaceAppearance('star','none','blue'),{icon:'star',cover:'none',accent:'blue'});assert.deepEqual(appearance.spaceAppearance({}),appearance.DEFAULT_SPACE_APPEARANCE);});
test('external assets, markup, arbitrary CSS and unknown choices are rejected',()=>{for(const args of [['<svg>','desk','mint'],['home','https://external/image','mint'],['home','desk','#ffffff'],['home','desk','constructor']])assert.equal(appearance.parseSpaceAppearance(...args),null);});
test('automatic covers are stable for identity while explicit/no-cover choices stay exact',()=>{assert.equal(appearance.resolvedSpaceCover(id,'auto'),appearance.resolvedSpaceCover(id,'auto'));for(const cover of ['cozy','desk','study','none'])assert.equal(appearance.resolvedSpaceCover(id,cover),cover);});
test('metadata and name save in one owner/revision-filtered update',async()=>{const h=harness();assert.ok((await h.saveSpace({},form())).message);assert.ok(h.calls.some(c=>c[0]==='update'&&JSON.stringify(c[1])===JSON.stringify({title:'Home',icon:'home',cover:'desk',accent:'mint'})));assert.ok(h.calls.some(c=>c[0]==='eq'&&c[1]==='user_id'&&c[2]==='owner-a'));assert.ok(h.calls.some(c=>c[0]==='eq'&&c[1]==='revision'&&c[2]===1));assert.deepEqual(h.invalidations,['/spaces','/']);});
test('stale appearance saves return a conflict without successful invalidation',async()=>{const h=harness({data:null,error:null});assert.ok((await h.saveSpace({},form())).error);assert.deepEqual(h.invalidations,[]);});
test('older rename submissions do not overwrite appearance columns',async()=>{const h=harness(),f=form();for(const key of ['icon','cover','accent'])f.delete(key);assert.ok((await h.saveSpace({},f)).message);assert.deepEqual(h.calls.find(c=>c[0]==='update')[1],{title:'Home'});});
test('shared visuals escape titles and honor an explicit no-cover choice',()=>{const art=load('../src/components/ui/space-artwork.tsx',{}),visual=load('../src/components/ui/space-visual.tsx',{'./space-artwork':art,'@/lib/spaces/appearance':appearance});const html=renderToStaticMarkup(React.createElement(visual.SpaceVisual,{space:{id,title:'<script>Title</script>',icon:'book',cover:'none',accent:'blue'}}));assert.doesNotMatch(html,/<script>|class="space-artwork"/);assert.match(html,/&lt;script&gt;/);assert.match(html,/data-space-accent="blue"/);});
test('database allowlists match shared presentation choices',()=>{const sql=fs.readFileSync(new URL('../supabase/migrations/20261027001400_space_appearance.sql',import.meta.url),'utf8');for(const[name,map]of Object.entries({icon:appearance.SPACE_ICONS,cover:appearance.SPACE_COVERS,accent:appearance.SPACE_ACCENTS})){const match=sql.match(new RegExp('check\\('+name+' in\\(([^)]+)\\)\\)'));assert.ok(match);assert.deepEqual([...match[1].matchAll(/'([^']+)'/g)].map(m=>m[1]).sort(),Object.keys(map).sort());}});
