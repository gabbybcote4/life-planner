import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import {createRequire} from "node:module";
import * as validation from "../src/lib/shared/validation.ts";
const require=createRequire(import.meta.url),id="a901f5be-4fb8-43c4-8912-bb4511cd0001",project="a901f5be-4fb8-43c4-8912-bb4511cd0011";
function compile(path,deps={}){const code=ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),"utf8"),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,m={exports:{}};new Function("require","exports",code)(n=>Object.hasOwn(deps,n)?deps[n]:require(n),m.exports);return m.exports;}
const helpers=compile("../src/lib/projects/task-projects.ts",{"../shared/validation":validation,"./types":{PROJECT_STATUSES:{active:"Active",paused:"On hold",completed:"Completed"}}});
const choice={task_id:id,query:"",offset:0,more:false,items:[{project_id:project,title:"Work",status:"active",active:true,revision:1}]};
function form(values={}){const f=new FormData();for(const[k,v]of Object.entries({task:id,query:"",offset:"0",...values}))f.set(k,v);return f;}
function harness(response={data:choice},signed=true){const calls=[];return {...compile("../src/app/projects/task-project-actions.ts",{"@/lib/auth/account":{getAccountContext:async()=>signed?{supabase:{rpc:async(...a)=>{calls.push(a);return response;}}}:null},"@/lib/shared/validation":validation,"@/lib/projects/task-projects":helpers}),calls};}
test("task project choices validate response identity, pagination, relations and duplicate IDs",()=>{
 assert.ok(helpers.validTaskChoices(choice,id,"",0));
 for(const data of [{...choice,task_id:project},{...choice,query:"old"},{...choice,offset:20},{...choice,items:[...choice.items,...choice.items]},{...choice,items:[{...choice.items[0],revision:0}]},{...choice,items:[{...choice.items[0],status:"constructor"}]}])assert.equal(helpers.validTaskChoices(data,id,"",0),false);
 assert.ok(helpers.validTaskChoices({...choice,items:[{...choice.items[0],active:false,revision:2}]},id,"",0));
});
test("picker permits no-typing browse and authenticates every bounded request without a caller owner",async()=>{
 const h=harness();assert.deepEqual(await h.loadTaskProjects(form()),choice);assert.deepEqual(h.calls,[["planner_task_project_choices",{p_task:id,p_query:"",p_offset:0}]]);
 for(const values of [{task:"bad"},{query:"x".repeat(101)},{offset:"1"},{offset:"020"},{offset:"1000000"}]){const h=harness();assert.ok((await h.loadTaskProjects(form(values))).error);assert.equal(h.calls.length,0);}
 const anon=harness({},false);assert.ok((await anon.loadTaskProjects(form())).error);assert.equal(anon.calls.length,0);
 for(const data of [null,{}, {...choice,task_id:project}])assert.ok((await harness({data}).loadTaskProjects(form())).error);
});
test("badges batch original task IDs once and preserve source fields with complete counts",async()=>{
 const task={id,title:"Original",completed:false,space_id:null},calls=[];
 const client={rpc:async(...a)=>{calls.push(a);return {data:[{task_id:id,total:4,projects:[1,2,3].map(n=>({id:project.slice(0,-1)+n,title:"Project "+n}))}]};}};
 const result=await helpers.withTaskProjects(client,[task]);assert.equal(result[0].title,"Original");assert.equal(result[0].completed,false);assert.equal(result[0].project_count,4);assert.equal(result[0].projects.length,3);assert.deepEqual(calls,[["planner_task_project_badges",{p_tasks:[id]}]]);
 assert.deepEqual(await helpers.withTaskProjects(client,[]),[]);assert.equal(calls.length,1);
});
test("missing, malformed and failed metadata never becomes a false zero or leaks unrelated IDs",async()=>{
 for(const response of [{error:{}},{data:[]},{data:[{task_id:project,total:0,projects:[]}]},{data:[{task_id:id,total:2,projects:[]}]},{data:[{task_id:id,total:0,projects:[]},{task_id:id,total:0,projects:[]}]}]){
 const [task]=await helpers.withTaskProjects({rpc:async()=>response},[{id,projects:[{id:project,title:"Old"}],project_count:1}]);assert.equal(task.projects_error,true);assert.equal(task.project_count,undefined);assert.equal(task.projects,undefined);
 }
 const [known]=await helpers.withTaskProjects({rpc:async()=>({data:[{task_id:id,total:0,projects:[]}]})},[{id}]);assert.equal(known.project_count,0);assert.equal(known.projects_error,false);
 let called=false;const result=await helpers.withTaskProjects({rpc:async()=>{called=true;}},Array.from({length:201},(_,n)=>({id:String(n)})));assert.equal(called,false);assert.ok(result.every(t=>t.projects_error));
});
test("new RPCs stay read-only, invoker-scoped, bounded and literal while writes reuse revisioned relations",()=>{
 const sql=fs.readFileSync(new URL("../supabase/migrations/20261028002400_task_project_picker.sql",import.meta.url),"utf8");
 assert.doesNotMatch(sql,/security definer|insert into|update public|delete from|create table/i);assert.equal((sql.match(/security invoker/g)||[]).length,2);assert.match(sql,/user_id=auth.uid\(\)/);assert.match(sql,/strpos\(lower\(p.title\)/);assert.match(sql,/limit 20 offset p_offset/);assert.match(sql,/limit 3/);assert.match(sql,/cardinality\(p_tasks\)>200/);assert.match(sql,/from public,anon/);
 const picker=fs.readFileSync(new URL("../src/app/tasks/task-project-assignment.tsx",import.meta.url),"utf8");assert.match(picker,/onToggle=/);assert.match(picker,/<ProjectLinkControl/);assert.match(picker,/revision=\{p.revision\}/);assert.doesNotMatch(picker,/useEffect|useLayoutEffect/);
});


const searchTypes=compile("../src/lib/search/types.ts");
function browseHarness({signed=true,response={data:[]},offline=false}={}){
 const calls=[];const chain={select(v){calls.push(["select",v]);return this;},eq(...v){calls.push(["eq",...v]);return this;},order(v){calls.push(["order",v]);return this;},async range(...v){calls.push(["range",...v]);if(offline)throw Error("offline");return response;}};
 const actions=compile("../src/app/search/actions.ts",{"@/lib/search/types":searchTypes,"@/lib/auth/account":{getAccountContext:async()=>signed?{userId:"verified",supabase:{from(table){calls.push(["from",table]);return chain;},rpc:async(...v)=>{calls.push(["rpc",...v]);return response;}}}:null}});
 return {...actions,calls};
}
function browseForm(kind="space",query="",offset="0"){const f=new FormData();f.set("kind",kind);f.set("query",query);f.set("offset",offset);return f;}
test("record pickers browse owned rows immediately with deterministic bounded pagination",async()=>{
 for(const [kind,table]of [["space","spaces"],["task","tasks"],["page","space_pages"],["note","notes"]]){
 const h=browseHarness({response:{data:Array.from({length:21},(_,n)=>({id:project,title:"Item "+n,space_id:null,space:null}))}});const r=await h.browsePlanner(searchTypes.EMPTY_SEARCH,browseForm(kind,"","20"));assert.equal(r.items.length,20);assert.equal(r.more,true);assert.equal(r.searched,true);assert.deepEqual(h.calls[0],["from",table]);assert.ok(h.calls.some(c=>c[0]==="eq"&&c[1]==="user_id"&&c[2]==="verified"));assert.ok(h.calls.some(c=>c[0]==="range"&&c[1]===20&&c[2]===40));assert.deepEqual(h.calls.filter(c=>c[0]==="order").map(c=>c[1]),["title","id"]);
 }
});
test("picker browse authenticates, limits kinds/pages and distinguishes empty from failure",async()=>{
 const anon=browseHarness({signed:false});assert.ok((await anon.browsePlanner(searchTypes.EMPTY_SEARCH,browseForm())).error);assert.equal(anon.calls.length,0);
 for(const f of [browseForm("all"),browseForm("event"),browseForm("space","","1")]){const h=browseHarness();assert.ok((await h.browsePlanner(searchTypes.EMPTY_SEARCH,f)).error);assert.equal(h.calls.length,0);}
 for(const options of [{offline:true},{response:{error:{}}},{response:{data:null}},{response:{data:[null]}}]){const r=await browseHarness(options).browsePlanner(searchTypes.EMPTY_SEARCH,browseForm());assert.ok(r.error);assert.equal(r.searched,false);}
 const r=await browseHarness().browsePlanner(searchTypes.EMPTY_SEARCH,browseForm());assert.equal(r.searched,true);assert.equal(r.items.length,0);assert.equal(r.error,undefined);
});
test("typed picker filters reuse literal search while global blank search stays unchanged",async()=>{
 const h=browseHarness();await h.browsePlanner(searchTypes.EMPTY_SEARCH,browseForm("task","100%_"));assert.deepEqual(h.calls,[["rpc","planner_search",{p_query:"100%_",p_kind:"task",p_offset:0}]]);
 const global=browseHarness();const r=await global.searchPlanner(searchTypes.EMPTY_SEARCH,browseForm("all"));assert.equal(r.searched,false);assert.equal(global.calls.length,0);
});
test("shared picker loads on open and project type switches reload available choices",()=>{
 const space=fs.readFileSync(new URL("../src/app/components/space-picker.tsx",import.meta.url),"utf8"),link=fs.readFileSync(new URL("../src/app/knowledge/link-picker.tsx",import.meta.url),"utf8"),project=fs.readFileSync(new URL("../src/app/projects/project-item-picker.tsx",import.meta.url),"utf8");
 assert.match(space,/onToggle=/);assert.match(space,/useRecordChoices\("space"\)/);assert.doesNotMatch(space,/required/);assert.match(project,/onOpen=\{\(\)=>load\(\)\}/);assert.match(project,/load\(next\)/);assert.doesNotMatch(project,/type="search" required/);assert.match(link,/onToggle=/);assert.match(link,/state.query===query.trim\(\)/);
});
