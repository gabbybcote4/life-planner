"use client";
import {usePlanning} from "@/app/components/planning-preferences";
import {calendarWeekdays} from "@/lib/calendar/preferences";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCalendarDate, monthCells, shiftMonth } from "@/lib/calendar/dates";
import { CalendarTodayButton } from "./calendar-today";

export function MonthView({ selectedDate, events }: { selectedDate: string; events: { event_date: string }[] }) {
  const {week_start}=usePlanning();
  const previous = shiftMonth(selectedDate, -1);
  const next = shiftMonth(selectedDate, 1);
  const cells = monthCells(selectedDate,week_start);
  const counts = new Map<string, number>();
  for (const event of events) counts.set(event.event_date, (counts.get(event.event_date) ?? 0) + 1);
  const weekdays = calendarWeekdays(week_start);

  return <section className="calendar-month" aria-labelledby="calendar-month-heading">
    <div className="calendar-toolbar">
      <h2 id="calendar-month-heading">{formatCalendarDate(selectedDate, true)}</h2>
      <div className="calendar-month-controls">
        {previous ? <Link href={`/calendar?date=${previous}`} className="calendar-arrow" aria-label="Previous month">←</Link> : <Button className="calendar-arrow" disabled aria-label="Previous month">←</Button>}
        <CalendarTodayButton />
        {next ? <Link href={`/calendar?date=${next}`} className="calendar-arrow" aria-label="Next month">→</Link> : <Button className="calendar-arrow" disabled aria-label="Next month">→</Button>}
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

