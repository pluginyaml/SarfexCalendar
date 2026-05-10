"use client";

import Link from "next/link";
import type { EventViewModel } from "@/lib/caldav";
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
      <PopoverContent align="start" className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold">{event.title}</h3>
            <Badge
              className="border-transparent text-white"
              style={{ backgroundColor: event.color ?? "#64748B" }}
              variant="outline"
            >
              {event.category || "Ohne Kategorie"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{formatEventDateTime(event, timezone)}</p>
        </div>
        {event.location ? <p className="text-sm text-muted-foreground">{event.location}</p> : null}
        {event.description ? (
          <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
            {event.description}
          </p>
        ) : null}
        <Button asChild className="w-full" size="sm">
          <Link href={`/events/${event.id}`}>Bearbeiten</Link>
        </Button>
      </PopoverContent>
    </Popover>
  );
}
