"use client";

import Link from "next/link";
import type { EventViewModel } from "@/lib/calendar/types";
import { formatEventDateTime } from "@/lib/event-time";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type EventPopoverProps = {
  event: EventViewModel;
  timezone: string;
  children: React.ReactNode;
};

export function EventPopover({ event, timezone, children }: EventPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold">{event.title}</h3>
            <Badge
              className="border-transparent text-white/95"
              style={{ backgroundColor: event.color ?? "#64748B" }}
              variant="outline"
            >
              {event.category || "Ohne Kategorie"}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">{formatEventDateTime(event, timezone)}</p>
          {event.calendarName ? (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span
                className="inline-flex h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: event.calendarColor ?? "#94A3B8" }}
              />
              <span>{event.calendarName}</span>
            </div>
          ) : null}
        </div>
        {event.isRecurring ? (
          <p className="text-[11px] text-muted-foreground">
            Serientermine lassen sich in V2 nur als gesamte Serie bearbeiten.
          </p>
        ) : null}
        {event.location ? <p className="text-[11px] text-muted-foreground">{event.location}</p> : null}
        {event.description ? (
          <p className="whitespace-pre-line text-[11px] leading-5 text-muted-foreground">
            {event.description}
          </p>
        ) : null}
        <Button asChild className="w-full rounded-[0.75rem] text-[11px]" size="sm" variant="outline">
          <Link href={`/events/${event.id}`}>Bearbeiten</Link>
        </Button>
      </PopoverContent>
    </Popover>
  );
}
