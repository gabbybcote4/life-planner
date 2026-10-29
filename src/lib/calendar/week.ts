import {parseCalendarDate,monthRange} from "./dates";
import type {Task} from "../tasks/types";
import type {CalendarRepeat} from "./repeats";
import type {CalendarEvent} from "./dates";

export function shiftCalendarDays(date:string,amount:number):string|null{
 if(!parseCalendarDate(date)||!Number.isSafeInteger(amount))return null;
 const d=new Date(date+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+amount);
 return Number.isFinite(d.getTime())?parseCalendarDate(d.toISOString().slice(0,10)):null;
}
export function calendarWeekRange(date:string,start:"sunday"|"monday"="sunday"){
 if(!parseCalendarDate(date))throw new RangeError("Invalid calendar date");
 const d=new Date(date+"T12:00:00Z"),offset=(d.getUTCDay()-(start==="monday"?1:0)+7)%7;
 const days=Array.from({length:7},(_,i)=>shiftCalendarDays(date,i-offset));
 const visible=days.filter((day):day is string=>day!==null),last=new Date(visible.at(-1)!+"T12:00:00Z");last.setUTCDate(last.getUTCDate()+1);
 return {days,start:visible[0],end:last.toISOString().slice(0,10)};
}
export function calendarRangeMonths(start:string,end:string){
 const months=[monthRange(start).start],next=monthRange(start).end;
 if(next<end&&parseCalendarDate(next))months.push(next);
 return months;
}
export type WeekEntry={key:string;date:string;title:string;time:string|null;kind:"task"|"repeat"|"event";completed:boolean};
export function calendarWeekEntries(tasks:Task[],events:CalendarEvent[],repeats:CalendarRepeat[]){
 const entries:WeekEntry[]=[...tasks.filter(t=>t.due_date).map(t=>({key:"task:"+t.id,date:t.due_date!,title:t.title,time:t.due_time?.slice(0,5)??null,kind:"task" as const,completed:t.completed})),...events.map(e=>({key:"event:"+e.id,date:e.event_date,title:e.title,time:null,kind:"event" as const,completed:false})),...repeats.map(r=>({key:"repeat:"+r.source_id+":"+r.due_date,date:r.due_date,title:r.title,time:r.due_time?.slice(0,5)??null,kind:"repeat" as const,completed:false}))];
 const buckets=new Map<string,WeekEntry[]>();
 for(const entry of entries){const key=entry.date+":"+(entry.time?entry.time.slice(0,2):"all");buckets.set(key,[...(buckets.get(key)??[]),entry]);}
 for(const values of buckets.values())values.sort((a,b)=>(a.time??"").localeCompare(b.time??"")||a.title.localeCompare(b.title)||a.key.localeCompare(b.key));
 return buckets;
}
