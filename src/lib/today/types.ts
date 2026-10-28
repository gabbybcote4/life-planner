import {isRecordId} from "../shared/validation";
import {parseCalendarDate} from "../calendar/dates";
import {isHabitDayResult,type Habit} from "../habits/types";
import type {Task} from "../tasks/types";
export const TODAY_PAGE_SIZE=5;
export type TodayOffsets={tasks:number;habits:number;events:number};
export type TodayData={tasks:Task[];habits:Habit[];events:{id:string;title:string;event_date:string}[];counts:{tasks:number;overdue:number;habits:number;habits_done:number;events:number;undated:number}};
export type TodayState={day?:string;offsets?:TodayOffsets;data?:TodayData;error?:string};
export function parseTodayOffset(value:unknown){return typeof value==="string"&&/^(0|[1-9]\d{0,5})$/.test(value)&&Number(value)<=999980&&Number(value)%TODAY_PAGE_SIZE===0?Number(value):null;}
export function isTodayData(value:unknown,day:string):value is TodayData{
 if(!parseCalendarDate(day)||!value||typeof value!=="object")return false;const d=value as TodayData;
 if(!d.counts||!["tasks","overdue","habits","habits_done","events","undated"].every(k=>Number.isSafeInteger(d.counts[k as keyof TodayData["counts"]])&&d.counts[k as keyof TodayData["counts"]]>=0)||d.counts.overdue>d.counts.tasks||d.counts.habits_done>d.counts.habits)return false;
 if(!Array.isArray(d.tasks)||d.tasks.length>TODAY_PAGE_SIZE||d.tasks.length>d.counts.tasks||!Array.isArray(d.events)||d.events.length>TODAY_PAGE_SIZE||d.events.length>d.counts.events||!Array.isArray(d.habits)||d.habits.length>TODAY_PAGE_SIZE||!isHabitDayResult({items:d.habits,total:d.counts.habits}))return false;
 const unique=(items:{id:string}[])=>items.every(i=>i&&typeof i==="object"&&isRecordId(i.id))&&new Set(items.map(i=>i.id)).size===items.length;
 return unique(d.tasks)&&unique(d.events)&&d.tasks.every(t=>t&&isRecordId(t.id)&&typeof t.title==="string"&&t.title.trim().length>0&&t.completed===false&&typeof t.created_at==="string"&&parseCalendarDate(t.due_date)!==null&&t.due_date!<=day&&["none","low","medium","high"].includes(t.priority??"")&&Number.isSafeInteger(t.planning_revision)&&Number(t.planning_revision)>0&&(t.space_id===null||isRecordId(t.space_id))&&(t.space===null||(t.space&&typeof t.space.title==="string")))&&d.events.every(e=>e&&isRecordId(e.id)&&typeof e.title==="string"&&e.title.trim().length>0&&e.event_date===day);
}