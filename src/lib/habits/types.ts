import {parseCalendarDate} from "../calendar/dates";
import {isRecordId} from "../shared/validation";
export const HABIT_PRESETS=[
 {title:"Drink water",kind:"amount",target:8,unit:"glasses"},
 {title:"Read",kind:"amount",target:20,unit:"minutes"},
 {title:"Move your body",kind:"amount",target:30,unit:"minutes"},
 {title:"Take a walk",kind:"check",target:1,unit:"done"},
 {title:"Tidy up",kind:"check",target:1,unit:"done"},
 {title:"Wind down",kind:"check",target:1,unit:"done"},
] as const;
export const WEEKDAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export type HabitSettings={title:string;kind:"check"|"amount";target:number;unit:string;schedule:"daily"|"weekdays"|"weekly";weekdays:number[];weekly_goal:number;space_id:string|null;start_date:string;paused:boolean};
export type Habit=HabitSettings&{id:string;revision:number;space_title:string|null;week_done:number;log:{amount:number;target:number;unit:string;kind:"check"|"amount";revision:number}|null};
export type HabitState={error?:string;message?:string;revision?:number};
export type HabitDayState={error?:string;day?:string;offset?:number;items?:Habit[];total?:number};
export function parseAmount(v:unknown):number|null {if(typeof v!=="string"||!/^\d{1,7}(\.\d{1,2})?$/.test(v))return null;const n=Number(v);return n<=1000000?n:null;}
export function parseHabit(data:FormData):HabitSettings|null{
 const title=data.get("title"),kind=data.get("kind"),unit=data.get("unit"),schedule=data.get("schedule"),space=data.get("space_id"),start_date=parseCalendarDate(data.get("start_date"));
 const target=parseAmount(data.get("target")),goal=data.get("weekly_goal"),days=data.getAll("weekdays");
 if(typeof title!=="string"||!title.trim()||Array.from(title.trim()).length>200||!["check","amount"].includes(String(kind))||typeof unit!=="string"||!unit.trim()||Array.from(unit.trim()).length>30||target===null||target<=0||!start_date||!["daily","weekdays","weekly"].includes(String(schedule))||typeof goal!=="string"||! /^[1-7]$/.test(goal)||typeof space!=="string"||(space!==""&&!isRecordId(space))||days.some(d=>typeof d!=="string"||! /^[0-6]$/.test(d))||new Set(days).size!==days.length||(schedule==="weekdays"&&!days.length)||!["true","false"].includes(String(data.get("paused"))))return null;
 return {title:title.trim(),kind:kind as HabitSettings["kind"],target:kind==="check"?1:target,unit:kind==="check"?"done":unit.trim(),schedule:schedule as HabitSettings["schedule"],weekdays:days.map(Number).sort(),weekly_goal:Number(goal),space_id:space||null,start_date,paused:data.get("paused")==="true"};
}
export function isHabitDue(h:Habit,day:string){
 if(!parseCalendarDate(day)||h.paused||day<h.start_date)return false;
 if(h.schedule==="weekdays")return h.weekdays.includes(new Date(day+"T12:00:00Z").getUTCDay());
 return h.schedule!=="weekly"||h.week_done<h.weekly_goal;
}
export function scheduleLabel(h:HabitSettings){return h.schedule==="daily"?"Daily":h.schedule==="weekly"?h.weekly_goal+" days / week":h.weekdays.map(d=>WEEKDAYS[d]).join(" · ");}
export function parseHabitRevision(v:unknown){return typeof v==="string"&&/^(0|[1-9]\d{0,8})$/.test(v)?Number(v):null;}
export function isHabitDayResult(value:unknown):value is {items:Habit[];total:number}{
 if(!value||typeof value!=="object")return false;
 const result=value as {items?:unknown;total?:unknown};
 const amount=(v:unknown)=>typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=1000000&&Math.abs(Math.round(v*100)-v*100)<0.00001;
 if(!Number.isSafeInteger(result.total)||Number(result.total)<0||!Array.isArray(result.items)||result.items.length>20||result.items.length>Number(result.total))return false;
 const ids=new Set();
 return result.items.every(raw=>{
  if(!raw||typeof raw!=="object")return false;const h=raw as Habit;
  if(!isRecordId(h.id)||ids.has(h.id))return false;ids.add(h.id);
  return typeof h.title==="string"&&h.title.trim().length>0&&Array.from(h.title).length<=200&&["check","amount"].includes(h.kind)&&amount(h.target)&&h.target>0&&typeof h.unit==="string"&&h.unit.trim().length>0&&Array.from(h.unit).length<=30&&["daily","weekdays","weekly"].includes(h.schedule)&&Array.isArray(h.weekdays)&&h.weekdays.length<=7&&new Set(h.weekdays).size===h.weekdays.length&&h.weekdays.every(d=>Number.isInteger(d)&&d>=0&&d<=6)&&(h.schedule!=="weekdays"||h.weekdays.length>0)&&Number.isInteger(h.weekly_goal)&&h.weekly_goal>=1&&h.weekly_goal<=7&&typeof h.paused==="boolean"&&parseCalendarDate(h.start_date)!==null&&Number.isSafeInteger(h.revision)&&h.revision>0&&(h.space_id===null||isRecordId(h.space_id))&&(h.space_title===null||typeof h.space_title==="string")&&Number.isInteger(h.week_done)&&h.week_done>=0&&h.week_done<=7&&(h.kind!=="check"||(h.target===1&&h.unit==="done"))&&(h.log===null||(typeof h.log==="object"&&amount(h.log.amount)&&amount(h.log.target)&&h.log.target>0&&typeof h.log.unit==="string"&&h.log.unit.trim().length>0&&Array.from(h.log.unit).length<=30&&["check","amount"].includes(h.log.kind)&&Number.isSafeInteger(h.log.revision)&&h.log.revision>0&&(h.log.kind!=="check"||(h.log.target===1&&h.log.unit==="done"&&[0,1].includes(h.log.amount)))));
 });
}