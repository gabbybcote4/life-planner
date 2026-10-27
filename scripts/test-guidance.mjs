import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import {createRequire} from "node:module";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import * as dates from "../src/lib/calendar/dates.ts";
import * as validation from "../src/lib/shared/validation.ts";
import {withGuidanceFirst,WIDGETS,DEFAULT_LAYOUT,parseLayout} from "../src/lib/dashboard/layout.ts";
const require=createRequire(import.meta.url);
function compile(path,deps={}){
 const code=ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,loaded={exports:{}};
 new Function("require","exports",code)(name=>Object.hasOwn(deps,name)?deps[name]:require(name),loaded.exports);return loaded.exports;
}
const guidance=compile("../src/lib/dashboard/guidance.ts",{"@/lib/shared/validation":validation,"@/lib/calendar/dates":dates});
const id="ae66172a-f871-43b3-a610-a838d8b7c601",today="2026-10-27";
const task={id,title:"A saved task",due_date:null,priority:"none",space_id:null,space_title:null};
const data={open:1,overdue:0,today:0,unplanned:1,events_today:0,tasks:[task],events:[]};
test("guidance reasons distinguish evidence from urgency and respect date-only comparisons",()=>{
 assert.match(guidance.taskReason({...task,due_date:"2026-10-26"},today),/Overdue/);
 assert.equal(guidance.taskReason({...task,due_date:today},today),"Due today");
 assert.match(guidance.taskReason({...task,priority:"high"},today),/You marked this high priority/);
 assert.match(guidance.taskReason({...task,due_date:"2026-11-02"},today),/Upcoming/);
 assert.match(guidance.taskReason(task,today),/not an urgent deadline/);
});
test("malformed payloads fail rather than impersonating an empty successful result",()=>{
 assert.equal(guidance.isGuidanceData(data),true);
 for(const bad of [null,{}, {...data,open:-1},{...data,tasks:[]},{...data,tasks:[{...task,id:"bad"}]},{...data,tasks:[{...task,due_date:"2027-02-29"}]},{...data,tasks:[{...task,priority:"constructor"}]}])assert.equal(guidance.isGuidanceData(bad),false);
 assert.equal(guidance.isGuidanceData({...data,open:0,unplanned:0,tasks:[]}),true);
});
function harness(result={data},signedIn=true){
 const calls=[];return {...compile("../src/app/dashboard/guidance-actions.ts",{"@/lib/auth/account":{getAccountContext:async()=>signedIn?{supabase:{rpc:async(...args)=>{calls.push(args);return result;}},userId:"owner-a"}:null},"@/lib/calendar/dates":dates,"@/lib/dashboard/guidance":guidance}),calls};
}
function form(day=today){const f=new FormData();f.set("today",day);return f;}
test("guidance uses a verified fresh account, validates local day, and never accepts an owner",async()=>{
 const h=harness(),result=await h.loadGuidance({},form());assert.equal(result.date,today);assert.deepEqual(h.calls,[["planner_dashboard_guidance",{p_today:today}]]);
 const invalid=harness();assert.ok((await invalid.loadGuidance({},form("2101-01-01"))).error);assert.equal(invalid.calls.length,0);
 const anon=harness(undefined,false);assert.ok((await anon.loadGuidance({},form())).error);assert.equal(anon.calls.length,0);
});
test("read failures return no false zero counts or stale guidance",async()=>{
 for(const value of [{error:{code:"network"}},{data:{}},{data:null}]){const h=harness(value);const result=await h.loadGuidance({data,date:today},form());assert.ok(result.error);assert.equal(result.data,undefined);}
});
test("rendered suggestion escapes saved content, explains source, and links exact tasks",()=>{
 const ui=compile("../src/app/dashboard/guidance-widget.tsx",{"@/components/ui/desk-icon":compile("../src/components/ui/desk-icon.tsx"),"next/link":({children,...props})=>React.createElement("a",props,children),"@/components/ui/button":compile("../src/components/ui/button.tsx"),"@/components/ui/feedback":compile("../src/components/ui/feedback.tsx"),"@/lib/calendar/dates":dates,"@/lib/shared/client-actions":{},"@/lib/dashboard/guidance":guidance,"./focus-timer":{StartGuidedFocus:()=>React.createElement("button",null,"Start focus")},"./guidance-actions":{}});
 const html=renderToStaticMarkup(React.createElement(ui.GuidanceContent,{data:{...data,tasks:[{...task,title:"<script>literal</script>"}]},date:today,selected:0,onChoose(){}}));
 assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.match(html,new RegExp("tasks\\?task="+id));assert.match(html,/not an urgent deadline/);assert.match(html,/all 1 open tasks/);
 const mixed=renderToStaticMarkup(React.createElement(ui.GuidanceContent,{data:{...data,tasks:[{...task,due_date:today,priority:"high"}]},date:today,selected:0,onChoose(){}}));
 assert.match(mixed,/data-cue="today">Today/);assert.match(mixed,/guidance-priority-tag">High priority/);
 assert.match(mixed,/<details class="guidance-why"><summary>Why this\?/);
 assert.match(mixed,/<details class="guidance-logic"><summary>How suggestions work/);
});
test("widget registration expands safely without changing saved defaults",()=>{
 assert.ok(WIDGETS.guidance);assert.equal(DEFAULT_LAYOUT.length,7);assert.ok(!DEFAULT_LAYOUT.some(w=>w.id==="guidance"));
 assert.deepEqual(parseLayout([{id:"guidance",width:"full",accent:"yellow"}]),[{id:"guidance",width:"full",accent:"yellow"}]);
 assert.equal(parseLayout([{id:"guidance",width:"full",suggestion:"private"}]),null);
 const sql=fs.readFileSync(new URL("../supabase/migrations/20261027001900_dashboard_guidance.sql",import.meta.url),"utf8");
 const ids=sql.match(/widget_id not in \(([^)]+)\)/)[1];assert.deepEqual([...ids.matchAll(/'([^']+)'/g)].map(m=>m[1]).sort(),Object.keys(WIDGETS).sort());
 assert.match(sql,/security invoker/);assert.match(sql,/t.user_id=\(select auth.uid\(\)\) and not t.completed/);assert.doesNotMatch(sql,/update public\.|set default|security definer/i);
});

test("explicit guidance promotion preserves order/width/accent and never mutates a layout",()=>{
 const saved=[{id:"recent",width:"half",accent:"pink"},{id:"guidance",width:"half",accent:"mint"},{id:"timer",width:"full"}],before=JSON.stringify(saved);
 assert.deepEqual(withGuidanceFirst(saved),[saved[1],saved[0],saved[2]]);assert.equal(JSON.stringify(saved),before);
 assert.deepEqual(withGuidanceFirst([]),[{id:"guidance",width:"full"}]);
});

test("visual cue labels match their detailed evidence without inventing urgency",()=>{
 for(const [fields,label] of [[{due_date:"2026-10-26"},"Overdue"],[{due_date:today},"Today"],[{priority:"high"},"High priority"],[{due_date:"2026-11-02"},"Upcoming"],[{},"Unplanned"]]){
  assert.equal(guidance.taskCue({...task,...fields},today).label,label);
 }
 assert.equal(guidance.shortGuidanceDate(today,today),"Today");
 assert.equal(guidance.shortGuidanceDate("2026-10-28",today),"Tomorrow");
 assert.equal(guidance.shortGuidanceDate("2028-02-29",today),"Feb 29, 2028");
});
