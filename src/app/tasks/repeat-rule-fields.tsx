"use client";
import {Select,TextInput} from "@/components/ui/fields";
import type {RepeatRule} from "@/lib/tasks/recurrence";
const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export function RepeatRuleFields({rule,onChange,field,dueDate}:{rule:RepeatRule;onChange:(rule:RepeatRule)=>void;field:string;dueDate:string}){
 return <fieldset className="repeat-custom"><legend>Custom repeat</legend>
  <div className="repeat-interval"><label htmlFor={field+"-every"}>Every</label><TextInput id={field+"-every"} type="number" min={1} max={99} required value={rule.interval} onChange={e=>onChange({...rule,interval:Number(e.target.value)})}/>
  <Select aria-label="Repeat interval unit" value={rule.unit} onChange={e=>onChange({...rule,unit:e.target.value as RepeatRule["unit"],weekdays:e.target.value==="week"?[dueDate?new Date(dueDate+"T12:00:00Z").getUTCDay():1]:[],monthly_mode:"date"})}>{["day","week","month","year"].map(unit=><option value={unit} key={unit}>{unit}(s)</option>)}</Select></div>
  {rule.unit==="week"&&<fieldset className="repeat-weekdays"><legend>On these days</legend>{DAYS.map((label,day)=><label key={day}><input type="checkbox" checked={rule.weekdays.includes(day)} onChange={e=>onChange({...rule,weekdays:(e.target.checked?[...rule.weekdays,day]:rule.weekdays.filter(d=>d!==day)).sort()})}/>{label}</label>)}</fieldset>}
  {rule.unit==="month"&&<><label htmlFor={field+"-monthly"}>Monthly pattern</label><Select id={field+"-monthly"} value={rule.monthly_mode} onChange={e=>onChange({...rule,monthly_mode:e.target.value as RepeatRule["monthly_mode"]})}><option value="date">Same date · last day in shorter months</option><option value="weekday">Same weekday & week number</option><option value="last_weekday">Last matching weekday</option></Select></>}
  <label htmlFor={field+"-ends"}>Ends</label><Select id={field+"-ends"} value={rule.ends} onChange={e=>onChange({...rule,ends:e.target.value as RepeatRule["ends"],end_date:e.target.value==="on"?dueDate||null:null,count:e.target.value==="after"?10:null})}><option value="never">Never</option><option value="on">On a date</option><option value="after">After a number of occurrences</option></Select>
  {rule.ends==="on"&&<><label htmlFor={field+"-until"}>Last allowed date</label><TextInput id={field+"-until"} type="date" min={dueDate||"1900-01-01"} max="2100-12-31" required value={rule.end_date??""} onChange={e=>onChange({...rule,end_date:e.target.value||null})}/></>}
  {rule.ends==="after"&&<><label htmlFor={field+"-count"}>Total occurrences · includes this task</label><TextInput id={field+"-count"} type="number" min={1} max={999} required value={rule.count??""} onChange={e=>onChange({...rule,count:Number(e.target.value)})}/></>}
  <p className="muted">Uses the due date as its starting pattern. Fifth-weekday patterns skip months without that day.</p>
 </fieldset>;
}
