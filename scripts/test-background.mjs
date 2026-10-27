import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
import * as bg from '../src/lib/themes/background.ts';
const require=createRequire(import.meta.url);
function harness(results,account=true){
 const calls=[],invalidations=[],queue=[...results];
 const client={from(table){calls.push(['from',table]);return {update(value){calls.push(['update',value]);return this;},insert(value){calls.push(['insert',value]);return this;},eq(k,v){calls.push(['eq',k,v]);return this;},select(){return this;},maybeSingle:async()=>queue.shift(),single:async()=>queue.shift()};}};
 const code=ts.transpileModule(fs.readFileSync(new URL('../src/app/settings/background-actions.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,loaded={exports:{}};
 const deps={'next/cache':{revalidatePath:(...args)=>invalidations.push(args)},'@/lib/auth/account':{getAccountContext:async()=>account?{supabase:client,userId:'owner-a'}:null},'@/lib/themes/background':bg};
 new Function('require','exports',code)(name=>deps[name]??require(name),loaded.exports);
 return {...loaded.exports,calls,invalidations};
}
function form(extra={}){const f=new FormData();for(const[k,v]of Object.entries({pattern:'grid',intensity:'strong',revision:'1',...extra}))f.set(k,v);return f;}
test('only built-in background and intensity pairs validate',()=>{
 for(const pattern of Object.keys(bg.BACKGROUNDS))for(const intensity of Object.keys(bg.INTENSITIES))assert.deepEqual(bg.parseBackground(pattern,intensity),{pattern,intensity});
 for(const value of [null,'constructor','__proto__','url(evil)','dots; color:red',{},''])assert.equal(bg.parseBackground(value,'medium'),null);
 for(const value of [null,'constructor','0','strong!important'])assert.equal(bg.parseBackground('grid',value),null);
 assert.deepEqual(bg.DEFAULT_BACKGROUND,{pattern:'dots',intensity:'medium'});
});
test('save changes only background fields, guards owner/revision and refreshes layout',async()=>{
 const h=harness([{data:{background_revision:2},error:null}]),r=await h.saveBackground({},form());
 assert.equal(r.revision,2);assert.deepEqual(h.calls.find(c=>c[0]==='update')[1],{background_pattern:'grid',background_intensity:'strong'});
 assert.ok(h.calls.some(c=>c[1]==='user_id'&&c[2]==='owner-a'));assert.ok(h.calls.some(c=>c[1]==='background_revision'&&c[2]===1));
 assert.deepEqual(h.invalidations,[['/','layout']]);
});
test('stale saved row returns conflict and no invalidation',async()=>{const h=harness([{data:null},{data:{background_revision:4}}]);assert.match((await h.saveBackground({},form())).error,/another tab/);assert.equal(h.invalidations.length,0);assert.ok(!h.calls.some(c=>c[0]==='insert'));});
test('new account inserts narrow settings after confirming no row',async()=>{const h=harness([{data:null},{data:null},{data:{background_revision:2}}]);assert.equal((await h.saveBackground({},form())).revision,2);assert.deepEqual(h.calls.find(c=>c[0]==='insert')[1],{user_id:'owner-a',background_pattern:'grid',background_intensity:'strong'});});
test('concurrent initial row conflict uses a guarded retry',async()=>{const h=harness([{data:null},{data:null},{error:{code:'23505'}},{data:null}]);assert.ok((await h.saveBackground({},form())).error);assert.equal(h.calls.filter(c=>c[0]==='update').length,2);assert.equal(h.invalidations.length,0);});
test('invalid input, missing session and database errors never report saved',async()=>{
 const bad=harness([]);assert.ok((await bad.saveBackground({},form({revision:'1e2'}))).error);assert.equal(bad.calls.length,0);
 const anon=harness([],false);assert.ok((await anon.saveBackground({},form())).error);assert.equal(anon.calls.length,0);
 const failed=harness([{error:{code:'offline'}}]);assert.ok((await failed.saveBackground({},form())).error);assert.equal(failed.invalidations.length,0);
});
test('SQL preset lists agree with application and existing rows are not rewritten',()=>{
 const sql=fs.readFileSync(new URL('../supabase/migrations/20261027001500_desktop_background.sql',import.meta.url),'utf8');
 for(const [column,values] of [['background_pattern',bg.BACKGROUNDS],['background_intensity',bg.INTENSITIES]]){
 const list=sql.match(new RegExp(column+" in \\(([^)]+)\\)"))[1];assert.deepEqual([...list.matchAll(/'([^']+)'/g)].map(x=>x[1]).sort(),Object.keys(values).sort());
 }
 assert.doesNotMatch(sql,/update public\.planner_preferences/);assert.match(sql,/before insert or update/);assert.match(sql,/new.background_revision=2/);
});
