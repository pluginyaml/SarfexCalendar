"use client";

import { formatInTimeZone } from "date-fns-tz";
import { useEffect, useMemo, useState } from "react";
import { requestEvents } from "@/lib/calendar/client";
import type { EventViewModel, EventWarning } from "@/lib/calendar/types";
import { eventOccursOnDate, getUpcomingEventsRange } from "@/lib/event-time";

type DashboardOverviewProps = {
  timezone: string;
};

const STALE_WARNING_CODE = "CALDAV_CACHE_STALE";

function normalizeCategory(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/\u00e4/g, "ae")
    .replace(/\u00f6/g, "oe")
    .replace(/\u00fc/g, "ue")
    .replace(/\u00df/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatEventValue(event: EventViewModel | null, timezone: string) {
  if (!event) {
    return "Keine";
  }

  if (event.allDay) {
    return event.start;
  }

  return formatInTimeZone(event.start, timezone, "dd.MM. HH:mm");
}

function formatEventDetail(event: EventViewModel | null) {
  return event?.title ?? "Noch nichts geplant";
}

export function DashboardOverview({ timezone }: DashboardOverviewProps) {
  const [events, setEvents] = useState<EventViewModel[]>([]);
  const [warnings, setWarnings] = useState<EventWarning[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const range = getUpcomingEventsRange(6, timezone);

    void (async () => {
      try {
        const result = await requestEvents(
          `/api/events?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`,
        );

        if (!isMounted) {
          return;
        }

        setEvents(
          [...result.events].sort(
            (left, right) => new Date(left.start).getTime() - new Date(right.start).getTime(),
          ),
        );
        setWarnings(result.warnings);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Termine konnten nicht geladen werden.");
        setWarnings([]);
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

  const todayKey = useMemo(() => formatInTimeZone(new Date(), timezone, "yyyy-MM-dd"), [timezone]);
  const todayEvents = useMemo(
    () => events.filter((event) => eventOccursOnDate(event, todayKey, timezone)),
    [events, timezone, todayKey],
  );
  const nextExam = useMemo(
    () => events.find((event) => normalizeCategory(event.category) === "pruefung") ?? null,
    [events],
  );
  const nextOnline = useMemo(
    () => events.find((event) => normalizeCategory(event.category) === "onlineeinheit") ?? null,
    [events],
  );
  const openDeadlines = useMemo(
    () => events.filter((event) => normalizeCategory(event.category) === "deadline").length,
    [events],
  );
  const nonStaleWarnings = warnings.filter((warning) => warning.code !== STALE_WARNING_CODE);
  const hasStaleWarnings = warnings.some((warning) => warning.code === STALE_WARNING_CODE);

  const items = [
    {
      label: "Heute",
      value: isLoading ? "..." : `${todayEvents.length}`,
      detail: todayEvents[0]?.title ?? "Keine Termine",
      accentClass: "bg-foreground/70",
    },
    {
      label: "Nächste Prüfung",
      value: isLoading ? "..." : formatEventValue(nextExam, timezone),
      detail: formatEventDetail(nextExam),
      accentClass: "bg-rose-500/70",
    },
    {
      label: "Nächste Onlineeinheit",
      value: isLoading ? "..." : formatEventValue(nextOnline, timezone),
      detail: formatEventDetail(nextOnline),
      accentClass: "bg-sky-500/70",
    },
    {
      label: "Offene Deadlines",
      value: isLoading ? "..." : `${openDeadlines}`,
      detail: openDeadlines > 0 ? "In den kommenden Monaten vorhanden" : "Aktuell nichts offen",
      accentClass: "bg-amber-500/70",
    },
    {
      label: "CalDAV",
      value: error ? "Störung" : isLoading ? "Prüfe..." : nonStaleWarnings.length > 0 ? "Warnung" : hasStaleWarnings ? "Cache" : "Verbunden",
      detail:
        error ??
        nonStaleWarnings[0]?.message ??
        (hasStaleWarnings ? "Kurzzeitig zwischengespeicherte Daten" : "Nextcloud ist die einzige Quelle der Wahrheit"),
      accentClass: error || nonStaleWarnings.length > 0 ? "bg-rose-500/70" : "bg-emerald-500/70",
    },
  ];

  return (
    <section className="overflow-hidden rounded-[0.95rem] border border-black/6 bg-white/88">
      <div className="overflow-x-auto">
        <div className="flex min-w-[920px] divide-x divide-black/6">
          {items.map((item) => (
            <div className="flex min-w-[184px] flex-1 flex-col gap-1 px-3 py-2.5" key={item.label}>
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${item.accentClass}`} />
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {item.label}
                </p>
              </div>
              <p className="text-[13px] font-semibold tracking-tight text-foreground">{item.value}</p>
              <p className="truncate text-[10px] leading-4 text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
