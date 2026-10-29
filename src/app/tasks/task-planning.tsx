"use client";
import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextInput, Select } from "@/components/ui/fields";
import { FormFeedback } from "@/components/ui/feedback";
import { runAction, UNCONFIRMED_SAVE } from "@/lib/shared/client-actions";
import { TASK_PRIORITIES, TASK_REPEATS, type Task, type TaskRepeat, type TaskPriority, type TaskPlanningState } from "@/lib/tasks/types";
import { formatCalendarDate } from "@/lib/calendar/dates";
import { saveTaskPlanning } from "./planning-actions";
import { setTaskCompleted } from "./actions";
import Link from "next/link";
import {DEFAULT_REPEAT_RULE} from "@/lib/tasks/recurrence";
import {RepeatRuleFields} from "./repeat-rule-fields";
import {parseTaskTime} from "@/lib/tasks/time";
import {usePlanning} from "@/app/components/planning-preferences";

// One planning control is shared by Tasks, dashboard lists, and space task lists.
export function TaskPlanning({ task, disabled, expanded = false, onSaved }: { task: Task; disabled: boolean; expanded?: boolean; onSaved?:()=>void }) {
  const {show_task_timezones}=usePlanning();
  const field = useId();
  const [dueDate, setDueDate] = useState(task.due_date ?? ""), [priority, setPriority] = useState<TaskPriority>(task.priority ?? "none");
  const [dueTime,setDueTime]=useState(parseTaskTime(task.due_time)??""),[dueZone,setDueZone]=useState(task.due_timezone??"");
  const [browserZone,setBrowserZone]=useState("UTC"),[zones,setZones]=useState<string[]>(task.due_timezone?[task.due_timezone]:["UTC"]);
  function loadZones(){
    const device=Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC";
    setBrowserZone(device);setDueZone(value=>value||device);
    if(!show_task_timezones)return;
    let available=["America/Edmonton","America/New_York","Europe/London","Europe/Paris","Asia/Tokyo","Australia/Sydney"];
    try{available=Intl.supportedValuesOf("timeZone");}catch{}
    setZones([...new Set(["UTC",device,...(task.due_timezone?[task.due_timezone]:[]),...available])].sort());
  }
  const [repeat,setRepeat]=useState<TaskRepeat>(task.repeat_frequency??"none");
  const [rule,setRule]=useState(task.repeat_rule??{...DEFAULT_REPEAT_RULE,weekdays:[task.due_date?new Date(task.due_date+"T12:00:00Z").getUTCDay():1]});
  const [confirmed, setConfirmed] = useState({ dueDate: task.due_date ?? "",dueTime:parseTaskTime(task.due_time)??"",dueZone:task.due_timezone??"", priority: task.priority ?? "none",repeat:task.repeat_frequency??"none",rule });
  const [revision, setRevision] = useState(task.planning_revision ?? 1);
  const changed = dueDate !== confirmed.dueDate || dueTime!==confirmed.dueTime || (!!dueTime&&dueZone!==confirmed.dueZone) || priority !== confirmed.priority || repeat!==confirmed.repeat || (repeat==="custom"&&JSON.stringify(rule)!==JSON.stringify(confirmed.rule));
  const [state, action, pending] = useActionState<TaskPlanningState, FormData>(async (previous, data) => {
    const result = await runAction(() => saveTaskPlanning(previous, data), UNCONFIRMED_SAVE);
    if (!result.error && result.revision) { setRevision(result.revision); setConfirmed({ dueDate,dueTime,dueZone:dueTime?dueZone:"", priority,repeat,rule });onSaved?.(); }
    return result;
  }, {});
  const [reopenState,reopenAction,reopening]=useActionState<TaskPlanningState,FormData>(async(previous,data)=>{
    const result=await runAction(()=>setTaskCompleted(previous,data),UNCONFIRMED_SAVE);
    if(!result.error)onSaved?.();
    return result;
  },{});
  return <details className="task-planning" open={expanded}><summary>
    {task.due_date || (task.priority && task.priority !== "none") ? <span className="task-plan-badges">
      {task.due_date && <span>Due <time dateTime={task.due_date}>{formatCalendarDate(task.due_date)}</time></span>}
      {task.priority && task.priority !== "none" && <span className="task-priority" data-priority={task.priority}>{TASK_PRIORITIES[task.priority]} priority</span>}
      <span className="muted">Edit plan</span>
    </span> : "Add a date or priority"}
  </summary>
  {task.completed&&(!task.repeat_frequency||task.repeat_frequency==="none")&&<form action={reopenAction} aria-busy={reopening}>
    <input type="hidden" name="id" value={task.id}/><input type="hidden" name="completed" value="false"/>
    <p className="muted">Completed task · reopen to add a repeat.</p>
    <Button type="submit" disabled={disabled||pending||reopening} pending={reopening} pendingLabel="Reopening...">Reopen to set repeat</Button>
    <FormFeedback {...reopenState}/>
  </form>}
  {task.completed&&task.repeat_frequency&&task.repeat_frequency!=="none"&&task.repeat_next_id&&!task.repeat_finished&&<Link className="text-link" href={"/tasks?task="+task.repeat_next_id}>Edit next occurrence →</Link>}
  <form action={action} aria-busy={pending}>
    <input type="hidden" name="id" value={task.id} /><input type="hidden" name="revision" value={revision} />
    {task.completed&&task.repeat_frequency&&task.repeat_frequency!=="none"&&<p className="muted">Completed repeat · edit the next task to change its schedule.</p>}
    <fieldset disabled={disabled || pending || reopening || (task.completed&&!!task.repeat_frequency&&task.repeat_frequency!=="none")}>
      <label htmlFor={field + "-date"}>Due date (optional)</label>
      <TextInput id={field + "-date"} name="due_date" type="date" min="1900-01-01" max="2100-12-31" value={dueDate} onChange={event => {setDueDate(event.target.value);if(!event.target.value)setDueTime("");}} />
      <label htmlFor={field+"-time"}>Due time (optional)</label>
      <TextInput id={field+"-time"} name="due_time" type="time" step={60} value={dueTime} disabled={!dueDate} onFocus={loadZones} onChange={event=>{setDueTime(event.target.value);if(event.target.value)loadZones();}}/>
      {!dueDate&&<input type="hidden" name="due_time" value=""/>}
      {dueTime?<>{show_task_timezones?<><label htmlFor={field+"-zone"}>Time zone</label><Select id={field+"-zone"} name="due_timezone" required value={dueZone} onFocus={loadZones} onPointerDown={loadZones} onChange={event=>setDueZone(event.target.value)}><option value="">Choose time zone</option>{zones.map(zone=><option key={zone} value={zone}>{zone.replaceAll("_"," ")}</option>)}</Select></>:<input type="hidden" name="due_timezone" value={dueZone}/>}<Button variant="text" onClick={()=>setDueTime("")}>Make all-day</Button><p className="muted">Repeats keep this clock time{show_task_timezones?" & time zone":""}. No notifications.</p></>:<><input type="hidden" name="due_timezone" value=""/><p className="muted">{dueDate?"All-day · add a time if needed":"Choose a date to add a time"}</p></>}
      <label htmlFor={field + "-priority"}>Priority</label>
      <Select id={field + "-priority"} name="priority" value={priority} onChange={event => setPriority(event.target.value as TaskPriority)}>{Object.entries(TASK_PRIORITIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
      <label htmlFor={field+"-repeat"}>Repeat</label>
      <Select id={field+"-repeat"} name="repeat_frequency" value={repeat} disabled={task.completed} onChange={event=>setRepeat(event.target.value as TaskRepeat)}>{Object.entries(TASK_REPEATS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select>
      {repeat==="custom"&&<><input type="hidden" name="repeat_rule" value={JSON.stringify(rule)}/><RepeatRuleFields rule={rule} onChange={setRule} field={field} dueDate={dueDate}/>{task.repeat_index&&<p className="muted">Occurrence {task.repeat_index}{task.repeat_rule?.count?" of "+task.repeat_rule.count:""}{task.repeat_finished?" · series ended":""}</p>}</>}
      {task.completed&&repeat==="none"&&<p className="muted">Reopen this task before adding a repeat.</p>}
      {repeat!=="none"?<p className="muted">Complete → next scheduled task. Keeps Space, priority & project links. {repeat==="monthly"?"Monthly keeps the original day, clamped in shorter months. ":""}No notifications.</p>:<p className="muted">Leave these blank/default when you just need to capture a task. A date is a planning cue, not a calendar event or reminder.</p>}
      {repeat!=="none"&&dueDate&&<Link className="text-link" href={"/calendar?date="+dueDate}>View repeats on calendar →</Link>}
      <div className="task-plan-controls"><Button variant="primary" type="submit" disabled={!changed} pending={pending} pendingLabel="Saving...">Save task plan</Button>
        <Button variant="text" disabled={!changed} onClick={() => { setDueDate(confirmed.dueDate);setDueTime(confirmed.dueTime);setDueZone(confirmed.dueZone||browserZone); setPriority(confirmed.priority);setRepeat(confirmed.repeat);setRule(confirmed.rule); }}>Cancel changes</Button>
        <Button variant="text" onClick={() => { setDueDate("");setDueTime(""); setPriority("none");setRepeat("none"); }}>Clear plan</Button></div>
    </fieldset>
    <FormFeedback error={state.error} message={!changed ? state.message : undefined} />
  </form></details>;
}
