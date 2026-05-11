"use client";

import { format, isToday } from "date-fns";
import { de } from "date-fns/locale";
import type { EventViewModel } from "@/lib/caldav";
import { EventBlock } from "@/components/calendar/event-block";
import {
  buildTimedEventLayoutsForDate,
  getAllDayEventsForDate,
  getVisibleHourRange,
  HOUR_ROW_HEIGHT,
} from "@/components/calendar/time-grid-utils";

type DayViewProps = {
  currentDate: Date;
  events: EventViewModel[];
  timezone: string;
};

export function DayView({ currentDate, events, timezone }: DayViewProps) {
  const dateKey = format(currentDate, "yyyy-MM-dd");
  const { startHour, endHour } = getVisibleHourRange(events, [currentDate], timezone);
  const hours = Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
  const totalHeight = hours.length * HOUR_ROW_HEIGHT;
  const allDayEvents = getAllDayEventsForDate(events, dateKey, timezone);
  const layouts = buildTimedEventLayoutsForDate(events, dateKey, timezone, startHour, endHour);

  return (
    <section className="overflow-hidden rounded-[1rem] border border-black/6 bg-white">
      <div className="flex items-center justify-between border-b border-black/6 px-3 py-2">
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Tag
          </p>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              {format(currentDate, "EEEE", { locale: de })}
            </h2>
            <span className="text-[11px] text-muted-foreground">{format(currentDate, "dd.MM.yyyy")}</span>
          </div>
        </div>
        {isToday(currentDate) ? (
          <span className="rounded-full bg-black/[0.045] px-2 py-0.5 text-[10px] font-medium text-foreground">
            Heute
          </span>
        ) : null}
      </div>

      {allDayEvents.length > 0 ? (
        <div className="border-b border-black/6 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Ganztag
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {allDayEvents.map((event) => (
              <div className="min-w-[220px] flex-1" key={`${event.href}-${event.etag}`}>
                <EventBlock compact event={event} timezone={timezone} variant="pill" />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="max-h-[72vh] overflow-y-auto">
        <div className="grid grid-cols-[64px_minmax(0,1fr)]">
          <div className="relative border-r border-black/6">
            {hours.map((hour) => (
              <div className="relative border-b border-black/[0.05]" key={hour} style={{ height: HOUR_ROW_HEIGHT }}>
                <span className="absolute -top-1.5 right-2 bg-white px-1 text-[10px] text-muted-foreground">
                  {`${hour}:00`}
                </span>
              </div>
            ))}
            <span className="absolute -bottom-1.5 right-2 bg-white px-1 text-[10px] text-muted-foreground">
              24:00
            </span>
          </div>

          <div className="relative" style={{ height: totalHeight }}>
            {hours.map((hour) => (
              <div
                className="border-b border-black/[0.05]"
                key={`${dateKey}-${hour}`}
                style={{ height: HOUR_ROW_HEIGHT }}
              />
            ))}

            {layouts.length === 0 && allDayEvents.length === 0 ? (
              <p className="absolute left-3 top-3 text-[11px] text-muted-foreground">
                Keine Termine an diesem Tag.
              </p>
            ) : null}

            <div className="absolute inset-0">
              {layouts.map((layout) => (
                <div
                  className="absolute px-[4px] py-[2px]"
                  key={`${layout.event.href}-${layout.event.etag}-${dateKey}`}
                  style={{
                    top: layout.top,
                    left: `calc(${layout.leftPct}% + 1px)`,
                    width: `calc(${layout.widthPct}% - 2px)`,
                    height: layout.height,
                  }}
                >
                  <EventBlock event={layout.event} timezone={timezone} variant="timed" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
