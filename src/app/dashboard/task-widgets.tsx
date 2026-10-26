import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import type { Task } from "@/lib/tasks/types";
import type { Widget } from "@/lib/dashboard/layout";
import { AddTaskForm, TaskList } from "../tasks/task-board";
import { DashboardWidgets } from "./dashboard-widgets";

type TaskCounts = { open: number; completed: number; headingId?: string };

export function TaskOverviewWidget({ open, completed, headingId = "overview-heading" }: TaskCounts) {
  const total = open + completed;
  return <section className="overview-section" aria-labelledby={headingId}>
    <div className="dashboard-section-heading"><h2 id={headingId}>At a glance</h2><p className="muted">Across all your saved tasks</p></div>
    <dl className="overview-cards">
      <div className="overview-card overview-open"><dt>To do</dt><dd><span className="overview-number">{open}</span><span className="overview-note">Room for your next step</span></dd></div>
      <div className="overview-card overview-completed"><dt>Completed</dt><dd><span className="overview-number">{completed}</span><span className="overview-note">Small wins add up</span></dd></div>
      <div className="overview-card"><dt>Total tasks</dt><dd><span className="overview-number">{total}</span><span className="overview-note">Your list, all in one place</span></dd></div>
    </dl><p className="visually-hidden" role="status">{open} tasks to do, {completed} completed, {total} total.</p>
  </section>;
}

export function QuickAddWidget({ headingId = "capture-heading" }: { headingId?: string }) {
  return <section className="dashboard-capture" aria-labelledby={headingId}>
    <p className="eyebrow">Make a little room</p><h2 id={headingId}>Get it off your mind.</h2>
    <p className="muted panel-intro">Capture a task here. It will be waiting in your list.</p><AddTaskForm />
  </section>;
}

export function TaskProgressWidget({ open, completed, headingId = "progress-heading" }: TaskCounts) {
  const total = open + completed;
  const percent = total === 0 ? 0 : Math.round(completed / total * 100);
  return <section className="dashboard-progress-widget" aria-labelledby={headingId}>
    <p className="eyebrow">Every step counts</p><h2 id={headingId}>Your progress</h2>
    {total === 0 ? <p className="muted panel-intro">Your first task is a place to start. Your progress will appear here.</p> : <>
      <p className="progress-value">{percent}<span>% complete</span></p>
      <progress value={completed} max={total} aria-label={`${completed} of ${total} saved tasks completed`} />
      <p className="muted panel-intro">{open === 0 ? "All caught up. Take a moment to enjoy it." : `${completed} of ${total} tasks completed. Keep going at your own pace.`}</p>
    </>}
  </section>;
}

export function RecentTasksWidget({ tasks, headingId = "recent-heading" }: { tasks: Task[]; headingId?: string }) {
  return <section className="dashboard-recent-widget" aria-labelledby={headingId}>
    <div className="dashboard-section-heading"><div><p className="eyebrow">Pick up where you left off</p><h2 id={headingId}>Recently added</h2></div>
      <Link className="text-link" href="/tasks">View all tasks <span aria-hidden="true">→</span></Link></div>
    {tasks.length === 0 ? <EmptyState title="Your list starts here.">Add a task from Quick add or the Tasks page.</EmptyState> : <TaskList tasks={tasks} />}
  </section>;
}

export function TaskWidgets({ open, completed, tasks, layout, revision, canCustomize }: {
  open: number; completed: number; tasks: Task[]; layout: Widget[]; revision: number; canCustomize: boolean;
}) {
  return <DashboardWidgets savedLayout={layout} savedRevision={revision} canCustomize={canCustomize} slots={{
    overview: <TaskOverviewWidget open={open} completed={completed} />,
    capture: <QuickAddWidget />,
    progress: <TaskProgressWidget open={open} completed={completed} />,
    recent: <RecentTasksWidget tasks={tasks} />,
  }} />;
}
