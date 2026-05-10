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
    <div className="space-y-5">
      <CalendarToolbar
        currentDate={currentDate}
        onNext={() => handleShift("next")}
        onPrevious={() => handleShift("previous")}
        onToday={handleToday}
        onViewChange={handleViewChange}
        view={view}
      />

      {error ? (
        <div className="rounded-[1.75rem] border border-destructive/20 bg-destructive/5 px-5 py-10 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-[1.75rem] border border-white/70 bg-card/90 px-5 py-10 text-sm text-muted-foreground">
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
