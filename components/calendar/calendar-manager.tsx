"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CALENDAR_TODAY_EVENT_NAME, CALENDAR_VIEW_EVENT_NAME } from "@/lib/app-shortcuts";
import { createOccurrenceInstanceKey } from "@/lib/calendar/source-utils";
import { requestEvents } from "@/lib/calendar/client";
import type { EventViewModel, EventWarning } from "@/lib/calendar/types";
import { getCalendarRange, shiftCalendarDate } from "@/lib/event-time";
import { requestJson } from "@/lib/http-client";
import type { CalendarSourceRecord, DefaultView, UiSettingsRecord } from "@/types/entities";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { DayView } from "@/components/calendar/day-view";
import { MonthView } from "@/components/calendar/month-view";
import { WeekView } from "@/components/calendar/week-view";
import { YearView } from "@/components/calendar/year-view";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { QuickAdd } from "@/components/quick-add";

type CalendarManagerProps = {
  timezone: string;
};

const STALE_WARNING_CODE = "CALDAV_CACHE_STALE";

function parseRequestedView(search: string): DefaultView | null {
  const requestedView = new URLSearchParams(search).get("view");

  if (
    requestedView === "day" ||
    requestedView === "week" ||
    requestedView === "month" ||
    requestedView === "year"
  ) {
    return requestedView;
  }

  return null;
}

function buildViewUrl(pathname: string, nextView: DefaultView) {
  const params = new URLSearchParams(window.location.search);
  params.set("view", nextView);
  return `${pathname}?${params.toString()}`;
}

function sortCalendarEvents(items: EventViewModel[]) {
  return [...items].sort((left, right) => {
    const leftTime = left.allDay
      ? new Date(`${left.start}T00:00:00Z`).getTime()
      : new Date(left.start).getTime();
    const rightTime = right.allDay
      ? new Date(`${right.start}T00:00:00Z`).getTime()
      : new Date(right.start).getTime();

    return leftTime - rightTime;
  });
}

