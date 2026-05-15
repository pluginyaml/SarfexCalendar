"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { requestEvents } from "@/lib/calendar/client";
import type { EventViewModel, EventWarning } from "@/lib/calendar/types";
import { getUpcomingEventsRange } from "@/lib/event-time";
import { requestJson } from "@/lib/http-client";
import type { CalendarSourceRecord, CategoryRecord } from "@/types/entities";
import { EventFilters } from "@/components/events/event-filters";
import { EventList } from "@/components/events/event-list";
import { QuickAdd } from "@/components/quick-add";

type EventsManagerProps = {
  timezone: string;
};

const STALE_WARNING_CODE = "CALDAV_CACHE_STALE";

export function EventsManager({ timezone }: EventsManagerProps) {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<EventViewModel[]>([]);
  const [warnings, setWarnings] = useState<EventWarning[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [calendarSources, setCalendarSources] = useState<CalendarSourceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedCalendarId, setSelectedCalendarId] = useState("all");
  const [metaWarning, setMetaWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeCalendarSources = useMemo(
    () =>
      calendarSources.filter((calendar) => calendar.isActive && !calendar.isMissingRemote),
    [calendarSources],
  );
  const effectiveSelectedCalendarId = useMemo(
    () =>
      selectedCalendarId === "all" ||
      activeCalendarSources.some((calendar) => calendar.id === selectedCalendarId)
        ? selectedCalendarId
        : "all",
    [activeCalendarSources, selectedCalendarId],
  );
  const visibleWarnings = useMemo(
    () => warnings.filter((warning) => warning.code !== STALE_WARNING_CODE),
    [warnings],
  );
  const hasStaleWarning = useMemo(
    () => warnings.some((warning) => warning.code === STALE_WARNING_CODE),
    [warnings],
  );
  const createdEventId = searchParams.get("created");

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const [categoriesResult, calendarsResult] = await Promise.all([
          requestJson<CategoryRecord[]>("/api/categories"),
          requestJson<CalendarSourceRecord[]>("/api/calendars"),
        ]);

        if (!isMounted) {
          return;
        }

        setCategories(categoriesResult);
        setCalendarSources(calendarsResult);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setMetaWarning(
          loadError instanceof Error
            ? loadError.message
            : "Filterdaten konnten nicht vollständig geladen werden.",
        );
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const range = getUpcomingEventsRange(6, timezone);
    const calendarQuery =
      effectiveSelectedCalendarId === "all"
        ? ""
        : `&calendarIds=${encodeURIComponent(effectiveSelectedCalendarId)}`;

    void (async () => {
      try {
        const eventsResult = await requestEvents(
          `/api/events?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}${calendarQuery}`,
        );

        if (!isMounted) {
          return;
        }

        setEvents(eventsResult.events);
        setWarnings(eventsResult.warnings);
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
  }, [effectiveSelectedCalendarId, timezone]);

  const locationOptions = useMemo(
    () =>
      Array.from(new Set(events.map((event) => event.location).filter(Boolean) as string[])).sort(
        (left, right) => left.localeCompare(right, "de-DE"),
      ),
    [events],
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch = query
        ? [event.title, event.description ?? "", event.location ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(query)
        : true;
      const matchesCategory =
        selectedCategory === "all" ? true : event.category === selectedCategory;
      const matchesLocation =
        selectedLocation === "all" ? true : (event.location ?? "") === selectedLocation;
      const matchesCalendar =
        effectiveSelectedCalendarId === "all"
          ? true
          : event.calendarId === effectiveSelectedCalendarId;

      return matchesSearch && matchesCategory && matchesLocation && matchesCalendar;
    });
  }, [effectiveSelectedCalendarId, events, search, selectedCategory, selectedLocation]);

  if (isLoading) {
    return (
      <div className="rounded-[1.75rem] border border-white/70 bg-card/90 px-5 py-10 text-sm text-muted-foreground">
        Termine werden geladen...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.75rem] border border-destructive/20 bg-destructive/5 px-5 py-10 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {metaWarning ? (
        <div className="rounded-[1.75rem] border border-warning/15 bg-warning/5 px-5 py-3 text-sm text-foreground">
          {metaWarning}
        </div>
      ) : null}
      {visibleWarnings.length > 0 ? (
        <div className="rounded-[1.75rem] border border-warning/15 bg-warning/5 px-5 py-3 text-sm text-foreground">
          {visibleWarnings.map((warning) => warning.message).join(" ")}
        </div>
      ) : null}
      {hasStaleWarning ? (
        <p className="px-1 text-[11px] text-muted-foreground">
          Ein Teil der Liste kommt kurzzeitig aus dem Cache.
        </p>
      ) : null}
      <EventFilters
        calendarId={effectiveSelectedCalendarId}
        calendars={activeCalendarSources.map((calendar) => ({
          id: calendar.id,
          name: calendar.displayName,
        }))}
        categories={categories.map((category) => category.name)}
        category={selectedCategory}
        location={selectedLocation}
        locations={locationOptions}
        onCalendarChange={setSelectedCalendarId}
        onCategoryChange={setSelectedCategory}
        onLocationChange={setSelectedLocation}
        onSearchChange={setSearch}
        search={search}
      />
      <QuickAdd
        compact
        description="Freitext in einen neuen Termin-Entwurf umwandeln"
        timezone={timezone}
      />
      <EventList events={filteredEvents} highlightEventId={createdEventId} timezone={timezone} />
    </div>
  );
}
