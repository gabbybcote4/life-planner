import {parseCalendarDate} from "../calendar/dates";

export type RepeatRule={interval:number;unit:"day"|"week"|"month"|"year";weekdays:number[];monthly_mode:"date"|"weekday"|"last_weekday";ends:"never"|"on"|"after";end_date:string|null;count:number|null};
export const DEFAULT_REPEAT_RULE:RepeatRule={interval:1,unit:"week",weekdays:[1],monthly_mode:"date",ends:"never",end_date:null,count:null};
// One explicit shape for browser drafts, server writes, SQL and export.
export function parseRepeatRule(value:unknown):RepeatRule|null{
 if(!value||typeof value!=="object"||Array.isArray(value))return null;
 const r=value as RepeatRule;
 if(Object.keys(r).sort().join()!==Object.keys(DEFAULT_REPEAT_RULE).sort().join()||!Number.isInteger(r.interval)||r.interval<1||r.interval>99||!["day","week","month","year"].includes(r.unit)||!["date","weekday","last_weekday"].includes(r.monthly_mode)||!["never","on","after"].includes(r.ends)||!Array.isArray(r.weekdays)||r.weekdays.some(d=>!Number.isInteger(d)||d<0||d>6)||new Set(r.weekdays).size!==r.weekdays.length||(r.unit==="week"?r.weekdays.length===0:r.weekdays.length!==0))return null;
 if(r.unit!=="month"&&r.monthly_mode!=="date")return null;
 if(r.ends==="on"?(!parseCalendarDate(r.end_date)||r.count!==null):r.end_date!==null)return null;
 if(r.ends==="after"?(!Number.isInteger(r.count)||Number(r.count)<1||Number(r.count)>999):r.count!==null)return null;
 return {...r,weekdays:[...r.weekdays].sort((a,b)=>a-b)};
}
