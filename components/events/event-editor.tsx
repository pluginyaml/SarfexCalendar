"use client";

import { useEffect, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { EventViewModel } from "@/lib/caldav";
import { decodeEventId } from "@/lib/caldav/event-id";
import { requestJson } from "@/lib/http-client";
import { remindersToInputString } from "@/lib/reminders";
import { splitDescriptionAndLink } from "@/lib/event-time";
import type {
  CategoryRecord,
  EventTemplateRecord,
  LocationTemplateRecord,
} from "@/types/entities";
import { EventForm, type EventFormInitialValues } from "@/components/events/event-form";

type EventEditorProps = {
  mode: "create" | "edit";
  eventId?: string;
  timezone: string;
};

export function EventEditor({ mode, eventId, timezone }: EventEditorProps) {
  const router = useRouter();
  const [editorNow] = useState(() => new Date());
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [locations, setLocations] = useState<LocationTemplateRecord[]>([]);
  const [templates, setTemplates] = useState<EventTemplateRecord[]>([]);
  const [event, setEvent] = useState<EventViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const [categoriesResult, locationsResult, templatesResult] = await Promise.all([
          requestJson<CategoryRecord[]>("/api/categories"),
          requestJson<LocationTemplateRecord[]>("/api/locations"),
          requestJson<EventTemplateRecord[]>("/api/templates"),
        ]);

        let eventResult: EventViewModel | null = null;

        if (mode === "edit") {
          if (!eventId) {
            throw new Error("Es fehlt eine Event-ID.");
          }

          const href = decodeEventId(eventId);
          eventResult = await requestJson<EventViewModel>(
            `/api/events/detail?href=${encodeURIComponent(href)}`,
          );
        }

        if (!isMounted) {
          return;
        }

        setCategories(categoriesResult.filter((category) => category.isActive));
        setLocations(locationsResult);
        setTemplates(templatesResult);
        setEvent(eventResult);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Daten konnten nicht geladen werden.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [eventId, mode]);

  const initialValues: EventFormInitialValues = (() => {
    if (!event) {
      return {
        href: undefined,
        etag: undefined,
        title: "",
        category: categories[0]?.name ?? "",
        startDate: formatInTimeZone(editorNow, timezone, "yyyy-MM-dd"),
        startTime: formatInTimeZone(editorNow, timezone, "HH:mm"),
        endDate: formatInTimeZone(editorNow, timezone, "yyyy-MM-dd"),
        endTime: formatInTimeZone(
          new Date(editorNow.getTime() + 60 * 60 * 1000),
          timezone,
          "HH:mm",
        ),
        allDay: false,
        location: "",
        locationTemplateId: "__none__",
        description: "",
        link: "",
        reminderInput: remindersToInputString(categories[0]?.defaultReminderMinutes ?? [60]),
        templateId: "__none__",
      };
    }

    const { description, link } = splitDescriptionAndLink(event.description);

    return {
      href: event.href,
      etag: event.etag,
      title: event.title,
      category: event.category,
      startDate: event.allDay ? event.start : formatInTimeZone(event.start, timezone, "yyyy-MM-dd"),
      startTime: event.allDay ? "09:00" : formatInTimeZone(event.start, timezone, "HH:mm"),
      endDate: event.allDay ? event.end : formatInTimeZone(event.end, timezone, "yyyy-MM-dd"),
      endTime: event.allDay ? "10:00" : formatInTimeZone(event.end, timezone, "HH:mm"),
      allDay: event.allDay,
      location: event.location ?? "",
      locationTemplateId: "__none__",
      description,
      link,
      reminderInput: remindersToInputString(event.reminders),
      templateId: "__none__",
    };
  })();

  const handleSubmit = async (payload: {
    href?: string;
    etag?: string;
    title: string;
    description: string | null;
    location: string | null;
    start: string;
    end: string;
    allDay: boolean;
    category: string;
    reminders: number[];
  }) => {
    setIsSaving(true);

    try {
      const savedEvent =
        mode === "create"
          ? await requestJson<EventViewModel>("/api/events", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await requestJson<EventViewModel>("/api/events", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

      toast.success(mode === "create" ? "Termin gespeichert." : "Termin aktualisiert.");
      router.replace(`/events/${savedEvent.id}`);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event) {
      return;
    }

    setIsDeleting(true);

    try {
      await requestJson<{ href: string }>("/api/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          href: event.href,
          etag: event.etag,
        }),
      });

      toast.success("Termin gelöscht.");
      router.replace("/events");
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="rounded-[1.75rem] border border-white/70 bg-card/90 px-5 py-10 text-sm text-muted-foreground">Formulardaten werden geladen...</div>;
  }

  if (error) {
    return <div className="rounded-[1.75rem] border border-destructive/20 bg-destructive/5 px-5 py-10 text-sm text-destructive">{error}</div>;
  }

  return (
    <EventForm
      categories={categories}
      key={`${mode}-${event?.etag ?? "new"}-${categories.map((category) => category.id).join(",")}`}
      initialValues={initialValues}
      isDeleting={isDeleting}
      isSaving={isSaving}
      locations={locations}
      mode={mode}
      onDelete={mode === "edit" ? handleDelete : undefined}
      onSubmit={handleSubmit}
      templates={templates}
      timezone={timezone}
    />
  );
}
