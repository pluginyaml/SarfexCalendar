"use client";

import Link from "next/link";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { EventViewModel } from "@/lib/calendar/types";
import { formatEventDateTime } from "@/lib/event-time";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type EventListProps = {
  events: EventViewModel[];
  timezone: string;
  highlightEventId?: string | null;
};

export function EventList({ events, timezone, highlightEventId = null }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-border bg-card/90 px-5 py-10 text-sm text-muted-foreground">
        Keine Termine im gewählten Zeitraum gefunden.
      </div>
    );
  }

  const groups = Object.entries(
    events.reduce<Record<string, EventViewModel[]>>((accumulator, event) => {
      const groupKey = event.allDay ? event.start : new Date(event.start).toISOString();
      const monthKey = format(new Date(groupKey), "yyyy-MM", { locale: de });
      accumulator[monthKey] ??= [];
      accumulator[monthKey].push(event);
      return accumulator;
    }, {}),
  );

  return (
    <div className="space-y-5">
      {groups.map(([monthKey, monthEvents]) => (
        <Card key={monthKey} className="card-shadow border-white/70 bg-card/90">
          <CardHeader>
            <CardTitle>
              {format(new Date(`${monthKey}-01T00:00:00`), "LLLL yyyy", { locale: de })}
            </CardTitle>
            <CardDescription>{monthEvents.length} Termine</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {monthEvents.map((event) => (
              <Link
                key={event.instanceKey}
                className={cn(
                  "flex flex-col gap-3 rounded-[1.5rem] border border-border bg-white/70 px-4 py-4 transition-colors hover:bg-secondary/40",
                  highlightEventId === event.id ? "border-primary/40 bg-primary/5 ring-1 ring-primary/15" : "",
                )}
                href={`/events/${event.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatEventDateTime(event, timezone)}
                    </p>
                  </div>
                  <Badge
                    className="border-transparent text-white"
                    style={{ backgroundColor: event.color ?? "#64748B" }}
                    variant="outline"
                  >
                    {event.category || "Ohne Kategorie"}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {event.location ? <p>{event.location}</p> : null}
                  {event.calendarName ? (
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: event.calendarColor ?? "#94A3B8" }}
                      />
                      <span>{event.calendarName}</span>
                    </div>
                  ) : null}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