export function CalendarManager({ timezone }: CalendarManagerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [manualView, setManualView] = useState<DefaultView | null>(null);
  const [events, setEvents] = useState<EventViewModel[]>([]);
  const [warnings, setWarnings] = useState<EventWarning[]>([]);
  const [calendarSources, setCalendarSources] = useState<CalendarSourceRecord[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState("all");
  const [calendarSourceWarning, setCalendarSourceWarning] = useState<string | null>(null);
  const [settings, setSettings] = useState<UiSettingsRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestedView = parseRequestedView(searchParams.toString());
  const effectiveView = manualView ?? requestedView ?? settings?.defaultView ?? "week";

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const [calendarsResult, settingsResult] = await Promise.all([
          requestJson<CalendarSourceRecord[]>("/api/calendars"),
          requestJson<UiSettingsRecord>("/api/settings"),
        ]);

        if (!isMounted) {
          return;
        }

        setCalendarSources(calendarsResult);
        setSettings(settingsResult);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setCalendarSourceWarning(
          loadError instanceof Error
            ? loadError.message
            : "Kalenderquellen konnten nicht vollständig geladen werden.",
        );
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleTimedEventDrop = async (
    event: EventViewModel,
    nextValues: { start: string; end: string },
  ) => {
    if (event.start === nextValues.start && event.end === nextValues.end) {
      return;
    }

    if (!event.href || !event.etag || !event.title.trim() || !event.category.trim()) {
      toast.error("Der Termin kann nicht verschoben werden, weil Pflichtdaten fehlen.");
      return;
    }

    const optimisticEvent: EventViewModel = {
      ...event,
      start: nextValues.start,
      end: nextValues.end,
      instanceKey: createOccurrenceInstanceKey(event.href, nextValues.start),
    };
    const previousEvents = events;

    setEvents((current) =>
      sortCalendarEvents(
        current.map((item) => (item.href === event.href ? optimisticEvent : item)),
      ),
    );

    try {
      const savedEvent = await requestJson<EventViewModel>("/api/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          href: event.href,
          etag: event.etag,
          calendarId: event.calendarId ?? undefined,
          title: event.title,
          description: event.description ?? null,
          location: event.location ?? null,
          start: nextValues.start,
          end: nextValues.end,
          allDay: event.allDay,
          category: event.category,
          reminders: event.reminders,
          recurrence: null,
        }),
      });

      setEvents((current) =>
        sortCalendarEvents(current.map((item) => (item.href === event.href ? savedEvent : item))),
      );
      toast.success("Termin verschoben.");
    } catch (updateError) {
      setEvents(previousEvents);
      toast.error(
        updateError instanceof Error
          ? updateError.message
          : "Der Termin konnte nicht verschoben werden.",
      );
    }
  };

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

  useEffect(() => {
    let isMounted = true;
    const range = getCalendarRange(effectiveView, currentDate, timezone);
    const calendarQuery =
      effectiveSelectedCalendarId === "all"
        ? ""
        : `&calendarIds=${encodeURIComponent(effectiveSelectedCalendarId)}`;

    void (async () => {
      try {
        const result = await requestEvents(
          `/api/events?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}${calendarQuery}`,
        );

        if (!isMounted) {
          return;
        }

        setEvents(result.events);
        setWarnings(result.warnings);
        setError(null);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Kalender konnte nicht geladen werden.");
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
  }, [currentDate, effectiveSelectedCalendarId, effectiveView, timezone]);

  const syncViewToUrl = (nextView: DefaultView) => {
    if (typeof window === "undefined") {
      return;
    }

    router.replace(buildViewUrl(pathname, nextView), { scroll: false });
  };

  const handleViewChange = (nextView: DefaultView) => {
    setError(null);
    setIsLoading(true);
    setManualView(nextView);
    syncViewToUrl(nextView);
  };

  const handleShift = (direction: "previous" | "next") => {
    setError(null);
    setIsLoading(true);
    setCurrentDate((current) => shiftCalendarDate(current, effectiveView, direction));
  };

  const handleToday = () => {
    setError(null);
    setIsLoading(true);
    setCurrentDate(new Date());
  };

  const handleMonthSelect = (nextDate: Date) => {
    setCurrentDate(nextDate);
    handleViewChange("month");
  };

  const handleTodayShortcut = useEffectEvent(() => {
    handleToday();
  });

  const handleCalendarViewShortcut = useEffectEvent((nextView: DefaultView) => {
    handleViewChange(nextView);
  });

  useEffect(() => {
    const onToday = () => {
      handleTodayShortcut();
    };
    const onViewChange = (event: Event) => {
      const nextView = (event as CustomEvent<{ view?: DefaultView }>).detail?.view;

      if (!nextView) {
        return;
      }

      handleCalendarViewShortcut(nextView);
    };

    window.addEventListener(CALENDAR_TODAY_EVENT_NAME, onToday);
    window.addEventListener(CALENDAR_VIEW_EVENT_NAME, onViewChange as EventListener);

    return () => {
      window.removeEventListener(CALENDAR_TODAY_EVENT_NAME, onToday);
      window.removeEventListener(CALENDAR_VIEW_EVENT_NAME, onViewChange as EventListener);
    };
  }, []);

  return (
    <div className="space-y-3">
      <CalendarToolbar
        calendars={activeCalendarSources.map((calendar) => ({
          id: calendar.id,
          name: calendar.displayName,
        }))}
        currentDate={currentDate}
        onCalendarChange={setSelectedCalendarId}
        onNext={() => handleShift("next")}
        onPrevious={() => handleShift("previous")}
        onToday={handleToday}
        onViewChange={handleViewChange}
        selectedCalendarId={effectiveSelectedCalendarId}
        view={effectiveView}
      />

      <DashboardOverview timezone={timezone} />

      {error ? (
        <div className="rounded-[0.9rem] border border-destructive/15 bg-destructive/[0.04] px-3 py-3 text-[11px] text-destructive">
          {error}
        </div>
      ) : null}

      {!error && calendarSourceWarning ? (
        <div className="rounded-[0.9rem] border border-warning/15 bg-warning/5 px-3 py-3 text-[11px] text-foreground">
          {calendarSourceWarning}
        </div>
      ) : null}

      {!error && visibleWarnings.length > 0 ? (
        <div className="rounded-[0.9rem] border border-warning/15 bg-warning/5 px-3 py-3 text-[11px] text-foreground">
          {visibleWarnings.map((warning) => warning.message).join(" ")}
        </div>
      ) : null}

      {!error && hasStaleWarning ? (
        <p className="px-1 text-[11px] text-muted-foreground">
          Kalenderdaten werden kurzzeitig aus dem Cache angezeigt.
        </p>
      ) : null}

      {isLoading ? (
        <div className="rounded-[0.9rem] border border-black/6 bg-white/88 px-3 py-3 text-[11px] text-muted-foreground">
          Kalenderdaten werden geladen...
        </div>
      ) : effectiveView === "day" ? (
        <DayView
          currentDate={currentDate}
          events={events}
          onTimedEventDrop={handleTimedEventDrop}
          timezone={timezone}
        />
      ) : effectiveView === "week" ? (
        <WeekView
          currentDate={currentDate}
          events={events}
          onTimedEventDrop={handleTimedEventDrop}
          timezone={timezone}
        />
      ) : effectiveView === "month" ? (
        <MonthView currentDate={currentDate} events={events} timezone={timezone} />
      ) : (
        <YearView
          currentDate={currentDate}
          events={events}
          onMonthSelect={handleMonthSelect}
          timezone={timezone}
        />
      )}

      <QuickAdd
        className="border-black/6 bg-white/80"
        compact
        description="Schnellentwurf für einen neuen Termin"
        timezone={timezone}
        title="Quick Add"
      />
    </div>
  );
}
