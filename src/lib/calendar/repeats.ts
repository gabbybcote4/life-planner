import {isRecordId} from "../shared/validation";
import {parseCalendarDate,monthRange} from "./dates";
import {parseTaskTime,validTaskZone} from "../tasks/time";
export type CalendarRepeat={source_id:string;title:string;due_date:string;due_time:string|null;due_timezone:string|null;occurrence_index?:number;planning_revision?:number;scheduled_date?:string};
export function validCalendarRepeats(value:unknown,start:string):value is CalendarRepeat[]{
 if(!parseCalendarDate(start)||!Array.isArray(value)||value.length>5000)return false;
 const range=monthRange(start),keys=new Set<string>();
 return value.every(row=>{
  if(!row||!isRecordId(row.source_id)||typeof row.title!=="string"||!row.title.trim()||!parseCalendarDate(row.due_date)||row.due_date<range.start||row.due_date>=range.end)return false;
  if(row.due_time===null?row.due_timezone!==null:(!parseTaskTime(row.due_time)||!validTaskZone(row.due_timezone)))return false;
  if(row.occurrence_index!==undefined&&(!Number.isSafeInteger(row.occurrence_index)||row.occurrence_index<1||!Number.isSafeInteger(row.planning_revision)||row.planning_revision<1||!parseCalendarDate(row.scheduled_date)))return false;
  const key=row.source_id+":"+row.due_date;if(keys.has(key))return false;keys.add(key);return true;
 });
}
