"use client";

import { format, endOfWeek, startOfWeek } from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DefaultView } from "@/types/entities";
import { Button } from "@/components/ui/button";

type CalendarToolbarProps = {
  currentDate: Date;
  view: DefaultView;
  onViewChange: (view: DefaultView) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
};

function getPeriodLabel(view: DefaultView, currentDate: Date) {
  if (view === "day") {
    return format(currentDate, "EEEE, dd. MMMM yyyy", { locale: de });
  }

  if (view === "week") {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return `${format(start, "dd.MM.", { locale: de })} - ${format(end, "dd.MM.yyyy", { locale: de })}`;
  }

  return format(currentDate, "LLLL yyyy", { locale: de });
}

export function CalendarToolbar({
  currentDate,
  view,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/70 bg-card/90 p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Kalender
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">{getPeriodLabel(view, currentDate)}</h2>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Button onClick={onPrevious} size="icon" type="button" variant="outline">
            <ChevronLeft className="size-4" />
          </Button>
          <Button onClick={onToday} type="button" variant="secondary">
            Heute
          </Button>
          <Button onClick={onNext} size="icon" type="button" variant="outline">
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-secondary p-1">
          {(["day", "week", "month"] as const).map((value) => (
            <Button
              key={value}
              onClick={() => onViewChange(value)}
              size="sm"
              type="button"
              variant={view === value ? "default" : "ghost"}
            >
              {value === "day" ? "Tag" : value === "week" ? "Woche" : "Monat"}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
