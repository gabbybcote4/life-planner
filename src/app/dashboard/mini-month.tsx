"use client";
import Link from "next/link";
import {usePlanning} from "@/app/components/planning-preferences";
import {calendarWeekdays} from "@/lib/calendar/preferences";
import {monthCells,formatCalendarDate} from "@/lib/calendar/dates";
export function MiniMonth({today}:{today:string}){const {week_start}=usePlanning();return <div className="desktop-mini-calendar"><h3>{formatCalendarDate(today,true)}</h3><div className="mini-weekdays" aria-hidden="true">{calendarWeekdays(week_start).map(day=><span key={day}>{day.slice(0,1)}</span>)}</div><div className="mini-month-days" aria-label="Current month (UTC)">{monthCells(today,week_start).map((date,index)=>date?<Link key={date} href={"/calendar?date="+date} aria-label={formatCalendarDate(date)} aria-current={date===today?"date":undefined}>{Number(date.slice(-2))}</Link>:<span key={index}/>)}</div></div>;}
