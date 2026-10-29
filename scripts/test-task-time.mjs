import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as clock from '../src/lib/tasks/time.ts';
import * as types from '../src/lib/tasks/types.ts';
import * as dates from '../src/lib/calendar/dates.ts';
import * as validation from '../src/lib/shared/validation.ts';
const require=createRequire(import.meta.url),id='fe66172a-f871-43b3-a610-a838d8b7c501';
function load(path,deps={}){const code=ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,m={exports:{}};new Function('require','exports',code)(n=>Object.hasOwn(deps,n)?deps[n]:require(n),m.exports);return m.exports;}
const recurrence=load('../src/lib/tasks/recurrence.ts',{'../calendar/dates':dates});
function form(extra={}){const f=new FormData();for(const[k,v]of Object.entries({id,due_date:'2026-03-08',due_time:'09:30',due_timezone:'America/Edmonton',priority:'none',repeat_frequency:'daily',revision:'1',...extra}))f.set(k,v);return f;}
function harness(result={data:{planning_revision:2}},signed=true){const calls=[];const query={update(value){calls.push(['update',value]);return this;},eq(...args){calls.push(['eq',...args]);return this;},select(){return this;},maybeSingle:async()=>result};return {...load('../src/app/tasks/planning-actions.ts',{'next/cache':{revalidatePath:()=>{}},'@/lib/auth/account':{getAccountContext:async()=>signed?{userId:'verified-owner',supabase:{from:()=>query}}:null},'@/lib/shared/validation':validation,'@/lib/calendar/dates':dates,'@/lib/tasks/types':types,'@/lib/tasks/time':clock,'@/lib/tasks/recurrence':recurrence}),calls};}
test('task clocks accept minute precision and reject impossible or offset-based inputs',()=>{
 for(const input of ['00:00','12:00','23:59','09:30:00'])assert.ok(clock.parseTaskTime(input));
 for(const input of [null,'','24:00','9:00','12:60','09:30:01','09:30Z','09:30-06:00',{}])assert.equal(clock.parseTaskTime(input),null);
 assert.equal(clock.formatTaskTime('00:00'),'12:00 AM');assert.equal(clock.formatTaskTime('12:00:00'),'12:00 PM');assert.equal(clock.formatTaskTime('23:59'),'11:59 PM');
 for(const zone of ['UTC','America/Edmonton','Europe/London','Asia/Tokyo'])assert.equal(clock.validTaskZone(zone),true);
 for(const zone of [null,'EST','Not/A_Zone','+06:00',{},'UTC; drop table'])assert.equal(clock.validTaskZone(zone),false);
});
test('time saves include fresh owner and shared planning revision without converting wall time',async()=>{
 for(const date of ['2026-03-08','2026-11-01']){const h=harness();assert.equal((await h.saveTaskPlanning({},form({due_date:date,user_id:'foreign'}))).revision,2);assert.equal(h.calls[0][1].due_time,'09:30');assert.equal(h.calls[0][1].due_timezone,'America/Edmonton');assert.ok(h.calls.some(c=>c[1]==='user_id'&&c[2]==='verified-owner'));assert.ok(h.calls.some(c=>c[1]==='planning_revision'&&c[2]===1));}
});
test('blank clock clears both fields; invalid/missing dates or zones do not write',async()=>{
 const h=harness();assert.ok((await h.saveTaskPlanning({},form({due_time:'',due_timezone:''}))).message);assert.equal(h.calls[0][1].due_time,null);assert.equal(h.calls[0][1].due_timezone,null);
 for(const data of [{due_time:'24:00'},{due_time:'09:30:02'},{due_timezone:'EST'},{due_timezone:'Not/A_Zone'},{due_date:''}]){const h=harness();assert.ok((await h.saveTaskPlanning({},form(data))).error);assert.equal(h.calls.length,0);}
 const missing=harness(),f=form();f.delete('due_timezone');assert.ok((await missing.saveTaskPlanning({},f)).error);assert.equal(missing.calls.length,0);
});
test('unconfirmed, stale and signed-out time saves never announce success',async()=>{
 for(const [result,signed]of [[{error:{code:'offline'}},true],[{data:null},true],[{},false]]){const h=harness(result,signed),r=await h.saveTaskPlanning({},form());assert.ok(r.error);assert.equal(r.message,undefined);}
});
test('shared editor has optional time, named zone and explicit all-day control',()=>{
 const {TaskPlanning}=load('../src/app/tasks/task-planning.tsx',{'@/components/ui/button':load('../src/components/ui/button.tsx'),'@/components/ui/fields':load('../src/components/ui/fields.tsx'),'@/components/ui/feedback':load('../src/components/ui/feedback.tsx'),'@/lib/shared/client-actions':{},'@/lib/tasks/types':types,'@/lib/tasks/time':clock,'@/lib/calendar/dates':dates,'@/lib/tasks/recurrence':recurrence,'@/app/components/planning-preferences':{usePlanning:()=>({show_task_timezones:false})},'./planning-actions':{},'./actions':{},'./repeat-rule-fields':{RepeatRuleFields:()=>null}});
 const task={id,title:'Task',completed:false,due_date:'2026-03-08',due_time:'09:30:00',due_timezone:'America/Edmonton'};
 const html=renderToStaticMarkup(React.createElement(TaskPlanning,{task,disabled:false}));assert.match(html,/type="time"/);assert.match(html,/value="09:30"/);assert.match(html,/name="due_timezone"/);assert.match(html,/Make all-day/);assert.match(html,/Repeats keep this clock time/);
 const untimed=renderToStaticMarkup(React.createElement(TaskPlanning,{task:{id,title:'Quick task',completed:false},disabled:false}));assert.match(untimed,/Choose a date to add a time/);
});
test('time zone controls are hidden by default and can be enabled without rewriting task data',()=>{
 const draw=show=>{const {TaskPlanning}=load('../src/app/tasks/task-planning.tsx',{'@/components/ui/button':load('../src/components/ui/button.tsx'),'@/components/ui/fields':load('../src/components/ui/fields.tsx'),'@/components/ui/feedback':load('../src/components/ui/feedback.tsx'),'@/lib/shared/client-actions':{},'@/lib/tasks/types':types,'@/lib/tasks/time':clock,'@/lib/calendar/dates':dates,'@/lib/tasks/recurrence':recurrence,'@/app/components/planning-preferences':{usePlanning:()=>({show_task_timezones:show})},'./planning-actions':{},'./actions':{},'./repeat-rule-fields':{RepeatRuleFields:()=>null}});return renderToStaticMarkup(React.createElement(TaskPlanning,{task:{id,title:'Task',completed:false,due_date:'2026-03-08',due_time:'09:30:00',due_timezone:'America/Edmonton'},disabled:false}));};
 assert.match(draw(false),/type="hidden" name="due_timezone" value="America\/Edmonton"/);assert.doesNotMatch(draw(false),/<select[^>]+name="due_timezone"/);assert.match(draw(true),/<select[^>]+name="due_timezone"/);
 const planning=load('../src/lib/calendar/preferences.ts'),display=load('../src/lib/themes/display.ts',{'../calendar/preferences':planning});
 const f=new FormData();for(const[k,v]of Object.entries({group:'planning',revision:'2',week_start:'monday',date_format:'iso',show_task_timezones:'true',user_id:'forged'}))f.set(k,v);
 assert.deepEqual(display.parseDisplayForm(f).values,{week_start:'monday',date_format:'iso',show_task_timezones:true});f.set('show_task_timezones','yes');assert.equal(display.parseDisplayForm(f),null);
});
test('export v5 includes the optional zone preference using an explicit allowlist',()=>{
 const s=load('../src/lib/export/schema.ts'),columns=s.EXPORT_COLUMNS_V5,keys=Object.keys(columns),row=Object.fromEntries(columns.planner_preferences.map(k=>[k,null]));
 const d={format:'life-planner-export',format_version:5,exported_at:'2026-10-29T00:00:00Z',total_records:1,counts:Object.fromEntries(keys.map(k=>[k,k==='planner_preferences'?1:0])),data:Object.fromEntries(keys.map(k=>[k,k==='planner_preferences'?[row]:[]]))};assert.ok(s.validExport(d));delete row.show_task_timezones;assert.equal(s.validExport(d),false);
 const sql=fs.readFileSync(new URL('../supabase/migrations/20261029003200_calendar_repeat_previews.sql',import.meta.url),'utf8');assert.ok(sql.includes("('planner_preferences','"+columns.planner_preferences.join(',')+"'"));assert.match(sql,/'format_version',5/);
});
test('migration preserves RLS, carries clock metadata and does not reset repeat counts for time-only edits',()=>{
 const sql=fs.readFileSync(new URL('../supabase/migrations/20261029003100_task_due_times.sql',import.meta.url),'utf8');assert.doesNotMatch(sql,/security definer|drop policy|disable.*row level|alter column due_date/i);assert.match(sql,/grant update\(due_time,due_timezone\)/);assert.match(sql,/due_time=new.due_time,due_timezone=new.due_timezone/);assert.match(sql,/new\.due_time is distinct from old\.due_time/);assert.match(sql,/t\.due_date,t\.due_time,t\.due_timezone/);assert.match(sql,/from public,anon/);
 const anchorReset=sql.slice(sql.indexOf('if new.repeat_frequency is distinct'),sql.indexOf('new.repeat_anchor_day='));assert.doesNotMatch(anchorReset,/due_time|due_timezone/);
});
test('export v4 requires both time fields while all previous versions stay compatible',()=>{
 const s=load('../src/lib/export/schema.ts'),keys=Object.keys(s.EXPORT_COLUMNS);
 for(const [version,columns]of [[1,s.EXPORT_COLUMNS],[2,s.EXPORT_COLUMNS_V2],[3,s.EXPORT_COLUMNS_V3],[4,s.EXPORT_COLUMNS_V4]]){const row=Object.fromEntries(columns.tasks.map(k=>[k,null])),d={format:'life-planner-export',format_version:version,exported_at:'2026-10-29T00:00:00Z',total_records:1,counts:Object.fromEntries(keys.map(k=>[k,k==='tasks'?1:0])),data:Object.fromEntries(keys.map(k=>[k,k==='tasks'?[row]:[]]))};assert.ok(s.validExport(d));if(version===4){delete row.due_timezone;assert.equal(s.validExport(d),false);}}
 const sql=fs.readFileSync(new URL('../supabase/migrations/20261029003100_task_due_times.sql',import.meta.url),'utf8');assert.ok(sql.includes("('tasks','"+s.EXPORT_COLUMNS_V4.tasks.join(',')+"'"));assert.match(sql,/'format_version',4/);
});
