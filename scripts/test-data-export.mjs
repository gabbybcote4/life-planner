import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import {createRequire} from "node:module";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
const require=createRequire(import.meta.url);
function load(path,deps={}){const code=ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),"utf8"),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,m={exports:{}};new Function("require","exports",code)(n=>Object.hasOwn(deps,n)?deps[n]:require(n),m.exports);return m.exports;}
const schema=load("../src/lib/export/schema.ts");
function payload(){const keys=Object.keys(schema.EXPORT_COLUMNS);return {format:"life-planner-export",format_version:1,exported_at:"2026-10-29T00:00:00.000Z",total_records:0,counts:Object.fromEntries(keys.map(k=>[k,0])),data:Object.fromEntries(keys.map(k=>[k,[]]))};}
function withTask(title="Original \n🙂 <script>"){const data=payload(),row=Object.fromEntries(schema.EXPORT_COLUMNS.tasks.map(k=>[k,null]));row.id="a901f5be-4fb8-43c4-8912-bb4511cd0001";row.title=title;row.completed=false;data.data.tasks=[row];data.counts.tasks=1;data.total_records=1;return data;}
function harness(response={data:payload()},signed=true,offline=false){const calls=[];return {...load("../src/app/settings/export/route.ts",{"@/lib/auth/account":{getAccountContext:async()=>signed?{userId:"verified-owner",supabase:{rpc:async(...a)=>{calls.push(a);if(offline)throw Error("secret database detail");return response;}}}:null},"@/lib/export/schema":schema}),calls};}
function request(origin="http://localhost:3000"){return new Request("http://localhost:3000/settings/export",{method:"POST",headers:origin?{origin}:{},body:JSON.stringify({user_id:"foreign"})});}
test("v1 contract covers every saved collection and complete row/total counts",()=>{
 const d=withTask();assert.ok(schema.validExport(d));assert.equal(Object.keys(schema.EXPORT_COLUMNS).length,14);assert.equal(schema.exportFilename(d),"life-planner-export-2026-10-29.json");
 for(const bad of [{...d,format_version:2},{...d,exported_at:"bad"},{...d,total_records:2},{...d,counts:{...d.counts,tasks:2}},{...d,data:{...d.data,notes:undefined}},{...d,access_token:"secret"}])assert.equal(schema.validExport(bad),false);
 const extra=withTask();extra.data.tasks[0].password="secret";assert.equal(schema.validExport(extra),false);const missing=withTask();delete missing.data.tasks[0].title;assert.equal(schema.validExport(missing),false);
 const duplicate=payload();duplicate.data.planner_preferences=[{},{}];duplicate.counts.planner_preferences=2;duplicate.total_records=2;assert.equal(schema.validExport(duplicate),false);
});
test("export authenticates freshly and ignores caller ownership and body parameters",async()=>{
 const h=harness({data:withTask()}),r=await h.POST(request());assert.equal(r.status,200);assert.deepEqual(h.calls,[["planner_export_data"]]);assert.match(r.headers.get("content-disposition"),/^attachment; filename="life-planner-export-2026-10-29.json"$/);assert.match(r.headers.get("cache-control"),/private.*no-store/);assert.equal(r.headers.get("x-content-type-options"),"nosniff");assert.match(r.headers.get("vary"),/Cookie/);const d=await r.json();assert.equal(d.data.tasks[0].title,"Original \n🙂 <script>");assert.equal(d.total_records,1);
});
test("cross-site, missing-origin and signed-out requests cannot reach the export RPC",async()=>{
 for(const origin of ["https://attacker.invalid",""]){const h=harness();const r=await h.POST(request(origin));assert.equal(r.status,403);assert.equal(h.calls.length,0);assert.match(r.headers.get("cache-control"),/no-store/);}
 const anon=harness({},false);const r=await anon.POST(request());assert.equal(r.status,401);assert.equal(anon.calls.length,0);assert.equal(r.headers.get("content-disposition"),null);
});
test("missing setup, failed transport and partial manifests never return a downloadable partial file",async()=>{
 for(const response of [{error:{code:"undefined_function"}},{data:null},{data:{...payload(),counts:{}}}]){const h=harness(response),r=await h.POST(request());assert.ok(r.status>=500);assert.equal(r.headers.get("content-disposition"),null);assert.match(r.headers.get("cache-control"),/no-store/);}
 const r=await harness({},true,true).POST(request());assert.equal(r.status,503);assert.doesNotMatch(await r.text(),/secret database detail/);
});
test("large exports fail honestly on both database and UTF-8 download limits",async()=>{
 const sqlLimit=await harness({error:{code:"54000"}}).POST(request());assert.equal(sqlLimit.status,413);assert.equal(sqlLimit.headers.get("content-disposition"),null);
 const big=withTask("🙂".repeat(Math.floor(schema.EXPORT_MAX_BYTES/4)+1));const response=await harness({data:big}).POST(request());assert.equal(response.status,413);assert.equal(response.headers.get("content-disposition"),null);
});
test("SQL is invoker-only, explicit-projection, whole-account and bounded without truncation",()=>{
 const sql=fs.readFileSync(new URL("../supabase/migrations/20261028002700_data_export.sql",import.meta.url),"utf8");assert.match(sql,/stable security invoker/);assert.match(sql,/owner_id uuid=auth.uid\(\)/);assert.match(sql,/where user_id=\$1/g);assert.doesNotMatch(sql,/security definer|auth\.users|insert into|update public|delete from|limit [0-9]/i);assert.match(sql,/total_rows>50000/);assert.match(sql,/20971520/);assert.match(sql,/from public,anon/);assert.match(sql,/join docs target/);
 for(const [key,columns]of Object.entries(schema.EXPORT_COLUMNS)){if(key==="knowledge_links")continue;assert.ok(sql.includes("('"+key+"','"+columns.join(",")+"'"),"Projection drift: "+key);assert.ok(!columns.includes("user_id"));}
});
test("download panel is explicit, accessible and offers format/restore scope",()=>{
 const {ExportPanel}=load("../src/app/settings/export-panel.tsx",{"@/components/ui/button":load("../src/components/ui/button.tsx"),"@/components/ui/feedback":load("../src/components/ui/feedback.tsx"),"@/lib/export/schema":schema});const html=renderToStaticMarkup(React.createElement(ExportPanel));assert.match(html,/Download JSON/);assert.match(html,/What is included/);assert.match(html,/Import\/restore is a future step/);assert.match(html,/habit history/);assert.match(html,/no passwords/);assert.doesNotMatch(html,/href="blob:/);
});

test("privacy fixtures insert habit history only under the matching authenticated identity",()=>{
 const sql=fs.readFileSync(new URL("../supabase/tests/data_export_rls.sql",import.meta.url),"utf8");let owner=null,authenticated=false,checked=0;
 for(const line of sql.split(/\r?\n/)){
  if(line==="set local role authenticated;")authenticated=true;
  if(line.startsWith("set local role anon;"))authenticated=false;
  const claim=line.match(/request.jwt.claims','(.*?)',true/);if(claim)owner=JSON.parse(claim[1]).sub??null;
  if(line.startsWith("insert into public.habit_checkins")){const values=line.match(/values\('([^']+)','([^']+)'/);assert.ok(authenticated);assert.equal(values[2],owner);checked++;}
 }
 assert.equal(checked,2);assert.doesNotMatch(sql,/disable trigger|session_replication_role/);
});

test("history assertions compare numeric values and expose a versioned fixture diagnostic",()=>{
 const sql=fs.readFileSync(new URL("../supabase/tests/data_export_rls.sql",import.meta.url),"utf8");assert.match(sql,/EXPORT-CHECKS-V3/);assert.match(sql,/amount'\)::numeric is distinct from 1/);assert.match(sql,/target'\)::numeric is distinct from 1/);assert.doesNotMatch(sql,/amount'\s*<>\s*'1'/);assert.match(sql,/EXPORT-V3 history mismatch/);
});
