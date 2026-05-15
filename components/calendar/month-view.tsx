"use client";

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { de } from "date-fns/locale";
import type { EventViewModel } from "@/lib/calendar/types";
import { eventOccursOnDate } from "@/lib/event-time";
import { cn } from "@/lib/utils";
import { EventBlock } from "@/components/calendar/event-block";

type MonthViewProps = {
  currentDate: Date;
  events: EventViewModel[];
  timezone: string;
};

const WEEKDAY_LABELS = Array.from({ length: 7 }, (_, index) =>
  format(new Date(2026, 0, index + 5), "EEE", { locale: de }),
);

export function MonthView({ currentDate, events, timezone }: MonthViewProps) {
  const calendarStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <section className="overflow-hidden rounded-[1rem] border border-black/6 bg-white">
      <div className="overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-7 border-b border-black/6">
            {WEEKDAY_LABELS.map((label) => (
              <div
                className="border-r border-black/6 px-2.5 py-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground last:border-r-0"
                key={label}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayEvents = events.filter((event) => eventOccursOnDate(event, dateKey, timezone));

              return (
                <div
                  className={cn(
                    "min-h-[120px] border-b border-black/6 px-2.5 py-2",
                    index % 7 !== 6 ? "border-r border-black/6" : "",
                    !isSameMonth(day, currentDate) ? "bg-black/[0.015]" : "",
                  )}
                  key={dateKey}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className={
                        isToday(day)
                          ? "flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[10px] font-medium text-background"
                          : isSameMonth(day, currentDate)
                            ? "text-[11px] font-medium text-foreground"
                            : "text-[11px] font-medium text-muted-foreground"
                      }
                    >
                      {format(day, "d")}
                    </span>
                    {index < 7 ? (
                      <span className="text-[10px] text-muted-foreground">{format(day, "MM")}</span>
                    ) : null}
                  </div>

                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <EventBlock compact event={event} key={event.instanceKey} timezone={timezone} variant="pill" />
                    ))}
                    {dayEvents.length > 3 ? (
                      <p className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} mehr</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
