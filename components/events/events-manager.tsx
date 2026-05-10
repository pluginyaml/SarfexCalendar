"use client";

import { useEffect, useMemo, useState } from "react";
import type { EventViewModel } from "@/lib/caldav";
import { getUpcomingEventsRange } from "@/lib/event-time";
import { requestJson } from "@/lib/http-client";
import type { CategoryRecord } from "@/types/entities";
import { EventFilters } from "@/components/events/event-filters";
import { EventList } from "@/components/events/event-list";

type EventsManagerProps = {
  timezone: string;
};

export function EventsManager({ timezone }: EventsManagerProps) {
  const [events, setEvents] = useState<EventViewModel[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const range = getUpcomingEventsRange(6, timezone);

    void (async () => {
      try {
        const [eventsResult, categoriesResult] = await Promise.all([
          requestJson<EventViewModel[]>(
            `/api/events?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`,
          ),
          requestJson<CategoryRecord[]>("/api/categories"),
        ]);

        if (!isMounted) {
          return;
        }

        setEvents(eventsResult);
        setCategories(categoriesResult);
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

      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [events, search, selectedCategory, selectedLocation]);

  if (isLoading) {
    return <div className="rounded-[1.75rem] border border-white/70 bg-card/90 px-5 py-10 text-sm text-muted-foreground">Termine werden geladen...</div>;
  }

  if (error) {
    return <div className="rounded-[1.75rem] border border-destructive/20 bg-destructive/5 px-5 py-10 text-sm text-destructive">{error}</div>;
  }

  return (
    <div className="space-y-5">
      <EventFilters
        categories={categories.map((category) => category.name)}
        category={selectedCategory}
        location={selectedLocation}
        locations={locationOptions}
        onCategoryChange={setSelectedCategory}
        onLocationChange={setSelectedLocation}
        onSearchChange={setSearch}
        search={search}
      />
      <EventList events={filteredEvents} timezone={timezone} />
    </div>
  );
}
