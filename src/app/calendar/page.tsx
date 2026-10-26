import { MonthView } from "./month-view";
import { requireAccount } from "@/lib/auth/account";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { monthRange, parseCalendarDate } from "@/lib/calendar/dates";
import { PlannerPage, PlannerHeading, SetupNotice, LoadError } from "@/app/components/planner-page";
import { CalendarStart } from "./calendar-today";
import { CalendarEvents } from "./calendar-events";

type CalendarSearch = Promise<{ date?: string | string[] }>;

async function CalendarContent({ searchParams }: { searchParams: CalendarSearch }) {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const { supabase, userId, email } = await requireAccount();
  const params = await searchParams;
  const selectedDate = parseCalendarDate(params.date);
  if (!selectedDate) return <CalendarStart />;
  const range = monthRange(selectedDate);
  const { data: events, error, count } = await supabase.from("calendar_events")
    .select("id,title,event_date", { count: "exact" }).eq("user_id", userId)
    .gte("event_date", range.start).lt("event_date", range.end)
    .order("event_date").order("created_at").order("id").limit(1000);
  const tooMany = count !== null && count > (events?.length ?? 0);

  return <>
    <PlannerHeading eyebrow="Make time for what matters" title="Your days, thoughtfully planned." description="A calendar for the moments you want to remember. Start with a date and an all-day event." email={email} />
    {error || tooMany ? <LoadError title="Your events could not be loaded." description={tooMany ? "This month has more events than this view can display. No saved events have been changed." : "Try again. Your saved events have not been changed."} action="/calendar" params={{ date: selectedDate }} /> : <div className="calendar-layout">
      <MonthView selectedDate={selectedDate} events={events ?? []} />
      <CalendarEvents key={`${userId}:${selectedDate}`} selectedDate={selectedDate}
        events={(events ?? []).filter((event) => event.event_date === selectedDate)} />
    </div>}
  </>;
}

export default function CalendarPage({ searchParams }: { searchParams: CalendarSearch }) {
  return <PlannerPage active="calendar" loading="Loading your calendar...">
    <CalendarContent searchParams={searchParams} />
  </PlannerPage>;
}
