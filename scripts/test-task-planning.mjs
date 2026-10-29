import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import {createRequire} from "node:module";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import * as types from "../src/lib/tasks/types.ts";
import * as dates from "../src/lib/calendar/dates.ts";
import * as validation from "../src/lib/shared/validation.ts";
const require=createRequire(import.meta.url),id="ae66172a-f871-43b3-a610-a838d8b7c501";
function compile(path,deps={}){
 const code=ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,loaded={exports:{}};
 new Function("require","exports",code)(name=>Object.hasOwn(deps,name)?deps[name]:require(name),loaded.exports);return loaded.exports;
}
function harness(result={data:{planning_revision:2}},{signedIn=true}={}){
 const calls=[],invalidations=[];
 const supabase={from(table){calls.push(["from",table]);return {update(value){calls.push(["update",value]);return this;},eq(k,v){calls.push(["eq",k,v]);return this;},select(value){calls.push(["select",value]);return this;},maybeSingle:async()=>result};}};
 const actions=compile("../src/app/tasks/planning-actions.ts",{"next/cache":{revalidatePath:path=>invalidations.push(path)},"@/lib/auth/account":{getAccountContext:async()=>signedIn?{supabase,userId:"owner-a"}:null},"@/lib/shared/validation":validation,"@/lib/calendar/dates":dates,"@/lib/tasks/types":types});
 return {...actions,calls,invalidations};
}
function form(extra={}){const f=new FormData();for(const[k,v]of Object.entries({id,due_date:"2028-02-29",priority:"high",revision:"1",...extra}))f.set(k,v);return f;}
test("priorities are an explicit strict allowlist with a neutral quick-capture default",()=>{
 assert.deepEqual(Object.keys(types.TASK_PRIORITIES),["none","low","medium","high"]);
 for(const key of Object.keys(types.TASK_PRIORITIES))assert.equal(types.parseTaskPriority(key),key);
 for(const bad of [null,{},"constructor","__proto__","urgent","HIGH","high;display:none"])assert.equal(types.parseTaskPriority(bad),null);
});
test("planning saves only date/priority with owner and revision guards",async()=>{
 const h=harness();assert.equal((await h.saveTaskPlanning({},form())).revision,2);
 assert.deepEqual(h.calls.find(c=>c[0]==="update")[1],{due_date:"2028-02-29",priority:"high"});
 for(const [key,value] of [["id",id],["user_id","owner-a"],["planning_revision",1]])assert.ok(h.calls.some(c=>c[0]==="eq"&&c[1]===key&&c[2]===value));
 assert.deepEqual(h.invalidations,["/","/tasks","/spaces","/search"]);
});
test("clearing planning is explicit and writes null date with none priority",async()=>{
 const h=harness();assert.ok((await h.saveTaskPlanning({},form({due_date:"",priority:"none"}))).message);
 assert.deepEqual(h.calls.find(c=>c[0]==="update")[1],{due_date:null,priority:"none"});
});
test("bad dates, positions, revisions and identities are rejected before account access",async()=>{
 for(const extra of [{due_date:"2027-02-29"},{due_date:"1899-12-31"},{due_date:"2101-01-01"},{due_date:"2028-02-29T00:00:00Z"},{priority:"constructor"},{revision:"0"},{revision:"01"},{revision:"1e2"},{id:"foreign-or-malformed"}]){
  const h=harness();assert.ok((await h.saveTaskPlanning({},form(extra))).error);assert.equal(h.calls.length,0);
 }
 const h=harness(),f=form();f.delete("due_date");assert.ok((await h.saveTaskPlanning({},f)).error);assert.equal(h.calls.length,0);
});
test("stale, missing, expired and failed saves do not announce success or refresh data",async()=>{
 for(const result of [{data:null},{error:{code:"offline"}}]){const h=harness(result);assert.ok((await h.saveTaskPlanning({},form())).error);assert.equal(h.invalidations.length,0);}
 const h=harness(undefined,{signedIn:false});assert.ok((await h.saveTaskPlanning({},form())).error);assert.equal(h.calls.length,0);
});
test("task projections carry planning into all existing shared list destinations",()=>{
 for(const column of ["due_date","priority","planning_revision"])assert.ok(types.TASK_SELECT.includes(column));
 const selected=fs.readFileSync(new URL("../src/lib/tasks/selected-task.ts",import.meta.url),"utf8");assert.match(selected,/select\(TASK_SELECT\)/);
 const board=fs.readFileSync(new URL("../src/app/tasks/task-board.tsx",import.meta.url),"utf8");assert.match(board,/<TaskPlanning task=\{task\}/);
});
test("actual planning controls render optional labeled fields and date-only metadata",()=>{
 const deps={"@/components/ui/edit-dialog":editDialogs,"@/components/ui/button":compile("../src/components/ui/button.tsx"),"@/components/ui/fields":compile("../src/components/ui/fields.tsx"),"@/components/ui/feedback":compile("../src/components/ui/feedback.tsx"),"@/lib/shared/client-actions":{},"@/lib/tasks/types":types,"@/lib/calendar/dates":dates,"./planning-actions":{}};
 const {TaskPlanning}=compile("../src/app/tasks/task-planning.tsx",deps);
 const html=renderToStaticMarkup(React.createElement(TaskPlanning,{task:{id,title:"Task",completed:false,due_date:"2028-02-29",priority:"high",planning_revision:4},disabled:false}));
 assert.match(html,/dateTime="2028-02-29"/i);assert.match(html,/February 29, 2028/);assert.match(html,/High priority/);assert.match(html,/type="date"/);assert.match(html,/min="1900-01-01"/);assert.match(html,/max="2100-12-31"/);
 assert.match(html,/Save task plan/);assert.match(html,/name="revision" value="4"/);
 const plain=renderToStaticMarkup(React.createElement(TaskPlanning,{task:{id,title:"<literal>",completed:false},disabled:true}));assert.match(plain,/Add a date or priority/);assert.match(plain,/<fieldset disabled=""/);
});
test("database priorities match app and migration leaves old rows and ownership policies alone",()=>{
 const sql=fs.readFileSync(new URL("../supabase/migrations/20261027001800_task_planning.sql",import.meta.url),"utf8");
 const list=sql.match(/priority in \(([^)]+)\)/)[1];assert.deepEqual([...list.matchAll(/'([^']+)'/g)].map(m=>m[1]).sort(),Object.keys(types.TASK_PRIORITIES).sort());
 assert.match(sql,/default 'none'/);assert.match(sql,/grant update\(due_date,priority\)/);
 assert.doesNotMatch(sql,/update public\.tasks|create policy|drop|grant.*planning_revision/i);
 assert.match(sql,/new.due_date is distinct from old.due_date or new.priority is distinct from old.priority/);
});

