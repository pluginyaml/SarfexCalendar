"use client";

import { format, endOfWeek, startOfWeek } from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DefaultView } from "@/types/entities";
import { NewEventButton } from "@/components/layout/new-event-button";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CalendarToolbarProps = {
  currentDate: Date;
  view: DefaultView;
  calendars?: Array<{
    id: string;
    name: string;
  }>;
  selectedCalendarId?: string;
  onViewChange: (view: DefaultView) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onCalendarChange?: (value: string) => void;
};

function getViewLabel(view: DefaultView) {
  if (view === "day") {
    return "Tag";
  }

  if (view === "week") {
    return "Woche";
  }

  if (view === "year") {
    return "Jahr";
  }

  return "Monat";
}

function getPeriodLabel(view: DefaultView, currentDate: Date) {
  if (view === "day") {
    return format(currentDate, "EEEE, dd. MMMM yyyy", { locale: de });
  }

  if (view === "week") {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return `${format(start, "dd.MM.", { locale: de })} – ${format(end, "dd.MM.yyyy", { locale: de })}`;
  }

  if (view === "year") {
    return format(currentDate, "yyyy", { locale: de });
  }

  return format(currentDate, "LLLL yyyy", { locale: de });
}

export function CalendarToolbar({
  currentDate,
  view,
  calendars = [],
  selectedCalendarId = "all",
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  onCalendarChange,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-col gap-2 rounded-[1rem] border border-black/6 bg-white/90 px-3 py-2">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Kalender
          </p>
          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="text-[15px] font-semibold tracking-tight text-foreground">
              {getViewLabel(view)}
            </h1>
            <p className="text-[12px] text-muted-foreground">{getPeriodLabel(view, currentDate)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {calendars.length > 1 && onCalendarChange ? (
            <Select onValueChange={onCalendarChange} value={selectedCalendarId}>
              <SelectTrigger className="h-8 w-[210px] rounded-[0.7rem] text-[11px]">
                <SelectValue placeholder="Alle aktiven Kalender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle aktiven Kalender</SelectItem>
                {calendars.map((calendar) => (
                  <SelectItem key={calendar.id} value={calendar.id}>
                    {calendar.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <div className="flex items-center gap-1">
            <Button className="rounded-[0.7rem]" onClick={onPrevious} size="icon" type="button" variant="outline">
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              className="rounded-[0.7rem] px-2.5 text-[11px]"
              onClick={onToday}
              size="sm"
              type="button"
              variant="outline"
            >
              Heute
            </Button>
            <Button className="rounded-[0.7rem]" onClick={onNext} size="icon" type="button" variant="outline">
              <ChevronRight className="size-3.5" />
            </Button>
          </div>

          <div className="flex items-center rounded-[0.75rem] bg-black/[0.035] p-0.5">
            {(["day", "week", "month", "year"] as const).map((value) => (
              <Button
                className="h-7 rounded-[0.6rem] px-2.5 text-[11px]"
                key={value}
                onClick={() => onViewChange(value)}
                size="sm"
                type="button"
                variant={view === value ? "default" : "ghost"}
              >
                {value === "day"
                  ? "Tag"
                  : value === "week"
                    ? "Woche"
                    : value === "month"
                      ? "Monat"
                      : "Jahr"}
              </Button>
            ))}
          </div>

          <NewEventButton className="shrink-0" />
        </div>
      </div>
    </div>
  );
}
