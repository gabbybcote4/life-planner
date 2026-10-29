import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as dates from '../src/lib/calendar/dates.ts';
import * as times from '../src/lib/tasks/time.ts';
import * as validation from '../src/lib/shared/validation.ts';
const require=createRequire(import.meta.url),id='b834eb33-8222-4b11-8900-000000000001',request='b834eb33-8222-4b11-8900-000000000002';
function load(path,deps={}){const code=ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,m={exports:{}};new Function('require','exports',code)(n=>Object.hasOwn(deps,n)?deps[n]:require(n),m.exports);return m.exports;}
const move=load('../src/lib/calendar/reschedule.ts',{'../shared/validation':validation,'./dates':dates,'../tasks/time':times});
const source={id,title:'Weekly chore',revision:2,index:3,scheduledDate:'2026-11-13',date:'2026-11-13',time:'09:30',timezone:'America/Edmonton',repeating:true};
function form(extra={}){const f=new FormData();for(const[k,v]of Object.entries({request_id:request,source_id:id,revision:'2',index:'3',scheduled_date:'2026-11-13',date:'2026-11-14',time:'10:30',timezone:'America/Edmonton',scope:'one',...extra}))f.set(k,v);return f;}
function harness(result={data:{id}},signed=true){const calls=[],invalidations=[];return {...load('../src/app/calendar/reschedule-actions.ts',{'next/cache':{revalidatePath:p=>invalidations.push(p)},'@/lib/auth/account':{getAccountContext:async()=>signed?{userId:'verified',supabase:{rpc:async(...args)=>{calls.push(args);if(result==='throw')throw Error('private detail');return result;}}}:null},'@/lib/calendar/reschedule':move,'@/lib/shared/validation':validation}),calls,invalidations};}
test('move parsing validates identity, revision, occurrence, dates and clock before persistence',()=>{
 assert.equal(move.parseMoveForm(form()).p_scope,'one');assert.equal(move.parseMoveForm(form({scope:'future'})).p_scope,'future');assert.equal(move.parseMoveForm(form({time:'',timezone:''})).p_zone,null);
 for(const bad of [{request_id:'bad'},{source_id:'bad'},{revision:'01'},{revision:'0'},{index:'1000001'},{scheduled_date:'2026-02-30'},{date:'2101-01-01'},{time:'24:00'},{time:'09:30:01'},{timezone:'EST'},{scope:'all'},{scope:'__proto__'}])assert.equal(move.parseMoveForm(form(bad)),null);
});
test('drops preserve minutes and use the all-day lane without silently changing the source',()=>{
 const original={...source};assert.deepEqual(move.dropProposal(source,'2026-11-15','15'),{source,date:'2026-11-15',time:'15:30',timezone:'America/Edmonton'});assert.equal(move.dropProposal(source,'2026-11-15','all').time,'');assert.deepEqual(source,original);
});
test('reschedule authenticates freshly, forwards no caller ownership and refreshes connected views',async()=>{
 const h=harness(),r=await h.rescheduleTask({},form({user_id:'foreign',title:'forged'}));assert.equal(r.id,id);assert.equal(h.calls.length,1);assert.equal(h.calls[0][0],'planner_reschedule_task');assert.deepEqual(Object.keys(h.calls[0][1]).sort(),['p_request','p_source','p_revision','p_index','p_scheduled','p_date','p_time','p_zone','p_scope'].sort());assert.ok(!Object.values(h.calls[0][1]).includes('foreign'));assert.ok(h.invalidations.includes('/calendar'));assert.ok(h.invalidations.includes('/today'));
 const invalid=harness();assert.ok((await invalid.rescheduleTask({},form({date:'bad'}))).error);assert.equal(invalid.calls.length,0);
});
test('stale, forbidden, duplicate, offline and incomplete results never report a move as saved',async()=>{
 for(const result of [{error:{code:'40001'}},{error:{code:'42501'}},{error:{code:'23505'}},{error:{code:'22023'}},{data:null},{data:{id:'bad'}},'throw']){const h=harness(result);assert.ok((await h.rescheduleTask({},form())).error);assert.equal(h.invalidations.length,0);assert.equal(h.calls.length,1);}
 const signedOut=harness({},false);assert.ok((await signedOut.rescheduleTask({},form())).error);assert.equal(signedOut.calls.length,0);
});
function dialogDeps(show=false){return {'next/navigation':{useRouter:()=>({push:()=>{},refresh:()=>{}})},'@/components/ui/edit-dialog':{EditDialog:()=>null},'@/components/ui/button':load('../src/components/ui/button.tsx'),'@/components/ui/fields':load('../src/components/ui/fields.tsx'),'@/components/ui/feedback':load('../src/components/ui/feedback.tsx'),'@/app/components/planning-preferences':{usePlanning:()=>({show_task_timezones:show})},'@/lib/shared/request-id':{createRequestId:()=>request},'@/lib/shared/client-actions':{},'./reschedule-actions':{}};}
test('move modal offers one/future choices, all-day and an explicit save while hiding zones by default',()=>{
 const {MoveForm}=load('../src/app/calendar/task-reschedule-dialog.tsx',dialogDeps());const html=renderToStaticMarkup(React.createElement(MoveForm,{proposal:{source,date:'2026-11-14',time:'10:30',timezone:'America/Edmonton'},onCancel:()=>{},onSaved:()=>{}}));for(const text of ['This occurrence','This and future occurrences','Save move','Make all-day'])assert.ok(html.includes(text));assert.match(html,/name="revision" value="2"/);assert.match(html,/name="index" value="3"/);assert.doesNotMatch(html,/<select[^>]*timezone/);
 const unchanged=renderToStaticMarkup(React.createElement(MoveForm,{proposal:{source,date:source.date,time:source.time,timezone:source.timezone},onCancel:()=>{},onSaved:()=>{}}));assert.match(unchanged,/type="submit" disabled=""/);
});
test('a lost-response retry keeps the same request identity and only closes on confirmed success',async()=>{
 let action,created=0,saved=0;const received=[];const deps=dialogDeps();deps.react={...React,useId:()=>'',useState:value=>[value,()=>{}],useRef:value=>({current:value}),useActionState:fn=>{action=fn;return [{},()=>{},false];}};deps['@/lib/shared/request-id']={createRequestId:()=>{created++;return request;}};deps['@/lib/shared/client-actions']={runAction:fn=>fn(),UNCONFIRMED_SAVE:{error:'Unconfirmed'}};deps['./reschedule-actions']={rescheduleTask:async(_,f)=>{received.push(f.get('request_id'));return received.length===1?{error:'Unconfirmed'}:{id};}};
 const {MoveForm}=load('../src/app/calendar/task-reschedule-dialog.tsx',deps);MoveForm({proposal:{source,date:'2026-11-14',time:'10:30',timezone:source.timezone},onCancel:()=>{},onSaved:()=>{saved++;}});assert.ok((await action({},form())).error);assert.equal(saved,0);assert.equal((await action({},form())).id,id);assert.equal(saved,1);assert.equal(created,1);assert.deepEqual(received,[request,request]);
});
test('week cards expose moves only for editable saved tasks or versioned future previews',()=>{
 const week=load('../src/lib/calendar/week.ts',{'./dates':dates}),task={id,title:'Task',completed:false,due_date:'2026-11-06',planning_revision:2,repeat_frequency:'weekly',repeat_index:2,repeat_scheduled_date:'2026-11-06'};
 const values=[...week.calendarWeekEntries([task,{...task,id:request,completed:true}],[{id,title:'Event',event_date:'2026-11-06'}],[{source_id:id,title:'Planned',due_date:'2026-11-13',due_time:null,due_timezone:null,occurrence_index:3,planning_revision:2,scheduled_date:'2026-11-13'}]).values()].flat();assert.equal(values.filter(v=>v.move).length,2);assert.equal(values.find(v=>v.kind==='repeat').move.index,3);assert.equal(values.find(v=>v.kind==='event').move,undefined);
});
test('database move entry point is narrow and private changes cannot be written by authenticated clients',()=>{
 const sql=fs.readFileSync(new URL('../supabase/migrations/20261029003300_calendar_reschedule.sql',import.meta.url),'utf8');assert.equal((sql.match(/security definer/g)||[]).length,1);const fn=sql.slice(sql.indexOf('create function public.planner_reschedule_task'),sql.indexOf('revoke all on function public.planner_reschedule_task'));assert.match(fn,/owner_id uuid=auth.uid\(\)/);assert.match(fn,/security definer set search_path=''/);assert.match(fn,/where id=p_source and user_id=owner_id for update/);assert.match(fn,/source.planning_revision<>p_revision/);assert.match(fn,/prior.payload is distinct from payload/);assert.doesNotMatch(fn,/execute format|set_config|p_user_id|disable/i);assert.match(sql,/grant select on public.task_repeat_changes,public.task_reschedule_receipts/);assert.doesNotMatch(sql,/grant (insert|update|delete).*task_repeat_changes|create policy.*for (insert|update|delete)/i);
});
test('export v6 preserves move history with explicit fields and still accepts older manifests',()=>{
 const s=load('../src/lib/export/schema.ts'),columns=s.EXPORT_COLUMNS_V6,keys=Object.keys(columns);const d={format:'life-planner-export',format_version:6,exported_at:'2026-10-29T00:00:00Z',total_records:0,counts:Object.fromEntries(keys.map(k=>[k,0])),data:Object.fromEntries(keys.map(k=>[k,[]]))};assert.ok(s.validExport(d));assert.equal(keys.length,16);const sql=fs.readFileSync(new URL('../supabase/migrations/20261029003300_calendar_reschedule.sql',import.meta.url),'utf8');for(const [key,fields]of Object.entries(columns)){if(key==='knowledge_links')continue;assert.ok(sql.includes("('"+key+"','"+fields.join(',')+"'"),key);}const invalid={...d,data:{...d.data}};delete invalid.data.task_repeat_changes;assert.equal(s.validExport(invalid),false);
});
