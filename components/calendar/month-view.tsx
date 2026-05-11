"use client";

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { EventViewModel } from "@/lib/caldav";
import { eventOccursOnDate } from "@/lib/event-time";
import { EventBlock } from "@/components/calendar/event-block";

type MonthViewProps = {
  currentDate: Date;
  events: EventViewModel[];
  timezone: string;
};

export function MonthView({ currentDate, events, timezone }: MonthViewProps) {
  const calendarStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="grid gap-3 md:grid-cols-7">
      {days.map((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const dayEvents = events.filter((event) => eventOccursOnDate(event, dateKey, timezone));

        return (
          <div
            className="min-h-40 rounded-[1.35rem] border border-border/60 bg-white/80 p-3 shadow-sm backdrop-blur"
            key={dateKey}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {format(day, "EEE")}
                </p>
                <span
                  className={`text-sm font-semibold ${
                    isSameMonth(day, currentDate) ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {format(day, "dd.MM")}
                </span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  isSameMonth(day, currentDate) ? "text-foreground" : "text-muted-foreground"
                } bg-muted/70`}
              >
                {dayEvents.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {dayEvents.slice(0, 3).map((event) => (
                <EventBlock compact event={event} key={`${event.href}-${event.etag}-${dateKey}`} timezone={timezone} />
              ))}
              {dayEvents.length > 3 ? (
                <p className="px-1 text-[11px] text-muted-foreground">
                  + {dayEvents.length - 3} weitere
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
