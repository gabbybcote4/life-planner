"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { localToday } from "@/lib/calendar/dates";

export function CalendarStart({view="month"}:{view?:"month"|"week"}={}) {
  const router = useRouter();
  useEffect(() => {
    // Read the browser's local date after hydration, not the server's UTC day.
    router.replace(`/calendar?date=${localToday()}${view==="week"?"&view=week":""}`);
  }, [router,view]);
  return <p role="status">Opening your calendar...</p>;
}

export function CalendarTodayButton({view="month"}:{view?:"month"|"week"}={}) {
  const router = useRouter();
  return <Button className="calendar-today-button" type="button"
    onClick={() => router.push(`/calendar?date=${localToday()}${view==="week"?"&view=week":""}`)}>Today</Button>;
}
