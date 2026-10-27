import {isRecordId} from "@/lib/shared/validation";
import {parseCalendarDate} from "@/lib/calendar/dates";
import type {TaskPriority} from "@/lib/tasks/types";
export type GuidanceTask = { id:string; title:string; due_date:string|null; priority:TaskPriority; space_id:string|null; space_title:string|null };
export type GuidanceEvent = { id:string; title:string; event_date:string };
export type GuidanceData = { open:number; overdue:number; today:number; unplanned:number; events_today:number; tasks:GuidanceTask[]; events:GuidanceEvent[] };
export type GuidanceState = { data?:GuidanceData; date?:string; error?:string };
export function taskReason(task:GuidanceTask,today:string):string {
 if(task.due_date && task.due_date<today)return "Overdue · due "+task.due_date;
 if(task.due_date===today)return "Due today";
 if(task.priority==="high")return "You marked this high priority"+(task.due_date?" · due "+task.due_date:"");
 if(task.due_date)return "Upcoming · due "+task.due_date;
 if(task.priority!=="none")return "You marked this "+task.priority+" priority";
 return "No date or priority yet · one of your oldest captures, not an urgent deadline";
}
export function isGuidanceData(value:unknown):value is GuidanceData {
 if(!value||typeof value!=="object")return false;
 const data=value as GuidanceData;
 if(!["open","overdue","today","unplanned","events_today"].every(key=>Number.isSafeInteger(data[key as keyof GuidanceData])&&Number(data[key as keyof GuidanceData])>=0))return false;
 if(data.overdue+data.today>data.open||data.unplanned>data.open)return false;
 return Array.isArray(data.tasks)&&data.tasks.length===Math.min(3,data.open)&&Array.isArray(data.events)&&data.events.length<=3
  && data.tasks.every(t=>t&&isRecordId(t.id)&&typeof t.title==="string"&&["none","low","medium","high"].includes(t.priority)&&(t.due_date===null||parseCalendarDate(t.due_date)!==null)&&(t.space_id===null||isRecordId(t.space_id))&&(t.space_title===null||typeof t.space_title==="string"))
  && data.events.every(e=>e&&isRecordId(e.id)&&typeof e.title==="string"&&parseCalendarDate(e.event_date)!==null);
}
