"use client";

import { createRequestId } from "@/lib/shared/request-id";

import { runAction, UNCONFIRMED_SAVE } from "@/lib/shared/client-actions";

import { FormFeedback } from "@/components/ui/feedback";
import { TextInput } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useActionState, useId, useRef, useState } from "react";
import { saveCalendarEvent } from "./actions";
import { EVENT_TITLE_LIMIT, formatCalendarDate, type CalendarEvent, type CalendarActionState } from "@/lib/calendar/dates";

export function CalendarEvents({ events, selectedDate }: { events: CalendarEvent[]; selectedDate: string }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<CalendarActionState>({});
  const onSaved = (result: CalendarActionState) => {
    setNotice(result);
    setEditingId(null);
  };

  return <section className="calendar-agenda" aria-labelledby="agenda-heading">
    <p className="eyebrow">A little space in your day</p>
    <h2 id="agenda-heading">{formatCalendarDate(selectedDate)}</h2>
    <p className="muted calendar-date-note">All-day events · {events.length} saved</p>
    <div className="calendar-notice" role="status">
      {notice.message && <p className="form-message">{notice.message}
        {notice.savedDate && notice.savedDate !== selectedDate && <> <Link className="text-link" href={`/calendar?date=${notice.savedDate}`}>View {formatCalendarDate(notice.savedDate)}</Link></>}
      </p>}
    </div>
    {events.length === 0 ? <p className="calendar-empty muted">Nothing planned for this date yet. Add an event below when you’re ready.</p> :
      <ul className="calendar-event-list" aria-label="Events for the selected date">
        {events.map((event) => <li key={event.id} className="calendar-event">
          {editingId === event.id ? <EventForm event={event} selectedDate={selectedDate}
            onSaved={onSaved} onCancel={() => setEditingId(null)} /> : <div className="calendar-event-summary">
            <span className="calendar-event-title">{event.title}</span>
            <Button variant="text" type="button" aria-label={`Edit event: ${event.title}`}
              onClick={() => { setNotice({}); setEditingId(event.id); }}>Edit</Button>
          </div>}
        </li>)}
      </ul>}
    <div className="calendar-add-event">
      <h3>Add an event</h3>
      <EventForm selectedDate={selectedDate} onSaved={setNotice} />
    </div>
  </section>;
}

function EventForm({ event, selectedDate, onSaved, onCancel }: {
  event?: CalendarEvent; selectedDate: string;
  onSaved: (result: CalendarActionState) => void; onCancel?: () => void;
}) {
  const fieldId = useId();
  const [title, setTitle] = useState(event?.title ?? "");
  const [date, setDate] = useState(event?.event_date ?? selectedDate);
  const requestId = useRef<string | null>(null);
  const [state, action, pending] = useActionState<CalendarActionState, FormData>(async (previous, data) => {
    const result = await runAction(async () => {
      requestId.current ??= event?.id ?? createRequestId();
      data.set("id", requestId.current);
      return saveCalendarEvent(previous, data);
    }, UNCONFIRMED_SAVE);
    if (!result.error) {
      if (!event) { setTitle(""); requestId.current = null; }
      onSaved(result);
    }
    return result;
  }, {});

  return <form action={action} className="calendar-event-form" aria-busy={pending}>
    <input type="hidden" name="mode" value={event ? "edit" : "create"} />
    <label htmlFor={`${fieldId}-title`}>Event title</label>
    <TextInput id={`${fieldId}-title`} name="title" value={title} onChange={(e) => setTitle(e.target.value)}
      maxLength={EVENT_TITLE_LIMIT} required readOnly={pending} autoComplete="off"
      placeholder="Something to look forward to..." />
    <label htmlFor={`${fieldId}-date`}>Date</label>
    <TextInput id={`${fieldId}-date`} name="event_date" type="date" value={date} onChange={(e) => setDate(e.target.value)}
      min="1900-01-01" max="2100-12-31" required readOnly={pending} />
    <div className="edit-task-controls">
      <Button variant="primary" type="submit" disabled={pending || !title.trim() || !date}>
        {pending ? "Saving..." : event ? "Save changes" : "Save event"}
      </Button>
      {onCancel && <Button variant="text" type="button" disabled={pending} onClick={onCancel}>Cancel</Button>}
    </div>
    <FormFeedback error={state.error} pending={pending} />
  </form>;
}

