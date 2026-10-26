import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import * as links from '../src/lib/knowledge/links.ts';
import * as validation from '../src/lib/shared/validation.ts';
const id='ab33172a-f871-43b3-a610-a838d8b7f001';
const target={kind:'note',id,title:'A title',space_id:null,space_title:null};
function actionHarness({account=true,response={data:[],error:null},throws=false}={}) {
 const calls=[];
 const output=ts.transpileModule(fs.readFileSync(new URL('../src/app/knowledge/actions.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const loaded={exports:{}};
 new Function('require','exports',output)(name=>{
  if(name.endsWith('/auth/account')) return {getAccountContext:async()=>account?{userId:'owner-a',supabase:{rpc:async(name,params)=>{calls.push({name,params});if(throws)throw Error('offline');return response;}}}:null};
  if(name.endsWith('/knowledge/links'))return links;
  if(name.endsWith('/shared/validation'))return validation;
  throw Error(name);
 },loaded.exports);
 return {...loaded.exports,calls};
}
function form(values){const result=new FormData();for(const [k,v] of Object.entries(values))result.set(k,v);return result;}
test('stable links survive changed labels and deduplicate case variants',()=>{
 const body=links.linkMarker(target)+' '+links.linkMarker({...target,title:'Renamed',id:id.toUpperCase()});
 assert.deepEqual(links.extractLinks(body),[{kind:'note',id}]);
});
test('note/page identities remain distinct even with the same UUID',()=>{
 assert.equal(links.extractLinks(links.linkMarker(target)+links.linkMarker({...target,kind:'page'})).length,2);
});
test('markers sanitize separators and preserve literal HTML as text',()=>{
 const marker=links.linkMarker({...target,title:'[<script>] |\n title'});
 assert.equal(links.extractLinks(marker).length,1);assert.ok(marker.includes('<script>'));
});
test('malformed, external, multiline, and overlong markers are ignored',()=>{
 for(const text of ['[[x|url:'+id+']]','[[x|note:javascript:alert(1)]]','[[a\nb|note:'+id+']]','[['+'x'.repeat(201)+'|note:'+id+']]'])assert.deepEqual(links.extractLinks(text),[]);
});
test('maximum Unicode title round trips in markers',()=>{
 assert.equal(links.extractLinks(links.linkMarker({...target,title:'🌿'.repeat(200)})).length,1);
});
test('insertion replaces only selection and returns the text cursor position',()=>{
 assert.deepEqual(links.insertLink('Before selected after','LINK',7,15),{text:'Before LINK after',caret:11});
});
test('oversized insertion leaves draft untouched and counts code points',()=>{
 assert.equal(links.insertLink('🌿'.repeat(20000),'X',0,0),null);
 assert.equal(links.insertLink('🌿'.repeat(19999),'X',0,0).text.length,39999);
});
test('only planner routes are produced for note/page navigation',()=>{
 assert.equal(links.targetHref(target),'/notes?note='+id);
 assert.equal(links.targetHref({...target,kind:'page',space_id:id}),'/spaces?space='+id+'&entry='+id);
});
test('pagination input rejects hostile or unbounded offsets',()=>{
 for(const v of [null,'-1','1e9','9999999','0 OR 1=1'])assert.equal(links.parseLinkOffset(v),0);
 assert.equal(links.parseLinkOffset('20'),20);
});
test('search requires a fresh verified account before using RPC',async()=>{
 const h=actionHarness({account:false});const r=await h.searchLinkTargets(links.EMPTY_LINK_RESULTS,form({query:''}));assert.ok(r.error);assert.equal(h.calls.length,0);
});
test('search passes literal query with bounded pagination and uses lookahead',async()=>{
 const h=actionHarness({response:{data:Array.from({length:21},()=>target),error:null}});
 const r=await h.searchLinkTargets(links.EMPTY_LINK_RESULTS,form({query:'  100%_  ',offset:'20'}));
 assert.equal(r.items.length,20);assert.equal(r.more,true);assert.deepEqual(h.calls,[{name:'planner_link_catalog',params:{p_query:'100%_',p_offset:20}}]);
});
test('invalid connection arguments make no data requests',async()=>{
 const h=actionHarness();for(const values of [{kind:'url',id,direction:'outgoing'},{kind:'note',id:'bad',direction:'backlinks'},{kind:'note',id,direction:'delete'}])assert.ok((await h.loadConnections(links.EMPTY_LINK_RESULTS,form(values))).error);assert.equal(h.calls.length,0);
});
test('connections use the authenticated read RPC without a caller-supplied owner',async()=>{
 const h=actionHarness();await h.loadConnections(links.EMPTY_LINK_RESULTS,form({kind:'note',id,direction:'backlinks',user_id:'foreign',offset:'-5'}));
 assert.deepEqual(h.calls,[{name:'planner_link_connections',params:{p_kind:'note',p_id:id,p_direction:'backlinks',p_offset:0}}]);
});
test('query errors and transport failures report failure rather than empty success',async()=>{
 for(const options of [{response:{data:null,error:{message:'missing migration'}}},{throws:true}]){
  const h=actionHarness(options);
  assert.ok((await h.searchLinkTargets(links.EMPTY_LINK_RESULTS,form({query:''}))).error);
  assert.ok((await h.loadConnections(links.EMPTY_LINK_RESULTS,form({kind:'note',id,direction:'outgoing'}))).error);
 }
});

// Reading-view checks exercise the actual renderer and authenticated resolver.
const { createRequire } = await import('node:module');
const require = createRequire(import.meta.url);
const React = await import('react');
const { renderToStaticMarkup } = await import('react-dom/server');
const rendererCode = ts.transpileModule(fs.readFileSync(new URL('../src/app/knowledge/linked-text.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const renderer = {exports:{}};
new Function('require','exports',rendererCode)(name=>name==='@/lib/knowledge/links'?links:require(name),renderer.exports);
const renderText = (body,targets) => renderToStaticMarkup(React.createElement(renderer.exports.LinkedText,{body,targets}));
test('reading view renders actual inline links with current titles instead of markers',()=>{
 const html=renderText('Before '+links.linkMarker(target)+' after',[{...target,title:'Current title'}]);
 assert.match(html,new RegExp('href="/notes\\?note='+id+'"'));assert.match(html,/>Current title<\/a>/);assert.doesNotMatch(html,/\[\[|\]\]/);assert.match(html,/Before /);assert.match(html,/ after/);
});
test('reading view resolves page routes and keeps repeated link occurrences',()=>{
 const page={...target,kind:'page',space_id:id};const html=renderText(links.linkMarker(page)+'\n'+links.linkMarker(page),[page]);
 assert.equal((html.match(/<a /g)||[]).length,2);assert.match(html,/\/spaces\?space=.*&amp;entry=/);
});
test('reading view escapes literal HTML and never creates a link for an unavailable target',()=>{
 const html=renderText('<script>alert(1)</script> '+links.linkMarker({...target,title:'<img src=x>'}),[]);
 assert.doesNotMatch(html,/<script|<img|<a /);assert.match(html,/&lt;script&gt;/);assert.match(html,/unavailable/);assert.doesNotMatch(html,/\[\[/);
});
function resolverHarness({signedIn=true,error=false}={}){
 const calls=[];
 const supabase={from(table){const call={table};calls.push(call);return {select(columns){call.columns=columns;return this;},eq(column,value){call.owner=[column,value];return this;},async in(column,ids){call.ids=ids;call.idColumn=column;return error?{data:null,error:{message:'network'}}:{data:ids.map(id=>({id,title:'Owned title',...(table==='space_pages'?{space_id:id}:{})})),error:null};}};}};
 const code=ts.transpileModule(fs.readFileSync(new URL('../src/app/knowledge/actions.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const loaded={exports:{}};
 new Function('require','exports',code)(name=>{
  if(name.endsWith('/auth/account'))return {getAccountContext:async()=>signedIn?{userId:'owner-a',supabase}:null};
  if(name.endsWith('/knowledge/links'))return links;
  if(name.endsWith('/shared/validation'))return validation;
  throw Error(name);
 },loaded.exports);
 return {resolve:loaded.exports.resolveLinkPreview,calls};
}
test('preview resolves both kinds with explicit owner filters and bounded ID batches',async()=>{
 const h=resolverHarness();
 const body=Array.from({length:75},(_,i)=>links.linkMarker({...target,id:'ab33172a-f871-43b3-a610-'+String(i).padStart(12,'0')})).join(' ')+' '+links.linkMarker({...target,kind:'page'});
 const result=await h.resolve(form({body}));assert.equal(result.items.length,76);assert.equal(h.calls.length,3);
 for(const call of h.calls){assert.deepEqual(call.owner,['user_id','owner-a']);assert.ok(call.ids.length<=50);assert.equal(call.idColumn,'id');}
 assert.equal(result.items.find(item=>item.kind==='page').space_id,id);
});
test('preview refuses expired identity and oversize bodies before resolving targets',async()=>{
 const h=resolverHarness({signedIn:false});assert.ok((await h.resolve(form({body:links.linkMarker(target)}))).error);assert.equal(h.calls.length,0);
 const valid=resolverHarness();assert.ok((await valid.resolve(form({body:'x'.repeat(20001)}))).error);assert.equal(valid.calls.length,0);
});
test('failed target lookup reports failure without returning a partial clickable list',async()=>{
 const h=resolverHarness({error:true});const result=await h.resolve(form({body:links.linkMarker(target)}));assert.ok(result.error);assert.deepEqual(result.items,[]);
});
