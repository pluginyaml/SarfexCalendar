"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { TimedEventLayout } from "@/components/calendar/time-grid-utils";
import { EventBlock } from "@/components/calendar/event-block";
import { canDragTimedCalendarEvent } from "@/components/calendar/time-grid-utils";

type DraggableTimedEventProps = {
  dateKey: string;
  layout: TimedEventLayout;
  timezone: string;
};

export function DraggableTimedEvent({
  dateKey,
  layout,
  timezone,
}: DraggableTimedEventProps) {
  const isDragEnabled = canDragTimedCalendarEvent(layout.event, timezone);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: layout.event.instanceKey,
    disabled: !isDragEnabled,
    data: {
      dateKey,
      event: layout.event,
      layout,
    },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        top: layout.top,
        left: `calc(${layout.leftPct}% + 1px)`,
        width: `calc(${layout.widthPct}% - 2px)`,
        height: layout.height,
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 30 : undefined,
      }}
      className="absolute px-[3px] py-[2px]"
      {...attributes}
      {...listeners}
    >
      <div
        className={isDragEnabled ? "cursor-grab active:cursor-grabbing" : ""}
        title={
          layout.event.isRecurring
            ? `${layout.event.title} - Drag and Drop ist für Serientermine deaktiviert.`
            : layout.event.title
        }
      >
        <EventBlock event={layout.event} timezone={timezone} variant="timed" />
      </div>
    </div>
  );
}
