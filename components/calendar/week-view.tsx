"use client";

import { DndContext, PointerSensor, pointerWithin, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { eachDayOfInterval, endOfWeek, format, isToday, startOfWeek } from "date-fns";
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

type WeekViewProps = {
  currentDate: Date;
  events: EventViewModel[];
  timezone: string;
  onTimedEventDrop?: (event: EventViewModel, nextValues: { start: string; end: string }) => void;
};

type WeekDropZoneProps = {
  dateKey: string;
  totalHeight: number;
  timezone: string;
  layouts: ReturnType<typeof buildTimedEventLayoutsForDate>;
};

function WeekDropZone({ dateKey, totalHeight, timezone, layouts }: WeekDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `week-drop-${dateKey}`,
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

export function WeekView({
  currentDate,
  events,
  timezone,
  onTimedEventDrop,
}: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const { startHour, endHour } = getVisibleHourRange(events, days, timezone);
  const hours = Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
  const totalHeight = hours.length * HOUR_ROW_HEIGHT;
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
        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-black/6">
              <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Woche
              </div>
              {days.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const allDayEvents = getAllDayEventsForDate(events, dateKey, timezone);

                return (
                  <div className="min-h-[76px] border-l border-black/6 px-2 py-2" key={dateKey}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        {format(day, "EEE", { locale: de })}
                      </p>
                      <span
                        className={
                          isToday(day)
                            ? "flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[10px] font-medium text-background"
                            : "text-[11px] font-medium text-foreground"
                        }
                      >
                        {format(day, "dd")}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      {allDayEvents.slice(0, 2).map((event) => (
                        <EventBlock compact event={event} key={event.instanceKey} timezone={timezone} variant="pill" />
                      ))}
                      {allDayEvents.length > 2 ? (
                        <p className="text-[10px] text-muted-foreground">
                          +{allDayEvents.length - 2} mehr
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))]">
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

                {days.map((day) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const layouts = buildTimedEventLayoutsForDate(
                    events,
                    dateKey,
                    timezone,
                    startHour,
                    endHour,
                  );

                  return (
                    <div className="border-r border-black/6 last:border-r-0" key={dateKey}>
                      <div className="relative" style={{ height: totalHeight }}>
                        {hours.map((hour) => (
                          <div
                            className="border-b border-black/[0.05]"
                            key={`${dateKey}-${hour}`}
                            style={{ height: HOUR_ROW_HEIGHT }}
                          />
                        ))}

                        <div className="absolute inset-0">
                          <WeekDropZone
                            dateKey={dateKey}
                            layouts={layouts}
                            timezone={timezone}
                            totalHeight={totalHeight}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </DndContext>
  );
}
