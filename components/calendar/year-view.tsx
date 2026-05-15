"use client";

import {
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { de } from "date-fns/locale";
import type { EventViewModel } from "@/lib/calendar/types";
import { eventOccursOnDate } from "@/lib/event-time";
import { cn } from "@/lib/utils";

type YearViewProps = {
  currentDate: Date;
  events: EventViewModel[];
  timezone: string;
  onMonthSelect: (date: Date) => void;
};

const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export function YearView({
  currentDate,
  events,
  timezone,
  onMonthSelect,
}: YearViewProps) {
  const yearStart = startOfYear(currentDate);
  const yearEnd = endOfYear(currentDate);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
  const yearDays = eachDayOfInterval({ start: yearStart, end: yearEnd });
  const eventCountByDay = new Map<string, number>();

  for (const day of yearDays) {
    const dateKey = format(day, "yyyy-MM-dd");
    const count = events.filter((event) => eventOccursOnDate(event, dateKey, timezone)).length;

    if (count > 0) {
      eventCountByDay.set(dateKey, count);
    }
  }

  return (
    <section className="rounded-[1rem] border border-black/6 bg-white p-3 sm:p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Jahr
          </p>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {format(currentDate, "yyyy")}
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Klick auf einen Monat öffnet die Monatsansicht.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
        {months.map((month) => {
          const monthStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
          const monthEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
          const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
          const activeDayCount = days.filter((day) =>
            eventCountByDay.has(format(day, "yyyy-MM-dd")),
          ).length;

          return (
            <button
              className="rounded-[1rem] border border-border bg-white/70 p-3 text-left transition-colors hover:bg-secondary/40"
              key={format(month, "yyyy-MM")}
              onClick={() => onMonthSelect(month)}
              type="button"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {format(month, "LLLL", { locale: de })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeDayCount > 0 ? `${activeDayCount} Tage mit Terminen` : "Keine Termine"}
                  </p>
                </div>
                {isSameMonth(month, new Date()) ? (
                  <span className="rounded-full bg-black/[0.045] px-2 py-0.5 text-[10px] font-medium text-foreground">
                    Aktuell
                  </span>
                ) : null}
              </div>

              <div className="mb-1 grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((label) => (
                  <span
                    className="text-center text-[10px] font-medium text-muted-foreground"
                    key={`${format(month, "yyyy-MM")}-${label}`}
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const count = eventCountByDay.get(dateKey) ?? 0;

                  return (
                    <div
                      className={cn(
                        "flex h-8 flex-col items-center justify-center rounded-[0.7rem] text-[10px]",
                        !isSameMonth(day, month) ? "text-muted-foreground/50" : "text-foreground",
                        count > 0 ? "bg-primary/8" : "",
                      )}
                      key={dateKey}
                    >
                      <span
                        className={cn(
                          isToday(day)
                            ? "inline-flex min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-background"
                            : "",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {count > 0 ? (
                        <span className="mt-0.5 inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
