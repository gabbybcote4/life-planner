import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import {createRequire} from "node:module";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import * as tasks from "../src/lib/tasks/types.ts";
import * as notes from "../src/lib/notes/types.ts";
import * as validation from "../src/lib/shared/validation.ts";
const require=createRequire(import.meta.url),id="ae66172a-f871-43b3-a610-a838d8b7f701",space="ae66172a-f871-43b3-a610-a838d8b7f700";
function compile(path,deps={}){
 const code=ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,loaded={exports:{}};
 new Function("require","exports",code)(name=>Object.hasOwn(deps,name)?deps[name]:require(name),loaded.exports);return loaded.exports;
}
const types=compile("../src/lib/inbox/types.ts",{"@/lib/tasks/types":tasks,"@/lib/notes/types":notes,"@/lib/shared/validation":validation});
function form(extra={}){const f=new FormData();for(const[k,v]of Object.entries({id,kind:"task",text:"A little task",title:"",space_id:"",...extra}))f.set(k,v);return f;}
test("capture preserves literal notes and derives optional Unicode-safe titles",()=>{
 assert.deepEqual(types.parseCapture(form()),{id,kind:"task",title:"A little task",body:"",space_id:null});
 const text="\n  First idea\n<script>literal</script>\n";
 const parsed=types.parseCapture(form({kind:"note",text,space_id:space}));
 assert.equal(parsed.title,"First idea");assert.equal(parsed.body,text);assert.equal(parsed.space_id,space);
 assert.equal(Array.from(types.parseCapture(form({kind:"note",text:"🌱".repeat(250)})).title).length,200);
 assert.equal(types.parseCapture(form({kind:"note",text:"text",title:"  My title  "})).title,"My title");
});
test("capture validates limits, kind and identifiers without truncating a task",()=>{
 for(const extra of [{text:" "},{kind:"page"},{id:"bad"},{space_id:"foreign-string"},{text:"x".repeat(201)},{kind:"note",text:"x".repeat(20001)},{kind:"note",title:"x".repeat(201)}])assert.equal(types.parseCapture(form(extra)),null);
 assert.ok(types.parseCapture(form({kind:"note",text:"x".repeat(20000)})));
});
test("saved target links distinguish task, note and space page",()=>{
 assert.equal(types.captureHref({id,kind:"task",space_id:null}),"/tasks?task="+id);
 assert.equal(types.captureHref({id,kind:"note",space_id:null}),"/notes?note="+id);
 assert.equal(types.captureHref({id,kind:"page",space_id:space}),"/spaces?space="+space+"&entry="+id);
});
function harness(response,{signedIn=true}={}){
 const calls=[],invalidations=[];
 const client={rpc:async(...args)=>{calls.push(["rpc",...args]);return response;},from(table){calls.push(["from",table]);return {update(values){calls.push(["update",values]);return this;},eq(k,v){calls.push(["eq",k,v]);return this;},select(){return this;},maybeSingle:async()=>response};}};
 const actions=compile("../src/app/inbox/actions.ts",{"next/cache":{revalidatePath:p=>invalidations.push(p)},"@/lib/auth/account":{getAccountContext:async()=>signedIn?{supabase:client,userId:"owner-a"}:null},"@/lib/shared/validation":validation,"@/lib/notes/types":notes,"@/lib/inbox/types":types});
 return {...actions,calls,invalidations};
}
test("capture uses one atomic RPC with no caller owner and checks the returned target",async()=>{
 const h=harness({data:{id,kind:"page",space_id:space}}),result=await h.captureItem({},form({kind:"note",space_id:space,text:"Brain dump"}));
 assert.equal(result.href,"/spaces?space="+space+"&entry="+id);
 assert.deepEqual(h.calls,[["rpc","planner_quick_capture",{p_id:id,p_kind:"note",p_space_id:space,p_title:"Brain dump",p_body:"Brain dump"}]]);
 assert.ok(h.invalidations.includes("/inbox"));assert.ok(h.invalidations.includes("/"));
});
test("invalid/session/ambiguous/retry errors never claim saved or discard a draft",async()=>{
 const invalid=harness({});assert.ok((await invalid.captureItem({},form({text:""}))).error);assert.equal(invalid.calls.length,0);
 const anon=harness({}, {signedIn:false});assert.ok((await anon.captureItem({},form())).error);assert.equal(anon.calls.length,0);
 for(const response of [{error:{code:"23505"}},{error:{code:"network"}},{data:null},{data:{id:"wrong",kind:"task",space_id:null}}]){
  const h=harness(response),result=await h.captureItem({},form());assert.ok(result.error);assert.equal(result.href,undefined);assert.equal(h.invalidations.length,0);
 }
});
test("review changes only queue status with fresh owner and revision guards",async()=>{
 const h=harness({data:{id}}),f=form({revision:"4",reviewed:"true"});assert.ok((await h.reviewCapture({},f)).message);
 assert.deepEqual(h.calls.find(c=>c[0]==="update")[1],{reviewed:true});
 for(const[k,v]of [["id",id],["user_id","owner-a"],["revision",4]])assert.ok(h.calls.some(c=>c[0]==="eq"&&c[1]===k&&c[2]===v));
 assert.deepEqual(h.invalidations,["/inbox"]);
 const stale=harness({data:null});assert.ok((await stale.reviewCapture({},f)).error);assert.equal(stale.invalidations.length,0);
});
test("capture card escapes original text and offers review separately from source actions",()=>{
 const card=compile("../src/app/inbox/capture-card.tsx",{"next/link":({children,...props})=>React.createElement("a",props,children),"@/components/ui/button":compile("../src/components/ui/button.tsx"),"@/components/ui/feedback":compile("../src/components/ui/feedback.tsx"),"@/components/ui/desk-icon":compile("../src/components/ui/desk-icon.tsx"),"@/lib/shared/client-actions":{},"@/lib/inbox/types":types,"./actions":{}});
 const html=renderToStaticMarkup(React.createElement(card.CaptureCard,{item:{id,kind:"note",title:"<script>Title</script>",body:"Line\n<script>Body</script>",space_id:null,reviewed:false,revision:1,created_at:"2026-10-27T12:00:00Z"}}));
 assert.doesNotMatch(html,/<script>(?:Title|Body)/);assert.match(html,/&lt;script&gt;/);assert.match(html,/Original capture/);assert.match(html,/Reviewed/);assert.match(html,/name="reviewed" value="true"/);
});
test("SQL preserves invoker ownership, atomic source branches and immutable retry metadata",()=>{
 const sql=fs.readFileSync(new URL("../supabase/migrations/20261027002000_inbox_capture.sql",import.meta.url),"utf8");
 assert.match(sql,/security invoker/);assert.match(sql,/pg_advisory_xact_lock/);assert.match(sql,/existing.kind<>target_kind/);assert.match(sql,/existing.space_id is distinct from p_space_id/);
 for(const table of ["tasks","notes","space_pages"])assert.ok(sql.includes("insert into public."+table));
 assert.match(sql,/grant update\(reviewed\)/);assert.match(sql,/force row level security/);assert.match(sql,/foreign key\(page_id,user_id\)/);assert.doesNotMatch(sql,/security definer|update public\.(tasks|notes|space_pages)/i);
});

