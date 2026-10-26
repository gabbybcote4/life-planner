import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatCalendarDate, monthCells, monthRange, parseCalendarDate, shiftMonth } from "@/lib/calendar/dates";
import { PlannerNavigation } from "../components/planner-navigation";
import { SignOutButton } from "../sign-out-button";
import { CalendarStart, CalendarTodayButton } from "./calendar-today";
import { CalendarEvents } from "./calendar-events";

type CalendarSearch = Promise<{ date?: string | string[] }>;

async function CalendarContent({ searchParams }: { searchParams: CalendarSearch }) {
  if (!isSupabaseConfigured()) return <p className="form-message">Your planner is being set up. Sign-in will be available soon.</p>;
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError || !auth?.claims?.sub) redirect("/login");
  const params = await searchParams;
  const selectedDate = parseCalendarDate(params.date);
  if (!selectedDate) return <CalendarStart />;
  const range = monthRange(selectedDate);
  const { data: events, error, count } = await supabase.from("calendar_events")
    .select("id,title,event_date", { count: "exact" }).eq("user_id", auth.claims.sub)
    .gte("event_date", range.start).lt("event_date", range.end)
    .order("event_date").order("created_at").order("id").limit(1000);
  const tooMany = count !== null && count > (events?.length ?? 0);

  return <>
    <div className="planner-intro">
      <div><p className="eyebrow">Make time for what matters</p><h1>Your days, thoughtfully planned.</h1>
        <p className="intro">A calendar for the moments you want to remember. Start with a date and an all-day event.</p></div>
      <div className="planner-account"><p className="muted">{String(auth.claims.email ?? "Your account")}</p><SignOutButton /></div>
    </div>
    {error || tooMany ? <section className="task-load-error" aria-labelledby="calendar-error-heading">
      <h2 id="calendar-error-heading">Your events couldn’t be loaded.</h2>
      <p className="muted">{tooMany ? "This month has more events than this view can display. No saved events have been changed." : "Try again. Your saved events have not been changed."}</p>
      <form action="/calendar" method="get"><input type="hidden" name="date" value={selectedDate} />
        <button className="secondary-button" type="submit">Try again</button></form>
    </section> : <div className="calendar-layout">
      <MonthView selectedDate={selectedDate} events={events ?? []} />
      <CalendarEvents key={`${auth.claims.sub}:${selectedDate}`} selectedDate={selectedDate}
        events={(events ?? []).filter((event) => event.event_date === selectedDate)} />
    </div>}
  </>;
}

function MonthView({ selectedDate, events }: { selectedDate: string; events: { event_date: string }[] }) {
  const previous = shiftMonth(selectedDate, -1);
  const next = shiftMonth(selectedDate, 1);
  const cells = monthCells(selectedDate);
  const counts = new Map<string, number>();
  for (const event of events) counts.set(event.event_date, (counts.get(event.event_date) ?? 0) + 1);
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return <section className="calendar-month" aria-labelledby="calendar-month-heading">
    <div className="calendar-toolbar">
      <h2 id="calendar-month-heading">{formatCalendarDate(selectedDate, true)}</h2>
      <div className="calendar-month-controls">
        {previous ? <Link href={`/calendar?date=${previous}`} className="calendar-arrow" aria-label="Previous month">←</Link> : <button className="calendar-arrow" disabled aria-label="Previous month">←</button>}
        <CalendarTodayButton />
        {next ? <Link href={`/calendar?date=${next}`} className="calendar-arrow" aria-label="Next month">→</Link> : <button className="calendar-arrow" disabled aria-label="Next month">→</button>}
      </div>
    </div>
    <table className="calendar-table">
      <caption className="visually-hidden">{formatCalendarDate(selectedDate, true)}. Select a date to view or add events.</caption>
      <thead><tr>{weekdays.map((day) => <th key={day} scope="col"><abbr title={day}>{day.slice(0, 3)}</abbr></th>)}</tr></thead>
      <tbody>{Array.from({ length: cells.length / 7 }, (_, row) => <tr key={row}>
        {cells.slice(row * 7, row * 7 + 7).map((date, column) => <td key={date ?? `blank-${column}`}>
          {date && <Link href={`/calendar?date=${date}`} className={`calendar-day${date === selectedDate ? " is-selected" : ""}`}
            aria-current={date === selectedDate ? "date" : undefined}
            aria-label={`${formatCalendarDate(date)}, ${counts.get(date) ?? 0} events`}>
            <span className="calendar-day-number" aria-hidden="true">{Number(date.slice(-2))}</span>
            <span className="calendar-day-count" aria-hidden="true">{counts.has(date) ? `${counts.get(date)} ${counts.get(date) === 1 ? "event" : "events"}` : ""}</span>
          </Link>}
        </td>)}
      </tr>)}</tbody>
    </table>
    <p className="muted calendar-help">Choose a date to see its events. All-day dates stay the same across time zones.</p>
  </section>;
}

export default function CalendarPage({ searchParams }: { searchParams: CalendarSearch }) {
  return <main className="planner-shell"><section className="paper-card calendar-card" aria-label="Your Life Planner calendar">
    <PlannerNavigation active="calendar" />
    <Suspense fallback={<p role="status">Loading your calendar...</p>}><CalendarContent searchParams={searchParams} /></Suspense>
  </section></main>;
}
