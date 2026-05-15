"use client";

import { formatInTimeZone } from "date-fns-tz";
import type { EventViewModel } from "@/lib/calendar/types";
import { formatEventTimeLabel } from "@/lib/event-time";
import { cn } from "@/lib/utils";
import { EventPopover } from "@/components/calendar/event-popover";

type EventBlockProps = {
  event: EventViewModel;
  timezone: string;
  compact?: boolean;
  variant?: "default" | "pill" | "timed";
};

const twoLineClampStyle = {
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: 2,
  display: "-webkit-box",
  overflow: "hidden",
};

function getCompactTimeLabel(event: EventViewModel, timezone: string) {
  if (event.allDay) {
    return "Ganztag";
  }

  return formatInTimeZone(event.start, timezone, "HH:mm");
}

export function EventBlock({
  event,
  timezone,
  compact,
  variant = "default",
}: EventBlockProps) {
  const accentColor = event.color ?? "#275DF1";
  const sharedStyle = {
    borderColor: `${accentColor}24`,
  };

  if (variant === "pill") {
    return (
      <EventPopover event={event} timezone={timezone}>
        <button
          className="flex min-h-[1.85rem] w-full items-start gap-1.5 overflow-hidden rounded-[0.4rem] border bg-white/90 px-1.5 py-1 text-left transition-colors hover:bg-white"
          style={{
            ...sharedStyle,
            backgroundColor: `${accentColor}12`,
          }}
          title={event.title}
          type="button"
        >
          <span
            aria-hidden="true"
            className="mt-[0.28rem] h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          <div className="min-w-0">
            <span className="block text-[9px] font-medium leading-none text-slate-500">
              {getCompactTimeLabel(event, timezone)}
            </span>
            <span
              className="mt-0.5 block text-[10px] font-medium leading-[1.05] text-slate-900"
              style={twoLineClampStyle}
            >
              {event.title}
            </span>
          </div>
        </button>
      </EventPopover>
    );
  }

  if (variant === "timed") {
    return (
      <EventPopover event={event} timezone={timezone}>
        <button
          className="flex h-full w-full flex-col justify-between overflow-hidden rounded-[0.55rem] border bg-white/92 px-2 py-1.5 text-left transition-colors hover:bg-white"
          style={{
            ...sharedStyle,
            backgroundColor: `${accentColor}14`,
            boxShadow: "inset 2px 0 0 0 " + accentColor,
          }}
          title={event.title}
          type="button"
        >
          <span
            className="text-[10px] font-semibold leading-[1.1] text-slate-900"
            style={twoLineClampStyle}
          >
            {event.title}
          </span>
          <span className="mt-1 text-[9px] font-medium text-slate-500">
            {formatEventTimeLabel(event, timezone)}
          </span>
        </button>
      </EventPopover>
    );
  }

  return (
    <EventPopover event={event} timezone={timezone}>
      <button
        className={cn(
          "flex w-full flex-col rounded-[0.75rem] border bg-white/92 px-2.5 py-2 text-left transition-colors hover:bg-white",
          compact ? "gap-1" : "gap-1.5",
        )}
        style={sharedStyle}
        title={event.title}
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
        <span
          className={cn("font-semibold leading-tight text-slate-900", compact ? "text-[11px]" : "text-xs")}
          style={twoLineClampStyle}
        >
          {event.title}
        </span>
        <span className={cn("text-slate-500", compact ? "text-[10px]" : "text-[11px]")}>
          {formatEventTimeLabel(event, timezone)}
        </span>
      </button>
    </EventPopover>
  );
}
