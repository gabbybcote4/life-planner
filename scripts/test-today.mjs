import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import {createRequire} from "node:module";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import * as dates from "../src/lib/calendar/dates.ts";
import * as validation from "../src/lib/shared/validation.ts";
const require=createRequire(import.meta.url),id="f8a3d661-4d7b-43af-98e1-6d2658ad9101",day="2026-10-28";
function compile(path,deps={}){const code=ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,m={exports:{}};new Function("require","exports",code)(n=>Object.hasOwn(deps,n)?deps[n]:require(n),m.exports);return m.exports;}
const habits=compile("../src/lib/habits/types.ts",{"../calendar/dates":dates,"../shared/validation":validation});
const types=compile("../src/lib/today/types.ts",{"../shared/validation":validation,"../calendar/dates":dates,"../habits/types":habits});
const task={id,title:"<script>Task</script>",completed:false,created_at:"2020-01-01",due_date:day,priority:"high",planning_revision:2,space_id:null,space:null};
const habit={id,title:"Habit",kind:"check",target:1,unit:"done",schedule:"daily",weekly_goal:3,weekdays:[],space_id:null,space_title:null,start_date:"2026-10-27",paused:false,revision:1,week_done:0,log:null};
const data={tasks:[task],habits:[habit],events:[{id,title:"<script>Event</script>",event_date:day}],counts:{tasks:7,overdue:3,habits:1,habits_done:0,events:6,undated:2}};
function form(extra={}){const f=new FormData();for(const[k,v]of Object.entries({day,tasks:"0",habits:"0",events:"0",...extra}))f.set(k,v);return f;}
function harness(result={data},signedIn=true){const calls=[];const actions=compile("../src/app/today/actions.ts",{"@/lib/auth/account":{getAccountContext:async()=>signedIn?{userId:"verified",supabase:{rpc:async(...a)=>{calls.push(a);return result;}}}:null},"@/lib/calendar/dates":dates,"@/lib/today/types":types});return {...actions,calls};}
test("Today validates bounded independent pages and rejects malformed source records",()=>{
 for(const n of ["0","5","999980"])assert.equal(types.parseTodayOffset(n),Number(n));for(const n of ["1","-5","1000000","5.0","05",null])assert.equal(types.parseTodayOffset(n),null);
 assert.ok(types.isTodayData(data,day));
 for(const bad of [{...data,tasks:[null]},{...data,events:[null]},{...data,tasks:[{...task,due_date:"2026-10-29"}]},{...data,tasks:[{...task,completed:true}]},{...data,events:[{...data.events[0],event_date:"2026-10-27"}]},{...data,habits:[{id:"bad"}]},{...data,counts:{...data.counts,habits_done:2}},{...data,tasks:[task,task]}])assert.equal(types.isTodayData(bad,day),false);
});
test("empty successful days stay distinct from failed or ambiguous loads",async()=>{
 const empty={tasks:[],habits:[],events:[],counts:{tasks:0,overdue:0,habits:0,habits_done:0,events:0,undated:0}};
 assert.ok(types.isTodayData(empty,day));assert.ok((await harness({data:empty}).loadToday(form())).data);
 for(const response of [{error:{code:"network"}},{data:null},{data:{}}]){const result=await harness(response).loadToday(form());assert.ok(result.error);assert.equal(result.data,undefined);}
});
test("Today reads use fresh authentication and send dates/pages without caller ownership",async()=>{
 const h=harness(),result=await h.loadToday(form({tasks:"5",events:"10"}));assert.equal(result.day,day);assert.deepEqual(h.calls,[["planner_today",{p_day:day,p_tasks_offset:5,p_habits_offset:0,p_events_offset:10}]]);
 const anon=harness({},false);assert.ok((await anon.loadToday(form())).error);assert.equal(anon.calls.length,0);
 const bad=harness();assert.ok((await bad.loadToday(form({day:"2027-02-29"}))).error);assert.ok((await bad.loadToday(form({habits:"1"}))).error);assert.equal(bad.calls.length,0);
});
test("Today aggregation stays read-only, owner-scoped and based on complete source sets",()=>{
 const sql=fs.readFileSync(new URL("../supabase/migrations/20261028002200_today.sql",import.meta.url),"utf8");assert.match(sql,/stable security invoker/);assert.doesNotMatch(sql,/security definer|\b(insert|update|delete|alter table|create table)\b/i);
 assert.match(sql,/t.user_id=auth.uid\(\) and not t.completed and t.due_date<=p_day/);assert.match(sql,/where user_id=auth.uid\(\) and event_date=p_day/);assert.match(sql,/where h.user_id=auth.uid\(\)/);assert.match(sql,/limit 5 offset p_tasks_offset/);assert.match(sql,/select count\(\*\) from tasks/);assert.match(sql,/log is not null or \(not paused/);assert.match(sql,/w.amount>=w.target/);assert.match(sql,/revoke all.*from public,anon/);
});
const buttons=compile("../src/components/ui/button.tsx"),feedback=compile("../src/components/ui/feedback.tsx"),fields=compile("../src/components/ui/fields.tsx");
function renderToday(source){let n=0;const react={...React,useState:()=>[[day,{tasks:0,habits:0,events:0},0][n++],()=>{}],useEffect(){},useActionState:()=>[{day,offsets:{tasks:0,habits:0,events:0},...source},()=>{},false]};
 const {TodayView}=compile("../src/app/today/today-view.tsx",{"react":react,"next/link":({children,...p})=>React.createElement("a",p,children),"@/components/ui/button":buttons,"@/components/ui/edit-dialog":{EditDialog:({title})=>React.createElement("button",{"aria-label":title},"Edit")},"@/app/calendar/calendar-events":{EventForm:()=>null},"@/components/ui/desk-icon":compile("../src/components/ui/desk-icon.tsx"),"@/lib/calendar/dates":{localToday(){throw Error("Clock in render");}},"@/lib/shared/client-actions":{},"@/lib/today/types":types,"./actions":{},"@/app/tasks/task-board":{TaskList:({tasks,onChanged})=>{assert.equal(typeof onChanged,"function");return React.createElement("ul",null,tasks.map(t=>React.createElement("li",{key:t.id},t.title)));}},"@/app/habits/habits-view":{HabitCard:({habit,onSaved})=>{assert.equal(typeof onSaved,"function");return React.createElement("article",null,habit.title);}}});return renderToStaticMarkup(React.createElement(TodayView));}
test("visual Today shows source types, full counts, paging and safe context links",()=>{
 const html=renderToday({data});assert.match(html,/Tasks due/);assert.match(html,/3 overdue/);assert.match(html,/0 checked/);assert.match(html,/All-day/);assert.match(html,/href="\/calendar\?date=2026-10-28"/);assert.match(html,/Undated tasks/);assert.match(html,/&lt;script&gt;Task/);assert.match(html,/&lt;script&gt;Event/);assert.doesNotMatch(html,/<script>Task|<script>Event/);assert.match(html,/Task pages/);assert.match(html,/Calendar pages/);assert.match(html,/1–5 \/ 7/);
});
test("Today failures do not render false zero counters, and read failures label previous results",()=>{
 const html=renderToday({error:"Setup needed"});assert.match(html,/role="alert"/);assert.doesNotMatch(html,/Jump to daily sections|No tasks due/);
 const previous=renderToday({data,error:"Refresh failed"});assert.match(previous,/Showing previous results/);assert.match(previous,/&lt;script&gt;Task/);
});
test("Today can prerender without a local clock or unverified source counts",()=>{
 const {TodayView}=compile("../src/app/today/today-view.tsx",{"next/link":({children,...p})=>React.createElement("a",p,children),"@/components/ui/button":buttons,"@/components/ui/edit-dialog":{EditDialog:({title})=>React.createElement("button",{"aria-label":title},"Edit")},"@/app/calendar/calendar-events":{EventForm:()=>null},"@/components/ui/desk-icon":{},"@/lib/calendar/dates":{localToday(){throw Error("Clock in render");}},"@/lib/shared/client-actions":{},"@/lib/today/types":types,"./actions":{},"@/app/tasks/task-board":{},"@/app/habits/habits-view":{}});const html=renderToStaticMarkup(React.createElement(TodayView));assert.match(html,/Opening your day/);assert.doesNotMatch(html,/Tasks due/);
});
test("shared task completion refreshes Today only after confirmed success",async()=>{
 for(const result of [{message:"Saved"},{error:"Offline"}]){
  let submit,changed=0;const react={...React,useState:v=>[v,()=>{}],useActionState:fn=>{submit=fn;return [{},()=>{},false];}};
  const board=compile("../src/app/tasks/task-board.tsx",{"react":react,"./task-planning":{},"@/lib/shared/request-id":{},"@/lib/shared/client-actions":{runAction:fn=>fn()},"next/link":{},"./task-space-assignment":{},"@/components/ui/edit-dialog":{},"@/components/ui/empty-state":{},"@/components/ui/feedback":feedback,"@/components/ui/fields":fields,"@/components/ui/button":buttons,"@/components/ui/edit-dialog":{EditDialog:({title})=>React.createElement("button",{"aria-label":title},"Edit")},"@/app/calendar/calendar-events":{EventForm:()=>null},"./actions":{setTaskCompleted:async()=>result},"@/lib/tasks/types":{}});
  const tree=board.TaskList({tasks:[task],onChanged(){changed++;}}),row=tree.props.children[0];row.type(row.props);await submit({},new FormData());assert.equal(changed,result.error?0:1);
 }
});