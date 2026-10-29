export const DATE_FORMATS={iso:"2026-10-28",dmy:"28/10/2026",mdy:"10/28/2026"} as const;
export type PlanningPreferences={week_start:"sunday"|"monday";date_format:keyof typeof DATE_FORMATS};
export const DEFAULT_PLANNING:PlanningPreferences={week_start:"sunday",date_format:"iso"};
export function validPlanning(v:unknown):v is PlanningPreferences{if(!v||typeof v!=="object")return false;const p=v as PlanningPreferences;return ["sunday","monday"].includes(p.week_start)&&Object.hasOwn(DATE_FORMATS,p.date_format);}
export function shortDate(date:string,format:PlanningPreferences["date_format"]){const [y,m,d]=date.split("-");return format==="dmy"?`${d}/${m}/${y}`:format==="mdy"?`${m}/${d}/${y}`:date;}
export function calendarWeekdays(start:PlanningPreferences["week_start"]){const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];return start==="monday"?[...days.slice(1),days[0]]:days;}
