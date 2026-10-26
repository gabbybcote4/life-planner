import test from "node:test";
import assert from "node:assert/strict";
import { parseCalendarDate, parseEventTitle, shiftMonth, monthRange, monthCells, localToday, formatCalendarDate } from "../src/lib/calendar/dates.ts";

test("calendar dates validate real days, leap years, and supported year bounds", () => {
  for (const date of ["2024-02-29", "2000-02-29", "1900-01-01", "2100-12-31"]) assert.equal(parseCalendarDate(date), date);
  for (const date of [null, ["2026-01-01"], "2025-02-29", "1900-02-29", "2100-02-29", "2026-04-31", "2026-00-01", "2026-13-01", "2026-01-00", "2026-1-1", "1899-12-31", "2101-01-01", "2026-10-26T00:00:00Z"]) {
    assert.equal(parseCalendarDate(date), null);
  }
});

test("month navigation clamps dates and handles year transitions", () => {
  assert.equal(shiftMonth("2024-01-31", 1), "2024-02-29");
  assert.equal(shiftMonth("2025-03-31", -1), "2025-02-28");
  assert.equal(shiftMonth("2026-12-15", 1), "2027-01-15");
  assert.equal(shiftMonth("1900-01-01", -1), null);
  assert.equal(shiftMonth("2100-12-31", 1), null);
  assert.deepEqual(monthRange("2100-12-31"), { start: "2100-12-01", end: "2101-01-01" });
});

test("month cells align weekdays and contain each date exactly once", () => {
  const cells = monthCells("2026-10-26");
  assert.equal(cells.length % 7, 0);
  assert.equal(cells[4], "2026-10-01");
  assert.equal(cells.filter(Boolean).length, 31);
  assert.equal(new Set(cells.filter(Boolean)).size, 31);
  assert.equal(monthCells("2024-02-29").filter(Boolean).length, 29);
});

test("date-only formatting never shifts the event day with host time zone", () => {
  const previous = process.env.TZ;
  try {
    for (const timeZone of ["America/Edmonton", "Pacific/Honolulu", "Pacific/Kiritimati"]) {
      process.env.TZ = timeZone;
      assert.equal(formatCalendarDate("2026-10-26"), "Monday, October 26, 2026");
      assert.equal(localToday(new Date(2026, 9, 26, 23, 59)), "2026-10-26");
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test("event titles reject blank, non-text, and oversized input", () => {
  assert.equal(parseEventTitle("  A day to remember  "), "A day to remember");
  assert.equal(parseEventTitle("🌿".repeat(200)), "🌿".repeat(200));
  for (const title of [null, "", "\n\t ", "x".repeat(201), new File(["event"], "event.txt")]) assert.equal(parseEventTitle(title), null);
});
