"use client";

import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { useEffect, useMemo, useState } from "react";
import type { EventViewModel } from "@/lib/caldav";
import { eventOccursOnDate, getUpcomingDaysRange } from "@/lib/event-time";
import { requestJson } from "@/lib/http-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardOverviewProps = {
  timezone: string;
};

function formatDashboardEventDate(event: EventViewModel | null, timezone: string) {
  if (!event) {
    return null;
  }

  if (event.allDay) {
    return event.start;
  }

  return formatInTimeZone(event.start, timezone, "dd.MM.yyyy HH:mm");
}

export function DashboardOverview({ timezone }: DashboardOverviewProps) {
  const [events, setEvents] = useState<EventViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const range = getUpcomingDaysRange(14, timezone);

    void (async () => {
      try {
        const result = await requestJson<EventViewModel[]>(
          `/api/events?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`,
        );

        if (!isMounted) {
          return;
        }

        setEvents(result);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Termine konnten nicht geladen werden.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [timezone]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayEvents = useMemo(
    () => events.filter((event) => eventOccursOnDate(event, todayKey, timezone)),
    [events, timezone, todayKey],
  );
  const nextExam = events.find((event) => event.category === "Prüfung") ?? null;
  const nextOnline = events.find((event) => event.category === "Onlineeinheit") ?? null;

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Card className="border-border/60 bg-white/85 shadow-sm">
        <CardHeader className="space-y-1">
          <CardDescription>Heute</CardDescription>
          <CardTitle>{isLoading ? "Laden..." : `${todayEvents.length} Termine`}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          {todayEvents[0]?.title ?? "Heute ist noch nichts geplant."}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-white/85 shadow-sm">
        <CardHeader className="space-y-1">
          <CardDescription>Naechste 14 Tage</CardDescription>
          <CardTitle>{isLoading ? "Laden..." : `${events.length} Termine`}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          Ein kompakter Blick auf die direkt bevorstehenden Einheiten, Deadlines und Praesenztermine.
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-white/85 shadow-sm">
        <CardHeader className="space-y-1">
          <CardDescription>Naechste Pruefung</CardDescription>
          <CardTitle>{nextExam?.title ?? "Noch keine Pruefung gefunden"}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          {formatDashboardEventDate(nextExam, timezone) ??
            "Sobald CalDAV Daten liefert, wird hier die naechste Pruefung hervorgehoben."}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-white/85 shadow-sm">
        <CardHeader className="space-y-1">
          <CardDescription>Naechste Onlineeinheit</CardDescription>
          <CardTitle>{nextOnline?.title ?? "Noch keine Onlineeinheit gefunden"}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3 text-sm leading-6 text-muted-foreground">
          <span>
            {error
              ? `CalDAV-Hinweis: ${error}`
              : formatDashboardEventDate(nextOnline, timezone) ?? "Schneller Zugriff auf den Kalender."}
          </span>
          <Button asChild size="sm">
            <Link href="/events/new">+ Termin</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
