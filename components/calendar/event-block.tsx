"use client";

import type { EventViewModel } from "@/lib/caldav";
import { formatEventTimeLabel } from "@/lib/event-time";
import { cn } from "@/lib/utils";
import { EventPopover } from "@/components/calendar/event-popover";

type EventBlockProps = {
  event: EventViewModel;
  timezone: string;
  compact?: boolean;
};

export function EventBlock({ event, timezone, compact }: EventBlockProps) {
  const accentColor = event.color ?? "#275DF1";

  return (
    <EventPopover event={event} timezone={timezone}>
      <button
        className={cn(
          "flex w-full flex-col rounded-xl border bg-white/92 px-2.5 py-2 text-left shadow-sm transition-colors hover:bg-white",
          compact ? "gap-1" : "gap-1.5",
        )}
        style={{ borderColor: `${accentColor}30` }}
        type="button"
      >
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          <span
            className={cn(
              "truncate uppercase tracking-[0.16em]",
              compact ? "text-[9px] font-semibold" : "text-[10px] font-semibold",
            )}
            style={{ color: accentColor }}
          >
            {event.category || "Termin"}
          </span>
        </span>
        <span className={cn("font-semibold leading-tight text-slate-900", compact ? "text-[11px]" : "text-xs")}>
          {event.title}
        </span>
        <span className={cn("text-slate-500", compact ? "text-[10px]" : "text-[11px]")}>
          {formatEventTimeLabel(event, timezone)}
        </span>
      </button>
    </EventPopover>
  );
}
