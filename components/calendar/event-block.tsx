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
  return (
    <EventPopover event={event} timezone={timezone}>
      <button
        className={cn(
          "flex w-full flex-col rounded-2xl px-3 py-2 text-left text-white shadow-lg transition-transform hover:-translate-y-0.5",
          compact ? "gap-1" : "gap-2",
        )}
        style={{ backgroundColor: event.color ?? "#275DF1" }}
        type="button"
      >
        <span className={cn("font-semibold leading-tight", compact ? "text-xs" : "text-sm")}>
          {event.title}
        </span>
        <span className={cn("opacity-90", compact ? "text-[11px]" : "text-xs")}>
          {formatEventTimeLabel(event, timezone)}
        </span>
      </button>
    </EventPopover>
  );
}
