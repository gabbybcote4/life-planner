import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import {createRequire} from "node:module";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import * as timer from "../src/lib/timer/timer.ts";
import {WIDGETS,DEFAULT_LAYOUT,parseLayout,moveWidget,setWidgetAccent} from "../src/lib/dashboard/layout.ts";
const require=createRequire(import.meta.url);
test("session defaults, minute validation and display boundaries",()=>{
 assert.equal(timer.createTimer().remainingMs,1500000);
 assert.equal(timer.createTimer("short").durationMs,300000);
 assert.equal(timer.createTimer("long").durationMs,900000);
 for(const value of ["1","25","180"])assert.equal(timer.parseTimerMinutes(value),Number(value));
 for(const value of [null,"","0","01","181","1.5","1e2","-1",{},["25"]])assert.equal(timer.parseTimerMinutes(value),null);
 for(const [ms,expected]of [[0,"00:00"],[1,"00:01"],[60000,"01:00"],[3599000,"59:59"],[10800000,"180:00"]])assert.equal(timer.formatTimer(ms),expected);
});
test("deadline calculation catches up after throttling or time away without tick drift",()=>{
 let state=timer.timerReducer(timer.createTimer(),{type:"start",now:1000});
 assert.equal(state.endsAt,1501000);
 state=timer.timerReducer(state,{type:"tick",now:601000});assert.equal(state.remainingMs,900000);
 state=timer.timerReducer(state,{type:"tick",now:1501500});assert.equal(state.remainingMs,0);assert.equal(state.status,"complete");assert.equal(state.endsAt,null);
 assert.equal(timer.timerReducer(state,{type:"tick",now:9999999}),state);
});
test("pause/resume preserves subsecond remaining time and does not count paused time",()=>{
 let state=timer.timerReducer(timer.createTimer("short"),{type:"start",now:1000});
 state=timer.timerReducer(state,{type:"pause",now:2234});assert.equal(state.remainingMs,298766);assert.equal(state.status,"paused");
 assert.equal(timer.timerRemaining(state,999999),298766);
 state=timer.timerReducer(state,{type:"start",now:1000000});assert.equal(state.endsAt,1298766);
 state=timer.timerReducer(state,{type:"tick",now:1001000});assert.equal(state.remainingMs,297766);
});
test("reset, mode and custom length are explicit and cannot switch a running session",()=>{
 let state=timer.timerReducer(timer.createTimer(),{type:"duration",minutes:1});
 state=timer.timerReducer(state,{type:"start",now:0});
 assert.equal(timer.timerReducer(state,{type:"mode",mode:"long"}),state);
 assert.equal(timer.timerReducer(state,{type:"duration",minutes:3}),state);
 state=timer.timerReducer(state,{type:"pause",now:2500});
 const reset=timer.timerReducer(state,{type:"reset"});assert.equal(reset.durationMs,60000);assert.equal(reset.status,"ready");
 state=timer.timerReducer(reset,{type:"mode",mode:"long"});assert.equal(state.durationMs,900000);
 for(const minutes of [0,181,2.5,NaN,Infinity])assert.equal(timer.timerReducer(state,{type:"duration",minutes}),state);
});
test("completion never starts the next session and start-again uses selected duration",()=>{
 let state=timer.timerReducer(timer.createTimer("short"),{type:"start",now:0});
 state=timer.timerReducer(state,{type:"pause",now:300001});assert.equal(state.status,"complete");
 state=timer.timerReducer(state,{type:"start",now:500000});assert.equal(state.endsAt,800000);assert.equal(state.remainingMs,300000);assert.equal(state.mode,"short");
 assert.equal(timer.timerReducer(state,{type:"tick",now:NaN}),state);
 assert.equal(timer.timerRemaining(state,-100000),state.durationMs);
});
test("timer is optional and preserves existing defaults, metadata, and layout validation",()=>{
 assert.ok(WIDGETS.timer);assert.equal(DEFAULT_LAYOUT.length,7);assert.ok(!DEFAULT_LAYOUT.some(w=>w.id==="timer"));
 const saved=[{id:"recent",width:"full"},{id:"timer",width:"half",accent:"mint"}],before=JSON.stringify(saved);
 assert.deepEqual(parseLayout(saved),saved);assert.deepEqual(moveWidget(saved,"timer",-1),[saved[1],saved[0]]);
 assert.equal(setWidgetAccent(saved,"timer","blue")[1].accent,"blue");assert.equal(JSON.stringify(saved),before);
 assert.equal(parseLayout([{id:"timer",width:"half",remainingMs:1000}]),null);
 assert.equal(parseLayout([{id:"timer",width:"half"},{id:"timer",width:"full"}]),null);
 const sql=fs.readFileSync(new URL("../supabase/migrations/20261027001700_focus_timer_widget.sql",import.meta.url),"utf8");
 const ids=sql.match(/widget_id not in \(([^)]+)\)/)[1];
 assert.deepEqual([...ids.matchAll(/'([^']+)'/g)].map(m=>m[1]).sort(),Object.keys(WIDGETS).filter(id=>id!=="guidance").sort());
 assert.match(sql,/jsonb_array_length\(candidate\) > 8/);assert.doesNotMatch(sql,/update public\.dashboard_layouts|set default/i);
});
test("actual timer can prerender with no clock reads and uses labeled native controls",()=>{
 const deps={"@/components/ui/edit-dialog":editDialogs,"next/link":({children,...props})=>React.createElement("a",props,children),"@/components/ui/button":compile("../src/components/ui/button.tsx"),"@/components/ui/fields":compile("../src/components/ui/fields.tsx"),"@/components/ui/feedback":compile("../src/components/ui/feedback.tsx"),"@/lib/timer/timer":timer};
 const ui=compile("../src/app/dashboard/focus-timer.tsx",deps),old=Date.now;
 try{
 Date.now=()=>{throw Error("Live clock during prerender");};
 const html=renderToStaticMarkup(React.createElement(ui.FocusTimerProvider,null,React.createElement(ui.FocusTimerWidget)));
 assert.match(html,/25:00/);assert.match(html,/aria-label="Time remaining"/);assert.match(html,/aria-live="off"/);assert.match(html,/min="1"/);assert.match(html,/max="180"/);
 assert.match(html,/>Start</);assert.match(html,/>Reset</);assert.match(html,/Short break/);assert.doesNotMatch(html,/localStorage|Notification/);
 }finally{Date.now=old;}
});
function compile(path,deps={}){
 const code=ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,loaded={exports:{}};
 new Function("require","exports",code)(name=>Object.hasOwn(deps,name)?deps[name]:require(name),loaded.exports);return loaded.exports;
}

const editDialogs=compile("../src/components/ui/edit-dialog.tsx",{"./button":compile("../src/components/ui/button.tsx"),"./desktop-window":compile("../src/components/ui/desktop-window.tsx")});