test("task table reuses real completion, planning and relation controls without copying source records",()=>{
 const planning=compile("../src/app/tasks/task-planning.tsx",{"@/components/ui/button":compile("../src/components/ui/button.tsx"),"@/components/ui/fields":compile("../src/components/ui/fields.tsx"),"@/components/ui/feedback":compile("../src/components/ui/feedback.tsx"),"@/lib/shared/client-actions":{},"@/lib/tasks/types":types,"@/lib/calendar/dates":dates,"./planning-actions":{}});
 const board=compile("../src/app/tasks/task-board.tsx",{"@/components/ui/edit-dialog":editDialogs,"./task-planning":planning,"@/lib/shared/request-id":{},"@/lib/shared/client-actions":{},"next/link":({children,...props})=>React.createElement("a",props,children),"@/app/components/planning-preferences":{DateLabel:({date})=>date},"./task-project-assignment":{TaskProjectAssignment:()=>React.createElement("button",null,"Choose projects")},"./task-space-assignment":{TaskSpaceAssignment:()=>React.createElement("button",null,"Assign a space")},"@/components/ui/empty-state":compile("../src/components/ui/empty-state.tsx"),"@/components/ui/feedback":compile("../src/components/ui/feedback.tsx"),"@/components/ui/fields":compile("../src/components/ui/fields.tsx"),"@/components/ui/button":compile("../src/components/ui/button.tsx"),"./actions":{},"@/lib/tasks/types":types});
 const task={id,title:"<b>Saved task</b>",completed:true,due_date:"2028-02-29",priority:"high",planning_revision:4,space_id:id,space:{title:"Work"},projects:[{id,title:"<b>Project</b>"}],project_count:4};
 const html=renderToStaticMarkup(React.createElement(board.TaskList,{tasks:[task],table:true}));
 assert.match(html,/<table[^>]+role="table"/);assert.match(html,/scope="col"/);assert.match(html,/scope="row"/);
 assert.match(html,/aria-checked="true"/);assert.match(html,/&lt;b&gt;Saved task&lt;\/b&gt;/);assert.doesNotMatch(html,/<b>Saved task/);
 assert.match(html,/February 29, 2028/);assert.match(html,/name="revision" value="4"/);assert.match(html,/High priority/);assert.match(html,/Assign a space/);assert.match(html,/Choose projects/);assert.match(html,/&lt;b&gt;Project&lt;\/b&gt;/);assert.match(html,/3 more/);assert.match(html,/data-label="Projects"/);assert.match(html,/href="\/spaces\?space=/);
 const list=renderToStaticMarkup(React.createElement(board.TaskList,{tasks:[task]}));assert.match(list,/<ul[^>]+aria-label="Saved tasks"/);assert.doesNotMatch(list,/<table/);
 const empty=renderToStaticMarkup(React.createElement(board.TaskBoard,{tasks:[],hasMore:false}));assert.match(empty,/Add your first task/);assert.doesNotMatch(empty,/<table/);
 const capped=renderToStaticMarkup(React.createElement(board.TaskBoard,{tasks:[task],hasMore:true}));assert.match(capped,/200 most recent/);assert.match(capped,/<table/);
});

const editDialogs=compile("../src/components/ui/edit-dialog.tsx",{"./button":compile("../src/components/ui/button.tsx"),"./desktop-window":compile("../src/components/ui/desktop-window.tsx")});
