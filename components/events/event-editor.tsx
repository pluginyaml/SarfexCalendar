"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { EventViewModel } from "@/lib/calendar/types";
import { decodeEventId } from "@/lib/caldav/event-id";
import { requestJson } from "@/lib/http-client";
import { parseRecurrenceRule } from "@/lib/recurrence/rule";
import type { EventRecurrenceInput } from "@/lib/recurrence/types";
import { remindersToInputString } from "@/lib/reminders";
import { splitDescriptionAndLink } from "@/lib/event-time";
import { useClientReady } from "@/hooks/use-client-ready";
import {
  clearQuickAddDraft,
  readQuickAddDraft,
} from "@/lib/quick-add/draft-storage";
import type { QuickAddDraft } from "@/lib/quick-add/types";
import type {
  CalendarSourceRecord,
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

type QuickAddResolutionContext = {
  categories: CategoryRecord[];
  calendarSources: CalendarSourceRecord[];
  locations: LocationTemplateRecord[];
  templates: EventTemplateRecord[];
  defaultCalendarId: string;
};

const NONE_OPTION = "__none__";

function resolveQuickAddDraft(
  draft: QuickAddDraft,
  context: QuickAddResolutionContext,
) {
  const warnings: string[] = [];
  const activeCategories = context.categories.filter((category) => category.isActive);
  const activeCalendars = context.calendarSources.filter(
    (calendar) => calendar.isActive && !calendar.isMissingRemote,
  );
  const activeLocations = context.locations.filter((location) => location.isActive);
  const activeTemplates = context.templates.filter((template) => template.isActive);

  const resolvedDraft: QuickAddDraft = {
    ...draft,
    calendarId: context.defaultCalendarId,
    locationTemplateId: undefined,
    templateId: undefined,
    reminders: draft.reminders ?? [],
  };

  if (draft.calendarId) {
    const matchingCalendar = activeCalendars.find((calendar) => calendar.id === draft.calendarId) ?? null;

    if (matchingCalendar) {
      resolvedDraft.calendarId = matchingCalendar.id;
    } else {
      warnings.push("Der erkannte Kalender ist nicht mehr aktiv.");
    }
  }

  if (draft.categoryId) {
    const matchingCategory = activeCategories.find((category) => category.id === draft.categoryId) ?? null;

    if (matchingCategory) {
      resolvedDraft.categoryId = matchingCategory.id;
      resolvedDraft.category = matchingCategory.name;
    } else if (draft.category) {
      const matchingCategoryByName =
        activeCategories.find((category) => category.name === draft.category) ?? null;

      if (matchingCategoryByName) {
        resolvedDraft.categoryId = matchingCategoryByName.id;
        resolvedDraft.category = matchingCategoryByName.name;
      } else {
        resolvedDraft.categoryId = undefined;
        resolvedDraft.category = undefined;
        warnings.push("Die erkannte Kategorie konnte nicht übernommen werden.");
      }
    } else {
      resolvedDraft.categoryId = undefined;
      resolvedDraft.category = undefined;
      warnings.push("Die erkannte Kategorie konnte nicht übernommen werden.");
    }
  } else if (draft.category) {
    const matchingCategoryByName =
      activeCategories.find((category) => category.name === draft.category) ?? null;

    if (matchingCategoryByName) {
      resolvedDraft.categoryId = matchingCategoryByName.id;
      resolvedDraft.category = matchingCategoryByName.name;
    } else {
      resolvedDraft.category = undefined;
      warnings.push("Die erkannte Kategorie konnte nicht übernommen werden.");
    }
  }

  if (draft.locationTemplateId) {
    const matchingLocation =
      activeLocations.find((location) => location.id === draft.locationTemplateId) ?? null;

    if (matchingLocation) {
      resolvedDraft.locationTemplateId = matchingLocation.id;
    } else {
      warnings.push("Die erkannte Standortvorlage ist nicht mehr verfügbar.");
    }
  }

  if (draft.templateId) {
    const matchingTemplate =
      activeTemplates.find((template) => template.id === draft.templateId) ?? null;

    if (matchingTemplate) {
      resolvedDraft.templateId = matchingTemplate.id;
    } else {
      warnings.push("Die erkannte Vorlage ist nicht mehr verfügbar.");
    }
  }

  if (!resolvedDraft.category && activeCategories[0]) {
    resolvedDraft.categoryId = activeCategories[0].id;
    resolvedDraft.category = activeCategories[0].name;
  }

  if (!resolvedDraft.reminderInput) {
    resolvedDraft.reminderInput = remindersToInputString(resolvedDraft.reminders);
  }

  return {
    draft: resolvedDraft,
    warnings,
  };
}

export function EventEditor({ mode, eventId, timezone }: EventEditorProps) {
  const isClientReady = useClientReady();
  const router = useRouter();
  const searchParams = useSearchParams();
  const quickAddDraftClearedRef = useRef(false);
  const [editorNow] = useState(() => new Date());
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [calendarSources, setCalendarSources] = useState<CalendarSourceRecord[]>([]);
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
        const [categoriesResult, calendarsResult, locationsResult, templatesResult] = await Promise.all([
          requestJson<CategoryRecord[]>("/api/categories"),
          requestJson<CalendarSourceRecord[]>("/api/calendars"),
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
        setCalendarSources(calendarsResult);
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

  const availableCalendarSources = useMemo(
    () =>
      mode === "edit"
        ? calendarSources
        : calendarSources.filter((calendar) => calendar.isActive && !calendar.isMissingRemote),
    [calendarSources, mode],
  );

  const defaultCalendarId = useMemo(() => {
    const defaultSource =
      availableCalendarSources.find((calendar) => calendar.isDefault) ?? availableCalendarSources[0];
    return defaultSource?.id ?? "";
  }, [availableCalendarSources]);

  const shouldApplyQuickAddDraft =
    mode === "create" && searchParams.get("quickAdd") === "1";
  const storedQuickAddDraft = useMemo(() => {
    if (!isClientReady || !shouldApplyQuickAddDraft) {
      return null;
    }

    return readQuickAddDraft();
  }, [isClientReady, shouldApplyQuickAddDraft]);

  const quickAddResolution = useMemo(() => {
    if (mode !== "create" || isLoading || !storedQuickAddDraft) {
      return null;
    }

    return resolveQuickAddDraft(storedQuickAddDraft, {
      categories,
      calendarSources,
      locations,
      templates,
      defaultCalendarId,
    });
  }, [
    calendarSources,
    categories,
    defaultCalendarId,
    isLoading,
    locations,
    mode,
    storedQuickAddDraft,
    templates,
  ]);

  useEffect(() => {
    if (!quickAddResolution || quickAddDraftClearedRef.current) {
      return;
    }

    clearQuickAddDraft();
    quickAddDraftClearedRef.current = true;
  }, [quickAddResolution]);

  const quickAddDraft = quickAddResolution?.draft ?? null;
  const quickAddWarnings = quickAddResolution?.warnings ?? [];

  const initialValues: EventFormInitialValues = (() => {
    if (!event) {
      const resolvedCalendarId =
        quickAddDraft?.calendarId &&
        availableCalendarSources.some((calendar) => calendar.id === quickAddDraft.calendarId)
          ? quickAddDraft.calendarId
          : defaultCalendarId;

      return {
        href: undefined,
        etag: undefined,
        calendarId: resolvedCalendarId,
        title: quickAddDraft?.title ?? "",
        category: quickAddDraft?.category ?? categories[0]?.name ?? "",
        startDate: quickAddDraft?.startDate ?? formatInTimeZone(editorNow, timezone, "yyyy-MM-dd"),
        startTime: quickAddDraft?.startTime ?? formatInTimeZone(editorNow, timezone, "HH:mm"),
        endDate: quickAddDraft?.endDate ?? formatInTimeZone(editorNow, timezone, "yyyy-MM-dd"),
        endTime:
          quickAddDraft?.endTime ??
          formatInTimeZone(new Date(editorNow.getTime() + 60 * 60 * 1000), timezone, "HH:mm"),
        allDay: quickAddDraft?.allDay ?? false,
        location: quickAddDraft?.location ?? "",
        locationTemplateId: quickAddDraft?.locationTemplateId ?? NONE_OPTION,
        description: quickAddDraft?.description ?? "",
        link: quickAddDraft?.link ?? "",
        reminderInput:
          quickAddDraft?.reminderInput ??
          remindersToInputString(
            quickAddDraft?.reminders ?? categories[0]?.defaultReminderMinutes ?? [60],
          ),
        recurrence: {
          preset: "none",
          frequency: "WEEKLY",
          interval: 1,
          byWeekdays: [],
          endMode: "never",
        },
        templateId: quickAddDraft?.templateId ?? NONE_OPTION,
      };
    }

    const { description, link } = splitDescriptionAndLink(event.description);

    return {
      href: event.href,
      etag: event.etag,
      calendarId: event.calendarId ?? defaultCalendarId,
      title: event.title,
      category: event.category,
      startDate: event.allDay ? event.start : formatInTimeZone(event.start, timezone, "yyyy-MM-dd"),
      startTime: event.allDay ? "09:00" : formatInTimeZone(event.start, timezone, "HH:mm"),
      endDate: event.allDay ? event.end : formatInTimeZone(event.end, timezone, "yyyy-MM-dd"),
      endTime: event.allDay ? "10:00" : formatInTimeZone(event.end, timezone, "HH:mm"),
      allDay: event.allDay,
      location: event.location ?? "",
      locationTemplateId: NONE_OPTION,
      description,
      link,
      reminderInput: remindersToInputString(event.reminders),
      recurrence: parseRecurrenceRule(event.recurrenceRule, {
        start: event.start,
        timezone,
        allDay: event.allDay,
      }),
      templateId: NONE_OPTION,
    };
  })();

  const handleSubmit = async (payload: {
    href?: string;
    etag?: string;
    calendarId?: string;
    title: string;
    description: string | null;
    location: string | null;
    start: string;
    end: string;
    allDay: boolean;
    category: string;
    reminders: number[];
    recurrence?: EventRecurrenceInput | null;
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

      if (mode === "create") {
        toast.success("Termin erstellt.");
        router.replace(`/events?created=${encodeURIComponent(savedEvent.id)}`);
      } else {
        toast.success("Termin aktualisiert.");
        router.replace(`/events/${savedEvent.id}`);
      }

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
    return (
      <div className="rounded-[1.75rem] border border-white/70 bg-card/90 px-5 py-10 text-sm text-muted-foreground">
        Formulardaten werden geladen...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.75rem] border border-destructive/20 bg-destructive/5 px-5 py-10 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mode === "create" && quickAddWarnings.length > 0 ? (
        <div className="rounded-[1.2rem] border border-warning/15 bg-warning/5 px-4 py-3 text-sm text-foreground">
          {quickAddWarnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <EventForm
        calendarSources={availableCalendarSources}
        categories={categories}
        key={`${mode}-${event?.etag ?? "new"}-${categories.map((category) => category.id).join(",")}-${availableCalendarSources.map((calendar) => calendar.id).join(",")}-${quickAddDraft ? JSON.stringify(quickAddDraft) : "no-quick-add"}`}
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
    </div>
  );
}