test("quick capture prerenders a closed labeled modal and a reusable launch control",()=>{
 const deps={"next/link":({children,...props})=>React.createElement("a",props,children),"@/components/ui/button":compile("../src/components/ui/button.tsx"),"@/components/ui/fields":compile("../src/components/ui/fields.tsx"),"@/components/ui/feedback":compile("../src/components/ui/feedback.tsx"),"@/components/ui/desktop-window":compile("../src/components/ui/desktop-window.tsx"),"@/app/components/space-picker":{SpacePicker:()=>React.createElement("div",null,"Space picker")},"@/lib/shared/request-id":{},"@/lib/shared/client-actions":{},"./actions":{}};
 const ui=compile("../src/app/inbox/quick-capture.tsx",deps);
 const html=renderToStaticMarkup(React.createElement(ui.QuickCaptureProvider,null,React.createElement(ui.QuickCaptureButton)));
 assert.match(html,/<dialog[^>]+aria-labelledby=/);assert.doesNotMatch(html,/<dialog[^>]+ open/);
 assert.match(html,/Close quick capture/);assert.match(html,/Capture type/);assert.match(html,/name="text"/);assert.match(html,/name="space_id"/);
 assert.match(html,/Discard draft/);assert.match(html,/Refreshing clears unsaved text/);
});
