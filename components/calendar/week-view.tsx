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
    <div className="overflow-x-auto">
      <div className="grid min-w-[980px] gap-4 md:grid-cols-7">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayEvents = events.filter((event) => eventOccursOnDate(event, dateKey, timezone));

          return (
            <Card className="card-shadow border-white/70 bg-card/90" key={dateKey}>
              <CardHeader>
                <CardTitle className="text-base">{format(day, "EEE dd.MM")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
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
