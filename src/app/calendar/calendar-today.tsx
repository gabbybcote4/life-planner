"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { localToday } from "@/lib/calendar/dates";

export function CalendarStart() {
  const router = useRouter();
  useEffect(() => {
    // Read the browser's local date after hydration, not the server's UTC day.
    router.replace(`/calendar?date=${localToday()}`);
  }, [router]);
  return <p role="status">Opening your calendar...</p>;
}

export function CalendarTodayButton() {
  const router = useRouter();
  return <Button className="calendar-today-button" type="button"
    onClick={() => router.push(`/calendar?date=${localToday()}`)}>Today</Button>;
}
