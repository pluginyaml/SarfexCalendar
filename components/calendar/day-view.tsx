"use client";

import { format } from "date-fns";
import type { EventViewModel } from "@/lib/caldav";
import { eventOccursOnDate } from "@/lib/event-time";
import { EventBlock } from "@/components/calendar/event-block";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type DayViewProps = {
  currentDate: Date;
  events: EventViewModel[];
  timezone: string;
};

export function DayView({ currentDate, events, timezone }: DayViewProps) {
  const dateKey = format(currentDate, "yyyy-MM-dd");
  const dayEvents = events.filter((event) => eventOccursOnDate(event, dateKey, timezone));

  return (
    <Card className="border-border/60 bg-white/82 shadow-sm">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-base">Tagesansicht</CardTitle>
        <CardDescription className="text-xs">{format(currentDate, "dd.MM.yyyy")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {dayEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground">Keine Termine an diesem Tag.</p>
        ) : (
          dayEvents.map((event) => (
            <EventBlock compact={false} event={event} key={`${event.href}-${event.etag}`} timezone={timezone} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
