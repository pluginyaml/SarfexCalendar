"use client";

import { DndContext, PointerSensor, pointerWithin, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { format, isToday } from "date-fns";
import { de } from "date-fns/locale";
import type { EventViewModel } from "@/lib/calendar/types";
import { DraggableTimedEvent } from "@/components/calendar/draggable-timed-event";
import { EventBlock } from "@/components/calendar/event-block";
import {
  buildTimedEventDropUpdate,
  buildTimedEventLayoutsForDate,
  getAllDayEventsForDate,
  getVisibleHourRange,
  HOUR_ROW_HEIGHT,
  resolveCalendarSlotFromOffset,
} from "@/components/calendar/time-grid-utils";

type DayViewProps = {
  currentDate: Date;
  events: EventViewModel[];
  timezone: string;
  onTimedEventDrop?: (event: EventViewModel, nextValues: { start: string; end: string }) => void;
};

type DayDropZoneProps = {
  dateKey: string;
  totalHeight: number;
  timezone: string;
  layouts: ReturnType<typeof buildTimedEventLayoutsForDate>;
};

function DayDropZone({ dateKey, totalHeight, timezone, layouts }: DayDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `day-drop-${dateKey}`,
    data: {
      dateKey,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={isOver ? "relative bg-primary/5 transition-colors" : "relative transition-colors"}
      style={{ height: totalHeight }}
    >
      <div className="absolute inset-0">
        {layouts.map((layout) => (
          <DraggableTimedEvent
            dateKey={dateKey}
            key={layout.event.instanceKey}
            layout={layout}
            timezone={timezone}
          />
        ))}
      </div>
    </div>
  );
}

export function DayView({
  currentDate,
  events,
  timezone,
  onTimedEventDrop,
}: DayViewProps) {
  const dateKey = format(currentDate, "yyyy-MM-dd");
  const { startHour, endHour } = getVisibleHourRange(events, [currentDate], timezone);
  const hours = Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
  const totalHeight = hours.length * HOUR_ROW_HEIGHT;
  const allDayEvents = getAllDayEventsForDate(events, dateKey, timezone);
  const layouts = buildTimedEventLayoutsForDate(events, dateKey, timezone, startHour, endHour);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragEnd={(dragEndEvent) => {
        if (!onTimedEventDrop || !dragEndEvent.over) {
          return;
        }

        const draggedEvent = dragEndEvent.active.data.current?.event as EventViewModel | undefined;
        const targetDateKey = dragEndEvent.over.data.current?.dateKey as string | undefined;

        if (!draggedEvent || !targetDateKey) {
          return;
        }

        const translatedTop =
          dragEndEvent.active.rect.current.translated?.top ??
          (dragEndEvent.active.rect.current.initial?.top ?? 0) + dragEndEvent.delta.y;
        const offsetY = translatedTop - dragEndEvent.over.rect.top;
        const durationMinutes =
          (new Date(draggedEvent.end).getTime() - new Date(draggedEvent.start).getTime()) / 60_000;
        const slot = resolveCalendarSlotFromOffset({
          dateKey: targetDateKey,
          offsetY,
          startHour,
          endHour,
          durationMinutes,
        });

        onTimedEventDrop(
          draggedEvent,
          buildTimedEventDropUpdate(draggedEvent, slot, timezone),
        );
      }}
      sensors={sensors}
    >
      <section className="overflow-hidden rounded-[1rem] border border-black/6 bg-white">
        <div className="flex items-center justify-between border-b border-black/6 px-3 py-2">
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Tag
            </p>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">
                {format(currentDate, "EEEE", { locale: de })}
              </h2>
              <span className="text-[11px] text-muted-foreground">
                {format(currentDate, "dd.MM.yyyy")}
              </span>
            </div>
          </div>
          {isToday(currentDate) ? (
            <span className="rounded-full bg-black/[0.045] px-2 py-0.5 text-[10px] font-medium text-foreground">
              Heute
            </span>
          ) : null}
        </div>

        {allDayEvents.length > 0 ? (
          <div className="border-b border-black/6 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Ganztag
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {allDayEvents.map((event) => (
                <div className="min-w-[220px] flex-1" key={event.instanceKey}>
                  <EventBlock compact event={event} timezone={timezone} variant="pill" />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="max-h-[72vh] overflow-y-auto">
          <div className="grid grid-cols-[64px_minmax(0,1fr)]">
            <div className="relative border-r border-black/6">
              {hours.map((hour) => (
                <div
                  className="relative border-b border-black/[0.05]"
                  key={hour}
                  style={{ height: HOUR_ROW_HEIGHT }}
                >
                  <span className="absolute right-2 top-1 bg-white px-1 text-[10px] text-muted-foreground">
                    {`${hour}:00`}
                  </span>
                </div>
              ))}
              <span className="absolute bottom-1 right-2 bg-white px-1 text-[10px] text-muted-foreground">
                24:00
              </span>
            </div>

            <div className="relative" style={{ height: totalHeight }}>
              {hours.map((hour) => (
                <div
                  className="border-b border-black/[0.05]"
                  key={`${dateKey}-${hour}`}
                  style={{ height: HOUR_ROW_HEIGHT }}
                />
              ))}

              {layouts.length === 0 && allDayEvents.length === 0 ? (
                <p className="absolute left-3 top-3 text-[11px] text-muted-foreground">
                  Keine Termine an diesem Tag.
                </p>
              ) : null}

              <div className="absolute inset-0">
                <DayDropZone
                  dateKey={dateKey}
                  layouts={layouts}
                  timezone={timezone}
                  totalHeight={totalHeight}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </DndContext>
  );
}
