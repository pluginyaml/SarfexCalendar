"use client";

import { addDays, addMonths, addWeeks } from "date-fns";
import { useEffect, useState } from "react";
import type { EventViewModel } from "@/lib/caldav";
import { getCalendarRange } from "@/lib/event-time";
import { requestJson } from "@/lib/http-client";
import type { DefaultView } from "@/types/entities";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { DayView } from "@/components/calendar/day-view";
import { MonthView } from "@/components/calendar/month-view";
import { WeekView } from "@/components/calendar/week-view";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

type CalendarManagerProps = {
  timezone: string;
};

export function CalendarManager({ timezone }: CalendarManagerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<DefaultView>("week");
  const [events, setEvents] = useState<EventViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const range = getCalendarRange(view, currentDate, timezone);

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

        setError(loadError instanceof Error ? loadError.message : "Kalender konnte nicht geladen werden.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [currentDate, timezone, view]);

  const handleViewChange = (nextView: DefaultView) => {
    setError(null);
    setIsLoading(true);
    setView(nextView);
  };

  const handleShift = (direction: "previous" | "next") => {
    setError(null);
    setIsLoading(true);
    setCurrentDate((current) => {
      if (view === "day") {
        return direction === "next" ? addDays(current, 1) : addDays(current, -1);
      }

      if (view === "week") {
        return direction === "next" ? addWeeks(current, 1) : addWeeks(current, -1);
      }

      return direction === "next" ? addMonths(current, 1) : addMonths(current, -1);
    });
  };

  const handleToday = () => {
    setError(null);
    setIsLoading(true);
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-3">
      <CalendarToolbar
        currentDate={currentDate}
        onNext={() => handleShift("next")}
        onPrevious={() => handleShift("previous")}
        onToday={handleToday}
        onViewChange={handleViewChange}
        view={view}
      />

      <DashboardOverview timezone={timezone} />

      {error ? (
        <div className="rounded-[0.9rem] border border-destructive/15 bg-destructive/[0.04] px-3 py-3 text-[11px] text-destructive">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-[0.9rem] border border-black/6 bg-white/88 px-3 py-3 text-[11px] text-muted-foreground">
          Kalenderdaten werden geladen...
        </div>
      ) : view === "day" ? (
        <DayView currentDate={currentDate} events={events} timezone={timezone} />
      ) : view === "week" ? (
        <WeekView currentDate={currentDate} events={events} timezone={timezone} />
      ) : (
        <MonthView currentDate={currentDate} events={events} timezone={timezone} />
      )}
    </div>
  );
}
