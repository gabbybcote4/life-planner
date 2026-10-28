import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import {createRequire} from "node:module";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import * as validation from "../src/lib/shared/validation.ts";
import * as dates from "../src/lib/calendar/dates.ts";
const require=createRequire(import.meta.url),id="a901f5be-4fb8-43c4-8912-bb4511cd0001",target="a901f5be-4fb8-43c4-8912-bb4511cd0011";
function compile(path,deps={}){const code=ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,m={exports:{}};new Function("require","exports",code)(n=>Object.hasOwn(deps,n)?deps[n]:require(n),m.exports);return m.exports;}
const types=compile("../src/lib/projects/types.ts",{"../shared/validation":validation,"../calendar/dates":dates});
const project={id,title:"Project",description:"",status:"active",space_id:null,space_title:null,revision:1,task_count:1,done_count:0,note_count:0,page_count:0};
const item={kind:"task",target_id:target,active:true,revision:1,target:{id:target,title:"Original task",space_id:null,space:null,completed:false,due_date:null,priority:"none",planning_revision:1,created_at:"2020-01-01"}};
function form(extra={}){const f=new FormData();for(const[k,v]of Object.entries({id,title:"Project",description:"",status:"active",space_id:"",revision:"0",...extra}))f.set(k,v);return f;}
function harness(response={data:{id,revision:1}},signedIn=true){const calls=[],invalidations=[];const actions=compile("../src/app/projects/actions.ts",{"next/cache":{revalidatePath:p=>invalidations.push(p)},"@/lib/auth/account":{getAccountContext:async()=>signedIn?{userId:"verified",supabase:{rpc:async(...a)=>{calls.push(a);return response;}}}:null},"@/lib/shared/validation":validation,"@/lib/projects/types":types});return {...actions,calls,invalidations};}
test("project settings validate minimal names, optional context and explicit statuses",()=>{
 assert.deepEqual(types.parseProject(form()),{title:"Project",description:"",status:"active",space_id:null});
 for(const values of [{title:" "},{title:"x".repeat(201)},{description:"x".repeat(501)},{status:"constructor"},{status:"automatic"},{space_id:"bad"}])assert.equal(types.parseProject(form(values)),null);
 assert.ok(types.parseProject(form({title:"🙂".repeat(200)})));for(const v of ["-1","01","1e2",null])assert.equal(types.parseProjectRevision(v),null);
});
test("catalog/detail validation checks bounded real targets and complete counters",()=>{
 assert.ok(types.isProjectCatalog({items:[project],total:1}));assert.ok(types.isProjectDetail({project,items:[item],total_links:1}));
 for(const p of [{...project,done_count:2},{...project,status:"unknown"},{...project,space_id:"bad"}])assert.equal(types.isProject(p),false);
 assert.equal(types.isProjectCatalog({items:[project,project],total:2}),false);
 for(const entries of [[null],[{...item,target:null}],[{...item,target:{...item.target,id:id}}],[{...item,target:{...item.target,due_date:"2027-02-29"}}],[item,item]])assert.equal(types.isProjectDetail({project,items:entries,total_links:2}),false);
});
test("source routes retain task, note and page identities without copying labels into URLs",()=>{
 assert.equal(types.projectSourceHref(item),"/tasks?task="+target);assert.equal(types.projectSourceHref({...item,kind:"note"}),"/notes?note="+target);assert.equal(types.projectSourceHref({...item,kind:"page",target:{...item.target,space_id:id}}),"/spaces?space="+id+"&entry="+target);
});
test("project writes authenticate and send only validated settings, identity and revision",async()=>{
 const h=harness();assert.equal((await h.saveProject({},form())).id,id);assert.deepEqual(Object.keys(h.calls[0][1]).sort(),["p_id","p_revision","p_settings"]);assert.equal(h.calls[0][0],"planner_save_project");assert.ok(h.invalidations.includes("/projects"));
 const bad=harness();assert.ok((await bad.saveProject({},form({title:""}))).error);assert.equal(bad.calls.length,0);const anon=harness({},false);assert.ok((await anon.saveProject({},form())).error);assert.equal(anon.calls.length,0);
});
test("link and unlink writes use an explicit kind, owner-free RPC and relation baseline",async()=>{
 const h=harness({data:{revision:2}});const result=await h.setProjectItem({},form({project:id,kind:"task",target,active:"false",revision:"1"}));assert.match(result.message,/Original item kept/);assert.deepEqual(h.calls,[["planner_set_project_item",{p_project:id,p_kind:"task",p_target:target,p_active:false,p_revision:1}]]);
 const bad=harness();assert.ok((await bad.setProjectItem({},form({project:id,kind:"event",target,active:"true"}))).error);assert.equal(bad.calls.length,0);
});
test("failed or ambiguous writes never confirm links or discard settings",async()=>{
 for(const response of [{error:{code:"40001"}},{data:null},{data:{id:"wrong",revision:1}},{data:{id,revision:0}}]){const h=harness(response);assert.ok((await h.saveProject({},form())).error);assert.equal(h.invalidations.length,0);}
 const h=harness({error:{code:"23503"}});assert.ok((await h.setProjectItem({},form({project:id,kind:"note",target,active:"true"}))).error);assert.equal(h.invalidations.length,0);
});
test("schema uses same-owner FKs, narrow grants and reversible revisioned relations",()=>{
 const sql=fs.readFileSync(new URL("../supabase/migrations/20261028002300_projects.sql",import.meta.url),"utf8");assert.doesNotMatch(sql,/security definer|update public\.(tasks|notes|space_pages)|delete from/i);assert.match(sql,/grant update\(active\)/);assert.match(sql,/i.revision<>p_revision/);assert.match(sql,/p_revision=0 and p_active and i.active/);assert.match(sql,/pg_advisory_xact_lock/);
 for(const source of ["projects","tasks","notes","space_pages"])assert.ok(sql.includes("references public."+source+"(id,user_id)"));assert.equal((sql.match(/force row level security/g)||[]).length,2);assert.match(sql,/jsonb_agg\(value order by/);assert.match(sql,/limit 20 offset p_offset/);assert.match(sql,/t.completed/);
});
test("project detail uses escaped current titles and preserves unlinked sources for restoration",()=>{
 const {ProjectDetail}=compile("../src/app/projects/project-detail.tsx",{"next/link":({children,...p})=>React.createElement("a",p,children),"next/navigation":{useRouter:()=>({refresh(){}})},"@/app/tasks/task-board":{TaskList:({tasks,onChanged})=>{assert.equal(typeof onChanged,"function");return React.createElement("p",null,tasks[0].title);}},"@/lib/projects/types":types,"./project-form":{ProjectEditor:()=>React.createElement("button",null,"Edit project")},"./project-item-picker":{ProjectItemPicker:()=>React.createElement("button",null,"Link item"),ProjectLinkControl:({active})=>React.createElement("button",null,active?"Restore link":"Unlink")}});
 const data={project:{...project,title:"<script>Project</script>"},items:[{...item,active:false,target:{...item.target,title:"<script>Original</script>"}}],total_links:1};const html=renderToStaticMarkup(React.createElement(ProjectDetail,{data}));assert.match(html,/&lt;script&gt;Project/);assert.match(html,/&lt;script&gt;Original/);assert.match(html,/Restore link/);assert.match(html,/Open original/);assert.match(html,/0 \/ 1 tasks done/);assert.doesNotMatch(html,/<script>/);
});
test("source backlinks use fresh identity, exact source kind and bounded active relations",async()=>{
 const calls=[];const query={select(...a){calls.push(["select",...a]);return this;},eq(...a){calls.push(["eq",...a]);return this;},order(...a){calls.push(["order",...a]);return this;},async limit(n){calls.push(["limit",n]);return {data:[{project_id:id,project:{id,title:"<script>Current title</script>",status:"active"}}],count:7};}};
 const {ProjectBacklinks}=compile("../src/app/projects/project-backlinks.tsx",{"next/link":({children,...p})=>React.createElement("a",p,children),"@/lib/auth/account":{getAccountContext:async()=>({userId:"verified",supabase:{from(table){calls.push(["from",table]);return query;}}})},"@/lib/shared/validation":validation,"@/lib/projects/types":types});
 const html=renderToStaticMarkup(await ProjectBacklinks({kind:"task",id:target}));
 for(const pair of [["user_id","verified"],["kind","task"],["target_id",target],["active",true]])assert.ok(calls.some(c=>c[0]==="eq"&&c[1]===pair[0]&&c[2]===pair[1]));assert.ok(calls.some(c=>c[0]==="limit"&&c[1]===6));assert.match(html,/&lt;script&gt;Current title/);assert.match(html,/Showing 1 of 7/);assert.match(html,new RegExp("projects\\?project="+id));
});