import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import {createRequire} from "node:module";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import * as dates from "../src/lib/calendar/dates.ts";
import * as validation from "../src/lib/shared/validation.ts";
import {WIDGETS,DEFAULT_LAYOUT,parseLayout} from "../src/lib/dashboard/layout.ts";
const require=createRequire(import.meta.url),id="cf22172a-f871-43b3-a610-a838d8b7a801";
function compile(path,deps={}){const code=ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,m={exports:{}};new Function("require","exports",code)(n=>Object.hasOwn(deps,n)?deps[n]:require(n),m.exports);return m.exports;}
const types=compile("../src/lib/habits/types.ts",{"../calendar/dates":dates,"../shared/validation":validation});
function form(extra={}){const f=new FormData();for(const[k,v]of Object.entries({id,title:"Walk",kind:"check",target:"1",unit:"done",schedule:"daily",weekly_goal:"3",space_id:"",start_date:"2026-10-27",paused:"false",revision:"0",...extra}))f.set(k,v);return f;}
const habit={id,title:"Walk",kind:"check",target:1,unit:"done",schedule:"daily",weekly_goal:3,weekdays:[],space_id:null,space_title:null,start_date:"2026-10-27",paused:false,revision:1,week_done:0,log:null};
function harness(result={data:{revision:1}},signedIn=true){const calls=[],invalidations=[];const actions=compile("../src/app/habits/actions.ts",{"next/cache":{revalidatePath:p=>invalidations.push(p)},"@/lib/auth/account":{getAccountContext:async()=>signedIn?{userId:"verified",supabase:{rpc:async(...a)=>{calls.push(a);return result;}}}:null},"@/lib/calendar/dates":dates,"@/lib/shared/validation":validation,"@/lib/habits/types":types});return {...actions,calls,invalidations};}
test("presets and strict settings keep title-only choices simple without silent amount truncation",()=>{
 for(const p of types.HABIT_PRESETS)assert.ok(types.parseHabit(form({...p,target:String(p.target)})));
 assert.equal(types.parseHabit(form()).target,1);
 const f=form({kind:"amount",target:"0.25",unit:"km",schedule:"weekdays"});f.append("weekdays","1");f.append("weekdays","5");assert.deepEqual(types.parseHabit(f).weekdays,[1,5]);
 for(const bad of [{title:" "},{target:"1.234"},{target:"0"},{target:"1e3"},{schedule:"unknown"},{schedule:"weekdays"},{weekly_goal:"8"},{space_id:"bad"},{start_date:"2027-02-29"},{kind:"bad"},{paused:"yes"}])assert.equal(types.parseHabit(form(bad)),null);
 const duplicate=form();duplicate.append("weekdays","1");duplicate.append("weekdays","1");assert.equal(types.parseHabit(duplicate),null);
 for(const bad of ["-1","NaN","1000001","1.001",{},null])assert.equal(types.parseAmount(bad),null);
});
test("daily, weekday and weekly cues use explicit local date strings, start dates and paused state",()=>{
 assert.equal(types.isHabitDue(habit,"2026-10-27"),true);assert.equal(types.isHabitDue(habit,"2026-10-26"),false);
 assert.equal(types.isHabitDue({...habit,paused:true},"2026-10-27"),false);
 assert.equal(types.isHabitDue({...habit,schedule:"weekdays",weekdays:[2]},"2026-10-27"),true);
 assert.equal(types.isHabitDue({...habit,schedule:"weekdays",weekdays:[1]},"2026-10-27"),false);
 assert.equal(types.isHabitDue({...habit,schedule:"weekly",week_done:3},"2026-10-27"),false);
 assert.equal(types.isHabitDue({...habit,schedule:"weekly",week_done:2},"2026-10-27"),true);
 assert.equal(types.scheduleLabel({...habit,schedule:"weekly"}),"3 days / week");assert.equal(types.isHabitDue(habit,"bad"),false);
});
test("day response validation rejects malformed, duplicate and contradictory saved snapshots",()=>{
 assert.ok(types.isHabitDayResult({items:[habit],total:1}));assert.ok(types.isHabitDayResult({items:[],total:0}));
 for(const patch of [{id:"bad"},{week_done:8},{revision:0},{kind:"check",target:2},{weekdays:[null]},{log:{amount:2,target:1,kind:"check",unit:"done",revision:1}},{start_date:"bad"}])assert.equal(types.isHabitDayResult({items:[{...habit,...patch}],total:1}),false);
 assert.equal(types.isHabitDayResult({items:[habit,habit],total:2}),false);assert.equal(types.isHabitDayResult({items:[habit],total:0}),false);
});
test("habit saves send only validated settings to the authenticated invoker RPC",async()=>{
 const h=harness();assert.equal((await h.saveHabit({},form())).revision,1);assert.equal(h.calls[0][0],"planner_save_habit");assert.deepEqual(Object.keys(h.calls[0][1]).sort(),["p_id","p_revision","p_settings"]);assert.equal(h.calls[0][1].p_settings.space_id,null);assert.deepEqual(h.invalidations,["/habits","/","/spaces"]);
 const anon=harness({},false);assert.ok((await anon.saveHabit({},form())).error);assert.equal(anon.calls.length,0);
 const bad=harness();assert.ok((await bad.saveHabit({},form({target:"1.111"}))).error);assert.equal(bad.calls.length,0);
});
test("check-ins preserve separate habit and log revisions, with no owner or target supplied by the browser",async()=>{
 const h=harness({data:{revision:2}}),f=form({day:"2026-10-27",amount:"2.5",habit_revision:"3",revision:"1"});assert.equal((await h.checkHabit({},f)).revision,2);
 assert.deepEqual(h.calls,[["planner_check_habit",{p_id:id,p_day:"2026-10-27",p_amount:2.5,p_revision:1,p_habit_revision:3}]]);
 const bad=harness();assert.ok((await bad.checkHabit({},form({day:"bad",amount:"1",habit_revision:"1"}))).error);assert.equal(bad.calls.length,0);
});
test("failed or ambiguous mutations never announce success or invalidate cached pages",async()=>{
 for(const result of [{error:{code:"40001"}},{data:null},{data:{revision:0}},{data:{revision:"1"}}]){const h=harness(result);assert.ok((await h.saveHabit({},form())).error);assert.equal(h.invalidations.length,0);}
});
test("day loading is bounded, date-validated and owner-free, with honest error states",async()=>{
 const h=harness({data:{items:[habit],total:1}});const f=form({day:"2026-10-27",offset:"0"});assert.equal((await h.loadHabitDay(f)).items.length,1);assert.deepEqual(h.calls,[["planner_habit_day",{p_day:"2026-10-27",p_offset:0}]]);
 const bad=harness({data:{items:[{id:"bad"}],total:1}});assert.ok((await bad.loadHabitDay(f)).error);assert.ok((await h.loadHabitDay(form({day:"2026-10-27",offset:"-1"}))).error);
});
test("habits widget is optional and SQL registry matches without rewriting saved defaults",()=>{
 assert.ok(WIDGETS.habits);assert.equal(DEFAULT_LAYOUT.length,7);assert.ok(!DEFAULT_LAYOUT.some(w=>w.id==="habits"));assert.deepEqual(parseLayout([{id:"habits",width:"half"}]),[{id:"habits",width:"half"}]);
 const sql=fs.readFileSync(new URL("../supabase/migrations/20261027002100_habits.sql",import.meta.url),"utf8");const ids=sql.match(/widget_id not in \(([^)]+)\)/)[1];assert.deepEqual([...ids.matchAll(/'([^']+)'/g)].map(m=>m[1]).sort(),Object.keys(WIDGETS).sort());
 assert.doesNotMatch(sql,/security definer|update public\.dashboard_layouts/i);assert.match(sql,/for share/);assert.match(sql,/p_habit_revision is distinct from h.revision/);assert.match(sql,/grant update\(amount\)/);assert.match(sql,/new.target=h.target/);assert.match(sql,/force row level security/);assert.match(sql,/p_amount<>round\(p_amount,2\)/);
});
test("habit surfaces prerender without a clock and offer real preset fields through the shared editor",()=>{
 const buttons=compile("../src/components/ui/button.tsx"),fields=compile("../src/components/ui/fields.tsx"),feedback=compile("../src/components/ui/feedback.tsx");
 const deps={"@/components/ui/button":buttons,"@/components/ui/fields":fields,"@/components/ui/feedback":feedback,"@/app/components/space-picker":{SpacePicker:()=>React.createElement("div",null,"Choose space")},"@/lib/shared/request-id":{},"@/lib/shared/client-actions":{},"@/lib/habits/types":types,"./actions":{}};
 const {HabitForm}=compile("../src/app/habits/habit-form.tsx",deps);const html=renderToStaticMarkup(React.createElement(HabitForm,{today:"2026-10-27",onSaved(){}}));assert.match(html,/Drink water/);assert.match(html,/Choose weekdays/);assert.match(html,/name="revision" value="0"/);assert.match(html,/Choose space/);
 const dialogs=compile("../src/components/ui/edit-dialog.tsx",{"./button":buttons,"./desktop-window":compile("../src/components/ui/desktop-window.tsx")});
 const {HabitsView}=compile("../src/app/habits/habits-view.tsx",{...deps,"next/link":({children,...p})=>React.createElement("a",p,children),"@/components/ui/edit-dialog":dialogs,"@/lib/calendar/dates":{localToday(){throw Error("Clock in render");}},"./habit-form":{HabitForm}});
 assert.match(renderToStaticMarkup(React.createElement(HabitsView)),/Opening your habits/);
});
test("habit creation signals completion only after a confirmed successful save",async()=>{
 for(const result of [{error:"Offline"},{},{revision:1}]){
  let submit,saved=0;const writes=[];
  const react={...React,useId:()=>"habit-test",useRef:v=>({current:v}),useState:v=>[v,x=>writes.push(x)],useActionState:fn=>{submit=fn;return [{},()=>{},false];}};
  const {HabitForm}=compile("../src/app/habits/habit-form.tsx",{"react":react,"@/components/ui/button":{},"@/components/ui/fields":{},"@/components/ui/feedback":{},"@/app/components/space-picker":{},"@/lib/shared/request-id":{createRequestId:()=>id},"@/lib/shared/client-actions":{runAction:fn=>fn()},"@/lib/habits/types":types,"./actions":{saveHabit:async()=>result}});
  HabitForm({today:"2026-10-28",onSaved(){saved++;}});await submit({},form());assert.equal(saved,result.revision?1:0);
 }
});

test("dialog success signal closes after confirmation while ordinary close still blocks pending forms",()=>{
 for(const signal of [undefined,0,1]){
  const effects=[];let closed=0;const node={open:true,close(){closed++;},querySelector(){return {};}};
  const react={...React,useId:()=>"dialog-test",useState:()=>[node,()=>{}],useEffect:fn=>effects.push(fn)};
  const {EditDialog}=compile("../src/components/ui/edit-dialog.tsx",{"react":react,"./button":{},"./desktop-window":{}});
  const tree=EditDialog({title:"Create habit",closeAfterSave:signal,children:null});
  effects.forEach(fn=>fn());assert.equal(closed,signal?1:0);
  tree.props.children[1].props.onCancel({preventDefault(){}});assert.equal(closed,signal?1:0);
 }
});