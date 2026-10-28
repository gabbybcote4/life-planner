"use client";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {TaskList} from "@/app/tasks/task-board";
import type {Task} from "@/lib/tasks/types";
import {PROJECT_STATUSES,PROJECT_KINDS,projectSourceHref,type ProjectDetail as Detail} from "@/lib/projects/types";
import {ProjectEditor} from "./project-form";
import {ProjectItemPicker,ProjectLinkControl} from "./project-item-picker";
export function ProjectDetail({data}:{data:Detail}){
 const router=useRouter(),p=data.project;
 return <section className="project-detail" aria-label={p.title}>
 <header className="project-detail-heading"><div><span className="project-status">{PROJECT_STATUSES[p.status]}</span><h2>{p.title}</h2>{p.space_id&&<Link className="text-link" href={"/spaces?space="+p.space_id}>{p.space_title??"Space"}</Link>}</div><ProjectEditor project={p}/></header>
 {p.description&&<p className="project-description">{p.description}</p>}
 <div className="project-progress"><strong>{p.task_count?p.done_count+" / "+p.task_count+" tasks done":"No tasks linked yet"}</strong><progress value={p.done_count} max={p.task_count||1} aria-label={p.done_count+" of "+p.task_count+" linked tasks complete"}/><span>{p.note_count} notes · {p.page_count} pages</span></div>
 <ProjectItemPicker project={p.id}/>
 <div className="project-items">{data.items.map(item=><article key={item.kind+item.target_id+item.revision} className={"project-linked-item"+(item.active?"":" is-unlinked")}>
 <header><span>{PROJECT_KINDS[item.kind]}{!item.active?" · Unlinked":""}</span><Link href={projectSourceHref(item)}>Open original →</Link><ProjectLinkControl project={p.id} kind={item.kind} target={item.target_id} active={!item.active} revision={item.revision}/></header>
 {item.active&&item.kind==="task"?<TaskList tasks={[item.target as Task]} onChanged={()=>router.refresh()}/>:<h3><Link href={projectSourceHref(item)}>{item.target.title}</Link></h3>}
 {item.target.space_id&&item.target.space_title&&<Link className="text-link" href={"/spaces?space="+item.target.space_id}>{item.target.space_title}</Link>}
 </article>)}</div>
 {!data.items.length&&<p className="muted">Link an existing task, note or page to start connecting this project.</p>}
 <details className="project-help"><summary>How connections work</summary><ul><li>Progress uses all active linked tasks, including older items.</li><li>Items can belong to several projects. Completing a task changes the original everywhere.</li><li>Unlink removes the relation only; Restore link brings it back.</li><li>Project status and Space do not move, complete or reschedule its items.</li><li>Use ＋ Capture for a new item, then link it here. Save drafts before paging or opening another source.</li></ul></details>
 </section>;
}