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
import * as taskTypes from '../src/lib/tasks/types.ts';
const require=createRequire(import.meta.url),id='a740eb33-8222-4b11-8900-000000000001';
function load(path,deps={}){const code=ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,m={exports:{}};new Function('require','exports',code)(n=>Object.hasOwn(deps,n)?deps[n]:require(n),m.exports);return m.exports;}
const week=load('../src/lib/calendar/week.ts',{'./dates':dates}),planning=load('../src/lib/calendar/preferences.ts'),repeats=load('../src/lib/calendar/repeats.ts',{'../shared/validation':validation,'./dates':dates,'../tasks/time':times});
test('week dates honor Sunday/Monday starts, month/year boundaries and leap days',()=>{
 const monday=week.calendarWeekRange('2026-11-01','monday');assert.equal(monday.start,'2026-10-26');assert.equal(monday.end,'2026-11-02');assert.deepEqual(week.calendarRangeMonths(monday.start,monday.end),['2026-10-01','2026-11-01']);
 const sunday=week.calendarWeekRange('2026-11-01');assert.equal(sunday.start,'2026-11-01');assert.equal(sunday.end,'2026-11-08');
 const newYear=week.calendarWeekRange('2027-01-01','monday');assert.equal(newYear.start,'2026-12-28');assert.equal(newYear.end,'2027-01-04');
 assert.ok(week.calendarWeekRange('2028-02-29').days.includes('2028-02-29'));assert.equal(new Set(monday.days).size,7);
 assert.deepEqual(week.calendarRangeMonths('2026-10-25','2026-11-01'),['2026-10-01']);
});
test('supported-year edges show blanks and safe navigation instead of invalid dates',()=>{
 const first=week.calendarWeekRange('1900-01-01');assert.equal(first.days[0],null);assert.equal(first.start,'1900-01-01');
 const last=week.calendarWeekRange('2100-12-31');assert.equal(last.end,'2101-01-01');assert.ok(last.days.includes(null));
 assert.equal(week.shiftCalendarDays('1900-01-01',-7),null);assert.equal(week.shiftCalendarDays('2100-12-31',7),null);assert.equal(week.shiftCalendarDays('bad',1),null);assert.equal(week.shiftCalendarDays('2026-01-01',1e15),null);assert.throws(()=>week.calendarWeekRange('bad'),RangeError);
});
test('week date arithmetic stays fixed across host zones and daylight changes',()=>{
 const previous=process.env.TZ;try{for(const zone of ['America/Edmonton','Pacific/Kiritimati','Pacific/Honolulu']){process.env.TZ=zone;assert.equal(week.shiftCalendarDays('2026-03-07',1),'2026-03-08');assert.equal(week.shiftCalendarDays('2026-10-31',1),'2026-11-01');assert.equal(week.calendarWeekRange('2026-03-08').start,'2026-03-08');}}finally{if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous;}
});
test('week buckets keep all-day events apart from timed tasks and retain exact minute labels',()=>{
 const tasks=[{id,title:'Later',completed:false,due_date:'2026-11-06',due_time:'14:58:00'},{id:id+'2',title:'Earlier',completed:true,due_date:'2026-11-06',due_time:'14:05:00'},{id:id+'3',title:'Midnight',completed:false,due_date:'2026-11-06',due_time:'00:00:00'},{id,title:'All-day task',completed:false,due_date:'2026-11-06'},{id:'undated',title:'Undated',completed:false}];
 const buckets=week.calendarWeekEntries(tasks,[{id,title:'Event',event_date:'2026-11-06'}],[{source_id:id,title:'Future',due_date:'2026-11-06',due_time:'15:00:00',due_timezone:'UTC'}]);
 assert.deepEqual(buckets.get('2026-11-06:14').map(e=>e.title),['Earlier','Later']);assert.equal(buckets.get('2026-11-06:00')[0].time,'00:00');assert.equal(buckets.get('2026-11-06:all').length,2);assert.equal(new Set(buckets.get('2026-11-06:all').map(e=>e.key)).size,2);assert.equal(buckets.get('2026-11-06:15')[0].kind,'repeat');assert.equal([...buckets.values()].flat().some(e=>e.title==='Undated'),false);
});
test('actual week markup labels real due times and retains week navigation and bounded overflow',()=>{
 const {WeekView}=load('../src/app/calendar/week-view.tsx',{'@/components/ui/button':load('../src/components/ui/button.tsx'),'@/lib/calendar/dates':dates,'@/lib/calendar/preferences':planning,'@/lib/calendar/week':week,'@/lib/tasks/time':times,'./calendar-today':{CalendarTodayButton:()=>null}});
 const tasks=Array.from({length:4},(_,i)=>({id:id+i,title:'Task <'+i+'>',completed:i===0,due_date:'2026-11-06',due_time:'14:58:00'}));
 const html=renderToStaticMarkup(React.createElement(WeekView,{selectedDate:'2026-11-06',weekStart:'monday',tasks,events:[{id,title:'All-day event',event_date:'2026-11-06'}],repeats:[]}));
 assert.match(html,/Hourly week grid/);assert.match(html,/2:58 PM/);assert.match(html,/Task &lt;0&gt;/);assert.match(html,/All-day event/);assert.match(html,/data-completed="true"/);assert.match(html,/＋1 more/);assert.match(html,/2026-10-30&amp;view=week/);assert.match(html,/2026-11-13&amp;view=week/);
});
function harness({failureMonth,preferenceError=false}={}){
 const calls=[],captured=[];
 const preview=(date)=>({source_id:id,title:'Planned '+date,due_date:date,due_time:null,due_timezone:null});
 const client={from(table){return {select(){return this;},eq(...a){calls.push([table,'eq',...a]);return this;},gte(...a){calls.push([table,'gte',...a]);return this;},lt(...a){calls.push([table,'lt',...a]);return this;},order(){return this;},maybeSingle:async()=>({data:{week_start:'monday'},error:preferenceError?{}:null}),limit:async()=>({data:[],count:0,error:null})};},rpc:async(name,args)=>{calls.push(['rpc',name,args]);return {error:args.p_start===failureMonth?{}:null,data:args.p_start==='2026-10-01'?[preview('2026-10-31')]:[preview('2026-11-01'),preview('2026-11-07')]};}};
 const Page=load('../src/app/calendar/page.tsx',{'./month-view':{MonthView:()=>null},'./week-view':{WeekView:props=>{captured.push(props);return React.createElement('p',null,'Week rendered');}},'@/lib/calendar/week':week,'@/lib/auth/account':{requireAccount:async()=>({supabase:client,userId:'owner'})},'@/lib/supabase/config':{isSupabaseConfigured:()=>true},'@/lib/calendar/dates':dates,'@/lib/tasks/types':taskTypes,'@/app/tasks/task-board':{TaskList:()=>null},'@/lib/calendar/repeats':repeats,'@/lib/tasks/time':times,'@/app/components/planner-page':{PlannerPage:()=>null,PlannerHeading:()=>null,SetupNotice:()=>null,LoadError:({title})=>React.createElement('p',null,title)},'./calendar-today':{CalendarStart:()=>React.createElement('p',null,'Start')},'./calendar-events':{CalendarEvents:()=>null}}).default;
 return {calls,captured,async draw(search={date:'2026-11-01',view:'week'}){const tree=Page({searchParams:Promise.resolve(search)}),content=await tree.props.children.type(tree.props.children.props);return renderToStaticMarkup(content);}};
}
test('cross-month weeks load both owned preview months and filter them to the selected week',async()=>{
 const h=harness();assert.match(await h.draw(),/Week rendered/);assert.deepEqual(h.calls.filter(c=>c[0]==='rpc').map(c=>c[2]),[{p_start:'2026-10-01'},{p_start:'2026-11-01'}]);assert.deepEqual(h.captured[0].repeats.map(r=>r.due_date),['2026-10-31','2026-11-01']);
 for(const table of ['tasks','calendar_events','planner_preferences'])assert.ok(h.calls.some(c=>c[0]===table&&c[1]==='eq'&&c[2]==='user_id'&&c[3]==='owner'));
 assert.ok(h.calls.some(c=>c[0]==='tasks'&&c[1]==='gte'&&c[3]==='2026-10-26'));assert.ok(h.calls.some(c=>c[0]==='tasks'&&c[1]==='lt'&&c[3]==='2026-11-02'));
});
test('failure in either preview month or week preference never renders partial success',async()=>{
 for(const options of [{failureMonth:'2026-10-01'},{failureMonth:'2026-11-01'},{preferenceError:true}]){const h=harness(options);assert.match(await h.draw(),/could not be loaded completely/);assert.equal(h.captured.length,0);}
 const invalid=harness();assert.match(await invalid.draw({date:'bad',view:'week'}),/Start/);assert.equal(invalid.calls.length,0);
});
test('Today preserves week mode and reads the local clock only on interaction',()=>{
 const calls=[],clock=[];const {CalendarTodayButton}=load('../src/app/calendar/calendar-today.tsx',{'@/components/ui/button':()=>null,'next/navigation':{useRouter:()=>({push:url=>calls.push(url)})},'@/lib/calendar/dates':{localToday:()=>{clock.push(1);return '2026-11-06';}}});const button=CalendarTodayButton({view:'week'});assert.equal(clock.length,0);button.props.onClick();assert.deepEqual(calls,['/calendar?date=2026-11-06&view=week']);
});
