"use client";

import { eachDayOfInterval, endOfWeek, format, startOfWeek } from "date-fns";
import type { EventViewModel } from "@/lib/caldav";
import { eventOccursOnDate } from "@/lib/event-time";
import { EventBlock } from "@/components/calendar/event-block";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WeekViewProps = {
  currentDate: Date;
  events: EventViewModel[];
  timezone: string;
};

export function WeekView({ currentDate, events, timezone }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="overflow-x-auto rounded-[1.75rem] border border-white/70 bg-card/75 p-3">
      <div className="grid min-w-[840px] gap-3 md:grid-cols-7">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayEvents = events.filter((event) => eventOccursOnDate(event, dateKey, timezone));

          return (
            <Card className="border-border/60 bg-white/85 shadow-sm" key={dateKey}>
              <CardHeader className="space-y-1 border-b border-border/50 pb-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {format(day, "EEE")}
                </p>
                <CardTitle className="text-base">{format(day, "dd.MM")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 pt-4">
                {dayEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Keine Termine</p>
                ) : (
                  dayEvents.map((event) => (
                    <EventBlock compact event={event} key={`${event.href}-${event.etag}-${dateKey}`} timezone={timezone} />
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
