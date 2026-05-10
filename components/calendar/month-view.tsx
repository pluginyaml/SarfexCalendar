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
    <div className="grid gap-4 md:grid-cols-7">
      {days.map((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const dayEvents = events.filter((event) => eventOccursOnDate(event, dateKey, timezone));

        return (
          <div
            className="card-shadow min-h-44 rounded-[1.5rem] border border-white/70 bg-card/90 p-3"
            key={dateKey}
          >
            <div className="mb-3 flex items-center justify-between">
              <span
                className={`text-sm font-semibold ${
                  isSameMonth(day, currentDate) ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {format(day, "dd.MM")}
              </span>
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {dayEvents.length}
              </span>
            </div>
            <div className="space-y-2">
              {dayEvents.slice(0, 3).map((event) => (
                <EventBlock compact event={event} key={`${event.href}-${event.etag}-${dateKey}`} timezone={timezone} />
              ))}
              {dayEvents.length > 3 ? (
                <p className="text-xs text-muted-foreground">+ {dayEvents.length - 3} weitere</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
